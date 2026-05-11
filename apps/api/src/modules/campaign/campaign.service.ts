import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import type { Prisma, Brief } from '@brandflow/db';
import type { CreateCampaignDto, UpdateCampaignDto, CreateBriefDto } from '@brandflow/shared';

@Injectable()
export class CampaignService {
  async findAll(businessId: string) {
    return prisma.campaign.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { contents: true, briefs: true, schedules: true } },
      },
    });
  }

  async findById(id: string, businessId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, businessId },
      include: {
        briefs: true,
        contents: { select: { id: true, platform: true, type: true, status: true, createdAt: true } },
        schedules: { orderBy: { scheduledAt: 'asc' } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async create(businessId: string, dto: CreateCampaignDto) {
    return prisma.campaign.create({ data: { ...dto, businessId, status: 'draft' } });
  }

  async update(id: string, businessId: string, dto: UpdateCampaignDto) {
    await this.findById(id, businessId);
    return prisma.campaign.update({ where: { id }, data: dto });
  }

  async clone(id: string, businessId: string) {
    const source = await prisma.campaign.findFirst({
      where: { id, businessId },
      include: { briefs: true },
    });
    if (!source) throw new NotFoundException('Campaign not found');

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const clone = await tx.campaign.create({
        data: {
          businessId,
          name: `${source.name} (Copy)`,
          status: 'draft',
          clonedFromId: source.id,
        },
      });

      if (source.briefs.length > 0) {
        await tx.brief.createMany({
          data: source.briefs.map((b: Brief) => ({
            businessId,
            campaignId: clone.id,
            objective: b.objective,
            audience: b.audience,
            platform: b.platform,
            cta: b.cta,
            tone: b.tone,
            format: b.format,
            contentType: b.contentType,
            businessGoal: b.businessGoal,
          })),
        });
      }

      return clone;
    });
  }

  async addBrief(campaignId: string, businessId: string, dto: CreateBriefDto) {
    await this.findById(campaignId, businessId);
    return prisma.brief.create({ data: { ...dto, campaignId, businessId } });
  }

  async delete(id: string, businessId: string) {
    await this.findById(id, businessId);
    return prisma.campaign.update({ where: { id }, data: { status: 'archived' } });
  }
}
