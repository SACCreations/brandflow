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

  async findSources(businessId: string, brandId?: string) {
    return prisma.knowledgeSource.findMany({
      where: { businessId, ...(brandId ? { brandId } : {}) },
      include: { _count: { select: { entries: true } } },
      orderBy: { createdAt: 'desc' },
    });
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

  async createSource(businessId: string, dto: CreateKnowledgeSourceDto) {
    const source = await prisma.knowledgeSource.create({
      data: {
        businessId,
        brandId: dto.brandId,
        type: dto.type,
        sourceUrl: dto.sourceUrl,
        status: 'pending',
      },
    });

    // Queue ingestion job
    await this.ingestionQueue.add(
      'ingest',
      { sourceId: source.id, businessId, type: dto.type, sourceUrl: dto.sourceUrl, text: dto.text },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return source;
  }

  async deleteSource(id: string, businessId: string) {
    const source = await prisma.knowledgeSource.findFirst({ where: { id, businessId } });
    if (!source) throw new NotFoundException('Knowledge source not found');

    await prisma.knowledgeSource.delete({ where: { id } });
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
