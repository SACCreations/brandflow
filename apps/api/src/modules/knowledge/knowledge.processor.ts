import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUES } from '@brandflow/shared';
import { IngestionService } from './ingestion.service';

interface IngestionJobData {
  sourceId: string;
  businessId: string;
  jobId: string;
  type: string;
  sourceUrl?: string;
  text?: string;
}

@Processor(QUEUES.KNOWLEDGE_INGESTION)
export class KnowledgeProcessor extends WorkerHost {
  private readonly logger = new Logger(KnowledgeProcessor.name);

  constructor(private readonly ingestionService: IngestionService) {
    super();
  }

  async process(job: Job<IngestionJobData>): Promise<void> {
    const { sourceId, businessId, jobId, type, sourceUrl, text } = job.data;
    this.logger.log(`Processing job ${job.id} | source=${sourceId} | type=${type}`);
    await this.ingestionService.runPipeline(jobId, sourceId, businessId, type, sourceUrl, text);
  }
}
