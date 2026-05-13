import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@brandflow/db';
import type { Prisma, KnowledgeSource, KnowledgeEntry } from '@brandflow/db';
import { LLMGateway, PromptEngine, QualityControl, CostTracker, type LLMConfig } from '@brandflow/ai';
import type { GenerateContentDto, UpdateContentDto, BrandContext } from '@brandflow/shared';
import { LlmSettingsService } from '../llm-settings/llm-settings.service';
import { nanoid } from 'nanoid';

@Injectable()
export class ContentService {
  private readonly gateway: LLMGateway;
  private readonly promptEngine: PromptEngine;
  private readonly qualityControl: QualityControl;
  private readonly costTracker: CostTracker;

  constructor(
    private readonly config: ConfigService,
    private readonly llmSettingsService: LlmSettingsService,
  ) {
    this.gateway = new LLMGateway({
      defaultProvider: config.get('llm.defaultProvider', 'openai') as 'openai' | 'anthropic',
      fallbackProvider: config.get('llm.fallbackProvider', 'anthropic') as 'anthropic' | 'openai',
      requestTimeoutMs: config.get('llm.requestTimeoutMs', 30000),
    });
    this.promptEngine = new PromptEngine();
    this.qualityControl = new QualityControl(this.gateway);
    this.costTracker = new CostTracker(async (event) => {
      await prisma.costEvent.create({ data: event });
    });
  }

