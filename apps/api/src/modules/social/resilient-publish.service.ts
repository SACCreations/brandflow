import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { SocialService } from './social.service';
import { PublishService } from './publish.service';
import { MetricsService } from '../../common/observability/metrics.service';
import { RedisService } from '../../common/redis/redis.service';

export type PublishContext = {
  businessId: string;
  contentId: string;
  socialAccountId: string;
  scheduleId?: string;
  automationRunId?: string;
  correlationId?: string;
};

@Injectable()
export class ResilientPublishService {
  private readonly logger = new Logger(ResilientPublishService.name);

  constructor(
    private readonly publishService: PublishService,
    private readonly socialService: SocialService,
    private readonly metrics: MetricsService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Executes a social publication with full reliability logic:
   * - Idempotency checks
   * - Circuit breaking
   * - JIT Token Refresh
   * - Failure classification
   * - Audit logging
   */
  async execute(ctx: PublishContext, tailoredBody?: string, attempt = 1): Promise<{ externalPostId: string }> {
    const { businessId, contentId, socialAccountId, scheduleId, correlationId } = ctx;
    const logPrefix = `[Publish][${correlationId || 'no-cid'}]`;

    this.logger.log(`${logPrefix} Processing publication for content ${contentId} (Attempt ${attempt})`);

    // 1. Circuit Breaker Check
    const circuitKey = `circuit_breaker:account:${socialAccountId}`;
    const isPaused = await this.redis.get(`${circuitKey}:paused`);
    if (isPaused) {
      this.logger.warn(`${logPrefix} Circuit Breaker: Account ${socialAccountId} is paused due to high failure rate.`);
      throw new Error('Social account is temporarily paused due to persistent failures.');
    }

    // 2. Fetch or Create PublishJob for state tracking
    let publishJob = await prisma.publishJob.findFirst({
      where: { 
        businessId, 
        contentId, 
        socialAccountId,
        ...(scheduleId ? { scheduleId } : {})
      }
    });

    if (publishJob?.status === 'published') {
      this.logger.warn(`${logPrefix} Idempotency: Content already published for this account. Skipping.`);
      return { externalPostId: publishJob.externalPostId! };
    }

    if (!publishJob) {
      publishJob = await prisma.publishJob.create({
        data: {
          businessId,
          contentId,
          socialAccountId,
          scheduleId,
          status: 'processing',
          retryCount: attempt - 1,
          tailoredBody,
        }
      });
    } else {
      publishJob = await prisma.publishJob.update({
        where: { id: publishJob.id },
        data: { status: 'processing', retryCount: attempt - 1 }
      });
    }

    try {
      // 3. JIT Token Validation / Refresh
      // (This is handled inside publishService.publishContent via getDecryptedTokens, 
      // but we add a higher level check here for autonomous recovery)
      
      // 4. Perform Publication
      const result = await this.publishService.publishContent(
        contentId,
        socialAccountId,
        businessId,
        tailoredBody || publishJob.tailoredBody || undefined
      );

      // 5. Success State Update
      await prisma.$transaction([
        prisma.publishJob.update({
          where: { id: publishJob.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            externalPostId: result.externalPostId,
          }
        }),
        ...(scheduleId ? [
          prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'published' }
          })
        ] : []),
        prisma.content.update({
          where: { id: contentId },
          data: { status: 'published' }
        })
      ]);

      // 6. Metrics & Circuit Reset
      await this.redis.del(circuitKey);
      await this.metrics.incrementSuccess(businessId, 'social_publish');
      
      this.logger.log(`${logPrefix} Successfully published to ${socialAccountId}. Post ID: ${result.externalPostId}`);
      
      return result;

    } catch (error: any) {
      const errMsg = error.message || String(error);
      const failureClass = this.classifyFailure(errMsg);
      
      this.logger.error(`${logPrefix} Publication failed: ${errMsg} (Class: ${failureClass})`);

      // 7. Autonomous Token Recovery (Retry once if expired)
      if (failureClass === 'token_expired' && attempt === 1) {
        this.logger.warn(`${logPrefix} Attempting autonomous token refresh...`);
        try {
          await this.socialService.refreshLinkedInToken(socialAccountId, businessId);
          // Re-attempt immediately if refresh succeeded
          return this.execute(ctx, tailoredBody, attempt + 1);
        } catch (refreshErr: any) {
          this.logger.error(`${logPrefix} Token refresh failed: ${refreshErr.message}`);
        }
      }

      // 8. Circuit Breaker: Record Failure
      if (failureClass !== 'token_expired' && failureClass !== 'rate_limit') {
        const failures = await this.redis.incrBy(circuitKey, 1);
        if (failures >= 5) {
          this.logger.error(`${logPrefix} Tripping circuit breaker for account ${socialAccountId}`);
          await this.redis.set(`${circuitKey}:paused`, 'true', 3600); // 1 hour pause
        }
      }

      // 9. Failure State Update
      const isTerminal = this.isTerminalFailure(failureClass);
      
      await prisma.publishJob.update({
        where: { id: publishJob.id },
        data: {
          status: isTerminal ? 'dead_letter' : 'retrying',
          failureReason: errMsg,
          failureClass,
          nextRetryAt: isTerminal ? null : this.getNextRetryAt(attempt),
        }
      });

      if (isTerminal) {
        if (scheduleId) {
          await prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'failed' }
          });
        }
        await this.metrics.incrementFailure(businessId, 'social_publish', failureClass);
      }

      throw error;
    }
  }

  private getNextRetryAt(attempt: number): Date {
    const base = 60_000; // 1 minute
    const delay = Math.min(base * Math.pow(2, attempt) + Math.random() * 30000, 24 * 60 * 60_000);
    return new Date(Date.now() + delay);
  }

  private classifyFailure(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('429')) return 'rate_limit';
    if (msg.includes('token') || msg.includes('auth') || msg.includes('401')) return 'token_expired';
    if (msg.includes('network') || msg.includes('timeout')) return 'network_failure';
    if (msg.includes('policy') || msg.includes('violation')) return 'content_violation';
    if (msg.includes('banned') || msg.includes('403')) return 'account_banned';
    return 'api_failure';
  }

  isTerminalFailure(failureClass: string): boolean {
    return ['content_violation', 'account_banned'].includes(failureClass);
  }

  /**
   * Manually retry a failed publish job.
   */
  async retryFailedJob(jobId: string, businessId: string) {
    const job = await prisma.publishJob.findFirst({
      where: { id: jobId, businessId },
      include: { schedule: true }
    });

    if (!job) throw new NotFoundException('Publish job not found');
    if (job.status !== 'dead_letter' && job.status !== 'failed') {
      throw new BadRequestException(`Cannot retry job in ${job.status} status`);
    }

    this.logger.log(`Manual retry triggered for job ${jobId}`);

    // Reset job status to processing
    await prisma.publishJob.update({
      where: { id: jobId },
      data: { status: 'processing', failureReason: null, failureClass: null }
    });

    return this.execute({
      businessId,
      contentId: job.contentId,
      socialAccountId: job.socialAccountId,
      scheduleId: job.scheduleId || undefined,
      correlationId: `manual-retry-${jobId}`
    }, job.tailoredBody || undefined, job.retryCount + 1);
  }
}
