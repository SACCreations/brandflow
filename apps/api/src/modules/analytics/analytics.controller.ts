import {
  Controller, Get, Post, Body, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AnalyticsEventPayload, JwtPayload } from '@brandflow/shared';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

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

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics for content' })
  getPerformance(@CurrentUser() user: JwtPayload, @Query('contentId') contentId?: string) {
    return this.analyticsService.getPerformanceMetrics(user.businessId, contentId);
  }
}
