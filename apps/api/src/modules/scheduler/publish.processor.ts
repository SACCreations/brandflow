import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { QUEUES } from '@brandflow/shared';

interface PublishJobData {
  scheduleId: string;
  businessId: string;
  contentId: string;
}

@Processor(QUEUES.PUBLISH)
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  async process(job: Job<PublishJobData>): Promise<void> {
    const { scheduleId, businessId, contentId } = job.data;
    this.logger.log(`Processing publish job for schedule ${scheduleId}`);

    const publishJob = await prisma.publishJob.create({
      data: {
        businessId,
        scheduleId,
        contentId,
        status: 'processing',
        attemptNumber: job.attemptsMade + 1,
      },
    });

    try {
      // TODO Phase 2: Route to actual platform connector (LinkedIn, Instagram, etc.)
      this.logger.log(`Publishing content ${contentId} for schedule ${scheduleId}`);

      await prisma.$transaction([
        prisma.publishJob.update({
          where: { id: publishJob.id },
          data: { status: 'published', completedAt: new Date() },
        }),
        prisma.schedule.update({
          where: { id: scheduleId },
          data: { status: 'published', publishedAt: new Date() },
        }),
        prisma.content.update({
          where: { id: contentId },
          data: { status: 'published', publishedAt: new Date() },
        }),
      ]);

      this.logger.log(`Successfully published schedule ${scheduleId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to publish schedule ${scheduleId}: ${errMsg}`);

      await prisma.publishJob.update({
        where: { id: publishJob.id },
        data: {
          status: 'failed',
          errorMessage: errMsg,
          failureClass: this.classifyFailure(errMsg),
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private classifyFailure(message: string): string {
    if (message.includes('rate limit') || message.includes('429')) return 'rate_limit';
    if (message.includes('token') || message.includes('auth') || message.includes('401')) return 'token_expired';
    if (message.includes('timeout') || message.includes('network')) return 'api_failure';
    return 'api_failure';
  }
}
