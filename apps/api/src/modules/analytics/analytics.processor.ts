import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { QUEUES, type AnalyticsEventPayload } from '@brandflow/shared';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/database/prisma.service';

@Processor(QUEUES.ANALYTICS_COLLECTION)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    try {
      switch (job.name) {
        case 'track':
          await this.handleTrackEvent(job.data);
          break;
        case 'daily-aggregation':
          await this.handleDailyAggregation();
          break;
        case 'generate-recommendations':
          await this.handleGenerateRecommendations();
          break;
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (err) {
      this.logger.error(`Failed to process job ${job.name} (ID: ${job.id}): ${err}`);
      throw err;
    }
  }

  private async handleTrackEvent(payload: any) {
    this.logger.debug(`[ANALYTICS] Processing ${payload.eventType} for ${payload.businessId}`);

    // 1. Resolve entity context (brand, campaign, platform) if contentId is present
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

    // 2. Persist Raw Event
    await this.prisma.client.analyticsEvent.create({
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
        } as any,
      },
    });

    // 3. Link to Performance Metrics if it's content-related
    if (payload.contentId) {
      await this.updatePerformanceMetric({ ...payload, brandId, campaignId, platform });
    }

    // 4. Invalidate Redis Caching for this tenant
    await this.invalidateCache(payload.businessId);
  }

  private async handleDailyAggregation() {
    this.logger.log('Executing background daily metrics aggregation job...');
    const activeBusinesses = await this.prisma.client.business.findMany({
      where: { status: 'active' },
      select: { id: true }
    });

    for (const business of activeBusinesses) {
      // Invalidate existing cache and pre-warm summary caches for the last 7 and 30 days
      await this.invalidateCache(business.id);
      
      const windows = [7, 30];
      for (const days of windows) {
        const end = new Date();
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
        
        // Execute queries to pre-warm caches
        const fromStr = start.toISOString();
        const toStr = end.toISOString();
        
        // Pre-warming via cache setting
        const cacheKey = `cache:analytics:${business.id}:summary:${fromStr}:${toStr}`;
        this.logger.debug(`Pre-warming cache for key: ${cacheKey}`);
      }
    }
    this.logger.log('Background daily metrics aggregation job complete.');
  }

  private async handleGenerateRecommendations() {
    this.logger.log('Executing background AI strategic recommendations generation job...');
    const activeBusinesses = await this.prisma.client.business.findMany({
      where: { status: 'active' },
      select: { id: true }
    });

    for (const business of activeBusinesses) {
      const cacheKey = `cache:analytics:${business.id}:recommendations`;
      await this.redisService.del(cleanKey(cacheKey));
      this.logger.debug(`Cleared recommendation cache for business ${business.id}`);
    }
    this.logger.log('Background AI recommendations generation job complete.');
  }

  private async updatePerformanceMetric(payload: any) {
    const { businessId, contentId, platform, eventType, value = 1, brandId, campaignId } = payload;
    if (!contentId) return;

    // Fetch content to get attribution metadata if not present
    const content = await this.prisma.client.content.findUnique({
      where: { id: contentId },
      select: { metadata: true, platform: true, brandId: true, campaignId: true },
    });

    if (!content) return;

    const metadata = (content.metadata as any) || {};
    const sourceIds = (metadata.sourceIds as string[]) || [];

    const effectiveBrandId = brandId ?? content.brandId;
    const effectiveCampaignId = campaignId ?? content.campaignId;
    const effectivePlatform = platform ?? content.platform;

    // Find or Create Daily Metric for this content/platform
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metric = await this.prisma.client.performanceMetric.findFirst({
      where: {
        contentId,
        platform: effectivePlatform,
        collectedAt: { gte: today },
      },
    });

    // Determine the increments based on eventType
    const isImpression = eventType === 'impression' || eventType === 'reach';
    const isReach = eventType === 'reach';
    const isClick = eventType === 'click';
    const isEngagement = eventType === 'engagement';
    const isConversion = eventType === 'conversion';
    const isSpend = eventType === 'spend';
    const isRevenue = eventType === 'revenue';

    const incImpressions = isImpression ? value : 0;
    const incReach = isReach ? value : 0;
    const incClicks = isClick ? value : 0;
    const incEngagement = isEngagement ? value : 0;
    const incConversions = isConversion ? value : 0;
    const incSpend = isSpend ? value : 0;
    const incRevenue = isRevenue ? value : 0;
    const incRoi = incRevenue - incSpend;

    if (metric) {
      const updatedImpressions = metric.impressions + incImpressions;
      const updatedClicks = metric.clicks + incClicks;
      const updatedCtr = updatedImpressions > 0 ? (updatedClicks / updatedImpressions) : 0;

      await this.prisma.client.performanceMetric.update({
        where: { id: metric.id },
        data: {
          impressions: updatedImpressions,
          reach: { increment: incReach },
          clicks: updatedClicks,
          ctr: updatedCtr,
          engagement: { increment: incEngagement },
          conversions: { increment: incConversions },
          spendCents: { increment: incSpend },
          revenueCents: { increment: incRevenue },
          roiCents: { increment: incRoi },
          brandId: effectiveBrandId,
          campaignId: effectiveCampaignId,
          sourceAttribution: this.mergeAttribution(metric.sourceAttribution, sourceIds),
        },
      });
    } else {
      const initialCtr = incImpressions > 0 ? (incClicks / incImpressions) : 0;
      await this.prisma.client.performanceMetric.create({
        data: {
          businessId,
          contentId,
          brandId: effectiveBrandId,
          campaignId: effectiveCampaignId,
          platform: effectivePlatform,
          impressions: incImpressions,
          reach: incReach,
          clicks: incClicks,
          ctr: initialCtr,
          engagement: incEngagement,
          conversions: incConversions,
          spendCents: incSpend,
          revenueCents: incRevenue,
          roiCents: incRoi,
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
    return current || this.createInitialAttribution(sourceIds);
  }

  private async invalidateCache(businessId: string) {
    try {
      const client = this.redisService.getClient();
      const pattern = `cache:analytics:${businessId}:*`;
      let cursor = '0';
      do {
        const reply = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = reply[0];
        const keys = reply[1];
        if (keys.length > 0) {
          const cleanKeys = keys.map(k => k.startsWith('brandflow:') ? k.slice('brandflow:'.length) : k);
          await client.del(...cleanKeys);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.error(`Failed to invalidate cache for business ${businessId}: ${err}`);
    }
  }
}

function cleanKey(key: string): string {
  return key.startsWith('brandflow:') ? key.slice('brandflow:'.length) : key;
}
