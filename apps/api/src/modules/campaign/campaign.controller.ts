import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createCampaignSchema, updateCampaignSchema, createBriefSchema, type CreateCampaignDto, type UpdateCampaignDto, type CreateBriefDto, type JwtPayload } from '@brandflow/shared';

@ApiTags('campaign')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @ApiOperation({ summary: 'List campaigns' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.campaignService.findAll(user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.campaignService.findById(id, user.businessId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a campaign' })
  create(@CurrentUser() user: JwtPayload, @Body(new ZodValidationPipe(createCampaignSchema)) dto: CreateCampaignDto) {
    return this.campaignService.create(user.businessId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign' })
  update(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload, @Body(new ZodValidationPipe(updateCampaignSchema)) dto: UpdateCampaignDto) {
    return this.campaignService.update(id, user.businessId, dto);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone a campaign' })
  clone(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.campaignService.clone(id, user.businessId);
  }

  @Post(':id/briefs')
  @ApiOperation({ summary: 'Add a brief to a campaign' })
  addBrief(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload, @Body(new ZodValidationPipe(createBriefSchema)) dto: CreateBriefDto) {
    return this.campaignService.addBrief(id, user.businessId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a campaign' })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.campaignService.delete(id, user.businessId);
  }
}
