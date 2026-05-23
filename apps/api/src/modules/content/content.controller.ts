import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  generateContentSchema,
  updateContentSchema,
  type GenerateContentDto,
  type UpdateContentDto,
  type JwtPayload,
} from '@brandflow/shared';

@ApiTags('content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('topics/suggest')
  @Permissions('content:read')
  @ApiOperation({ summary: 'Get AI recommended topic ideas' })
  suggestTopics(
    @Body('brandId') brandId: string,
    @Body('category') category: string,
    @CurrentUser() user: JwtPayload,
    @Body('campaignId') campaignId?: string,
  ) {
    return this.contentService.suggestTopics(user.businessId, brandId, category, campaignId);
  }

  @Get('jobs/:id')
  @Permissions('content:read')
  @ApiOperation({ summary: 'Get background generation job status' })
  async getJobStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contentService.getJobStatus(id, user.businessId);
  }

  @Get()
  @Permissions('content:read')
  @ApiOperation({ summary: 'List content items' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
    @Query('campaignId') campaignId?: string,
    @Query('status') status?: string,
    @Query('generationGroupId') generationGroupId?: string,
  ) {
    return this.contentService.findAll(user.businessId, { brandId, campaignId, status, generationGroupId });
  }

  @Get(':id')
  @Permissions('content:read')
  @ApiOperation({ summary: 'Get content item with versions and approvals' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contentService.findById(id, user.businessId);
  }

  @Post('generate')
  @Permissions('content:create' as any)
  @ApiOperation({ summary: 'Generate new content using AI' })
  generate(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(generateContentSchema)) dto: GenerateContentDto,
  ) {
    return this.contentService.generate(user.businessId, user.sub, dto);
  }

  @Post(':id/regenerate')
  @Permissions('content:create' as any)
  @ApiOperation({ summary: 'Regenerate content as a new variant in the same group' })
  regenerate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contentService.regenerate(id, user.businessId, user.sub);
  }

  @Patch(':id')
  @Permissions('content:edit' as any)
  @ApiOperation({ summary: 'Edit content body (creates new version)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateContentSchema)) dto: UpdateContentDto,
  ) {
    return this.contentService.update(id, user.businessId, user.sub, dto);
  }

  @Delete(':id')
  @Permissions('content:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a content item' })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contentService.archive(id, user.businessId);
  }
}
