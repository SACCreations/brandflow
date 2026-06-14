import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ReliabilityMonitorService } from './reliability-monitor.service';
import { AnalyticsService } from './analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../common/database/prisma.service';

describe('ReliabilityMonitorService', () => {
  let service: ReliabilityMonitorService;
  let analyticsServiceMock: any;
  let notificationsServiceMock: any;
  let prismaMock: any;

  beforeEach(async () => {
    analyticsServiceMock = {
      getReliabilityMetrics: vi.fn(),
      getSlaCompliance: vi.fn(),
    };

    notificationsServiceMock = {
      createNotification: vi.fn().mockResolvedValue({}),
    };

    prismaMock = {
      client: {
        business: {
          findMany: vi.fn(),
        },
        analyticsEvent: {
          create: vi.fn().mockResolvedValue({}),
        },
        publishJob: {
          groupBy: vi.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReliabilityMonitorService,
        { provide: AnalyticsService, useValue: analyticsServiceMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ReliabilityMonitorService>(ReliabilityMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('monitorReliability', () => {
    it('should trigger alert and notification when successRate is low (< 90)', async () => {
      prismaMock.client.business.findMany.mockResolvedValue([
        { id: 'biz-1', name: 'Biz 1', ownerId: 'owner-1' },
      ]);
      analyticsServiceMock.getReliabilityMetrics.mockResolvedValue({
        totalJobs: 10,
        successRate: 85,
        failedJobs: 2,
      });
      analyticsServiceMock.getSlaCompliance.mockResolvedValue({
        slaComplianceRate: 98,
        averageDelayMinutes: 5,
      });

      await service.monitorReliability();

      expect(prismaMock.client.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'biz-1',
            eventType: 'reliability_critical_alert',
          }),
        })
      );
      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-1',
          userId: 'owner-1',
          type: 'reliability_critical',
        })
      );
    });

    it('should trigger warning when SLA compliance is low (< 95)', async () => {
      prismaMock.client.business.findMany.mockResolvedValue([
        { id: 'biz-2', name: 'Biz 2', ownerId: 'owner-2' },
      ]);
      analyticsServiceMock.getReliabilityMetrics.mockResolvedValue({
        totalJobs: 10,
        successRate: 95,
        failedJobs: 0,
      });
      analyticsServiceMock.getSlaCompliance.mockResolvedValue({
        slaComplianceRate: 90,
        averageDelayMinutes: 15,
      });

      await service.monitorReliability();

      expect(prismaMock.client.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'biz-2',
            eventType: 'sla_compliance_warning',
          }),
        })
      );
      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-2',
          userId: 'owner-2',
          type: 'sla_warning',
        })
      );
    });
  });

  describe('analyzeFailures', () => {
    it('should query dead letter publish jobs and log failures', async () => {
      prismaMock.client.publishJob.groupBy.mockResolvedValue([
        { businessId: 'biz-1', failureClass: 'NetworkError', _count: 15 },
      ]);

      const logSpy = vi.spyOn((service as any).logger, 'log');

      await service.analyzeFailures();

      expect(prismaMock.client.publishJob.groupBy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('High frequency failure pattern detected'));
    });
  });
});
