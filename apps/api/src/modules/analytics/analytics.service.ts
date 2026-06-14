import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES, type AnalyticsEventPayload } from '@brandflow/shared';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectQueue(QUEUES.ANALYTICS_COLLECTION) private readonly queue: Queue,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    try {
      // Register repeatable background jobs
      await this.queue.add(
        'daily-aggregation',
        {},
        {
          repeat: { pattern: '0 2 * * *' }, // every day at 2 AM
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
      await this.queue.add(
        'generate-recommendations',
        {},
        {
          repeat: { pattern: '0 4 * * *' }, // every day at 4 AM
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
      this.logger.log('Repeatable BullMQ background jobs scheduled successfully.');
    } catch (err) {
      this.logger.error(`Failed to schedule repeatable jobs: ${err}`);
    }
  }

  /**
   * Track an analytics event (non-blocking — enqueued for async persistence).
   */
  async track(payload: AnalyticsEventPayload) {
    await this.queue.add('track', payload, { removeOnComplete: 100, removeOnFail: 50 });
  }

  /**
   * Ingest event directly (used by processor or internal callers).
   */
  async ingest(payload: any) {
    // Resolve context if possible
    let brandId = payload.brandId;
    let campaignId = payload.campaignId;
    let platform = payload.platform;

    if (payload.contentId) {
      const content = await this.prisma.client.content.findUnique({
        where: { id: payload.contentId },
        select: { brandId: true, campaignId: true, platform: true },
      });
      if (content) {
        brandId = brandId ?? content.brandId;
        campaignId = campaignId ?? content.campaignId ?? undefined;
        platform = platform ?? content.platform;
      }
    }

    return this.prisma.client.analyticsEvent.create({
      data: {
        businessId: payload.businessId,
        source: payload.source ?? 'unknown',
        eventType: payload.eventType,
        entityType: payload.entityType ?? (payload.contentId ? 'content' : undefined),
        entityId: payload.entityId ?? payload.contentId,
        brandId,
        campaignId,
        platform,
        payload: {
          ...(payload.platform ? { platform: payload.platform } : {}),
          ...(payload.value !== undefined ? { value: payload.value } : {}),
          ...(payload.meta ?? {}),
          ...(payload.payload ?? {}),
        },
      },
    });
  }

  /**
   * Fetch event counts grouped by source and type.
   */
  async getMetrics(businessId: string, brandId?: string, from?: string, to?: string) {
    const where: any = { businessId };
    if (brandId) where.brandId = brandId;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [total, bySource, byType] = await Promise.all([
      this.prisma.client.analyticsEvent.count({ where }),
      this.prisma.client.analyticsEvent.groupBy({
        by: ['source'],
        where,
        _count: true,
      }),
      this.prisma.client.analyticsEvent.groupBy({
        by: ['eventType'],
        where,
        _count: true,
      }),
    ]);

    return { total, bySource, byType };
  }

  /**
   * Get analytics dashboard summary with Redis caching.
   */
  async getSummary(businessId: string, from?: string, to?: string) {
    const cacheKey = `cache:analytics:${businessId}:summary:${from || 'default'}:${to || 'default'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const { start, end } = this.resolveDateRange(from, to);

    const [performanceMetrics, costTotals, analyticsMetrics, sources] = await Promise.all([
      this.prisma.client.performanceMetric.findMany({
        where: {
          businessId,
          collectedAt: { gte: start, lte: end },
        },
        orderBy: { collectedAt: 'asc' },
      }),
      this.prisma.client.costEvent.aggregate({
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
      this.prisma.client.knowledgeSource.findMany({
        where: { businessId },
        select: { id: true, name: true, type: true },
      }),
    ]);

    const trendMap = new Map<string, { label: string; reach: number; engagement: number; clicks: number; roiCents: number; conversions: number; spendCents: number; revenueCents: number }>();
    const dayCursor = new Date(start);

    while (dayCursor <= end) {
      const key = this.formatDayKey(dayCursor);
      trendMap.set(key, {
        label: dayCursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reach: 0,
        engagement: 0,
        clicks: 0,
        roiCents: 0,
        conversions: 0,
        spendCents: 0,
        revenueCents: 0,
      });
      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    const sourceLookup = new Map(sources.map((source) => [source.id, source]));
    const sourceImpact = new Map<string, { sourceId: string; name: string; type: string; reach: number; engagement: number; roiCents: number; usageCount: number }>();
    const platformMap = new Map<string, { platform: string; reach: number; engagement: number; clicks: number; roiCents: number; conversions: number; spendCents: number; revenueCents: number }>();

    const totals = performanceMetrics.reduce(
      (acc, metric) => {
        acc.reach += metric.reach;
        acc.impressions += metric.impressions;
        acc.engagement += metric.engagement;
        acc.clicks += metric.clicks;
        acc.conversions += metric.conversions;
        acc.spendCents += metric.spendCents;
        acc.revenueCents += metric.revenueCents;
        acc.roiCents += metric.roiCents;

        const dayKey = this.formatDayKey(metric.collectedAt);
        const dayEntry = trendMap.get(dayKey);
        if (dayEntry) {
          dayEntry.reach += metric.reach;
          dayEntry.engagement += metric.engagement;
          dayEntry.clicks += metric.clicks;
          dayEntry.roiCents += metric.roiCents;
          dayEntry.conversions += metric.conversions;
          dayEntry.spendCents += metric.spendCents;
          dayEntry.revenueCents += metric.revenueCents;
        }

        const platformEntry = platformMap.get(metric.platform) ?? {
          platform: metric.platform,
          reach: 0,
          engagement: 0,
          clicks: 0,
          roiCents: 0,
          conversions: 0,
          spendCents: 0,
          revenueCents: 0,
        };
        platformEntry.reach += metric.reach;
        platformEntry.engagement += metric.engagement;
        platformEntry.clicks += metric.clicks;
        platformEntry.roiCents += metric.roiCents;
        platformEntry.conversions += metric.conversions;
        platformEntry.spendCents += metric.spendCents;
        platformEntry.revenueCents += metric.revenueCents;
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
        conversions: 0,
        spendCents: 0,
        revenueCents: 0,
      },
    );

    const averageCtr = totals.impressions > 0
      ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2))
      : 0;
    const engagementRate = totals.reach > 0
      ? Number(((totals.engagement / totals.reach) * 100).toFixed(2))
      : 0;

    const result = {
      range: {
        from: start.toISOString(),
        to: end.toISOString(),
      },
      summary: {
        totalReach: totals.reach,
        totalImpressions: totals.impressions,
        totalEngagement: totals.engagement,
        totalClicks: totals.clicks,
        totalConversions: totals.conversions,
        totalSpendCents: totals.spendCents,
        totalRevenueCents: totals.revenueCents,
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

    // Cache with a 10 minutes TTL
    await this.redis.set(cacheKey, JSON.stringify(result), 600);

    return result;
  }

  /**
   * Get campaigns aggregated analytics.
   */
  async getCampaigns(businessId: string, brandId?: string, from?: string, to?: string) {
    const { start, end } = this.resolveDateRange(from, to);

    const campaigns = await this.prisma.client.campaign.findMany({
      where: { businessId, ...(brandId ? { brandId } : {}) },
      select: { id: true, name: true, status: true },
    });

    const metrics = await this.prisma.client.performanceMetric.findMany({
      where: {
        businessId,
        ...(brandId ? { brandId } : {}),
        collectedAt: { gte: start, lte: end },
      },
    });

    const campaignStats = new Map<string, any>();
    campaigns.forEach((c) => {
      campaignStats.set(c.id, {
        id: c.id,
        name: c.name,
        status: c.status,
        impressions: 0,
        reach: 0,
        clicks: 0,
        engagement: 0,
        conversions: 0,
        spendCents: 0,
        revenueCents: 0,
        roiCents: 0,
      });
    });

    metrics.forEach((m) => {
      const cid = m.campaignId;
      if (!cid) return;
      const stats = campaignStats.get(cid);
      if (!stats) return;

      stats.impressions += m.impressions;
      stats.reach += m.reach;
      stats.clicks += m.clicks;
      stats.engagement += m.engagement;
      stats.conversions += m.conversions;
      stats.spendCents += m.spendCents;
      stats.revenueCents += m.revenueCents;
      stats.roiCents += m.roiCents;
    });

    return Array.from(campaignStats.values()).map((stats) => {
      const ctr = stats.impressions > 0 ? Number(((stats.clicks / stats.impressions) * 100).toFixed(2)) : 0;
      const conversionRate = stats.clicks > 0 ? Number(((stats.conversions / stats.clicks) * 100).toFixed(2)) : 0;
      const roas = stats.spendCents > 0 ? Number((stats.revenueCents / stats.spendCents).toFixed(2)) : 0;
      const roiPercent = stats.spendCents > 0 ? Number((((stats.revenueCents - stats.spendCents) / stats.spendCents) * 100).toFixed(2)) : 0;
      const cpc = stats.clicks > 0 ? Math.round(stats.spendCents / stats.clicks) : 0;
      const cpa = stats.conversions > 0 ? Math.round(stats.spendCents / stats.conversions) : 0;

      return {
        ...stats,
        ctr,
        conversionRate,
        roas,
        roiPercent,
        cpc,
        cpa,
      };
    });
  }

  /**
   * Get platform aggregated metrics.
   */
  async getPlatforms(businessId: string, brandId?: string, from?: string, to?: string) {
    const { start, end } = this.resolveDateRange(from, to);

    const metrics = await this.prisma.client.performanceMetric.findMany({
      where: {
        businessId,
        ...(brandId ? { brandId } : {}),
        collectedAt: { gte: start, lte: end },
      },
    });

    const platformStats = new Map<string, any>();
    const platforms = ['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok'];
    
    platforms.forEach((p) => {
      platformStats.set(p, {
        platform: p,
        impressions: 0,
        reach: 0,
        clicks: 0,
        engagement: 0,
        conversions: 0,
        spendCents: 0,
        revenueCents: 0,
        roiCents: 0,
      });
    });

    metrics.forEach((m) => {
      const p = m.platform.toLowerCase();
      let stats = platformStats.get(p);
      if (!stats) {
        stats = {
          platform: p,
          impressions: 0,
          reach: 0,
          clicks: 0,
          engagement: 0,
          conversions: 0,
          spendCents: 0,
          revenueCents: 0,
          roiCents: 0,
        };
        platformStats.set(p, stats);
      }

      stats.impressions += m.impressions;
      stats.reach += m.reach;
      stats.clicks += m.clicks;
      stats.engagement += m.engagement;
      stats.conversions += m.conversions;
      stats.spendCents += m.spendCents;
      stats.revenueCents += m.revenueCents;
      stats.roiCents += m.roiCents;
    });

    return Array.from(platformStats.values()).map((stats) => {
      const ctr = stats.impressions > 0 ? Number(((stats.clicks / stats.impressions) * 100).toFixed(2)) : 0;
      const conversionRate = stats.clicks > 0 ? Number(((stats.conversions / stats.clicks) * 100).toFixed(2)) : 0;
      const roas = stats.spendCents > 0 ? Number((stats.revenueCents / stats.spendCents).toFixed(2)) : 0;
      const roiPercent = stats.spendCents > 0 ? Number((((stats.revenueCents - stats.spendCents) / stats.spendCents) * 100).toFixed(2)) : 0;

      return {
        ...stats,
        ctr,
        conversionRate,
        roas,
        roiPercent,
      };
    });
  }

  /**
   * Get time-series trend analysis comparing current vs previous period.
   */
  async getTrends(
    businessId: string,
    brandId?: string,
    campaignId?: string,
    platform?: string,
    from?: string,
    to?: string,
  ) {
    const { start, end } = this.resolveDateRange(from, to);
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start.getTime() - 1);

    const where: any = { businessId };
    if (brandId) where.brandId = brandId;
    if (campaignId) where.campaignId = campaignId;
    if (platform) where.platform = platform;

    const [currentMetrics, prevMetrics] = await Promise.all([
      this.prisma.client.performanceMetric.findMany({
        where: {
          ...where,
          collectedAt: { gte: start, lte: end },
        },
        orderBy: { collectedAt: 'asc' },
      }),
      this.prisma.client.performanceMetric.findMany({
        where: {
          ...where,
          collectedAt: { gte: prevStart, lte: prevEnd },
        },
      }),
    ]);

    const sumMetrics = (list: any[]) => {
      return list.reduce(
        (acc, m) => {
          acc.impressions += m.impressions;
          acc.reach += m.reach;
          acc.clicks += m.clicks;
          acc.engagement += m.engagement;
          acc.conversions += m.conversions;
          acc.spendCents += m.spendCents;
          acc.revenueCents += m.revenueCents;
          acc.roiCents += m.roiCents;
          return acc;
        },
        { impressions: 0, reach: 0, clicks: 0, engagement: 0, conversions: 0, spendCents: 0, revenueCents: 0, roiCents: 0 }
      );
    };

    const currentTotals = sumMetrics(currentMetrics);
    const prevTotals = sumMetrics(prevMetrics);

    const getGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(2));
    };

    const getTrendDirection = (growth: number) => {
      if (growth > 5) return 'up';
      if (growth < -5) return 'down';
      return 'flat';
    };

    const comparisons = {
      reach: {
        current: currentTotals.reach,
        previous: prevTotals.reach,
        growthPercent: getGrowth(currentTotals.reach, prevTotals.reach),
        direction: getTrendDirection(getGrowth(currentTotals.reach, prevTotals.reach)),
      },
      impressions: {
        current: currentTotals.impressions,
        previous: prevTotals.impressions,
        growthPercent: getGrowth(currentTotals.impressions, prevTotals.impressions),
        direction: getTrendDirection(getGrowth(currentTotals.impressions, prevTotals.impressions)),
      },
      clicks: {
        current: currentTotals.clicks,
        previous: prevTotals.clicks,
        growthPercent: getGrowth(currentTotals.clicks, prevTotals.clicks),
        direction: getTrendDirection(getGrowth(currentTotals.clicks, prevTotals.clicks)),
      },
      engagement: {
        current: currentTotals.engagement,
        previous: prevTotals.engagement,
        growthPercent: getGrowth(currentTotals.engagement, prevTotals.engagement),
        direction: getTrendDirection(getGrowth(currentTotals.engagement, prevTotals.engagement)),
      },
      roi: {
        current: currentTotals.roiCents,
        previous: prevTotals.roiCents,
        growthPercent: getGrowth(currentTotals.roiCents, prevTotals.roiCents),
        direction: getTrendDirection(getGrowth(currentTotals.roiCents, prevTotals.roiCents)),
      },
    };

    const pointsMap = new Map<string, any>();
    const cursor = new Date(start);
    while (cursor <= end) {
      const dayKey = this.formatDayKey(cursor);
      pointsMap.set(dayKey, {
        date: dayKey,
        label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: 0,
        reach: 0,
        clicks: 0,
        engagement: 0,
        conversions: 0,
        spendCents: 0,
        revenueCents: 0,
        roiCents: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    currentMetrics.forEach((m) => {
      const dayKey = this.formatDayKey(m.collectedAt);
      const point = pointsMap.get(dayKey);
      if (point) {
        point.impressions += m.impressions;
        point.reach += m.reach;
        point.clicks += m.clicks;
        point.engagement += m.engagement;
        point.conversions += m.conversions;
        point.spendCents += m.spendCents;
        point.revenueCents += m.revenueCents;
        point.roiCents += m.roiCents;
      }
    });

    const points = Array.from(pointsMap.values());

    for (let i = 0; i < points.length; i++) {
      let reachSum = 0;
      let clickSum = 0;
      let count = 0;
      for (let j = Math.max(0, i - 6); j <= i; j++) {
        reachSum += points[j].reach;
        clickSum += points[j].clicks;
        count++;
      }
      points[i].reachMovingAvg = Math.round(reachSum / count);
      points[i].clicksMovingAvg = Math.round(clickSum / count);
    }

    return {
      comparisons,
      timeSeries: points,
    };
  }

  /**
   * Get ROI and efficiency report.
   */
  async getRoi(
    businessId: string,
    brandId?: string,
    campaignId?: string,
    platform?: string,
    from?: string,
    to?: string,
  ) {
    const { start, end } = this.resolveDateRange(from, to);
    const where: any = { businessId };
    if (brandId) where.brandId = brandId;
    if (campaignId) where.campaignId = campaignId;
    if (platform) where.platform = platform;
    where.collectedAt = { gte: start, lte: end };

    const metrics = await this.prisma.client.performanceMetric.findMany({ where });

    const totals = metrics.reduce(
      (acc, m) => {
        acc.impressions += m.impressions;
        acc.reach += m.reach;
        acc.clicks += m.clicks;
        acc.engagement += m.engagement;
        acc.conversions += m.conversions;
        acc.spendCents += m.spendCents;
        acc.revenueCents += m.revenueCents;
        acc.roiCents += m.roiCents;
        return acc;
      },
      { impressions: 0, reach: 0, clicks: 0, engagement: 0, conversions: 0, spendCents: 0, revenueCents: 0, roiCents: 0 }
    );

    const ctr = totals.impressions > 0 ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0;
    const conversionRate = totals.clicks > 0 ? Number(((totals.conversions / totals.clicks) * 100).toFixed(2)) : 0;
    const roas = totals.spendCents > 0 ? Number((totals.revenueCents / totals.spendCents).toFixed(2)) : 0;
    const roiPercent = totals.spendCents > 0 ? Number((((totals.revenueCents - totals.spendCents) / totals.spendCents) * 100).toFixed(2)) : 0;
    const cpc = totals.clicks > 0 ? Math.round(totals.spendCents / totals.clicks) : 0;
    const cpa = totals.conversions > 0 ? Math.round(totals.spendCents / totals.conversions) : 0;
    const cpm = totals.impressions > 0 ? Math.round((totals.spendCents / totals.impressions) * 1000) : 0;
    const costPerLead = totals.conversions > 0 ? Math.round(totals.spendCents / totals.conversions) : 0;

    const spendDollars = totals.spendCents / 100;
    const efficiencyScore = Number(((totals.engagement * 1 + totals.clicks * 5 + totals.conversions * 20) / (spendDollars + 1)).toFixed(2));

    return {
      totals: {
        ...totals,
        ctr,
        conversionRate,
        roas,
        roiPercent,
        cpc,
        cpa,
        cpm,
        costPerLead,
        efficiencyScore,
      },
      range: { from: start.toISOString(), to: end.toISOString() },
    };
  }

  /**
   * Get top performing content sorted by metrics.
   */
  async getTopContent(
    businessId: string,
    brandId?: string,
    campaignId?: string,
    platform?: string,
    from?: string,
    to?: string,
    limit = 10,
  ) {
    const { start, end } = this.resolveDateRange(from, to);
    const where: any = { businessId };
    if (brandId) where.brandId = brandId;
    if (campaignId) where.campaignId = campaignId;
    if (platform) where.platform = platform;
    where.collectedAt = { gte: start, lte: end };

    const metrics = await this.prisma.client.performanceMetric.findMany({
      where,
      orderBy: { clicks: 'desc' },
      take: limit,
    });

    const contentIds = metrics.map((m) => m.contentId);
    const contents = await this.prisma.client.content.findMany({
      where: { id: { in: contentIds } },
      select: { id: true, body: true, type: true },
    });
    const contentMap = new Map(contents.map((c) => [c.id, c]));

    return metrics.map((m) => {
      const content = contentMap.get(m.contentId);
      const ctr = m.impressions > 0 ? Number(((m.clicks / m.impressions) * 100).toFixed(2)) : 0;
      const roas = m.spendCents > 0 ? Number((m.revenueCents / m.spendCents).toFixed(2)) : 0;
      const roiPercent = m.spendCents > 0 ? Number((((m.revenueCents - m.spendCents) / m.spendCents) * 100).toFixed(2)) : 0;

      return {
        id: m.id,
        contentId: m.contentId,
        body: content?.body || 'No content description',
        type: content?.type || 'unknown',
        platform: m.platform,
        reach: m.reach,
        impressions: m.impressions,
        clicks: m.clicks,
        engagement: m.engagement,
        conversions: m.conversions,
        spendCents: m.spendCents,
        revenueCents: m.revenueCents,
        roiCents: m.roiCents,
        ctr,
        roas,
        roiPercent,
        collectedAt: m.collectedAt,
      };
    });
  }

  /**
   * Export performance metrics to CSV format.
   */
  async exportCsv(businessId: string, brandId?: string, from?: string, to?: string): Promise<string> {
    const { start, end } = this.resolveDateRange(from, to);
    const where: any = { businessId };
    if (brandId) where.brandId = brandId;
    where.collectedAt = { gte: start, lte: end };

    const metrics = await this.prisma.client.performanceMetric.findMany({
      where,
      orderBy: { collectedAt: 'asc' },
    });

    const headers = [
      'Collected At',
      'Platform',
      'Content ID',
      'Campaign ID',
      'Reach',
      'Impressions',
      'Clicks',
      'Engagement',
      'Conversions',
      'CTR (%)',
      'Spend (USD)',
      'Revenue (USD)',
      'ROI (USD)',
    ];

    const rows = metrics.map((m) => [
      m.collectedAt.toISOString(),
      m.platform,
      m.contentId,
      m.campaignId || 'N/A',
      m.reach,
      m.impressions,
      m.clicks,
      m.engagement,
      m.conversions,
      (m.ctr * 100).toFixed(2),
      (m.spendCents / 100).toFixed(2),
      (m.revenueCents / 100).toFixed(2),
      (m.roiCents / 100).toFixed(2),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Export professional PDF performance report.
   */
  async exportPdf(businessId: string, brandId?: string, from?: string, to?: string): Promise<PassThrough> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = new PassThrough();
    doc.pipe(stream);

    const { start, end } = this.resolveDateRange(from, to);

    const [summary, campaigns, recommendations] = await Promise.all([
      this.getSummary(businessId, start.toISOString(), end.toISOString()),
      this.getCampaigns(businessId, brandId, start.toISOString(), end.toISOString()),
      this.getAiRecommendations(businessId),
    ]);

    const primaryColor = '#6366F1';
    const textColor = '#1E293B';
    const secondaryColor = '#64748B';
    const gridColor = '#E2E8F0';

    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('BrandFlow Performance Report')
      .font('Helvetica')
      .fontSize(10)
      .fillColor(secondaryColor)
      .text(`Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`)
      .moveDown(1.5);

    doc.strokeColor(gridColor).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(1.5);

    doc.fillColor(textColor).fontSize(16).text('Executive Summary', { underline: true }).moveDown(1);

    const kpiTable = [
      ['Metric', 'Value', 'Details'],
      ['Total Reach', summary.summary.totalReach.toLocaleString(), `${summary.trend.length} day snapshot`],
      ['Total Impressions', summary.summary.totalImpressions.toLocaleString(), 'Cumulative display counts'],
      ['Total Clicks', summary.summary.totalClicks.toLocaleString(), 'Accumulated ad/post links'],
      ['CTR', `${summary.summary.averageCtr}%`, 'Click-Through-Rate velocity'],
      ['Engagement Rate', `${summary.summary.engagementRate}%`, 'Interactive affinity rate'],
      ['AI Generation Cost', `$${(summary.summary.generationCostCents / 100).toFixed(2)}`, 'Spend on automated operations'],
    ];

    let currentY = doc.y;
    kpiTable.forEach((row, rowIndex) => {
      const isHeader = rowIndex === 0;
      doc
        .fontSize(10)
        .fillColor(isHeader ? primaryColor : textColor)
        .text(row[0], 50, currentY, { width: 150 })
        .text(row[1], 200, currentY, { width: 150 })
        .text(row[2], 350, currentY, { width: 200 });
      currentY += 20;
    });

    doc.y = currentY + 15;

    doc.fillColor(textColor).fontSize(16).text('Campaign Performance (Top 5)', { underline: true }).moveDown(1);

    const campaignHeaderY = doc.y;
    doc
      .fontSize(10)
      .fillColor(primaryColor)
      .text('Campaign Name', 50, campaignHeaderY, { width: 150 })
      .text('Impressions', 200, campaignHeaderY, { width: 80 })
      .text('Clicks', 280, campaignHeaderY, { width: 60 })
      .text('Conversions', 340, campaignHeaderY, { width: 80 })
      .text('Spend', 420, campaignHeaderY, { width: 60 })
      .text('ROI (%)', 480, campaignHeaderY, { width: 60 });

    let campaignY = campaignHeaderY + 20;
    campaigns.slice(0, 5).forEach((camp) => {
      doc
        .fontSize(9)
        .fillColor(textColor)
        .text(camp.name, 50, campaignY, { width: 150 })
        .text(camp.impressions.toLocaleString(), 200, campaignY, { width: 80 })
        .text(camp.clicks.toLocaleString(), 280, campaignY, { width: 60 })
        .text(camp.conversions.toLocaleString(), 340, campaignY, { width: 80 })
        .text(`$${(camp.spendCents / 100).toFixed(2)}`, 420, campaignY, { width: 60 })
        .text(`${camp.roiPercent}%`, 480, campaignY, { width: 60 });
      campaignY += 20;
    });

    doc.y = campaignY + 20;

    doc.fillColor(textColor).fontSize(16).text('AI Strategic Insights', { underline: true }).moveDown(1);
    recommendations.forEach((rec, index) => {
      doc
        .fontSize(10)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text(`${index + 1}. ${rec.topic} (Confidence: ${Math.round(rec.confidence * 100)}%)`)
        .font('Helvetica')
        .fillColor(textColor)
        .fontSize(9)
        .text(`Recommendation: ${rec.recommendation}`)
        .moveDown(0.5);
    });

    doc.end();
    return stream;
  }

  async getPerformanceMetrics(businessId: string, contentId?: string) {
    return this.prisma.client.performanceMetric.findMany({
      where: { businessId, ...(contentId ? { contentId } : {}) },
      orderBy: { collectedAt: 'desc' },
      take: 90,
    });
  }

  /**
   * Attributes success back to the "Brain" atoms.
   */
  async getIntelligenceImpact(businessId: string) {
    const [metrics, sources] = await Promise.all([
      this.prisma.client.performanceMetric.findMany({
        where: { businessId },
        select: { sourceAttribution: true, engagement: true, reach: true, roiCents: true }
      }),
      this.prisma.client.knowledgeSource.findMany({
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
   * Generates strategic recommendations dynamically based on database performance records.
   */
  async getAiRecommendations(businessId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [campaigns, platformStats, rawEvents, budgetList] = await Promise.all([
      this.getCampaigns(businessId, undefined, thirtyDaysAgo.toISOString()),
      this.getPlatforms(businessId, undefined, thirtyDaysAgo.toISOString()),
      this.prisma.client.analyticsEvent.findMany({
        where: {
          businessId,
          createdAt: { gte: thirtyDaysAgo },
          eventType: { in: ['click', 'engagement'] }
        },
        select: { createdAt: true }
      }),
      this.prisma.client.campaign.findMany({
        where: { businessId },
        select: { id: true, name: true, metadata: true }
      })
    ]);

    const recommendations: any[] = [];

    // 1. Top performing campaigns
    const topCampaigns = [...campaigns].sort((a, b) => b.roiPercent - a.roiPercent).filter(c => c.impressions > 0);
    if (topCampaigns.length > 0) {
      recommendations.push({
        topic: 'Top Campaign Performance',
        impact: 'High',
        recommendation: `Double down on "${topCampaigns[0].name}". It has the highest ROI of ${topCampaigns[0].roiPercent}% and CTR of ${topCampaigns[0].ctr}%.`,
        confidence: 0.95
      });
    }

    // 2. Worst performing campaigns
    const worstCampaigns = [...campaigns].sort((a, b) => a.roiPercent - b.roiPercent).filter(c => c.spendCents > 0 && c.roiPercent < 0);
    if (worstCampaigns.length > 0) {
      recommendations.push({
        topic: 'Underperforming Campaign Alert',
        impact: 'High',
        recommendation: `Pause or optimize "${worstCampaigns[0].name}". It currently has negative ROI of ${worstCampaigns[0].roiPercent}% and high cost.`,
        confidence: 0.88
      });
    }

    // 3. Best publishing hours
    const events = rawEvents || [];
    if (events.length > 0) {
      const hourCounts = Array(24).fill(0);
      events.forEach(e => {
        const hr = new Date(e.createdAt).getHours();
        hourCounts[hr]++;
      });
      let bestHour = 0;
      let maxCount = 0;
      for (let hr = 0; hr < 24; hr++) {
        if (hourCounts[hr] > maxCount) {
          maxCount = hourCounts[hr];
          bestHour = hr;
        }
      }
      recommendations.push({
        topic: 'Best Publishing Hours',
        impact: 'Medium',
        recommendation: `Schedule your posts around ${bestHour}:00. Analytical event counts peak at this hour, showing maximum audience activity.`,
        confidence: 0.82
      });
    } else {
      recommendations.push({
        topic: 'Best Publishing Hours',
        impact: 'Medium',
        recommendation: 'Not enough event data to calculate optimal publishing hour. Default to 10:00 AM (local time).',
        confidence: 0.50
      });
    }

    // 4. Top platforms
    const topPlatform = [...platformStats].sort((a, b) => b.ctr - a.ctr).filter(p => p.impressions > 0);
    if (topPlatform.length > 0) {
      recommendations.push({
        topic: 'Platform Optimization',
        impact: 'Medium',
        recommendation: `Your highest CTR is on ${topPlatform[0].platform.toUpperCase()} (${topPlatform[0].ctr}%). Increase frequency on this channel.`,
        confidence: 0.90
      });
    }

    // 5. Budget exhaustion warning
    budgetList.forEach(c => {
      const meta = (c.metadata as any) || {};
      const budget = meta.budget ? Number(meta.budget) : 0;
      if (budget > 0) {
        const campStats = campaigns.find(cs => cs.id === c.id);
        if (campStats && (campStats.spendCents / 100) >= budget * 0.85) {
          recommendations.push({
            topic: 'Budget Exhaustion Alert',
            impact: 'High',
            recommendation: `Campaign "${c.name}" has exhausted over 85% of its budget ($${(campStats.spendCents / 100).toFixed(2)} spend vs $${budget} budget).`,
            confidence: 0.99
          });
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push(
        {
          topic: 'Product Scalability',
          impact: 'High',
          recommendation: 'Generate more campaigns and connect social accounts to unlock advanced strategic learnings.',
          confidence: 0.75
        },
        {
          topic: 'Audience Engagement',
          impact: 'Medium',
          recommendation: 'Identify top performing channels by posting content regularly on multiple platforms.',
          confidence: 0.80
        }
      );
    }

    return recommendations;
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
      this.prisma.client.costEvent.aggregate({
        where,
        _sum: { costCents: true, inputTokens: true, outputTokens: true },
      }),
      this.prisma.client.costEvent.groupBy({
        by: ['module'],
        where,
        _sum: { costCents: true },
      }),
      this.prisma.client.costEvent.groupBy({
        by: ['model'],
        where,
        _sum: { costCents: true },
      }),
      this.prisma.client.costEvent.findMany({
        where,
        select: { createdAt: true, costCents: true }
      })
    ]);

    const trendMap = new Map<string, number>();
    dailyTrend.forEach(event => {
      const day = this.formatDayKey(event.createdAt);
      trendMap.set(day, (trendMap.get(day) || 0) + event.costCents);
    });

    const dailyTrendFormatted = Array.from(trendMap.entries())
      .map(([day, cost]) => ({ day, cost }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return {
      total: totalCost._sum,
      byModule,
      byModel,
      dailyTrend: dailyTrendFormatted,
    };
  }

  async getReliabilityMetrics(businessId: string) {
    const [totalJobs, failedJobs, successJobs] = await Promise.all([
      this.prisma.client.publishJob.count({ where: { businessId } }),
      this.prisma.client.publishJob.count({ where: { businessId, status: 'dead_letter' } }),
      this.prisma.client.publishJob.count({ where: { businessId, status: 'published' } }),
    ]);

    const successRate = totalJobs > 0 ? (successJobs / totalJobs) * 100 : 100;
    
    const accountHealth = await this.prisma.client.socialAccount.findMany({
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
    const publishedJobs = await this.prisma.client.publishJob.findMany({
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
        compliant: delayMinutes <= 5
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
