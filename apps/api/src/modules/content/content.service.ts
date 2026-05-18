import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@brandflow/db';
import type { Prisma, KnowledgeSource, KnowledgeEntry } from '@brandflow/db';
import { LLMGateway, PromptEngine, CostTracker, VectorService, type LLMConfig } from '@brandflow/ai';
import type { GenerateContentDto, UpdateContentDto, BrandContext } from '@brandflow/shared';
import { LlmSettingsService } from '../llm-settings/llm-settings.service';
import { PrismaService } from '../../common/database/prisma.service';
import { BudgetService } from '../llm-settings/budget.service';
import { AuditService } from '../business/audit.service';
import { QualityService } from '../quality/quality.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '@brandflow/shared';

@Injectable()
export class ContentService {
  private readonly gateway: LLMGateway;
  private readonly promptEngine: PromptEngine;
  private readonly costTracker: CostTracker;
  private readonly vectorService: VectorService;

  constructor(
    private readonly config: ConfigService,
    private readonly llmSettingsService: LlmSettingsService,
    private readonly prisma: PrismaService,
    private readonly budgetService: BudgetService,
    private readonly auditService: AuditService,
    private readonly qualityService: QualityService,
    @InjectQueue(QUEUES.AI_GENERATION) private readonly aiGenerationQueue: Queue,
  ) {
    this.gateway = new LLMGateway({
      defaultProvider: config.get('llm.defaultProvider', 'openai') as 'openai' | 'anthropic',
      fallbackProvider: config.get('llm.fallbackProvider', 'anthropic') as 'anthropic' | 'openai',
      requestTimeoutMs: config.get('llm.requestTimeoutMs', 30000),
      onBeforeComplete: async (options: LLMConfig) => {
        const tenantId = (this.prisma.client as any)['tenantId'] || options.businessId;
        if (tenantId) {
          await this.budgetService.checkBudget(tenantId);
        }
      },
    });
    this.promptEngine = new PromptEngine();
    this.costTracker = new CostTracker(async (event) => {
      await this.prisma.client.costEvent.create({ data: event });
      const totalTokens = (event.inputTokens || 0) + (event.outputTokens || 0);
      await this.budgetService.incrementUsage(event.businessId, totalTokens).catch(() => {});
    });
    this.vectorService = new VectorService();
  }


