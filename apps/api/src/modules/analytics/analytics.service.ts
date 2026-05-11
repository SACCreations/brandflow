import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@brandflow/db';
import { QUEUES, type AnalyticsEventPayload } from '@brandflow/shared';

@Injectable()
export class AnalyticsService {
  constructor(@InjectQueue(QUEUES.ANALYTICS_COLLECTION) private readonly queue: Queue) {}

  /**
   * Track an analytics event (non-blocking — enqueued for async persistence).
   */
  async track(payload: AnalyticsEventPayload) {
    await this.queue.add('track', payload, { removeOnComplete: 100, removeOnFail: 50 });
  }

  /**
   * Ingest event directly (used by processor or internal callers).
   */
  async ingest(payload: AnalyticsEventPayload) {
    return prisma.analyticsEvent.create({
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
          ...(payload.payload ?? {}),
        },
      },
    });
  }

  async getMetrics(businessId: string, _brandId?: string, from?: string, to?: string) {
    const where: Record<string, unknown> = { businessId };
    if (from || to) {
      where['createdAt'] = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [total, bySource, byType] = await Promise.all([
      prisma.analyticsEvent.count({ where }),
      prisma.analyticsEvent.groupBy({
        by: ['source'],
        where,
        _count: true,
      }),
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where,
        _count: true,
      }),
    ]);

    return { total, bySource, byType };
  }

  async getPerformanceMetrics(businessId: string, contentId?: string) {
    return prisma.performanceMetric.findMany({
      where: { businessId, ...(contentId ? { contentId } : {}) },
      orderBy: { collectedAt: 'desc' },
      take: 90,
    });
  }
}
