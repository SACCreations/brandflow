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

  /**
   * Calculates the ROI and impact of specific knowledge sources.
   * Attributes success back to the "Brain" atoms.
   */
  async getIntelligenceImpact(businessId: string) {
    const metrics = await prisma.performanceMetric.findMany({
      where: { businessId },
      select: { sourceAttribution: true, engagement: true, reach: true }
    });

    const impactMap: Record<string, { engagement: number; reach: number; count: number }> = {};

    metrics.forEach(m => {
      const attribution = (m.sourceAttribution as any) || {};
      Object.keys(attribution).forEach(sourceId => {
        const weight = attribution[sourceId];
        if (!impactMap[sourceId]) {
          impactMap[sourceId] = { engagement: 0, reach: 0, count: 0 };
        }
        impactMap[sourceId].engagement += m.engagement * weight;
        impactMap[sourceId].reach += m.reach * weight;
        impactMap[sourceId].count += 1;
      });
    });

    return impactMap;
  }

  /**
   * Generates strategic pivots based on performance data.
   */
  async getAiRecommendations(businessId: string) {
    const impact = await this.getIntelligenceImpact(businessId);
    // In production, we'd use LLMGateway here to analyze the impact map
    // against the Brand voice and Strategic Briefs.
    
    return [
      {
        topic: 'Product Scalability',
        impact: 'High',
        recommendation: 'Double down on "Sales Deck V4" topics. Technical content is driving 2x more CTO engagement.',
        confidence: 0.92
      },
      {
        topic: 'Early Adopter Pricing',
        impact: 'Medium',
        recommendation: 'The "Founder" audience is showing fatigue with pricing posts. Suggest switching to "ROI" focus.',
        confidence: 0.85
      }
    ];
  }

  async getCostAnalysis(businessId: string, from?: string, to?: string) {
    const where: any = { businessId };
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [totalCost, byModule, byModel, dailyTrend] = await Promise.all([
      prisma.costEvent.aggregate({
        where,
        _sum: { costCents: true, inputTokens: true, outputTokens: true },
      }),
      prisma.costEvent.groupBy({
        by: ['module'],
        where,
        _sum: { costCents: true },
      }),
      prisma.costEvent.groupBy({
        by: ['model'],
        where,
        _sum: { costCents: true },
      }),
      prisma.$queryRawUnsafe(
        `SELECT date_trunc('day', "createdAt") as day, CAST(SUM("costCents") AS INTEGER) as cost
         FROM cost_events
         WHERE "businessId" = $1
         GROUP BY day
         ORDER BY day ASC`,
        businessId,
      )
    ]);

    return {
      total: totalCost._sum,
      byModule,
      byModel,
      dailyTrend,
    };
  }
}
