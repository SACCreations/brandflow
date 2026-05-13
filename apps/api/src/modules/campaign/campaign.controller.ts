import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createCampaignSchema,
  updateCampaignSchema,
  type CreateCampaignDto,
  type JwtPayload,
  type UpdateCampaignDto,
} from '@brandflow/shared';

@ApiTags('campaigns')
@ApiBearerAuth()
@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @ApiOperation({ summary: 'List campaigns for the workspace' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('includeArchived') includeArchived: string
  ) {
    return this.campaignService.findAll(user.businessId, includeArchived === 'true');
  }

  @Post()
  @ApiOperation({ summary: 'Create a campaign' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createCampaignSchema)) dto: CreateCampaignDto,
  ) {
    return this.campaignService.create(user.businessId, dto);
  }

  @Post('from-brief/:briefId')
  @ApiOperation({ summary: 'Create a campaign from an approved brief' })
  createFromBrief(
    @CurrentUser() user: JwtPayload,
    @Param('briefId', ParseUUIDPipe) briefId: string,
  ) {
    return this.campaignService.createFromBrief(briefId, user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignService.findOne(id, user.businessId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a campaign' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCampaignSchema)) dto: UpdateCampaignDto,
  ) {
    return this.campaignService.update(id, user.businessId, dto);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a campaign' })
  archive(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignService.archive(id, user.businessId);
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Calculate campaign health' })
  getHealth(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignService.calculateHealth(id, user.businessId);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone a campaign' })
  clone(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') name: string
  ) {
    return this.campaignService.clone(id, user.businessId, name);
  }

  @Post(':id/delete') // Using POST for delete to avoid some proxy issues, or just use @Delete
  @ApiOperation({ summary: 'Delete a campaign' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.campaignService.remove(id, user.businessId);
  }
}
