import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@brandflow/shared';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('includeArchived') includeArchived: string
  ) {
    return this.campaignService.findAll(user.businessId, includeArchived === 'true');
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.campaignService.create(user.businessId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.campaignService.findOne(id, user.businessId);
  }

  @Put(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: any
  ) {
    return this.campaignService.update(id, user.businessId, dto);
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.campaignService.archive(id, user.businessId);
  }

  @Get(':id/health')
  getHealth(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.campaignService.calculateHealth(id, user.businessId);
  }

  @Post(':id/clone')
  clone(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('name') name: string
  ) {
    return this.campaignService.clone(id, user.businessId, name);
  }
}
