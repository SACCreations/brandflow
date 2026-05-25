import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BrandAnalyserService } from './brand-analyser.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { brandAnalysisRequestSchema, type BrandAnalysisRequestDto, type JwtPayload } from '@brandflow/shared';

@ApiTags('intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('brands/analyse')
export class BrandAnalyserController {
  constructor(
    private readonly brandAnalyserService: BrandAnalyserService,
    @InjectQueue('brand-analysis') private readonly brandAnalysisQueue: Queue
  ) {}

  @Post()
  @ApiOperation({ summary: 'Enqueue a job to analyse multiple knowledge sources to extract brand identity' })
  async analyse(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(brandAnalysisRequestSchema)) dto: BrandAnalysisRequestDto,
  ) {
    const job = await this.brandAnalysisQueue.add('analyse', {
      businessId: user.businessId,
      dto,
    });
    return { jobId: job.id, status: 'processing' };
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Check the status of a brand analysis job' })
  async getAnalysisStatus(@Param('jobId') jobId: string) {
    const job = await this.brandAnalysisQueue.getJob(jobId);
    
    if (!job) {
      throw new NotFoundException('Analysis job not found');
    }

    const state = await job.getState();

    if (state === 'completed') {
      return { status: 'completed', result: job.returnvalue };
    }

    if (state === 'failed') {
      return { status: 'failed', error: job.failedReason };
    }

    return { status: 'processing' };
  }
}
