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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'List content items' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
    @Query('campaignId') campaignId?: string,
    @Query('status') status?: string,
  ) {
    return this.contentService.findAll(user.businessId, { brandId, campaignId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content item with versions and approvals' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contentService.findById(id, user.businessId);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate new content using AI' })
  generate(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(generateContentSchema)) dto: GenerateContentDto,
  ) {
    return this.contentService.generate(user.businessId, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit content body (creates new version)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateContentSchema)) dto: UpdateContentDto,
  ) {
    return this.contentService.update(id, user.businessId, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a content item' })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contentService.archive(id, user.businessId);
  }
}
