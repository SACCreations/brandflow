import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { prisma } from '@brandflow/db';
import type { CreateKnowledgeSourceDto } from '@brandflow/shared';
import { QUEUES } from '@brandflow/shared';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectQueue(QUEUES.KNOWLEDGE_INGESTION) private readonly ingestionQueue: Queue,
  ) {}

  async getDashboardStats(businessId: string) {
    const [totalSources, totalEntries, pendingReviews, recentJobs] = await Promise.all([
      prisma.knowledgeSource.count({ where: { businessId } }),
      prisma.knowledgeEntry.count({ where: { businessId } }),
      prisma.knowledgeReview.count({ where: { businessId, status: 'pending' } }),
      prisma.knowledgeJob.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { source: { select: { name: true, type: true } } },
      }),
    ]);

    const sourcesByStatus = await prisma.knowledgeSource.groupBy({
      by: ['status'],
      where: { businessId },
      _count: true,
    });

    const averageConfidence = await prisma.knowledgeEntry.aggregate({
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
    return prisma.knowledgeSource.findMany({
      where: { businessId, ...(brandId ? { brandId } : {}) },
      include: { 
        _count: { select: { entries: true } },
        jobs: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSourceById(id: string, businessId: string) {
    const source = await prisma.knowledgeSource.findFirst({
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
    const source = await prisma.knowledgeSource.findFirst({
      where: { id: sourceId, businessId },
    });
    if (!source) throw new NotFoundException('Knowledge source not found');

    return prisma.knowledgeEntry.findMany({
      where: { sourceId },
      orderBy: { confidence: 'desc' },
    });
  }

  async createSource(businessId: string, dto: any) {
    // Check for existing source with same URL for this business
    if (dto.sourceUrl && dto.sourceUrl !== 'manual-input') {
      const existing = await prisma.knowledgeSource.findFirst({
        where: { businessId, sourceUrl: dto.sourceUrl }
      });
      
      if (existing) {
        // If it exists, we could either throw an error or return the existing source
        // Let's re-trigger ingestion if it's failed, otherwise throw
        if (existing.status === 'failed') {
          await prisma.knowledgeSource.update({
            where: { id: existing.id },
            data: { status: 'pending' }
          });
        } else {
          throw new Error('This source has already been added to your knowledge base.');
        }
        return existing;
      }
    }

    const source = await prisma.knowledgeSource.create({
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

    // Queue ingestion job
    await this.ingestionQueue.add(
      'ingest',
      { 
        sourceId: source.id, 
        businessId, 
        type: dto.type, 
        sourceUrl: dto.sourceUrl, 
        config: dto.config,
        text: dto.text 
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return source;
  }

  async deleteSource(id: string, businessId: string) {
    const source = await prisma.knowledgeSource.findFirst({ where: { id, businessId } });
    if (!source) throw new NotFoundException('Knowledge source not found');

    await prisma.knowledgeSource.delete({ where: { id } });
  }

  async updateEntryReview(entryId: string, businessId: string, status: string, note?: string) {
    const entry = await prisma.knowledgeEntry.findFirst({
      where: { id: entryId, businessId },
    });
    if (!entry) throw new NotFoundException('Knowledge entry not found');

    return prisma.knowledgeReview.create({
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
    const entry = await prisma.knowledgeEntry.findFirst({
      where: { id: entryId, businessId },
    });
    if (!entry) throw new NotFoundException('Knowledge entry not found');

    return prisma.knowledgeEntry.update({
      where: { id: entryId },
      data: { isStale: true, staleAt: new Date() },
    });
  }
}
