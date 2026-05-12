import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';

@Injectable()
export class CampaignService {
  async findAll(businessId: string, includeArchived = false) {
    return prisma.campaign.findMany({
      where: { 
        businessId,
        archivedAt: includeArchived ? undefined : null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contents: true, briefs: true, schedules: true }
        }
      }
    });
  }

  async findOne(id: string, businessId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, businessId },
      include: {
        briefs: true,
        contents: {
          include: { approvals: true, schedules: true }
        },
        schedules: {
          include: { socialAccount: true }
        },
        assets: true,
        templates: true
      }
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async create(businessId: string, dto: any) {
    return prisma.campaign.create({
      data: {
        ...dto,
        businessId,
      },
    });
  }

  async update(id: string, businessId: string, dto: any) {
    return prisma.campaign.update({
      where: { id },
      data: dto
    });
  }

  async archive(id: string, businessId: string) {
    return this.update(id, businessId, {
      archivedAt: new Date(),
      status: 'archived'
    });
  }

  async calculateHealth(id: string, businessId: string) {
    const campaign = await this.findOne(id, businessId);
    
    let strategyScore = 0;
    let approvalScore = 0;
    let scheduleScore = 0;

    // 1. Strategy Score (Brief completeness)
    if (campaign.briefs.length > 0) {
      const completeBriefs = campaign.briefs.filter(b => b.isComplete).length;
      strategyScore = (completeBriefs / campaign.briefs.length) * 100;
    }

    // 2. Approval Score (Content status)
    if (campaign.contents.length > 0) {
      const approvedContent = campaign.contents.filter(c => c.status === 'approved').length;
      approvalScore = (approvedContent / campaign.contents.length) * 100;
    }

    // 3. Schedule Score (Future coverage)
    if (campaign.schedules.length > 0) {
      const pendingSchedules = campaign.schedules.filter(s => s.status === 'pending').length;
      scheduleScore = (pendingSchedules / Math.max(campaign.contents.length, 1)) * 100;
    }

    const healthScore = Math.round((strategyScore + approvalScore + scheduleScore) / 3);

    await prisma.campaign.update({
      where: { id },
      data: { healthScore }
    });

    return { healthScore, components: { strategyScore, approvalScore, scheduleScore } };
  }

  async clone(id: string, businessId: string, newName: string) {
    const original = await this.findOne(id, businessId);

    const cloned = await prisma.campaign.create({
      data: {
        businessId,
        name: newName,
        description: original.description,
        status: 'draft',
        startDate: original.startDate,
        endDate: original.endDate,
        clonedFromId: id,
        metadata: original.metadata as any,
      }
    });

    // Clone Briefs
    for (const brief of original.briefs) {
      await prisma.brief.create({
        data: {
          businessId,
          campaignId: cloned.id,
          objective: brief.objective,
          audience: brief.audience,
          platform: brief.platform,
          cta: brief.cta,
          tone: brief.tone,
          format: brief.format,
          contentType: brief.contentType,
          businessGoal: brief.businessGoal,
          campaignTheme: brief.campaignTheme,
          isComplete: brief.isComplete,
          metadata: brief.metadata as any,
        }
      });
    }

    // Note: In production, we might also clone templates or automations
    // but we usually skip cloning 'Contents' and 'Schedules' as they are execution-specific.

    return cloned;
  }

  async remove(id: string, businessId: string) {
    // Check if campaign exists and belongs to business
    await this.findOne(id, businessId);
    return prisma.campaign.delete({
      where: { id }
    });
  }
}
