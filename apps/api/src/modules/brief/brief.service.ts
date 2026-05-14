import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import type { Prisma } from '@brandflow/db';
import { LLMGateway } from '@brandflow/ai';
import type {
  BriefWorkflowMetadata,
  BriefWorkflowMetadataDto,
  CreateBriefDto,
  UpdateBriefDto,
} from '@brandflow/shared';

import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class BriefService {
  private readonly ai: LLMGateway;

  constructor(private readonly prisma: PrismaService) {
    this.ai = new LLMGateway({ defaultProvider: 'openai' });
  }

  async findAll(
    businessId: string,
    filters: { projectId?: string; campaignId?: string } = {},
  ) {
    if (filters.projectId) {
      await this.assertProjectOwnership(businessId, filters.projectId);
    }

    if (filters.campaignId) {
      await this.assertCampaignOwnership(businessId, filters.campaignId);
    }

    return this.prisma.client.brief.findMany({
      where: {
        businessId,
        ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters.projectId
          ? {
              metadata: {
                path: ['projectId'],
                equals: filters.projectId,
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { campaign: { select: { id: true, name: true } } },
    });
  }

  async findById(id: string, businessId: string) {
    const brief = await this.prisma.client.brief.findFirst({
      where: { id, businessId },
      include: { campaign: { select: { id: true, name: true } } },
    });
    if (!brief) throw new NotFoundException('Brief not found');
    return brief;
  }

  async findLatestForProject(projectId: string, businessId: string) {
    await this.assertProjectOwnership(businessId, projectId);

    return this.prisma.client.brief.findFirst({
      where: {
        businessId,
        metadata: {
          path: ['projectId'],
          equals: projectId,
        },
      },
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(businessId: string, dto: CreateBriefDto) {
    const payload = await this.prepareCreatePayload(businessId, dto);

    return this.prisma.client.brief.create({
      data: payload,
      include: { campaign: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, businessId: string, dto: UpdateBriefDto) {
    const existing = await this.findById(id, businessId);
    const payload = await this.prepareUpdatePayload(businessId, existing, dto);

    return this.prisma.client.brief.update({
      where: { id },
      data: payload,
      include: { campaign: { select: { id: true, name: true } } },
    });
  }

  async createFromTemplate(businessId: string, templateType: string) {
    const templates: Record<string, any> = {
      product_launch: {
        objective: 'Drive awareness and pre-orders for new product',
        audience: 'Early adopters, existing customers',
        contentType: 'Multi-channel announcement',
        tone: 'Excited, authoritative, innovative',
        campaignTheme: 'The Future of [Product]',
      },
      seasonal_sale: {
        objective: 'Clear inventory and boost Q4 revenue',
        audience: 'Price-sensitive shoppers, previous buyers',
        contentType: 'Promotional ads and email',
        tone: 'Urgent, persuasive, direct',
        campaignTheme: 'Holiday Savings Event',
      },
      thought_leadership: {
        objective: 'Establish brand authority in [Industry]',
        audience: 'Industry peers, enterprise decision makers',
        contentType: 'blog',
        platform: 'linkedin',
        format: 'article',
        tone: 'Insightful, provocative, professional',
        campaignTheme: 'Industry Trends 2024',
      }
    };

    const config = templates[templateType] || {
      objective: 'Create a strategic brief for the next delivery milestone',
      metadata: { status: 'draft', source: 'manual', deliverables: [], constraints: [] },
    };

    return this.create(businessId, config);
  }

  async getAiSuggestions(businessId: string, field: string, context?: Record<string, unknown>) {
    // In production, we'd fetch high-performing campaign data from AnalyticsService
    // For now, we simulate an AI suggestion based on the brand context
    const prompt = `You are a strategic marketing consultant. 
      Suggest a ${field} for a content brief.
      Context: ${JSON.stringify(context || {})}
      Return only the suggested text.`;

    const { response } = await this.ai.complete(
      "You suggest high-converting marketing brief details.",
      prompt,
      { temperature: 0.8 }
    );

    return { suggestion: response.content };
  }

  async validate(id: string, businessId: string) {
    const brief = await this.findById(id, businessId);

    const missing = this.getMissingFields(brief);
    const isComplete = missing.length === 0;

    if (brief.isComplete !== isComplete) {
      await this.prisma.client.brief.update({
        where: { id },
        data: { isComplete },
      });
    }

    return { isComplete, missing };
  }

  private async prepareCreatePayload(
    businessId: string,
    dto: CreateBriefDto,
  ): Promise<Prisma.BriefUncheckedCreateInput> {
    if (dto.campaignId) {
      await this.assertCampaignOwnership(businessId, dto.campaignId);
    }

    const metadata = await this.resolveWorkflowMetadata(
      businessId,
      dto.metadata,
      dto.campaignId,
    );

    const nextState = {
      objective: dto.objective,
      audience: dto.audience ?? null,
      platform: dto.platform ?? null,
      cta: dto.cta ?? null,
      contentType: dto.contentType ?? null,
      businessGoal: dto.businessGoal ?? null,
    };

    return {
      businessId,
      campaignId: dto.campaignId ?? null,
      objective: dto.objective.trim(),
      audience: this.normalizeOptionalText(dto.audience) ?? null,
      platform: dto.platform ?? null,
      cta: this.normalizeOptionalText(dto.cta) ?? null,
      tone: this.normalizeOptionalText(dto.tone) ?? null,
      format: dto.format ?? null,
      contentType: dto.contentType ?? null,
      businessGoal: this.normalizeOptionalText(dto.businessGoal) ?? null,
      campaignTheme: this.normalizeOptionalText(dto.campaignTheme) ?? null,
      metadata: metadata as unknown as Prisma.InputJsonValue,
      isComplete: this.getMissingFields(nextState).length === 0,
    };
  }

  private async prepareUpdatePayload(
    businessId: string,
    existing: Awaited<ReturnType<BriefService['findById']>>,
    dto: UpdateBriefDto,
  ): Promise<Prisma.BriefUncheckedUpdateInput> {
    const nextCampaignId = dto.campaignId !== undefined ? dto.campaignId ?? null : existing.campaignId;

    if (nextCampaignId) {
      await this.assertCampaignOwnership(businessId, nextCampaignId);
    }

    const currentMetadata = this.normalizeStoredMetadata(existing.metadata);
    const metadata = dto.metadata
      ? await this.resolveWorkflowMetadata(
          businessId,
          { ...currentMetadata, ...dto.metadata },
          nextCampaignId ?? undefined,
        )
      : currentMetadata;

    const nextState = {
      objective: dto.objective ?? existing.objective,
      audience: dto.audience !== undefined ? dto.audience : existing.audience,
      platform: dto.platform !== undefined ? dto.platform : existing.platform,
      cta: dto.cta !== undefined ? dto.cta : existing.cta,
      contentType: dto.contentType !== undefined ? dto.contentType : existing.contentType,
      businessGoal: dto.businessGoal !== undefined ? dto.businessGoal : existing.businessGoal,
    };

    return {
      ...(dto.campaignId !== undefined ? { campaignId: dto.campaignId ?? null } : {}),
      ...(dto.objective !== undefined ? { objective: dto.objective.trim() } : {}),
      ...(dto.audience !== undefined ? { audience: this.normalizeOptionalText(dto.audience) ?? null } : {}),
      ...(dto.platform !== undefined ? { platform: dto.platform ?? null } : {}),
      ...(dto.cta !== undefined ? { cta: this.normalizeOptionalText(dto.cta) ?? null } : {}),
      ...(dto.tone !== undefined ? { tone: this.normalizeOptionalText(dto.tone) ?? null } : {}),
      ...(dto.format !== undefined ? { format: dto.format ?? null } : {}),
      ...(dto.contentType !== undefined ? { contentType: dto.contentType ?? null } : {}),
      ...(dto.businessGoal !== undefined ? { businessGoal: this.normalizeOptionalText(dto.businessGoal) ?? null } : {}),
      ...(dto.campaignTheme !== undefined ? { campaignTheme: this.normalizeOptionalText(dto.campaignTheme) ?? null } : {}),
      ...(dto.metadata !== undefined ? { metadata: metadata as unknown as Prisma.InputJsonValue } : {}),
      isComplete: this.getMissingFields(nextState).length === 0,
    };
  }

  private async resolveWorkflowMetadata(
    businessId: string,
    metadata: BriefWorkflowMetadataDto | Record<string, unknown> | null | undefined,
    campaignId?: string | null,
  ): Promise<BriefWorkflowMetadata> {
    const parsed = this.normalizeMetadataInput(metadata);
    let projectBrandId = parsed.brandId ?? undefined;
    let projectCustomerId = parsed.customerId ?? undefined;

    if (parsed.projectId) {
      const project = await this.prisma.client.project.findFirst({
        where: { id: parsed.projectId, businessId },
        select: {
          id: true,
          customerId: true,
          metadata: true,
        },
      });

      if (!project) {
        throw new BadRequestException('Selected project does not belong to this workspace.');
      }

      projectCustomerId = parsed.customerId ?? project.customerId ?? undefined;
      projectBrandId = parsed.brandId ?? this.extractPrimaryBrandId(project.metadata) ?? undefined;
    }

    if (projectCustomerId) {
      await this.assertCustomerOwnership(businessId, projectCustomerId);
    }

    if (projectBrandId) {
      await this.assertBrandOwnership(businessId, projectBrandId);
    }

    return {
      projectId: parsed.projectId ?? null,
      customerId: projectCustomerId ?? null,
      brandId: projectBrandId ?? null,
      status: parsed.status ?? 'draft',
      source: parsed.source ?? (parsed.projectId ? 'project' : campaignId ? 'campaign' : 'manual'),
      deliverables: parsed.deliverables,
      constraints: parsed.constraints,
    };
  }

  private normalizeMetadataInput(
    metadata: BriefWorkflowMetadataDto | Record<string, unknown> | null | undefined,
  ): BriefWorkflowMetadata {
    const source = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};

    return {
      projectId: this.getOptionalString(source['projectId']),
      customerId: this.getOptionalString(source['customerId']),
      brandId: this.getOptionalString(source['brandId']),
      status: this.getStatusValue(source['status']),
      source: this.getSourceValue(source['source']),
      deliverables: this.getStringArray(source['deliverables']),
      constraints: this.getStringArray(source['constraints']),
    };
  }

  private normalizeStoredMetadata(metadata: Prisma.JsonValue | null): BriefWorkflowMetadata {
    return this.normalizeMetadataInput(this.asRecord(metadata));
  }

  private getMissingFields(brief: {
    objective: string | null;
    audience: string | null;
    platform: string | null;
    cta: string | null;
    contentType: string | null;
    businessGoal: string | null;
  }) {
    const mandatoryFields = [
      { key: 'objective', value: brief.objective },
      { key: 'audience', value: brief.audience },
      { key: 'platform', value: brief.platform },
      { key: 'cta', value: brief.cta },
      { key: 'contentType', value: brief.contentType },
      { key: 'businessGoal', value: brief.businessGoal },
    ];

    return mandatoryFields
      .filter((field) => !this.normalizeOptionalText(field.value ?? undefined))
      .map((field) => field.key);
  }

  private async assertProjectOwnership(businessId: string, projectId: string) {
    const project = await this.prisma.client.project.findFirst({
      where: { id: projectId, businessId },
      select: { id: true },
    });

    if (!project) {
      throw new BadRequestException('Selected project does not belong to this workspace.');
    }
  }

  private async assertCampaignOwnership(businessId: string, campaignId: string) {
    const campaign = await this.prisma.client.campaign.findFirst({
      where: { id: campaignId, businessId },
      select: { id: true },
    });

    if (!campaign) {
      throw new BadRequestException('Selected campaign does not belong to this workspace.');
    }
  }

  private async assertCustomerOwnership(businessId: string, customerId: string) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, businessId },
      select: { id: true },
    });

    if (!customer) {
      throw new BadRequestException('Selected client does not belong to this workspace.');
    }
  }

  private async assertBrandOwnership(businessId: string, brandId: string) {
    const brand = await this.prisma.client.brand.findFirst({
      where: { id: brandId, businessId },
      select: { id: true },
    });

    if (!brand) {
      throw new BadRequestException('Selected brand does not belong to this workspace.');
    }
  }

  private extractPrimaryBrandId(metadata: Prisma.JsonValue | null) {
    return this.getOptionalString(this.asRecord(metadata)['primaryBrandId']);
  }

  private asRecord(value: Prisma.JsonValue | null | undefined) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private getOptionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private getStringArray(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  private getStatusValue(value: unknown): BriefWorkflowMetadata['status'] {
    return value === 'in_review' || value === 'approved' ? value : 'draft';
  }

  private getSourceValue(value: unknown): BriefWorkflowMetadata['source'] {
    return value === 'project' || value === 'campaign' ? value : 'manual';
  }

  private normalizeOptionalText(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}
