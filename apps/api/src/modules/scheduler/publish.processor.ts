import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { QUEUES } from '@brandflow/shared';
import { PublishService } from '../social/publish.service';
import { SocialService } from '../social/social.service';
import { MetricsService } from '../../common/observability/metrics.service';
import { RedisService } from '../../common/redis/redis.service';

interface PublishJobData {
  scheduleId: string;
  businessId: string;
  contentId: string;
}

@Processor(QUEUES.PUBLISH)
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  constructor(
    private readonly publishService: PublishService,
    private readonly socialService: SocialService,
    private readonly metrics: MetricsService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async process(job: Job<PublishJobData>): Promise<void> {
    const { scheduleId, businessId, contentId } = job.data;
    this.logger.log(`Processing publish job for schedule ${scheduleId} (Attempt ${job.attemptsMade + 1})`);

    // ─── Idempotency Check ──────────────────────────────────────
    const existingJob = await prisma.publishJob.findFirst({
      where: { scheduleId, businessId, contentId }
    });

    if (existingJob?.status === 'published') {
      this.logger.warn(`Idempotency: Schedule ${scheduleId} already published. Skipping.`);
      return;
    }

    // Look up schedule to get socialAccountId
    const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, businessId } });
    if (!schedule) throw new NotFoundException(`Schedule ${scheduleId} not found`);

    // ─── Circuit Breaker Check ──────────────────────────────────
    const circuitKey = `circuit_breaker:account:${schedule.socialAccountId}`;
    const isPaused = await this.redis.get(`${circuitKey}:paused`);
    if (isPaused) {
      this.logger.warn(`Circuit Breaker: Skipping publish for account ${schedule.socialAccountId} (Paused due to high failure rate)`);
      throw new Error(`Social account is temporarily paused due to persistent failures.`);
    }

    let publishJob = existingJob;

    if (publishJob) {
      publishJob = await prisma.publishJob.update({
        where: { id: publishJob.id },
        data: { status: 'processing', retryCount: job.attemptsMade },
      });
    } else {
      publishJob = await prisma.publishJob.create({
        data: {
          businessId,
          contentId,
          socialAccountId: schedule.socialAccountId,
          scheduleId,
          status: 'processing',
          retryCount: job.attemptsMade,
        },
      });
    }

    try {
      this.logger.log(`Publishing content ${contentId} for schedule ${scheduleId}`);
      const publishResult = await this.publishService.publishContent(
        contentId,
        schedule.socialAccountId,
        businessId,
        publishJob.tailoredBody ?? undefined,
      );

      await prisma.$transaction([
        prisma.publishJob.update({
          where: { id: publishJob.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            externalPostId: publishResult.externalPostId,
          },
        }),
        prisma.schedule.update({
          where: { id: scheduleId },
          data: { status: 'published' },
        }),
        prisma.content.update({
          where: { id: contentId },
          data: { status: 'published' },
        }),
      ]);

      // Success: Reset failure count
      await this.redis.del(circuitKey);
      await this.metrics.incrementSuccess(businessId, 'social_publish');
      this.logger.log(`Successfully published schedule ${scheduleId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const failureClass = this.classifyFailure(errMsg);
      
      // Autonomous Recovery: If token is expired, attempt ONE refresh and re-throw to trigger BullMQ retry
      if (failureClass === 'token_expired' && job.attemptsMade < 2) {
        this.logger.warn(`Token expired for schedule ${scheduleId}. Attempting autonomous refresh (Attempt ${job.attemptsMade + 1})...`);
        try {
          await this.socialService.refreshLinkedInToken(schedule.socialAccountId, businessId);
          this.logger.log(`Token refreshed for schedule ${scheduleId}. Job will retry automatically.`);
        } catch (refreshError: any) {
          this.logger.error(`Autonomous token refresh failed for schedule ${scheduleId}: ${refreshError.message}`);
        }
      }

      // ─── Circuit Breaker: Record Failure ─────────────────────
      if (failureClass !== 'token_expired' && failureClass !== 'rate_limit') { 
        const failures = await this.redis.incrBy(circuitKey, 1);
        if (failures >= 5) {
          this.logger.error(`Circuit Breaker: Tripping for account ${schedule.socialAccountId} after 5 failures.`);
          await this.redis.set(`${circuitKey}:paused`, 'true', 3600); // Pause for 1 hour
        }
      }

      const maxAttempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : 5;
      const isFatalError = failureClass === 'content_violation' || failureClass === 'account_banned';
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts || isFatalError;

      this.logger.error(`Failed to publish schedule ${scheduleId} (Attempt ${job.attemptsMade + 1}/${maxAttempts}): ${errMsg}`);

      await prisma.publishJob.update({
        where: { id: publishJob.id },
        data: {
          status: isFinalAttempt ? 'dead_letter' : 'retrying',
          failureReason: errMsg,
          failureClass,
          nextRetryAt: isFinalAttempt ? null : this.getNextRetryAt(job.attemptsMade + 1),
        },
      });

      if (isFinalAttempt) {
        await prisma.$transaction([
          prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'failed' },
          }),
          // Move back to approved so it can be re-scheduled or fixed
          prisma.content.update({
            where: { id: contentId },
            data: { status: 'approved' },
          }),
        ]);
        
        // Emit Alert Event (Internal)
        await prisma.analyticsEvent.create({
          data: {
            businessId,
            source: 'system.publisher',
            eventType: isFatalError ? 'publish_fatal_failure' : 'publish_critical_failure',
            entityType: 'schedule',
            entityId: scheduleId,
            payload: { error: errMsg, failureClass, attempts: job.attemptsMade + 1 },
          }
        });

        await this.metrics.incrementFailure(businessId, 'social_publish', failureClass);
      }

      throw error;
    }
  }

  private getNextRetryAt(attemptNumber: number): Date {
    // Exponential backoff with jitter: min(base * 2^n + jitter, max)
    const base = 60_000; // 1 minute
    const jitter = Math.floor(Math.random() * 30_000); // 0-30s jitter
    const delayMs = Math.min(base * 2 ** Math.max(attemptNumber - 1, 0) + jitter, 60 * 60_000); // Max 1 hour
    return new Date(Date.now() + delayMs);
  }

  private classifyFailure(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('429')) return 'rate_limit';
    if (msg.includes('token') || msg.includes('auth') || msg.includes('401')) return 'token_expired';
    if (msg.includes('timeout') || msg.includes('network') || msg.includes('eai_again')) return 'network_failure';
    if (msg.includes('content') || msg.includes('policy') || msg.includes('violation') || msg.includes('too long')) return 'content_violation';
    if (msg.includes('banned') || msg.includes('suspended') || msg.includes('403')) return 'account_banned';
    return 'api_failure';
  }

}
