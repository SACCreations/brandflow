import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUES } from '@brandflow/shared';
import { ContentService } from './content.service';

interface ContentGenerationJobData {
  businessId: string;
  userId: string;
  dto: any;
}

@Processor(QUEUES.AI_GENERATION)
export class ContentQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(ContentQueueProcessor.name);

  constructor(private readonly contentService: ContentService) {
    super();
  }

  async process(job: Job<ContentGenerationJobData>): Promise<any> {
    const { businessId, userId, dto } = job.data;
    this.logger.log(`Starting background content generation job ${job.id} for business ${businessId}`);

    const topics = dto.topics && dto.topics.length > 0 ? dto.topics : [dto.topic];
    const totalCount = topics.length * (dto.count || 1);
    let completedCount = 0;
    const results = [];

    for (const topic of topics) {
      const iterations = dto.count || 1;
      for (let i = 0; i < iterations; i++) {
        try {
          // Construct generation payload for this specific item
          const itemDto = {
            ...dto,
            topic, // Current topic in the loop
            count: 1, // Single generation inside the loop
          };

          // Map advanced settings to the generation payload
          if (dto.creativity !== undefined && dto.creativity !== null) {
            itemDto.temperature = dto.creativity;
          }

          // If language or cta is specified, append it to additionalContext to influence LLM prompt
          let contextBuffer = dto.additionalContext || '';
          if (dto.language) {
            contextBuffer += `\nTarget Language: ${dto.language}`;
          }
          if (dto.cta) {
            contextBuffer += `\nPrimary Call-to-Action (CTA): ${dto.cta}`;
          }
          if (dto.seoOptimized) {
            contextBuffer += `\nSEO Focus: Optimize headings and body copy for search keywords relevant to this topic.`;
          }
          if (dto.complianceStrictness) {
            contextBuffer += `\nGovernance Rules: Strict adherence to brand voice and banned phrases is required.`;
          }

          itemDto.additionalContext = contextBuffer.trim() || undefined;

          // Call the primary generation service
          const res = await this.contentService.generate(businessId, userId, itemDto);
          results.push({
            contentId: res.content.id,
            topic,
            status: 'success',
          });
        } catch (err: any) {
          this.logger.error(`Failed iteration for topic "${topic}": ${err.message}`);
          results.push({
            topic,
            status: 'failed',
            error: err.message,
          });
        }

        completedCount++;
        const progress = Math.round((completedCount / totalCount) * 100);
        await job.updateProgress(progress);
      }
    }

    this.logger.log(`Background generation job ${job.id} completed. Generated ${results.filter(r => r.status === 'success').length} drafts.`);
    return { results };
  }
}