  async findAll(businessId: string, filters: { brandId?: string; campaignId?: string; status?: string }) {
    return prisma.content.findMany({
      where: { businessId, ...filters },
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { approvals: true, versions: true } },
      },
    });
  }

  async findById(id: string, businessId: string) {
    const content = await prisma.content.findFirst({
      where: { id, businessId },
      include: {
        brand: true,
        brief: {
          select: {
            id: true,
            objective: true,
            audience: true,
            cta: true,
            platform: true,
            tone: true,
            format: true,
            contentType: true,
            businessGoal: true,
            campaignTheme: true,
            metadata: true,
          },
        },
        campaign: { select: { id: true, name: true, status: true } },
        versions: { orderBy: { version: 'desc' } },
        approvals: { orderBy: { createdAt: 'desc' } },
        qualityChecks: { orderBy: { checkedAt: 'desc' }, take: 1 },
      },
    });
    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  async generate(businessId: string, userId: string, dto: GenerateContentDto) {
    // 1. Check token budget
    const subscription = await prisma.subscription.findFirst({
      where: { businessId, status: 'active' },
    });
    if (!subscription) {
      throw new ForbiddenException('No active subscription found');
    }

    const periodStart = new Date();
    periodStart.setDate(1);
    const usedThisPeriod = await prisma.costEvent.aggregate({
      where: {
        businessId,
        createdAt: { gte: periodStart },
        module: 'generation',
      },
      _sum: { outputTokens: true, inputTokens: true },
    });

    const totalTokensUsed = (usedThisPeriod._sum.inputTokens ?? 0) + (usedThisPeriod._sum.outputTokens ?? 0);
    if (totalTokensUsed >= subscription.tokenBudget) {
      throw new ForbiddenException('Token budget exhausted for this billing period');
    }

    const briefContext = dto.briefId
      ? await this.resolveBriefContext(dto.briefId, businessId, dto.campaignId)
      : null;

    const effectiveBrandId = dto.brandId ?? briefContext?.brandId;
    if (!effectiveBrandId) {
      throw new BadRequestException('A linked brand is required to generate content.');
    }

    const effectiveCampaignId = dto.campaignId ?? briefContext?.campaignId ?? undefined;

    // 2. Resolve brand context
    const brand = await prisma.brand.findFirst({
      where: { id: effectiveBrandId, businessId },
      include: {
        knowledgeSources: {
          where: { status: 'completed' },
          include: {
            entries: { where: { isStale: false }, take: 10, orderBy: { confidence: 'desc' } },
          },
        },
      },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    const brandContext: BrandContext = {
      name: brand.name,
      positioning: brand.positioning,
      audience: brand.audience,
      tone: brand.tone as string[] | null,
      governance: brand.governance as BrandContext['governance'],
      knowledgeEntries: brand.knowledgeSources
        .flatMap((s: KnowledgeSource & { entries: KnowledgeEntry[] }) => s.entries)
        .map((e: KnowledgeEntry) => e.content),
    };

    // 3. Resolve prompt
    const promptRecord = await prisma.prompt.findFirst({
      where: {
        module: 'social',
        isActive: true,
        OR: [{ businessId: null }, { businessId }],
      },
      orderBy: { version: 'desc' },
    });

    const promptTemplate = promptRecord?.template ?? this.getDefaultPromptTemplate(dto.platform);
    const sanitizedTopic = this.promptEngine.sanitizeInput(dto.topic);

    const systemPrompt = this.promptEngine.buildSystemPrompt(
      {
        promptId: promptRecord?.id ?? 'default',
        template: promptTemplate,
        layer: promptRecord?.layer ?? 'platform',
        version: promptRecord?.version ?? 1,
      },
      {
        businessId,
        brandId: effectiveBrandId,
        brand: brandContext,
        knowledgeEntries: brandContext.knowledgeEntries,
        extra: {
          topic: sanitizedTopic,
          platform: dto.platform,
          type: dto.type,
          additional_context: this.buildGenerationContext(dto.additionalContext, briefContext),
        },
      },
    );

    // 4. Generate content
    const llmSettings = await this.llmSettingsService.getSettings(businessId);
    const decryptedApiKey = await this.llmSettingsService.getDecryptedApiKey(businessId);

    const requestId = nanoid();
    const { response, provider: usedProvider } = await this.gateway.complete(
      systemPrompt,
      `Generate a ${dto.type} for ${dto.platform} about: ${sanitizedTopic}`,
      {
        provider: (llmSettings.provider as any) ?? 'openai',
        model: llmSettings.model ?? undefined,
        temperature: dto.temperature ?? llmSettings.temperature ?? 0.75,
        maxTokens: dto.maxTokens ?? llmSettings.maxTokens ?? 1024,
        apiKey: decryptedApiKey ?? undefined,
      },
    );

    // 5. Quality check
    const qualityResult = await this.qualityControl.check(
      response.content,
      brandContext,
      brandContext.knowledgeEntries?.slice(0, 5) ?? [],
    );

    // 6. Track cost
    await this.costTracker.track({
      businessId,
      module: 'generation',
      model: response.model,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      requestId,
    });

    // 7. Persist content
    const content = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.content.create({
        data: {
          businessId,
          brandId: effectiveBrandId,
          briefId: dto.briefId ?? null,
          campaignId: effectiveCampaignId ?? null,
          platform: dto.platform,
          type: dto.type,
          body: response.content,
          status: 'draft',
          qualityScore: qualityResult.confidenceScore,
          promptId: promptRecord?.id,
          promptVersion: promptRecord?.version,
        },
      });

      await tx.contentVersion.create({
        data: {
          contentId: created.id,
          version: 1,
          body: response.content,
          editedBy: userId,
        },
      });

      await tx.qualityCheck.create({
        data: {
          businessId,
          contentId: created.id,
          passed: qualityResult.passed,
          confidenceScore: qualityResult.confidenceScore,
          violations: qualityResult.violations as unknown as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return {
      content,
      qualityCheck: qualityResult,
      provider: usedProvider,
      requestId,
    };
  }

  async update(id: string, businessId: string, userId: string, dto: UpdateContentDto) {
    const content = await this.findById(id, businessId);

    if (['published', 'archived'].includes(content.status)) {
      throw new BadRequestException(`Cannot edit content in ${content.status} status`);
    }

    const latestVersion = await prisma.contentVersion.findFirst({
      where: { contentId: id },
      orderBy: { version: 'desc' },
    });

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.content.update({
        where: { id },
        data: { body: dto.body, status: 'draft' },
      });

      await tx.contentVersion.create({
        data: {
          contentId: id,
          version: (latestVersion?.version ?? 0) + 1,
          body: dto.body,
          editedBy: userId,
        },
      });

      return updated;
    });
  }

  async archive(id: string, businessId: string) {
    await this.findById(id, businessId);
    return prisma.content.update({ where: { id }, data: { status: 'archived' } });
  }

  private getDefaultPromptTemplate(platform: string): string {
    return `You are an expert content creator for {{brand_name}}.
Brand positioning: {{positioning}}
Target audience: {{audience}}
Tone: {{tone}}
Banned phrases: {{banned_phrases}}

Platform: ${platform}
Topic: {{topic}}
{{additional_context}}

Write high-quality, engaging content appropriate for ${platform}. Stay true to the brand voice.`;
  }

  private async resolveBriefContext(
    briefId: string,
    businessId: string,
    requestedCampaignId?: string | null,
  ) {
    const brief = await prisma.brief.findFirst({
      where: { id: briefId, businessId },
      select: {
        id: true,
        campaignId: true,
        objective: true,
        audience: true,
        cta: true,
        platform: true,
        tone: true,
        format: true,
        contentType: true,
        businessGoal: true,
        campaignTheme: true,
        isComplete: true,
        metadata: true,
      },
    });

    if (!brief) {
      throw new NotFoundException('Brief not found');
    }

    const metadata = this.asRecord(brief.metadata);
    const briefStatus = metadata['status'] === 'approved'
      ? 'approved'
      : metadata['status'] === 'in_review'
        ? 'in_review'
        : 'draft';

    if (!brief.isComplete || briefStatus !== 'approved') {
      throw new BadRequestException('Only approved and complete briefs can generate content.');
    }

    if (requestedCampaignId && brief.campaignId && brief.campaignId !== requestedCampaignId) {
      throw new BadRequestException('The selected brief does not belong to the selected campaign.');
    }

    const effectiveCampaignId = requestedCampaignId ?? brief.campaignId ?? null;
    if (effectiveCampaignId) {
      await this.assertCampaignOwnership(businessId, effectiveCampaignId);
    }

    return {
      ...brief,
      brandId: this.getOptionalString(metadata['brandId']),
      deliverables: this.getStringArray(metadata['deliverables']),
      constraints: this.getStringArray(metadata['constraints']),
      status: briefStatus,
      campaignId: effectiveCampaignId,
    };
  }

  private buildGenerationContext(
    additionalContext: string | null | undefined,
    briefContext:
      | {
          objective: string;
          audience: string | null;
          cta: string | null;
          tone: string | null;
          campaignTheme: string | null;
          businessGoal: string | null;
          deliverables: string[];
          constraints: string[];
        }
      | null,
  ) {
    const segments = [this.normalizeOptionalText(additionalContext)];

    if (briefContext) {
      segments.push(
        [
          `Brief objective: ${briefContext.objective}`,
          briefContext.audience ? `Audience: ${briefContext.audience}` : null,
          briefContext.businessGoal ? `Business goal: ${briefContext.businessGoal}` : null,
          briefContext.campaignTheme ? `Campaign theme: ${briefContext.campaignTheme}` : null,
          briefContext.tone ? `Preferred tone: ${briefContext.tone}` : null,
          briefContext.cta ? `Primary CTA: ${briefContext.cta}` : null,
          briefContext.deliverables.length > 0 ? `Deliverables: ${briefContext.deliverables.join(', ')}` : null,
          briefContext.constraints.length > 0 ? `Constraints: ${briefContext.constraints.join(', ')}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }

    return segments.filter(Boolean).join('\n\n');
  }

  private async assertCampaignOwnership(businessId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, businessId },
      select: { id: true },
    });

    if (!campaign) {
      throw new BadRequestException('Selected campaign does not belong to this workspace.');
    }
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
      .filter(Boolean);
  }

  private normalizeOptionalText(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
}
