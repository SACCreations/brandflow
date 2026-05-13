import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { QUEUES } from '@brandflow/shared';
import { PublishService } from '../social/publish.service';

interface PublishJobData {
  scheduleId: string;
  businessId: string;
  contentId: string;
}

@Processor(QUEUES.PUBLISH)
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  constructor(private readonly publishService: PublishService) {
    super();
  }

  async process(job: Job<PublishJobData>): Promise<void> {
    const { scheduleId, businessId, contentId } = job.data;
    this.logger.log(`Processing publish job for schedule ${scheduleId}`);

    // Look up schedule to get socialAccountId
    const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, businessId } });
    if (!schedule) throw new NotFoundException(`Schedule ${scheduleId} not found`);

    const publishJob = await prisma.publishJob.create({
      data: {
        businessId,
        contentId,
        socialAccountId: schedule.socialAccountId,
        scheduleId,
        status: 'processing',
        retryCount: job.attemptsMade,
      },
    });

    try {
      this.logger.log(`Publishing content ${contentId} for schedule ${scheduleId}`);
      const publishResult = await this.publishService.publishContent(
        contentId,
        schedule.socialAccountId,
        businessId,
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

      this.logger.log(`Successfully published schedule ${scheduleId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const maxAttempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;
      this.logger.error(`Failed to publish schedule ${scheduleId}: ${errMsg}`);

      await prisma.publishJob.update({
        where: { id: publishJob.id },
        data: {
          status: isFinalAttempt ? 'failed' : 'retrying',
          failureReason: errMsg,
          failureClass: this.classifyFailure(errMsg),
          nextRetryAt: isFinalAttempt ? null : this.getNextRetryAt(job.attemptsMade + 1),
        },
      });

      if (isFinalAttempt) {
        await prisma.$transaction([
          prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'failed' },
          }),
          prisma.content.update({
            where: { id: contentId },
            data: { status: 'approved' },
          }),
        ]);
      }

      throw error;
    }
  }

  private getNextRetryAt(attemptNumber: number): Date {
    const delayMs = Math.min(60_000 * 2 ** Math.max(attemptNumber - 1, 0), 15 * 60_000);
    return new Date(Date.now() + delayMs);
  }

  private classifyFailure(message: string): string {
    if (message.includes('rate limit') || message.includes('429')) return 'rate_limit';
    if (message.includes('token') || message.includes('auth') || message.includes('401')) return 'token_expired';
    if (message.includes('timeout') || message.includes('network')) return 'api_failure';
    return 'api_failure';
  }
}
