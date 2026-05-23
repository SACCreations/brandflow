import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import type { Prisma } from '@brandflow/db';
import type {
  CampaignWorkflowMetadata,
  CreateCampaignDto,
  UpdateCampaignDto,
} from '@brandflow/shared';


@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(businessId: string, includeArchived = false) {
    return this.prisma.client.campaign.findMany({
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
    const campaign = await this.prisma.client.campaign.findFirst({
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

  async create(businessId: string, dto: CreateCampaignDto) {
    const payload = this.prepareCreatePayload(businessId, dto);

    return this.prisma.client.campaign.create({
      data: payload,
    });
  }

  async update(id: string, businessId: string, dto: UpdateCampaignDto) {
    const existing = await this.findOne(id, businessId);
    const payload = this.prepareUpdatePayload(existing, dto);

    return this.prisma.client.campaign.update({
      where: { id },
      data: payload
    });
  }

  async createFromBrief(briefId: string, businessId: string) {
    const brief = await this.prisma.client.brief.findFirst({
      where: { id: briefId, businessId },
      include: {
        campaign: { select: { id: true, name: true } },
      },
    });

    if (!brief) {
      throw new NotFoundException('Brief not found');
    }

    const metadata = this.normalizeBriefMetadata(brief.metadata);

    if (!brief.isComplete || metadata.status !== 'approved') {
      throw new BadRequestException('Only approved and complete briefs can create campaigns.');
    }

    if (brief.campaignId) {
      throw new ConflictException('This brief is already linked to a campaign.');
    }

    const project = metadata.projectId
      ? await this.prisma.client.project.findFirst({
          where: { id: metadata.projectId, businessId },
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
          },
        })
      : null;

    const created = await this.prisma.client.$transaction(async (tx: Prisma.TransactionClient) => {
      const campaign = await tx.campaign.create({
        data: {
          businessId,
          name: this.buildCampaignName(brief, project?.name),
          description: this.buildCampaignDescription(brief, project?.description ?? null),
          status: 'draft',
          startDate: project?.startDate ?? null,
          endDate: project?.endDate ?? null,
          metadata: {
            source: 'brief',
            sourceBriefId: brief.id,
            projectId: metadata.projectId ?? null,
            customerId: metadata.customerId ?? null,
            brandId: metadata.brandId ?? null,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.brief.update({
        where: { id: brief.id },
        data: { campaignId: campaign.id },
      });

      return campaign;
    });

    return created;
  }

  async archive(id: string, businessId: string) {
    await this.findOne(id, businessId);

    return this.prisma.client.campaign.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        status: 'archived',
      },
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

    await this.prisma.client.campaign.update({
      where: { id },
      data: { healthScore }
    });

    return { healthScore, components: { strategyScore, approvalScore, scheduleScore } };
  }

  async clone(id: string, businessId: string, newName: string) {
    const original = await this.findOne(id, businessId);

    const cloned = await this.prisma.client.campaign.create({
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
      await this.prisma.client.brief.create({
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
    return this.prisma.client.campaign.delete({
      where: { id }
    });
  }

  private prepareCreatePayload(
    businessId: string,
    dto: CreateCampaignDto,
  ): Prisma.CampaignUncheckedCreateInput {
    if (dto.startDate && dto.endDate && dto.endDate < dto.startDate) {
      throw new BadRequestException('Campaign end date cannot be earlier than the start date.');
    }

    return {
      businessId,
      name: dto.name.trim(),
      description: (dto.description && typeof dto.description === 'string' ? dto.description.trim() : null) || null,
      status: dto.status,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      clonedFromId: dto.clonedFromId ?? null,
      ...(dto.metadata ? { metadata: dto.metadata as unknown as Prisma.InputJsonValue } : {}),
    };
  }

  private prepareUpdatePayload(
    existing: Awaited<ReturnType<CampaignService['findOne']>>,
    dto: UpdateCampaignDto,
  ): Prisma.CampaignUncheckedUpdateInput {
    const nextStartDate = dto.startDate !== undefined ? dto.startDate ?? null : existing.startDate;
    const nextEndDate = dto.endDate !== undefined ? dto.endDate ?? null : existing.endDate;

    if (nextStartDate && nextEndDate && nextEndDate < nextStartDate) {
      throw new BadRequestException('Campaign end date cannot be earlier than the start date.');
    }

    const payload: Prisma.CampaignUncheckedUpdateInput = {};

    if (dto.name !== undefined) {
      payload.name = dto.name?.trim() ?? existing.name;
    }
    if (dto.description !== undefined) {
      payload.description = (dto.description && typeof dto.description === 'string' ? dto.description.trim() : null) || null;
    }
    if (dto.status !== undefined && dto.status !== null) {
      payload.status = dto.status;
    }
    if (dto.startDate !== undefined) {
      payload.startDate = dto.startDate ?? null;
    }
    if (dto.endDate !== undefined) {
      payload.endDate = dto.endDate ?? null;
    }
    if (dto.clonedFromId !== undefined) {
      payload.clonedFromId = dto.clonedFromId ?? null;
    }
    if (dto.metadata !== undefined) {
      payload.metadata = dto.metadata as unknown as Prisma.InputJsonValue;
    }

    return payload;
  }

  private normalizeBriefMetadata(metadata: Prisma.JsonValue | null) {
    const record = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

    return {
      projectId: this.getOptionalString(record['projectId']),
      customerId: this.getOptionalString(record['customerId']),
      brandId: this.getOptionalString(record['brandId']),
      status: record['status'] === 'approved' ? 'approved' : record['status'] === 'in_review' ? 'in_review' : 'draft',
    };
  }

  private buildCampaignName(
    brief: {
      platform: string | null;
      campaignTheme: string | null;
    },
    projectName?: string | null,
  ) {
    const theme = this.normalizeOptionalText(brief.campaignTheme);
    if (theme) return theme;

    if (projectName) {
      return `${projectName} Campaign`;
    }

    return `${brief.platform ? brief.platform.toUpperCase() : 'Multi-channel'} Campaign`;
  }

  private buildCampaignDescription(
    brief: {
      objective: string;
      audience: string | null;
      cta: string | null;
      businessGoal: string | null;
    },
    projectDescription?: string | null,
  ) {
    return [
      projectDescription ? `Project: ${projectDescription}` : null,
      `Objective: ${brief.objective}`,
      brief.audience ? `Audience: ${brief.audience}` : null,
      brief.businessGoal ? `Goal: ${brief.businessGoal}` : null,
      brief.cta ? `CTA: ${brief.cta}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private getOptionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private normalizeOptionalText(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}
