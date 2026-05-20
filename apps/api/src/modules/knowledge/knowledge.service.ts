import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';
import type { CreateKnowledgeSourceDto } from '@brandflow/shared';
import { QUEUES } from '@brandflow/shared';


@Injectable()
export class KnowledgeService {
  constructor(
    @InjectQueue(QUEUES.KNOWLEDGE_INGESTION) private readonly ingestionQueue: Queue,
    private readonly prisma: PrismaService,
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
      healthScore: 85, // Mock health score for now
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
        ...(classification && classification !== 'all' ? { classification } : {}),
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
        // If it exists, we could either throw an error or return the existing source
        // Let's re-trigger ingestion if it's failed, otherwise throw
        if (existing.status === 'failed') {
          await this.prisma.client.knowledgeSource.update({
            where: { id: existing.id },
            data: { status: 'pending' }
          });
        } else {
          throw new Error('This source has already been added to your knowledge base.');
        }
        return existing;
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

    // Mark existing entries as stale if re-ingesting
    await this.prisma.client.knowledgeEntry.updateMany({
      where: { sourceId, isStale: false },
      data: { isStale: true, staleAt: new Date() }
    });

    const job = await this.prisma.client.knowledgeJob.create({
      data: {
        sourceId,
        businessId,
        status: 'pending',
      },
    });

    await this.ingestionQueue.add('process-knowledge', {
      sourceId,
      businessId,
      jobId: job.id,
      type: source.type,
      sourceUrl: source.sourceUrl ?? undefined,
      text,
    });

    return job;
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

    // Update job status to pending
    await this.prisma.client.knowledgeJob.update({
      where: { id: jobId },
      data: { status: 'pending', startedAt: null, completedAt: null, progress: 0, error: null },
    });

    // Re-queue ingestion job
    await this.ingestionQueue.add(
      'ingest',
      { 
        sourceId: job.sourceId, 
        businessId, 
        type: job.source.type, 
        sourceUrl: job.source.sourceUrl, 
        metadata: job.source.metadata 
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return { status: 're-queued' };
  }
}
