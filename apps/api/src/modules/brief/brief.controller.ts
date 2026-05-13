import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BriefService } from './brief.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createBriefSchema,
  updateBriefSchema,
  type CreateBriefDto,
  type JwtPayload,
  type UpdateBriefDto,
} from '@brandflow/shared';

@ApiTags('briefs')
@ApiBearerAuth()
@Controller('briefs')
@UseGuards(JwtAuthGuard)
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Get()
  @ApiOperation({ summary: 'List briefs for the workspace' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('projectId') projectId?: string,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.briefService.findAll(user.businessId, { projectId, campaignId });
  }

  @Post()
  @ApiOperation({ summary: 'Create a brief' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createBriefSchema)) dto: CreateBriefDto,
  ) {
    return this.briefService.create(user.businessId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a brief' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBriefSchema)) dto: UpdateBriefDto,
  ) {
    return this.briefService.update(id, user.businessId, dto);
  }

  @Post('template/:type')
  @ApiOperation({ summary: 'Create a brief from a template' })
  createFromTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
  ) {
    return this.briefService.createFromTemplate(user.businessId, type);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get AI suggestions for a brief field' })
  getAiSuggestions(
    @CurrentUser() user: JwtPayload,
    @Query('field') field: string,
    @Query('context') context: string,
  ) {
    let parsedContext: Record<string, unknown> = {};

    if (context) {
      try {
        parsedContext = JSON.parse(context) as Record<string, unknown>;
      } catch {
        throw new BadRequestException('context must be valid JSON');
      }
    }

    return this.briefService.getAiSuggestions(user.businessId, field, parsedContext);
  }

  @Get('project/:projectId/latest')
  @ApiOperation({ summary: 'Get the latest brief for a project' })
  findLatestForProject(
    @CurrentUser() user: JwtPayload,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.briefService.findLatestForProject(projectId, user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brief details' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.briefService.findById(id, user.businessId);
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate brief completeness' })
  validate(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.briefService.validate(id, user.businessId);
  }
}
