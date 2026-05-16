import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/database/prisma.service';
import { KnowledgeService } from './knowledge.service';

@Injectable()
export class FreshnessService {
  private readonly logger = new Logger(FreshnessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeService: KnowledgeService
  ) {}

  /**
   * Daily check for stale knowledge sources.
   * If a URL source is older than its syncFrequency (default 7 days for 'weekly'), trigger re-ingestion.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkFreshness() {
    this.logger.log('Starting knowledge freshness audit...');

    const now = new Date();
    
    // Find sources that need sync
    const sources = await this.prisma.client.knowledgeSource.findMany({
      where: {
        status: 'completed',
        syncFrequency: { not: 'manual' },
      },
    });

    for (const source of sources) {
      const frequencyDays = this.getFrequencyInDays(source.syncFrequency);
      const nextSync = new Date(source.updatedAt.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

      if (now > nextSync) {
        this.logger.log(`Source ${source.name} (${source.id}) is stale. Triggering re-ingestion.`);
        try {
          await this.knowledgeService.triggerIngestion(source.id, source.businessId);
        } catch (err) {
          this.logger.error(`Failed to trigger re-ingestion for ${source.id}: ${err}`);
        }
      }
    }

    this.logger.log('Knowledge freshness audit complete.');
  }

  private getFrequencyInDays(freq: string): number {
    switch (freq) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      default: return 7;
    }
  }
}
