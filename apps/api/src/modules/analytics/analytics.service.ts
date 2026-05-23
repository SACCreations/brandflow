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

  async getSummary(businessId: string, from?: string, to?: string) {
    const { start, end } = this.resolveDateRange(from, to);

    const [performanceMetrics, costTotals, analyticsMetrics, sources] = await Promise.all([
      prisma.performanceMetric.findMany({
        where: {
          businessId,
          collectedAt: { gte: start, lte: end },
        },
        orderBy: { collectedAt: 'asc' },
      }),
      prisma.costEvent.aggregate({
        where: {
          businessId,
          createdAt: { gte: start, lte: end },
        },
        _sum: {
          costCents: true,
          inputTokens: true,
          outputTokens: true,
        },
      }),
      this.getMetrics(businessId, undefined, start.toISOString(), end.toISOString()),
      prisma.knowledgeSource.findMany({
        where: { businessId },
        select: { id: true, name: true, type: true },
      }),
    ]);

    const trendMap = new Map<string, { label: string; reach: number; engagement: number; clicks: number; roiCents: number }>();
    const dayCursor = new Date(start);

    while (dayCursor <= end) {
      const key = this.formatDayKey(dayCursor);
      trendMap.set(key, {
        label: dayCursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reach: 0,
        engagement: 0,
        clicks: 0,
        roiCents: 0,
      });
      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    const sourceLookup = new Map(sources.map((source) => [source.id, source]));
    const sourceImpact = new Map<string, { sourceId: string; name: string; type: string; reach: number; engagement: number; roiCents: number; usageCount: number }>();
    const platformMap = new Map<string, { platform: string; reach: number; engagement: number; clicks: number; roiCents: number }>();

    const totals = performanceMetrics.reduce(
      (acc, metric) => {
        acc.reach += metric.reach;
        acc.impressions += metric.impressions;
        acc.engagement += metric.engagement;
        acc.clicks += metric.clicks;
        acc.roiCents += metric.roiCents;

        const dayKey = this.formatDayKey(metric.collectedAt);
        const dayEntry = trendMap.get(dayKey);
        if (dayEntry) {
          dayEntry.reach += metric.reach;
          dayEntry.engagement += metric.engagement;
          dayEntry.clicks += metric.clicks;
          dayEntry.roiCents += metric.roiCents;
        }

        const platformEntry = platformMap.get(metric.platform) ?? {
          platform: metric.platform,
          reach: 0,
          engagement: 0,
          clicks: 0,
          roiCents: 0,
        };
        platformEntry.reach += metric.reach;
        platformEntry.engagement += metric.engagement;
        platformEntry.clicks += metric.clicks;
        platformEntry.roiCents += metric.roiCents;
        platformMap.set(metric.platform, platformEntry);

        const attribution = (metric.sourceAttribution ?? {}) as Record<string, number>;
        for (const [sourceId, weight] of Object.entries(attribution)) {
          const source = sourceLookup.get(sourceId);
          const sourceEntry = sourceImpact.get(sourceId) ?? {
            sourceId,
            name: source?.name ?? `Source ${sourceId.slice(0, 8)}`,
            type: source?.type ?? 'unknown',
            reach: 0,
            engagement: 0,
            roiCents: 0,
            usageCount: 0,
          };

          sourceEntry.reach += Math.round(metric.reach * weight);
          sourceEntry.engagement += Math.round(metric.engagement * weight);
          sourceEntry.roiCents += Math.round(metric.roiCents * weight);
          sourceEntry.usageCount += 1;
          sourceImpact.set(sourceId, sourceEntry);
        }

        return acc;
      },
      {
        reach: 0,
        impressions: 0,
        engagement: 0,
        clicks: 0,
        roiCents: 0,
      },
    );

    const averageCtr = totals.impressions > 0
      ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2))
      : 0;
    const engagementRate = totals.reach > 0
      ? Number(((totals.engagement / totals.reach) * 100).toFixed(2))
      : 0;

    return {
      range: {
        from: start.toISOString(),
        to: end.toISOString(),
      },
      summary: {
        totalReach: totals.reach,
        totalImpressions: totals.impressions,
        totalEngagement: totals.engagement,
        totalClicks: totals.clicks,
        averageCtr,
        engagementRate,
        attributedRoiCents: totals.roiCents,
        generationCostCents: costTotals._sum.costCents ?? 0,
        inputTokens: costTotals._sum.inputTokens ?? 0,
        outputTokens: costTotals._sum.outputTokens ?? 0,
        totalEvents: analyticsMetrics.total,
      },
      trend: Array.from(trendMap.values()),
      platformBreakdown: Array.from(platformMap.values()).sort((a, b) => b.reach - a.reach),
      topSources: Array.from(sourceImpact.values()).sort((a, b) => b.engagement - a.engagement).slice(0, 8),
      eventMix: analyticsMetrics.byType.map((item) => ({
        eventType: item.eventType,
        count: item._count,
      })),
    };
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
    const [metrics, sources] = await Promise.all([
      prisma.performanceMetric.findMany({
        where: { businessId },
        select: { sourceAttribution: true, engagement: true, reach: true, roiCents: true }
      }),
      prisma.knowledgeSource.findMany({
        where: { businessId },
        select: { id: true, name: true, type: true }
      })
    ]);

    const sourceMap = new Map(sources.map(s => [s.id, s]));
    const impactMap: Record<string, { name: string; type: string; engagement: number; reach: number; roiCents: number; count: number }> = {};

    metrics.forEach(m => {
      const attribution = (m.sourceAttribution as any) || {};
      Object.keys(attribution).forEach(sourceId => {
        const weight = attribution[sourceId];
        const source = sourceMap.get(sourceId);
        
        if (!impactMap[sourceId]) {
          impactMap[sourceId] = { 
            name: source?.name || 'Unknown Source', 
            type: source?.type || 'unknown',
            engagement: 0, 
            reach: 0, 
            roiCents: 0,
            count: 0 
          };
        }
        impactMap[sourceId].engagement += (m.engagement || 0) * weight;
        impactMap[sourceId].reach += (m.reach || 0) * weight;
        impactMap[sourceId].roiCents += (m.roiCents || 0) * weight;
        impactMap[sourceId].count += 1;
      });
    });

    return Object.values(impactMap).sort((a, b) => b.engagement - a.engagement);
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

  async getReliabilityMetrics(businessId: string) {
    const [totalJobs, failedJobs, successJobs] = await Promise.all([
      prisma.publishJob.count({ where: { businessId } }),
      prisma.publishJob.count({ where: { businessId, status: 'dead_letter' } }),
      prisma.publishJob.count({ where: { businessId, status: 'published' } }),
    ]);

    const successRate = totalJobs > 0 ? (successJobs / totalJobs) * 100 : 100;
    
    const accountHealth = await prisma.socialAccount.findMany({
      where: { businessId },
      select: { id: true, platform: true, name: true, tokenExpiresAt: true }
    });

    const healthyAccounts = accountHealth.filter(a => !a.tokenExpiresAt || a.tokenExpiresAt > new Date());
    
    return {
      successRate,
      totalJobs,
      failedJobs,
      accountHealth: {
        total: accountHealth.length,
        healthy: healthyAccounts.length,
        percentage: accountHealth.length > 0 ? (healthyAccounts.length / accountHealth.length) * 100 : 100
      }
    };
  }

  async getSlaCompliance(businessId: string) {
    // SLA: Posts published within 5 minutes of scheduled time
    const publishedJobs = await prisma.publishJob.findMany({
      where: { 
        businessId, 
        status: 'published',
        publishedAt: { not: null },
        scheduleId: { not: null }
      },
      include: { schedule: true },
      take: 100,
      orderBy: { publishedAt: 'desc' }
    });

    const slaResults = publishedJobs.map(job => {
      const scheduled = job.schedule!.scheduledAt.getTime();
      const actual = job.publishedAt!.getTime();
      const delayMinutes = (actual - scheduled) / (1000 * 60);
      return {
        jobId: job.id,
        delayMinutes,
        compliant: delayMinutes <= 5 // 5 minute SLA window
      };
    });

    const compliantCount = slaResults.filter(r => r.compliant).length;
    
    return {
      slaComplianceRate: slaResults.length > 0 ? (compliantCount / slaResults.length) * 100 : 100,
      averageDelayMinutes: slaResults.length > 0 ? slaResults.reduce((acc, r) => acc + r.delayMinutes, 0) / slaResults.length : 0,
      recentJobs: slaResults
    };
  }

  private resolveDateRange(from?: string, to?: string): { start: Date; end: Date } {
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private formatDayKey(date: Date): string {
    return date.toISOString().split('T')[0]!;
  }
}
