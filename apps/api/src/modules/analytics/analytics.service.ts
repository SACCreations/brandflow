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
        contentId: payload.contentId,
        platform: payload.platform,
        eventType: payload.eventType,
        value: payload.value ?? 1,
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date(),
        meta: payload.meta ?? {},
      },
    });
  }

  async getMetrics(businessId: string, brandId?: string, from?: string, to?: string) {
    const where: Record<string, unknown> = { businessId };
    if (from || to) {
      where['occurredAt'] = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [total, byPlatform, byType] = await Promise.all([
      prisma.analyticsEvent.count({ where }),
      prisma.analyticsEvent.groupBy({
        by: ['platform'],
        where,
        _sum: { value: true },
        _count: true,
      }),
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where,
        _sum: { value: true },
        _count: true,
      }),
    ]);

    return { total, byPlatform, byType };
  }

  async getPerformanceMetrics(businessId: string, contentId?: string) {
    return prisma.performanceMetric.findMany({
      where: { businessId, ...(contentId ? { contentId } : {}) },
      orderBy: { date: 'desc' },
      take: 90,
    });
  }
}
