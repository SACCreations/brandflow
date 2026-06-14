import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsProcessor } from './analytics.processor';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import type { Job } from 'bullmq';

describe('AnalyticsProcessor', () => {
  let processor: AnalyticsProcessor;
  let prismaMock: any;
  let redisMock: any;
  let redisClientMock: any;

  beforeEach(async () => {
    prismaMock = {
      client: {
        content: {
          findUnique: vi.fn(),
        },
        analyticsEvent: {
          create: vi.fn(),
        },
        business: {
          findMany: vi.fn(),
        },
        performanceMetric: {
          findFirst: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
      },
    };

    redisClientMock = {
      scan: vi.fn().mockResolvedValue(['0', []]),
      del: vi.fn().mockResolvedValue(1),
    };

    redisMock = {
      getClient: vi.fn().mockReturnValue(redisClientMock),
      del: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsProcessor,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    processor = module.get<AnalyticsProcessor>(AnalyticsProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should route "track" job to handleTrackEvent', async () => {
      const mockJob = {
        name: 'track',
        data: { businessId: 'biz-1', eventType: 'click', contentId: 'cnt-1' },
      } as Job;

      prismaMock.client.content.findUnique.mockResolvedValue({
        brandId: 'brand-1',
        campaignId: 'camp-1',
        platform: 'instagram',
      });
      prismaMock.client.analyticsEvent.create.mockResolvedValue({});
      prismaMock.client.performanceMetric.findFirst.mockResolvedValue(null);
      prismaMock.client.performanceMetric.create.mockResolvedValue({});

      await processor.process(mockJob);

      expect(prismaMock.client.analyticsEvent.create).toHaveBeenCalled();
      expect(prismaMock.client.performanceMetric.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'biz-1',
            contentId: 'cnt-1',
            brandId: 'brand-1',
            campaignId: 'camp-1',
            platform: 'instagram',
            clicks: 1,
          }),
        })
      );
    });

    it('should route "daily-aggregation" job to handleDailyAggregation', async () => {
      const mockJob = {
        name: 'daily-aggregation',
      } as Job;

      prismaMock.client.business.findMany.mockResolvedValue([
        { id: 'biz-1' },
        { id: 'biz-2' },
      ]);

      await processor.process(mockJob);

      expect(prismaMock.client.business.findMany).toHaveBeenCalled();
      expect(redisClientMock.scan).toHaveBeenCalled();
    });

    it('should route "generate-recommendations" job to handleGenerateRecommendations', async () => {
      const mockJob = {
        name: 'generate-recommendations',
      } as Job;

      prismaMock.client.business.findMany.mockResolvedValue([{ id: 'biz-1' }]);

      await processor.process(mockJob);

      expect(prismaMock.client.business.findMany).toHaveBeenCalled();
      expect(redisMock.del).toHaveBeenCalledWith('cache:analytics:biz-1:recommendations');
    });

    it('should log warning for unknown jobs', async () => {
      const mockJob = {
        name: 'unknown-job-name',
      } as Job;

      const loggerWarnSpy = vi.spyOn((processor as any).logger, 'warn');
      await processor.process(mockJob);
      expect(loggerWarnSpy).toHaveBeenCalled();
    });
  });

  describe('updatePerformanceMetric increments', () => {
    it('should increment existing performance metric statistics', async () => {
      const mockJob = {
        name: 'track',
        data: { businessId: 'biz-1', eventType: 'revenue', value: 500, contentId: 'cnt-1' },
      } as Job;

      prismaMock.client.content.findUnique.mockResolvedValue({
        brandId: 'brand-1',
        campaignId: 'camp-1',
        platform: 'instagram',
      });
      prismaMock.client.analyticsEvent.create.mockResolvedValue({});
      prismaMock.client.performanceMetric.findFirst.mockResolvedValue({
        id: 'metric-1',
        impressions: 10,
        clicks: 2,
        spendCents: 100,
        revenueCents: 200,
        roiCents: 100,
        sourceAttribution: {},
      });

      await processor.process(mockJob);

      expect(prismaMock.client.performanceMetric.update).toHaveBeenCalledWith({
        where: { id: 'metric-1' },
        data: expect.objectContaining({
          impressions: 10,
          clicks: 2,
          revenueCents: { increment: 500 },
          roiCents: { increment: 500 },
        }),
      });
    });
  });
});
