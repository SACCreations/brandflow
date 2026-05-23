import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { QUEUES, type AnalyticsEventPayload } from '@brandflow/shared';

@Processor(QUEUES.ANALYTICS_COLLECTION)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  async process(job: Job<AnalyticsEventPayload>): Promise<void> {
    const payload = job.data;
    this.logger.debug(`[ANALYTICS] Processing ${payload.eventType} for ${payload.businessId}`);

    try {
      // 1. Persist Raw Event
      const event = await prisma.analyticsEvent.create({
        data: {
          businessId: payload.businessId,
          source: payload.source ?? 'unknown',
          eventType: payload.eventType,
          entityType: payload.entityType ?? (payload.contentId ? 'content' : undefined),
          entityId: payload.entityId ?? payload.contentId,
          payload: {
            ...(payload.platform ? { platform: payload.platform } : {}),
            ...(payload.value !== undefined ? { value: payload.value } : {}),
            ...(payload.meta ?? {}),
          } as any,
        },
      });

      // 2. Link to Performance Metrics if it's content-related
      if (payload.contentId && (payload.eventType === 'click' || payload.eventType === 'engagement')) {
        await this.updatePerformanceMetric(payload);
      }
    } catch (err) {
      this.logger.error(`Failed to process analytics event: ${err}`);
      throw err;
    }
  }

  private async updatePerformanceMetric(payload: AnalyticsEventPayload) {
    const { businessId, contentId, platform, eventType, value = 1 } = payload;
    if (!contentId) return;

    // Fetch content to get attribution metadata
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { metadata: true, platform: true },
    });

    if (!content) return;

    const metadata = (content.metadata as any) || {};
    const sourceIds = (metadata.sourceIds as string[]) || [];

    // Find or Create Daily Metric for this content/platform
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metric = await prisma.performanceMetric.findFirst({
      where: {
        contentId,
        platform: platform ?? content.platform,
        collectedAt: { gte: today },
      },
    });

    if (metric) {
      await prisma.performanceMetric.update({
        where: { id: metric.id },
        data: {
          engagement: { increment: eventType === 'engagement' ? value : 0 },
          clicks: { increment: eventType === 'click' ? value : 0 },
          // Update attribution weight if needed (simplistic: equal distribution)
          sourceAttribution: this.mergeAttribution(metric.sourceAttribution, sourceIds),
        },
      });
    } else {
      await prisma.performanceMetric.create({
        data: {
          businessId,
          contentId,
          platform: platform ?? content.platform,
          engagement: eventType === 'engagement' ? value : 0,
          clicks: eventType === 'click' ? value : 0,
          collectedAt: new Date(),
          sourceAttribution: this.createInitialAttribution(sourceIds),
        },
      });
    }
  }

  private createInitialAttribution(sourceIds: string[]) {
    if (sourceIds.length === 0) return {};
    const weight = 1 / sourceIds.length;
    const attribution: Record<string, number> = {};
    sourceIds.forEach(id => attribution[id] = weight);
    return attribution;
  }

  private mergeAttribution(current: any, sourceIds: string[]) {
    // For now, we keep it simple. In production, we might want to track cumulative impact.
    return current || this.createInitialAttribution(sourceIds);
  }
}
