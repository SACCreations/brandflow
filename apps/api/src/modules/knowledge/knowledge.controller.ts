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

  @Get('sources')
  @ApiOperation({ summary: 'List knowledge sources' })
  findSources(
    @CurrentUser() user: JwtPayload,
    @Query('brandId') brandId?: string,
  ) {
    return this.knowledgeService.findSources(user.businessId, brandId);
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

  @Patch('entries/:id/stale')
  @ApiOperation({ summary: 'Mark a knowledge entry as stale' })
  markStale(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.knowledgeService.markEntryStale(id, user.businessId);
  }
}
