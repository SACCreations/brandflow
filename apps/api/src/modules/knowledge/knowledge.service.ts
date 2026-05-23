import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';
import type { CreateKnowledgeSourceDto } from '@brandflow/shared';
import { QUEUES } from '@brandflow/shared';
import { IngestionService } from './ingestion.service';



@Injectable()
export class KnowledgeService {
  constructor(
    @InjectQueue(QUEUES.KNOWLEDGE_INGESTION) private readonly ingestionQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly ingestionService: IngestionService,
  ) {}


  async getDashboardStats(businessId: string) {
    const [totalSources, totalEntries, pendingReviews, recentJobs] = await Promise.all([
      this.prisma.client.knowledgeSource.count({ where: { businessId } }),
      this.prisma.client.knowledgeEntry.count({ where: { businessId } }),
      this.prisma.client.knowledgeReview.count({ where: { businessId, status: 'pending' } }),
      this.prisma.client.knowledgeJob.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { source: { select: { name: true, type: true } } },
      }),
    ]);

    const sourcesByStatus = await this.prisma.client.knowledgeSource.groupBy({
      by: ['status'],
      where: { businessId },
      _count: true,
    });

    const averageConfidence = await this.prisma.client.knowledgeEntry.aggregate({
      where: { businessId },
      _avg: { confidence: true },
    });

    return {
      totalSources,
      totalEntries,
      pendingReviews,
      recentJobs,
      sourcesByStatus: sourcesByStatus.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count }), {}),
      averageConfidence: averageConfidence._avg.confidence ?? 0,
      healthScore: totalSources > 0 
        ? Math.min(100, Math.round(((totalEntries > 0 ? 30 : 0) + (totalSources >= 3 ? 25 : totalSources * 8) + ((averageConfidence._avg.confidence ?? 0) * 30) + (pendingReviews === 0 ? 15 : 0))))
        : 0,
    };
  }

  async findSources(businessId: string, brandId?: string) {
    return this.prisma.client.knowledgeSource.findMany({
      where: { businessId, ...(brandId ? { brandId } : {}) },
      include: { 
        _count: { select: { entries: true } },
        jobs: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSourceById(id: string, businessId: string) {
    const source = await this.prisma.client.knowledgeSource.findFirst({
      where: { id, businessId },
      include: {
        entries: { take: 50, orderBy: { confidence: 'desc' } },
        jobs: { orderBy: { createdAt: 'desc' }, take: 5 },
        audits: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!source) throw new NotFoundException('Knowledge source not found');
    return source;
  }

  async findEntries(businessId: string, sourceId: string) {
    const source = await this.prisma.client.knowledgeSource.findFirst({
      where: { id: sourceId, businessId },
    });
    if (!source) throw new NotFoundException('Knowledge source not found');

    return this.prisma.client.knowledgeEntry.findMany({
      where: { sourceId },
      orderBy: { confidence: 'desc' },
    });
  }

  async searchEntries(businessId: string, search?: string, classification?: string) {
    const querySearch = search?.trim();
    return this.prisma.client.knowledgeEntry.findMany({
      where: {
        businessId,
        ...(classification && classification !== 'all' ? { 
          classification: { contains: classification, mode: 'insensitive' } 
        } : {}),
        ...(querySearch ? {
          OR: [
            { content: { contains: querySearch, mode: 'insensitive' } },
            { classification: { contains: querySearch, mode: 'insensitive' } },
            { source: { name: { contains: querySearch, mode: 'insensitive' } } },
          ]
        } : {}),
      },
      include: {
        source: { select: { name: true, type: true, sourceUrl: true } }
      },
      orderBy: { confidence: 'desc' },
      take: 100,
    });
  }


  async createSource(businessId: string, dto: any) {
    // Check for existing source with same URL for this business
    if (dto.sourceUrl && dto.sourceUrl !== 'manual-input') {
      const existing = await this.prisma.client.knowledgeSource.findFirst({
        where: { businessId, sourceUrl: dto.sourceUrl }
      });
      
      if (existing) {
        if (existing.status === 'failed') {
          await this.prisma.client.knowledgeSource.update({
            where: { id: existing.id },
            data: { status: 'pending' }
          });
          // Fix: Must trigger ingestion again since we marked it as pending
          await this.triggerIngestion(existing.id, businessId, dto.text);
          return existing;
        } else {
          throw new BadRequestException('This source has already been added to your knowledge base.');
        }
      }
    }

    const source = await this.prisma.client.knowledgeSource.create({
      data: {
        businessId,
        brandId: dto.brandId,
        name: dto.name,
        type: dto.type,
        sourceUrl: dto.sourceUrl,
        trustLevel: dto.trustLevel ?? 'high',
        syncFrequency: dto.syncFrequency ?? 'manual',
        status: 'pending',
        metadata: { ...(dto.metadata ?? {}), locale: dto.locale ?? 'en-US' },
      },
    });

    await this.triggerIngestion(source.id, businessId, dto.text);

    return source;
  }

  async triggerIngestion(sourceId: string, businessId: string, text?: string) {
    const source = await this.prisma.client.knowledgeSource.findFirst({
      where: { id: sourceId, businessId },
    });
    if (!source) throw new NotFoundException('Source not found');

    if (source.type !== 'url' && source.type !== 'api' && source.type !== 'manual' && !text) {
      throw new BadRequestException(`Cannot re-sync a ${source.type} without the original file. Please re-upload.`);
    }

    // Mark existing entries as stale
    await this.prisma.client.knowledgeEntry.updateMany({
      where: { sourceId, isStale: false },
      data: { isStale: true, staleAt: new Date() },
    });

    return this.ingestionService.enqueue(sourceId, businessId, text);
  }

  async triggerIngestionAll(businessId: string) {
    const sources = await this.prisma.client.knowledgeSource.findMany({
      where: { 
        businessId,
        type: { in: ['url', 'api', 'manual'] }
      },
    });
    
    for (const source of sources) {
      await this.triggerIngestion(source.id, businessId);
    }
    return { syncedCount: sources.length };
  }

  async fixAllFacts(businessId: string) {
    // Clean up annoying failed jobs with missing text
    await this.prisma.client.knowledgeJob.deleteMany({
      where: { businessId, status: 'failed', error: { contains: 'text (base64) is required' } }
    });

    const entries = await this.prisma.client.knowledgeEntry.findMany({
      where: { businessId, classification: 'fact' }
    });

    if (entries.length === 0) return { fixed: 0, total: 0 };

    const chunks = entries.map(e => e.content);
    const atoms = await this.ingestionService.classify(chunks, businessId);

    let updated = 0;
    for (let i = 0; i < entries.length; i++) {
       const atom = atoms[i];
       const entry = entries[i];
       
       if (entry && atom && atom.type && atom.type !== 'fact') {
           await this.prisma.client.knowledgeEntry.update({
              where: { id: entry.id },
              data: { classification: atom.type }
           });
           updated++;
       }
    }
    return { fixed: updated, total: entries.length };
  }


  async deleteSource(id: string, businessId: string) {
    const source = await this.prisma.client.knowledgeSource.findFirst({ where: { id, businessId } });
    if (!source) throw new NotFoundException('Knowledge source not found');

    await this.prisma.client.knowledgeSource.delete({ where: { id } });
  }

  async updateEntryReview(entryId: string, businessId: string, status: string, note?: string) {
    const entry = await this.prisma.client.knowledgeEntry.findFirst({
      where: { id: entryId, businessId },
    });
    if (!entry) throw new NotFoundException('Knowledge entry not found');

    return this.prisma.client.knowledgeReview.create({
      data: {
        businessId,
        entryId,
        status,
        note,
        decidedAt: new Date(),
      },
    });
  }

  async markEntryStale(entryId: string, businessId: string) {
    const entry = await this.prisma.client.knowledgeEntry.findFirst({
      where: { id: entryId, businessId },
    });
    if (!entry) throw new NotFoundException('Knowledge entry not found');

    return this.prisma.client.knowledgeEntry.update({
      where: { id: entryId },
      data: { isStale: true, staleAt: new Date() },
    });
  }

  async findJobs(businessId: string) {
    return this.prisma.client.knowledgeJob.findMany({
      where: { businessId },
      include: { source: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getReviewQueue(businessId: string) {
    return this.prisma.client.knowledgeEntry.findMany({
      where: {
        businessId,
        reviews: {
          none: { status: { in: ['approved', 'rejected'] } }
        }
      },
      include: {
        source: { select: { name: true, type: true, sourceUrl: true } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { confidence: 'asc' },
      take: 50,
    });
  }

  async retryJob(jobId: string, businessId: string) {
    const job = await this.prisma.client.knowledgeJob.findFirst({
      where: { id: jobId, businessId },
      include: { source: true },
    });
    if (!job) throw new NotFoundException('Job not found');

    await this.prisma.client.knowledgeJob.update({
      where: { id: jobId },
      data: { status: 'pending', startedAt: null, completedAt: null, progress: 0, error: null },
    });

    return this.ingestionService.enqueue(job.sourceId, businessId);
  }

  // -----------------------------------------------------------------------
  // Ingestion monitoring helpers
  // -----------------------------------------------------------------------
  async getIngestionLogs(sourceId: string, businessId: string) {
    return this.ingestionService.getLogs(sourceId, businessId);
  }

  async getFailedRecords(businessId: string) {
    return this.ingestionService.getFailedRecords(businessId);
  }

  async getSyncHistory(sourceId: string, businessId: string) {
    return this.ingestionService.getSyncHistory(sourceId, businessId);
  }
}
