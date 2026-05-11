import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import type { Prisma } from '@brandflow/db';
import { QUEUES } from '@brandflow/shared';

interface IngestionJobData {
  sourceId: string;
  businessId: string;
  type: string;
  sourceUrl?: string;
  text?: string;
}

@Processor(QUEUES.KNOWLEDGE_INGESTION)
export class KnowledgeProcessor extends WorkerHost {
  private readonly logger = new Logger(KnowledgeProcessor.name);

  async process(job: Job<IngestionJobData>): Promise<void> {
    const { sourceId, businessId, type, sourceUrl, text } = job.data;
    this.logger.log(`Processing knowledge source ${sourceId} (type: ${type})`);

    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { status: 'processing' },
    });

    try {
      const content = await this.extractContent(type, sourceUrl, text);
      const entries = await this.parseEntries(content);

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.knowledgeEntry.createMany({
          data: entries.map((e) => ({
            businessId,
            sourceId,
            type: e.type,
            content: e.content,
            confidence: e.confidence,
          })),
        });

        await tx.knowledgeSource.update({
          where: { id: sourceId },
          data: { status: 'completed', lastIngested: new Date() },
        });
      });

      this.logger.log(`Knowledge source ${sourceId} ingested: ${entries.length} entries`);
    } catch (err) {
      this.logger.error(`Knowledge ingestion failed for ${sourceId}:`, err);
      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: 'failed' },
      });
      throw err;
    }
  }

  private async extractContent(type: string, sourceUrl?: string, text?: string): Promise<string> {
    switch (type) {
      case 'text':
        return text ?? '';
      case 'url':
        if (!sourceUrl) throw new Error('URL source requires sourceUrl');
        // In production: use a headless browser or crawler
        const response = await fetch(sourceUrl);
        return response.text();
      case 'pdf':
      case 'docx':
        // In production: use a document parser (pdf-parse, mammoth)
        return text ?? 'Document content would be extracted here';
      default:
        return text ?? '';
    }
  }

  private async parseEntries(
    content: string,
  ): Promise<Array<{ type: string; content: string; confidence: number }>> {
    // Simple MVP: split by sentences, classify as 'fact'
    // In production: use LLM to classify entry types
    const sentences = content
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    return sentences.slice(0, 100).map((sentence) => ({
      type: 'fact',
      content: sentence,
      confidence: 0.8,
    }));
  }
}
