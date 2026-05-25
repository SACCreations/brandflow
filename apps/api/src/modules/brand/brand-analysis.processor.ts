import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { BrandAnalyserService } from './brand-analyser.service';
import { BrandAnalysisRequestDto } from '@brandflow/shared';

@Processor('brand-analysis')
export class BrandAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(BrandAnalysisProcessor.name);

  constructor(private readonly brandAnalyserService: BrandAnalyserService) {
    super();
  }

  async process(job: Job<{ businessId: string; dto: BrandAnalysisRequestDto }>) {
    this.logger.log(`Processing brand analysis job ${job.id} for business ${job.data.businessId}`);
    
    try {
      const result = await this.brandAnalyserService.analyse(job.data.businessId, job.data.dto);
      this.logger.log(`Successfully completed brand analysis job ${job.id}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to process brand analysis job ${job.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
