import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { QUEUES } from '@brandflow/shared';
import { PublishService } from '../social/publish.service';
import { SocialService } from '../social/social.service';
import { MetricsService } from '../../common/observability/metrics.service';
import { RedisService } from '../../common/redis/redis.service';
import { ResilientPublishService } from '../social/resilient-publish.service';

interface PublishJobData {
  scheduleId: string;
  businessId: string;
  contentId: string;
}

@Processor(QUEUES.PUBLISH)
export class PublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishProcessor.name);

  constructor(
    private readonly resilientPublishService: ResilientPublishService,
  ) {
    super();
  }

  async process(job: Job<PublishJobData>): Promise<void> {
    const { scheduleId, businessId, contentId } = job.data;
    
    // Look up schedule to get socialAccountId
    const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, businessId } });
    if (!schedule) throw new NotFoundException(`Schedule ${scheduleId} not found`);

    await this.resilientPublishService.execute(
      {
        businessId,
        contentId,
        socialAccountId: schedule.socialAccountId,
        scheduleId,
        correlationId: job.id,
      },
      undefined,
      job.attemptsMade + 1
    );
  }

}