  async findAll(businessId: string, filters: { brandId?: string; campaignId?: string; status?: string }) {
    return this.prisma.client.content.findMany({
      where: { businessId, ...filters } as any,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { approvals: true, versions: true } },
      },
    });
  }

  async findById(id: string, businessId: string) {
    const content = await this.prisma.client.content.findFirst({
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
        schedules: {
          include: {
            socialAccount: { select: { id: true, platform: true, name: true } },
            publishJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
          orderBy: { scheduledAt: 'asc' },
        },
        versions: { orderBy: { version: 'desc' } },
        approvals: { orderBy: { createdAt: 'desc' } },
        qualityChecks: { orderBy: { checkedAt: 'desc' }, take: 1 },
      },
    });
    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  async generate(businessId: string, userId: string, dto: GenerateContentDto) {
    // Check if background queue execution is needed
    const topicsList = dto.topics && dto.topics.length > 0 ? dto.topics : (dto.topic ? [dto.topic] : []);
    const totalCount = topicsList.length * (dto.count || 1);

    if (totalCount > 3 || (dto.topics && dto.topics.length > 1)) {
      const job = await this.aiGenerationQueue.add(
        'generate-batch',
        { businessId, userId, dto },
        { attempts: 3, backoff: 5000 }
      );

      return {
        jobId: job.id,
        status: 'queued',
        progress: 0,
        async: true,
      } as any;
    }

    const effectiveTopic = topicsList[0] || dto.topic;
    if (!effectiveTopic) {
      throw new BadRequestException('A topic is required to generate content.');
    }

    // 1. Check token budget
    const subscription = await this.prisma.client.subscription.findFirst({
      where: { businessId, status: 'active' },
    });
    if (!subscription) {
      throw new ForbiddenException('No active subscription found');
    }

    const periodStart = new Date();
    periodStart.setDate(1);
    const usedThisPeriod = await this.prisma.client.costEvent.aggregate({
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
    const brand = await this.prisma.client.brand.findFirst({
      where: { id: effectiveBrandId, businessId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    // Perform semantic retrieval for relevant facts
    const relevantFacts = await this.vectorService.findRelevantContext(
      this.prisma.client,
      businessId,
      effectiveTopic,
      10 // Top 10 facts
    );

    const brandContext: BrandContext = {
      name: brand.name,
      positioning: brand.positioning,
      audience: brand.audience,
      tone: brand.tone as string[] | null,
      governance: brand.governance as BrandContext['governance'],
      knowledgeEntries: relevantFacts.map((f: any) => f.content),
    };

    // 3. Resolve prompt
    const promptRecord = await this.prisma.client.prompt.findFirst({
      where: {
        module: 'social',
        isActive: true,
        OR: [{ businessId: null }, { businessId }],
      },
      orderBy: { version: 'desc' },
    });

    const promptTemplate = promptRecord?.template ?? this.getDefaultPromptTemplate(dto.platform);
    const sanitizedTopic = this.promptEngine.sanitizeInput(effectiveTopic);

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

    const requestId = randomUUID();
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

    // 5. Quality check & Persist (Delegated to QualityService)
    const qualityResult = await this.qualityService.runCheck(
      '', // Temporary placeholder for contentId before creation, or we create content first
      response.content,
      businessId,
      effectiveBrandId,
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
    const content = await this.prisma.client.$transaction(async (tx: Prisma.TransactionClient) => {
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
          metadata: {
            sourceIds: relevantFacts.map((f: any) => f.sourceId).filter(Boolean),
            requestId,
          } as any,
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

      // Update quality check with the actual contentId (as it was likely created with an empty one or needs linking)
      // Since QualityService.runCheck creates the record, we might need to adjust the order:
      // Content First -> Then Quality Check.
      
      return created;
    });

    // RE-RUN QC with proper contentId for persistence
    const finalQualityResult = await this.qualityService.runCheck(
      content.id,
      response.content,
      businessId,
      effectiveBrandId,
    );

    await this.auditService.log({
      businessId,
      userId,
      action: 'generate',
      entityType: 'content',
      entityId: content.id,
      after: { platform: dto.platform, type: dto.type, briefId: dto.briefId },
    });

    return {
      content,
      qualityCheck: finalQualityResult,
      provider: usedProvider,
      requestId,
    };
  }


  async update(id: string, businessId: string, userId: string, dto: UpdateContentDto) {
    const content = await this.findById(id, businessId);

    if (['published', 'archived'].includes(content.status)) {
      throw new BadRequestException(`Cannot edit content in ${content.status} status`);
    }

    const latestVersion = await this.prisma.client.contentVersion.findFirst({
      where: { contentId: id },
      orderBy: { version: 'desc' },
    });

    return this.prisma.client.$transaction(async (tx: Prisma.TransactionClient) => {
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
    return this.prisma.client.content.update({ where: { id }, data: { status: 'archived' } });
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
    const brief = await this.prisma.client.brief.findFirst({
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
    const campaign = await this.prisma.client.campaign.findFirst({
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

  async getJobStatus(jobId: string, businessId: string) {
    const job = await this.aiGenerationQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (job.data.businessId !== businessId) {
      throw new ForbiddenException('Access denied to this job');
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;

    return {
      id: job.id,
      status: state,
      progress,
      result,
    };
  }

  async suggestTopics(businessId: string, brandId: string, category: string, campaignId?: string) {
    const brand = await this.prisma.client.brand.findFirst({
      where: { id: brandId, businessId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    const brandName = brand.name;
    const tone = Array.isArray(brand.tone) ? brand.tone.join(', ') : 'professional';
    const industry = brand.industry || 'marketing';

    const systemPrompt = `You are a Senior Content strategist for the brand "${brandName}" in the "${industry}" industry.
Generate exactly 5 creative, highly relevant marketing and content topic ideas for the category "${category}".
Tone: ${tone}.
Respond in strict JSON format matching:
{
  "topics": [
    { "id": "1", "name": "Topic title", "tag": "Trend" }
  ]
}`;

    try {
      const llmSettings = await this.llmSettingsService.getSettings(businessId);
      const decryptedApiKey = await this.llmSettingsService.getDecryptedApiKey(businessId);

      const { response } = await this.gateway.complete(
        systemPrompt,
        `Generate 5 topic suggestions for Category: ${category}`,
        {
          provider: (llmSettings.provider as any) ?? 'openai',
          model: llmSettings.model ?? undefined,
          temperature: 0.8,
          apiKey: decryptedApiKey ?? undefined,
        }
      );

      const parsed = JSON.parse(response.content);
      return parsed;
    } catch (err: any) {
      return {
        topics: [
          { id: '1', name: `${brandName} Premium Launch`, tag: 'Product Launch' },
          { id: '2', name: `Summer Special Combo Discount`, tag: 'Offer' },
          { id: '3', name: `Why Customers Choose ${brandName}`, tag: 'Brand Awareness' },
          { id: '4', name: `Top 5 Tips for ${industry} in 2026`, tag: 'Educational' },
          { id: '5', name: `Our Customer Testimonials & Success Stories`, tag: 'Social Proof' },
        ],
      };
    }
  }
}
