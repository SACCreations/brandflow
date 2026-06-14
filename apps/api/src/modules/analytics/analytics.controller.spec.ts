import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import type { Response } from 'express';
import { PassThrough } from 'stream';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let serviceMock: any;
  const mockUser = {
    userId: 'user-1',
    businessId: 'biz-1',
    email: 'test@example.com',
    role: 'owner',
  } as any;

  beforeEach(async () => {
    serviceMock = {
      track: vi.fn().mockResolvedValue({ success: true }),
      getMetrics: vi.fn().mockResolvedValue({ total: 100 }),
      getSummary: vi.fn().mockResolvedValue({ summary: {} }),
      getCampaigns: vi.fn().mockResolvedValue([]),
      getPlatforms: vi.fn().mockResolvedValue([]),
      getTrends: vi.fn().mockResolvedValue({}),
      getRoi: vi.fn().mockResolvedValue({}),
      getTopContent: vi.fn().mockResolvedValue([]),
      exportCsv: vi.fn().mockResolvedValue('csv-content'),
      exportPdf: vi.fn().mockResolvedValue(new PassThrough()),
      getPerformanceMetrics: vi.fn().mockResolvedValue([]),
      getIntelligenceImpact: vi.fn().mockResolvedValue([]),
      getAiRecommendations: vi.fn().mockResolvedValue([]),
      getCostAnalysis: vi.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /analytics/events should call service.track', async () => {
    const payload = { eventType: 'click', contentId: 'cnt-1' } as any;
    const result = await controller.track(mockUser, payload);
    expect(serviceMock.track).toHaveBeenCalledWith({ ...payload, businessId: 'biz-1' });
    expect(result).toEqual({ success: true });
  });

  it('GET /analytics/metrics should call service.getMetrics', async () => {
    const result = await controller.getMetrics(mockUser, 'brand-1', '2026-06-01', '2026-06-07');
    expect(serviceMock.getMetrics).toHaveBeenCalledWith('biz-1', 'brand-1', '2026-06-01', '2026-06-07');
    expect(result).toEqual({ total: 100 });
  });

  it('GET /analytics/summary should call service.getSummary', async () => {
    const result = await controller.getSummary(mockUser, '2026-06-01', '2026-06-07');
    expect(serviceMock.getSummary).toHaveBeenCalledWith('biz-1', '2026-06-01', '2026-06-07');
    expect(result).toEqual({ summary: {} });
  });

  it('GET /analytics/campaigns should call service.getCampaigns', async () => {
    const result = await controller.getCampaigns(mockUser, 'brand-1', '2026-06-01', '2026-06-07');
    expect(serviceMock.getCampaigns).toHaveBeenCalledWith('biz-1', 'brand-1', '2026-06-01', '2026-06-07');
    expect(result).toEqual([]);
  });

  it('GET /analytics/platforms should call service.getPlatforms', async () => {
    const result = await controller.getPlatforms(mockUser, 'brand-1', '2026-06-01', '2026-06-07');
    expect(serviceMock.getPlatforms).toHaveBeenCalledWith('biz-1', 'brand-1', '2026-06-01', '2026-06-07');
    expect(result).toEqual([]);
  });

  it('GET /analytics/trends should call service.getTrends', async () => {
    const result = await controller.getTrends(mockUser, 'brand-1', 'camp-1', 'linkedin', '2026-06-01', '2026-06-07');
    expect(serviceMock.getTrends).toHaveBeenCalledWith('biz-1', 'brand-1', 'camp-1', 'linkedin', '2026-06-01', '2026-06-07');
    expect(result).toEqual({});
  });

  it('GET /analytics/roi should call service.getRoi', async () => {
    const result = await controller.getRoi(mockUser, 'brand-1', 'camp-1', 'linkedin', '2026-06-01', '2026-06-07');
    expect(serviceMock.getRoi).toHaveBeenCalledWith('biz-1', 'brand-1', 'camp-1', 'linkedin', '2026-06-01', '2026-06-07');
    expect(result).toEqual({});
  });

  it('GET /analytics/top-content should call service.getTopContent', async () => {
    const result = await controller.getTopContent(mockUser, 'brand-1', 'camp-1', 'linkedin', '2026-06-01', '2026-06-07', 5);
    expect(serviceMock.getTopContent).toHaveBeenCalledWith('biz-1', 'brand-1', 'camp-1', 'linkedin', '2026-06-01', '2026-06-07', 5);
    expect(result).toEqual([]);
  });

  it('GET /analytics/export/csv should set response headers and send content', async () => {
    const resMock = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response;

    await controller.exportCsv(mockUser, resMock, 'brand-1', '2026-06-01', '2026-06-07');
    expect(serviceMock.exportCsv).toHaveBeenCalledWith('biz-1', 'brand-1', '2026-06-01', '2026-06-07');
    expect(resMock.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(resMock.status).toHaveBeenCalledWith(200);
    expect(resMock.send).toHaveBeenCalledWith('csv-content');
  });

  it('GET /analytics/export/pdf should pipe PDF stream to response', async () => {
    const mockPipe = vi.fn();
    const mockPdfStream = { pipe: mockPipe } as any;
    serviceMock.exportPdf.mockResolvedValue(mockPdfStream);

    const resMock = {
      setHeader: vi.fn(),
    } as unknown as Response;

    await controller.exportPdf(mockUser, resMock, 'brand-1', '2026-06-01', '2026-06-07');
    expect(serviceMock.exportPdf).toHaveBeenCalledWith('biz-1', 'brand-1', '2026-06-01', '2026-06-07');
    expect(resMock.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(mockPipe).toHaveBeenCalledWith(resMock);
  });

  it('GET /analytics/performance should call service.getPerformanceMetrics', async () => {
    const result = await controller.getPerformance(mockUser, 'cnt-1');
    expect(serviceMock.getPerformanceMetrics).toHaveBeenCalledWith('biz-1', 'cnt-1');
    expect(result).toEqual([]);
  });

  it('GET /analytics/intelligence-impact should call service.getIntelligenceImpact', async () => {
    const result = await controller.getIntelligenceImpact(mockUser);
    expect(serviceMock.getIntelligenceImpact).toHaveBeenCalledWith('biz-1');
    expect(result).toEqual([]);
  });

  it('GET /analytics/recommendations should call service.getAiRecommendations', async () => {
    const result = await controller.getRecommendations(mockUser);
    expect(serviceMock.getAiRecommendations).toHaveBeenCalledWith('biz-1');
    expect(result).toEqual([]);
  });

  it('GET /analytics/costs should call service.getCostAnalysis', async () => {
    const result = await controller.getCosts(mockUser, '2026-06-01', '2026-06-07');
    expect(serviceMock.getCostAnalysis).toHaveBeenCalledWith('biz-1', '2026-06-01', '2026-06-07');
    expect(result).toEqual({});
  });
});
