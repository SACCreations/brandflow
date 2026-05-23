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
import { createKnowledgeSourceSchema, knowledgeReviewSchema, type CreateKnowledgeSourceDto, type KnowledgeReviewDto, type JwtPayload } from '@brandflow/shared';

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

  @Get('entries')
  @ApiOperation({ summary: 'Search and filter all knowledge entries' })
  searchEntries(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('classification') classification?: string,
  ) {
    return this.knowledgeService.searchEntries(user.businessId, search, classification);
  }


  @Post('sources')
  @ApiOperation({ summary: 'Add a knowledge source (triggers ingestion)' })
  createSource(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createKnowledgeSourceSchema)) dto: CreateKnowledgeSourceDto,
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

  @Post('sources/sync-all')
  @ApiOperation({ summary: 'Trigger a re-sync of all knowledge sources' })
  syncAllSources(@CurrentUser() user: JwtPayload) {
    return this.knowledgeService.triggerIngestionAll(user.businessId);
  }

  @Post('fix-all-facts')
  @ApiOperation({ summary: 'Temp script to reclassify all broken fact entries and delete failed file jobs' })
  fixAllFacts(@CurrentUser() user: JwtPayload) {
    return this.knowledgeService.fixAllFacts(user.businessId);
  }

  @Post('sources/:id/sync')
  @ApiOperation({ summary: 'Trigger a re-sync of a knowledge source' })
  syncSource(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.triggerIngestion(id, user.businessId);
  }

  @Post('entries/:id/review')
  @ApiOperation({ summary: 'Submit a human review for a knowledge entry' })
  updateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(knowledgeReviewSchema)) dto: KnowledgeReviewDto,
  ) {
    return this.knowledgeService.updateEntryReview(id, user.businessId, dto.status, dto.note ?? undefined);
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

  @Get('review-queue')
  @ApiOperation({ summary: 'Get the knowledge review queue' })
  getReviewQueue(@CurrentUser() user: JwtPayload) {
    return this.knowledgeService.getReviewQueue(user.businessId);
  }

  @Post('jobs/:id/retry')
  @ApiOperation({ summary: 'Retry a failed ingestion job' })
  retryJob(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.retryJob(id, user.businessId);
  }

  @Get('sources/:id/logs')
  @ApiOperation({ summary: 'Get ingestion logs for a source' })
  getIngestionLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.getIngestionLogs(id, user.businessId);
  }

  @Get('sources/:id/sync-history')
  @ApiOperation({ summary: 'Get sync history for a source' })
  getSyncHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.getSyncHistory(id, user.businessId);
  }

  @Get('failed-records')
  @ApiOperation({ summary: 'Get all failed ingestion records for the business' })
  getFailedRecords(@CurrentUser() user: JwtPayload) {
    return this.knowledgeService.getFailedRecords(user.businessId);
  }
}
