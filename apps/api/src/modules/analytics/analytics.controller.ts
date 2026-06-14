import {
  Controller, Get, Post, Body, UseGuards, Query, Res, Inject, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsObservabilityInterceptor } from './analytics-observability.interceptor';
import type { AnalyticsEventPayload, JwtPayload } from '@brandflow/shared';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AnalyticsObservabilityInterceptor)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    @Inject(AnalyticsService) private readonly analyticsService: AnalyticsService
  ) {}

  @Post('events')
  @ApiOperation({ summary: 'Track an analytics event' })
  track(@CurrentUser() user: JwtPayload, @Body() payload: AnalyticsEventPayload) {
    return this.analyticsService.track({ ...payload, businessId: user.businessId });
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get aggregated metrics' })
  getMetrics(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getMetrics(user.businessId, brandId, from, to);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get analytics dashboard summary' })
  getSummary(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getSummary(user.businessId, from, to);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get campaign metrics aggregation' })
  getCampaigns(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getCampaigns(user.businessId, brandId, from, to);
  }

  @Get('platforms')
  @ApiOperation({ summary: 'Get platform metrics breakdown' })
  getPlatforms(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getPlatforms(user.businessId, brandId, from, to);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get performance trend analysis' })
  getTrends(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
    @Query('campaignId') campaignId?: string,
    @Query('platform') platform?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getTrends(user.businessId, brandId, campaignId, platform, from, to);
  }

  @Get('roi')
  @ApiOperation({ summary: 'Get ROI engine and efficiency metrics' })
  getRoi(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
    @Query('campaignId') campaignId?: string,
    @Query('platform') platform?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getRoi(user.businessId, brandId, campaignId, platform, from, to);
  }

  @Get('top-content')
  @ApiOperation({ summary: 'Get top performing content items' })
  getTopContent(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
    @Query('campaignId') campaignId?: string,
    @Query('platform') platform?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getTopContent(user.businessId, brandId, campaignId, platform, from, to, limit);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export performance metrics to CSV' })
  async exportCsv(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Query('brandId') brandId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csvContent = await this.analyticsService.exportCsv(user.businessId, brandId, from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=performance-metrics.csv');
    return res.status(200).send(csvContent);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export professional PDF report' })
  async exportPdf(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Query('brandId') brandId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const pdfStream = await this.analyticsService.exportPdf(user.businessId, brandId, from, to);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=performance-report.pdf');
    pdfStream.pipe(res);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics for content' })
  getPerformance(@CurrentUser() user: JwtPayload, @Query('contentId') contentId?: string) {
    return this.analyticsService.getPerformanceMetrics(user.businessId, contentId);
  }

  @Get('intelligence-impact')
  @ApiOperation({ summary: 'Get ROI impact of knowledge sources' })
  getIntelligenceImpact(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getIntelligenceImpact(user.businessId);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get AI-driven strategic recommendations' })
  getRecommendations(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getAiRecommendations(user.businessId);
  }
  
  @Get('costs')
  @ApiOperation({ summary: 'Get AI cost analysis' })
  getCosts(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getCostAnalysis(user.businessId, from, to);
  }
}
