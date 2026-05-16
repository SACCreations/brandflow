import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createKnowledgeSourceSchema, type CreateKnowledgeSourceDto, type JwtPayload } from '@brandflow/shared';

@ApiTags('knowledge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get knowledge hub dashboard statistics' })
  getDashboardStats(@CurrentUser() user: JwtPayload) {
    return this.knowledgeService.getDashboardStats(user.businessId);
  }

  @Get('sources')
  @ApiOperation({ summary: 'List knowledge sources' })
  findSources(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
  ) {
    return this.knowledgeService.findSources(user.businessId, brandId);
  }

  @Get('sources/:id')
  @ApiOperation({ summary: 'Get detailed knowledge source' })
  findSourceById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.findSourceById(id, user.businessId);
  }

  @Get('sources/:id/entries')
  @ApiOperation({ summary: 'List knowledge entries for a source' })
  findEntries(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.findEntries(user.businessId, id);
  }

  @Post('sources')
  @ApiOperation({ summary: 'Add a knowledge source (triggers ingestion)' })
  createSource(
    @CurrentUser() user: JwtPayload,
    @Body() dto: any, // Relaxing validation for prototype expansion
  ) {
    return this.knowledgeService.createSource(user.businessId, dto);
  }

  @Delete('sources/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a knowledge source and its entries' })
  deleteSource(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.deleteSource(id, user.businessId);
  }

  @Post('entries/:id/review')
  @ApiOperation({ summary: 'Submit a human review for a knowledge entry' })
  updateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: { status: string; note?: string },
  ) {
    return this.knowledgeService.updateEntryReview(id, user.businessId, dto.status, dto.note);
  }

  @Patch('entries/:id/stale')
  @ApiOperation({ summary: 'Mark a knowledge entry as stale' })
  markStale(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.markEntryStale(id, user.businessId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List knowledge ingestion jobs' })
  findJobs(@CurrentUser() user: JwtPayload) {
    return this.knowledgeService.findJobs(user.businessId);
  }

  @Post('jobs/:id/retry')
  @ApiOperation({ summary: 'Retry a failed ingestion job' })
  retryJob(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.retryJob(id, user.businessId);
  }
}
