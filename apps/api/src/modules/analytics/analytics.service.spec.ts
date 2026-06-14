import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { QUEUES } from '@brandflow/shared';
import { PassThrough } from 'stream';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaMock: any;
  let redisMock: any;
  let queueMock: any;

  beforeEach(async () => {
    // Mock Prisma Service
    prismaMock = {
      client: {
        analyticsEvent: {
          create: vi.fn().mockResolvedValue({}),
          count: vi.fn().mockResolvedValue(0),
          groupBy: vi.fn().mockResolvedValue([]),
          findMany: vi.fn().mockResolvedValue([]),
        },
        performanceMetric: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
        },
        costEvent: {
          aggregate: vi.fn().mockResolvedValue({ _sum: {}, _avg: {}, _count: {} }),
          groupBy: vi.fn().mockResolvedValue([]),
          findMany: vi.fn().mockResolvedValue([]),
        },
        knowledgeSource: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        campaign: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        content: {
          findMany: vi.fn().mockResolvedValue([]),
          findUnique: vi.fn().mockResolvedValue(null),
        },
        publishJob: {
          count: vi.fn().mockResolvedValue(0),
          findMany: vi.fn().mockResolvedValue([]),
        },
        socialAccount: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    };

    // Mock Redis Service
    redisMock = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    };

    // Mock Queue
    queueMock = {
      add: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
        { provide: getQueueToken(QUEUES.ANALYTICS_COLLECTION), useValue: queueMock },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('track', () => {
    it('should push tracking task to BullMQ queue', async () => {
      const payload: any = { businessId: 'biz-1', eventType: 'click', contentId: 'cnt-1' };
      await service.track(payload);
      expect(queueMock.add).toHaveBeenCalledWith('track', payload, expect.any(Object));
    });
  });

  describe('ingest', () => {
    it('should create raw event in database', async () => {
      const payload: any = { businessId: 'biz-1', eventType: 'click', source: 'web' };
      prismaMock.client.analyticsEvent.create.mockResolvedValue(payload);

      await service.ingest(payload);
      expect(prismaMock.client.analyticsEvent.create).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should query analytics count and grouped results', async () => {
      prismaMock.client.analyticsEvent.count.mockResolvedValue(10);
      prismaMock.client.analyticsEvent.groupBy.mockResolvedValue([]);

      const result = await service.getMetrics('biz-1');
      expect(result.total).toBe(10);
      expect(prismaMock.client.analyticsEvent.count).toHaveBeenCalled();
    });
  });

  describe('getSummary', () => {
    it('should fetch and compile metrics and set Redis cache', async () => {
      prismaMock.client.performanceMetric.findMany.mockResolvedValue([
        {
          collectedAt: new Date(),
          platform: 'linkedin',
          reach: 100,
          impressions: 200,
          engagement: 50,
          clicks: 10,
          conversions: 2,
          spendCents: 500,
          revenueCents: 1000,
          roiCents: 500,
          sourceAttribution: {},
        },
      ]);
      prismaMock.client.costEvent.aggregate.mockResolvedValue({
        _sum: { costCents: 100, inputTokens: 500, outputTokens: 500 },
      });
      prismaMock.client.analyticsEvent.count.mockResolvedValue(1);
      prismaMock.client.analyticsEvent.groupBy.mockResolvedValue([]);
      prismaMock.client.knowledgeSource.findMany.mockResolvedValue([]);

      const result = await service.getSummary('biz-1');
      expect(result.summary.totalReach).toBe(100);
      expect(result.summary.totalImpressions).toBe(200);
      expect(result.summary.totalClicks).toBe(10);
      expect(result.summary.averageCtr).toBe(5);
      expect(result.summary.engagementRate).toBe(50);
      expect(redisMock.set).toHaveBeenCalled();
    });
  });

  describe('getCampaigns', () => {
    it('should return aggregated metrics grouped by campaign', async () => {
      prismaMock.client.campaign.findMany.mockResolvedValue([
        { id: 'camp-1', name: 'Campaign 1', status: 'active' },
      ]);
      prismaMock.client.performanceMetric.findMany.mockResolvedValue([
        {
          campaignId: 'camp-1',
          impressions: 100,
          reach: 80,
          clicks: 20,
          engagement: 30,
          conversions: 5,
          spendCents: 1000,
          revenueCents: 3000,
          roiCents: 2000,
        },
      ]);

      const result = await service.getCampaigns('biz-1');
      expect(result).toHaveLength(1);
      expect(result[0].ctr).toBe(20);
      expect(result[0].roas).toBe(3);
      expect(result[0].roiPercent).toBe(200);
    });
  });

  describe('getPlatforms', () => {
    it('should return metrics aggregated by platform', async () => {
      prismaMock.client.performanceMetric.findMany.mockResolvedValue([
        {
          platform: 'linkedin',
          impressions: 500,
          reach: 400,
          clicks: 50,
          engagement: 60,
          conversions: 10,
          spendCents: 2000,
          revenueCents: 5000,
          roiCents: 3000,
        },
      ]);

      const result = await service.getPlatforms('biz-1');
      const linkedin = result.find((p) => p.platform === 'linkedin');
      expect(linkedin).toBeDefined();
      expect(linkedin.ctr).toBe(10);
      expect(linkedin.roas).toBe(2.5);
    });
  });

  describe('getTrends', () => {
    it('should calculate trends comparing current vs previous period', async () => {
      prismaMock.client.performanceMetric.findMany
        .mockResolvedValueOnce([
          {
            collectedAt: new Date(),
            impressions: 200,
            reach: 150,
            clicks: 20,
            engagement: 40,
            conversions: 5,
            spendCents: 1000,
            revenueCents: 3000,
            roiCents: 2000,
          },
        ]) // current period
        .mockResolvedValueOnce([
          {
            collectedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
            impressions: 100,
            reach: 100,
            clicks: 10,
            engagement: 20,
            conversions: 2,
            spendCents: 500,
            revenueCents: 1000,
            roiCents: 500,
          },
        ]); // previous period

      const result = await service.getTrends('biz-1');
      expect(result.comparisons.impressions.growthPercent).toBe(100);
      expect(result.comparisons.clicks.growthPercent).toBe(100);
      expect(result.comparisons.impressions.direction).toBe('up');
    });
  });

  describe('getRoi', () => {
    it('should compute CPC, CPA, CPM, and Efficiency Score', async () => {
      prismaMock.client.performanceMetric.findMany.mockResolvedValue([
        {
          impressions: 10000,
          reach: 8000,
          clicks: 100,
          engagement: 200,
          conversions: 10,
          spendCents: 5000,
          revenueCents: 15000,
          roiCents: 10000,
        },
      ]);

      const result = await service.getRoi('biz-1');
      expect(result.totals.ctr).toBe(1);
      expect(result.totals.roas).toBe(3);
      expect(result.totals.cpc).toBe(50); // 5000 cents / 100 clicks
      expect(result.totals.cpa).toBe(500); // 5000 cents / 10 conversions
      expect(result.totals.cpm).toBe(500); // (5000 / 10000) * 1000
    });
  });

  describe('getAiRecommendations', () => {
    it('should generate recommendations dynamically from performance stats', async () => {
      prismaMock.client.campaign.findMany.mockResolvedValue([
        { id: 'camp-1', name: 'Brand Campaign', metadata: { budget: 100 } },
      ]);
      prismaMock.client.performanceMetric.findMany.mockResolvedValue([]);
      prismaMock.client.analyticsEvent.findMany.mockResolvedValue([]);

      const result = await service.getAiRecommendations('biz-1');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].topic).toBeDefined();
    });
  });

  describe('exportCsv', () => {
    it('should generate a string containing CSV headers and data', async () => {
      prismaMock.client.performanceMetric.findMany.mockResolvedValue([
        {
          collectedAt: new Date(),
          platform: 'facebook',
          contentId: 'cnt-1',
          campaignId: 'camp-1',
          reach: 100,
          impressions: 200,
          clicks: 10,
          engagement: 20,
          conversions: 1,
          ctr: 0.05,
          spendCents: 100,
          revenueCents: 300,
          roiCents: 200,
        },
      ]);

      const csv = await service.exportCsv('biz-1');
      expect(csv).toContain('Collected At,Platform,Content ID');
      expect(csv).toContain('facebook');
    });
  });

  describe('exportPdf', () => {
    it('should return a PassThrough PDF stream', async () => {
      prismaMock.client.campaign.findMany.mockResolvedValue([]);
      prismaMock.client.performanceMetric.findMany.mockResolvedValue([]);
      prismaMock.client.costEvent.aggregate.mockResolvedValue({ _sum: {} });
      prismaMock.client.costEvent.groupBy.mockResolvedValue([]);
      prismaMock.client.analyticsEvent.count.mockResolvedValue(0);
      prismaMock.client.analyticsEvent.groupBy.mockResolvedValue([]);
      prismaMock.client.knowledgeSource.findMany.mockResolvedValue([]);

      const pdfStream = await service.exportPdf('biz-1');
      expect(pdfStream).toBeInstanceOf(PassThrough);
    });
  });
});
