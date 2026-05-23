import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@brandflow/db';
import { LLMGateway } from '@brandflow/ai';
import {
  brandAnalysisResultSchema,
  type BrandAnalysisBrandDto,
  type BrandAnalysisRequestDto,
  type BrandAnalysisResult,
} from '@brandflow/shared';
import { LlmSettingsService } from '../llm-settings/llm-settings.service';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

interface ResolvedAnalysisSource {
  type: 'knowledge_source' | 'url' | 'text';
  label: string;
  url?: string;
  text: string;
  evidenceCount: number;
  status?: string;
  warnings: string[];
  signals?: ExtractedPageSignals;
}

interface ExtractedPageSignals {
  brandName?: string;
  siteName?: string;
  title?: string;
  description?: string;
  canonicalUrl?: string;
  headings: string[];
  logoUrls: string[];
  socialLinks: string[];
  fonts: string[];
  colors: string[];
}

@Injectable()
export class BrandAnalyserService {
  private readonly gateway: LLMGateway;

  constructor(
    private readonly config: ConfigService,
    private readonly llmSettingsService: LlmSettingsService,
  ) {
    this.gateway = new LLMGateway({
      defaultProvider: (this.config.get('llm.defaultProvider', 'openai') as 'openai' | 'anthropic'),
      fallbackProvider: (this.config.get('llm.fallbackProvider', 'anthropic') as 'openai' | 'anthropic' | 'fallback'),
      requestTimeoutMs: this.config.get('llm.requestTimeoutMs', 30000),
    });
  }

  async analyse(businessId: string, dto: BrandAnalysisRequestDto): Promise<BrandAnalysisResult> {
    const resolvedSources = await this.resolveSources(businessId, dto);
    if (resolvedSources.length === 0) {
      throw new NotFoundException('No analysable source content was found. Add completed knowledge sources or valid URLs/text.');
    }

    const settings = await this.llmSettingsService.getSettings(businessId);
    const decryptedApiKey = await this.llmSettingsService.getDecryptedApiKey(businessId);
    const preferredProvider = settings.provider === 'anthropic' || settings.provider === 'fallback'
      ? settings.provider
      : 'openai';

    const systemPrompt = [
      'You are BrandFlow\'s senior brand strategist and brand-governance analyst.',
      'Use only the supplied evidence. Do not invent facts.',
      'Return a single JSON object with a `brand` object only. No markdown, no prose.',
      'If information is uncertain, use null for strings and empty arrays for lists.',
      'For core basics like brand name, website, and description, strongly prefer explicit page signals such as canonical URL, organization schema, title, meta description, and repeated headings.',
      'Never write generic placeholder copy. If the sources do not support a field, leave it null or empty.',
      'The brand object must use this shape:',
      JSON.stringify({
        brand: {
          name: 'string',
          tagline: 'string | null',
          description: 'string | null',
          industry: 'string | null',
          website: 'string | null',
          positioning: 'string | null',
          audience: 'string | null',
          differentiators: 'string | null',
          tone: ['string'],
          governance: {
            bannedPhrases: ['string'],
            requiredPhrases: ['string'],
            ctaPreferences: ['string'],
            requiredDisclaimer: 'string | null',
          },
          visualRules: {
            primaryColor: 'string | null',
            secondaryColor: 'string | null',
            accentColor: 'string | null',
            fontFamily: 'string | null',
            headingFont: 'string | null',
            bodyFont: 'string | null',
            logoUrls: [{ url: 'string | null', type: 'string | null', name: 'string | null' }],
          },
          identity: {
            mission: 'string | null',
            vision: 'string | null',
            values: ['string'],
            promise: 'string | null',
            personality: 'string | null',
          },
          designTokens: {
            borderRadius: 'string | null',
            shadows: 'string | null',
            spacing: 'string | null',
          },
          strategy: {
            targetLocation: 'string | null',
            ageGroup: 'string | null',
            interests: 'string | null',
            postingFrequency: 'daily | weekly | bi-weekly | monthly | null',
            festivalPosts: 'boolean',
            offerPosts: 'boolean',
            preferredTypes: ['string'],
            contentLanguage: 'tamil | english | mixed | null',
            ctaPreference: 'Call Now | DM | Visit Website | null',
          },
          designPreferences: {
            preferredStyle: 'Minimal | Corporate | 3D | Modern | Playful | Luxury | null',
            referenceLinks: ['string'],
            imageStyle: 'Minimal | Corporate | 3D | Modern | null',
            animationRequirement: 'boolean',
          },
          approvalWorkflow: {
            reviewerName: 'string | null',
            finalApproverName: 'string | null',
            processSteps: ['string'],
            approvalTiming: 'string | null',
            revisionLimit: 'number | null',
          },
          campaignDetails: {
            marketingGoal: 'Brand Awareness | Leads | Sales | null',
            monthlyBudget: 'number | null',
            duration: 'string | null',
            targetLeads: 'number | null',
            adPlatforms: ['string'],
          },
          analyticsConfig: {
            monthlyReport: 'boolean',
            kpiExpectations: 'string | null',
            leadTracking: 'boolean',
            engagementTracking: 'boolean',
          },
          socialAccess: {
            metaBusinessManagerId: 'string | null',
            adAccountId: 'string | null',
            instagramHandle: 'string | null',
            facebookPage: 'string | null',
            linkedinPage: 'string | null',
            youtubeChannel: 'string | null',
            twitterHandle: 'string | null',
          },
          competitors: [{ name: 'string', website: 'string | null', strengths: 'string | null', weaknesses: 'string | null' }],
          contactInfo: {
            personName: 'string | null',
            phoneNumber: 'string | null',
            email: 'string | null',
            officeAddress: 'string | null',
          },
        },
      }),
    ].join('\n');

    const userPrompt = this.buildUserPrompt(resolvedSources);

    const { response, requestId, provider } = await this.gateway.complete(systemPrompt, userPrompt, {
      provider: preferredProvider,
      model: settings.model ?? undefined,
      temperature: 0.15,
      maxTokens: Math.min(settings.maxTokens ?? 1800, 1800),
      apiKey: decryptedApiKey ?? undefined,
      jsonMode: true,
    });

    return this.parseAnalysisResult(response.content, {
      requestId,
      provider,
      model: response.model,
      resolvedSources,
    });
  }

  private async resolveSources(
    businessId: string,
    dto: BrandAnalysisRequestDto,
  ): Promise<ResolvedAnalysisSource[]> {
    const resolvedFromKnowledge = dto.sourceIds?.length
      ? await this.resolveKnowledgeSources(businessId, dto.sourceIds)
      : [];

    const resolvedDirectSources = dto.sources?.length
      ? await this.resolveDirectSources(dto.sources)
      : [];

    return [...resolvedFromKnowledge, ...resolvedDirectSources];
  }

  private async resolveKnowledgeSources(
    businessId: string,
    sourceIds: string[],
  ): Promise<ResolvedAnalysisSource[]> {
    const uniqueSourceIds = Array.from(new Set(sourceIds));
    const sources = await prisma.knowledgeSource.findMany({
      where: { businessId, id: { in: uniqueSourceIds } },
      select: {
        id: true,
        name: true,
        type: true,
        sourceUrl: true,
        status: true,
        _count: { select: { entries: true } },
      },
    });

    if (sources.length !== uniqueSourceIds.length) {
      throw new BadRequestException('One or more knowledge sources were not found in this workspace.');
    }

    const incompleteSources = sources.filter((source) => source.status !== 'completed');
    if (incompleteSources.length > 0) {
      throw new BadRequestException(
        `Knowledge sources must finish ingestion before analysis: ${incompleteSources
          .map((source) => source.name ?? source.sourceUrl ?? source.id)
          .join(', ')}`,
      );
    }

    const entries = await prisma.knowledgeEntry.findMany({
      where: {
        businessId,
        sourceId: { in: uniqueSourceIds },
        isStale: false,
      },
      orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
      take: 160,
      select: {
        sourceId: true,
        content: true,
        confidence: true,
        classification: true,
      },
    });

    const entriesBySource = new Map<string, typeof entries>();
    for (const entry of entries) {
      const bucket = entriesBySource.get(entry.sourceId) ?? [];
      if (bucket.length < 12) {
        bucket.push(entry);
      }
      entriesBySource.set(entry.sourceId, bucket);
    }

    return sources.map((source) => {
      const sourceEntries = entriesBySource.get(source.id) ?? [];
      if (sourceEntries.length === 0) {
        throw new NotFoundException(
          `No fresh knowledge entries were found for ${source.name ?? source.sourceUrl ?? 'the selected source'}.`,
        );
      }

      const text = sourceEntries
        .map((entry) => {
          const prefix = entry.classification ? `[${entry.classification}] ` : '';
          return `${prefix}${entry.content}`;
        })
        .join('\n\n');

      return {
        type: 'knowledge_source' as const,
        label: source.name ?? source.sourceUrl ?? source.id,
        url: source.sourceUrl ?? undefined,
        text: this.limitText(text, 6_000),
        evidenceCount: sourceEntries.length,
        status: source.status,
        warnings: source._count.entries < 5
          ? ['Knowledge source has a low evidence count; add more source material for stronger analysis.']
          : [],
      };
    });
  }

  private async resolveDirectSources(
    sources: BrandAnalysisRequestDto['sources'],
  ): Promise<ResolvedAnalysisSource[]> {
    const settled = await Promise.allSettled(
      (sources ?? []).map(async (source) => {
        if (source.type === 'text') {
          return {
            type: 'text' as const,
            label: source.label ?? 'Manual text source',
            text: this.limitText(this.normalizeText(source.value), 6_000),
            evidenceCount: 1,
            warnings: [],
          };
        }

        return this.fetchUrlSource(source.value, source.label ?? source.value);
      }),
    );

    const resolved = settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    const warnings = settled.flatMap((result) => (result.status === 'rejected'
      ? [result.reason instanceof Error ? result.reason.message : String(result.reason)]
      : []));

    if (resolved.length === 0) {
      throw new BadRequestException(
        warnings[0] ?? 'Unable to fetch any usable direct sources for analysis.',
      );
    }

    if (warnings.length > 0) {
      resolved[0]!.warnings.push(...warnings);
    }

    return resolved;
  }

  private async fetchUrlSource(urlValue: string, label: string): Promise<ResolvedAnalysisSource> {
    const normalizedUrl = this.normalizeUrl(urlValue);
    if (!normalizedUrl) {
      throw new BadRequestException(`Invalid source URL: ${urlValue}`);
    }

    // SSRF protection: validate URL resolves to a public IP
    await this.validateUrlSafety(normalizedUrl);

    const response = await fetch(normalizedUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        'User-Agent': 'BrandFlowBrandAnalyser/1.0 (+https://brandflow.local)',
        Accept: 'text/html, text/plain, application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to fetch ${normalizedUrl} (${response.status})`);
    }

    const rawContent = await response.text();
    const signals = this.extractPageSignals(rawContent, normalizedUrl);
    const baseText = this.limitText(this.extractReadableText(rawContent), 6_000);

    const text = [
      this.formatPageSignalsForPrompt(signals),
      'Readable page excerpt:',
      baseText,
    ].filter(Boolean).join('\n\n');

    if (text.length < 200) {
      throw new BadRequestException(`Source ${normalizedUrl} did not contain enough readable text to analyze.`);
    }

    return {
      type: 'url',
      label,
      url: normalizedUrl,
      text,
      evidenceCount: 1,
      status: 'fetched',
      warnings: [],
      signals,
    };
  }

  private buildUserPrompt(sources: ResolvedAnalysisSource[]): string {
    const sourceContext = sources
      .map((source, index) => [
        `Source ${index + 1}: ${source.label}`,
        `Type: ${source.type}`,
        source.url ? `URL: ${source.url}` : null,
        source.status ? `Status: ${source.status}` : null,
        `Evidence count: ${source.evidenceCount}`,
        'Evidence:',
        source.text,
      ]
        .filter(Boolean)
        .join('\n'))
      .join('\n\n---\n\n');

    return [
      'Analyze the evidence below and extract a usable brand draft for BrandFlow.',
      'Prioritize recurring patterns across sources over one-off claims.',
      'Use structured page signals (title, meta description, canonical URL, organization schema, headings, logos, social links) before inferring from long-form text.',
      'Keep `name`, `website`, `description`, `tone`, `positioning`, and identity fields grounded in explicit evidence.',
      'If you cannot verify a field from the supplied evidence, return null or an empty array.',
      '',
      sourceContext,
    ].join('\n');
  }

  private parseAnalysisResult(
    content: string,
    context: {
      requestId: string;
      provider: string;
      model: string;
      resolvedSources: ResolvedAnalysisSource[];
    },
  ): BrandAnalysisResult {
    const parsed = this.extractJsonObject(content);
    const rawBrand = this.asObject(parsed['brand']) ?? parsed;
    const governance = this.asObject(rawBrand['governance']);
    const visualRules = this.asObject(rawBrand['visualRules']);
    const identity = this.asObject(rawBrand['identity']);
    const designTokens = this.asObject(rawBrand['designTokens']);
    const strategy = this.asObject(rawBrand['strategy']);
    const designPreferences = this.asObject(rawBrand['designPreferences']);
    const approvalWorkflow = this.asObject(rawBrand['approvalWorkflow']);
    const campaignDetails = this.asObject(rawBrand['campaignDetails']);
    const analyticsConfig = this.asObject(rawBrand['analyticsConfig']);
    const socialAccess = this.asObject(rawBrand['socialAccess']);
    const competitors = Array.isArray(rawBrand['competitors']) ? rawBrand['competitors'] : [];
    const contactInfo = this.asObject(rawBrand['contactInfo']);
    const primarySignals = context.resolvedSources.find((source) => source.signals)?.signals;
    const socialSignals = this.extractSocialAccess(primarySignals);
    const logoUrlFallbacks = (primarySignals?.logoUrls ?? []).slice(0, 5).map((url, index) => ({
      url,
      type: index === 0 ? 'primary' : 'secondary',
      name: index === 0 ? 'Primary Logo' : `Detected Logo ${index + 1}`,
    }));

    const warnings = Array.from(new Set([
      ...context.resolvedSources.flatMap((source) => source.warnings),
      ...(context.resolvedSources.length < 2
        ? ['Add more than one source for higher-confidence brand analysis.']
        : []),
    ]));

    const brand = {
      name: this.normalizeString(rawBrand['name'], 255)
        ?? this.normalizeString(primarySignals?.brandName, 255)
        ?? this.inferBrandName(context.resolvedSources)
        ?? 'Untitled Brand',
      tagline: this.normalizeString(rawBrand['tagline'], 255),
      description: this.normalizeString(rawBrand['description'], 2000)
        ?? this.normalizeString(primarySignals?.description, 2000),
      industry: this.normalizeString(rawBrand['industry'], 100),
      website: this.normalizeUrl(this.normalizeString(rawBrand['website'], 500))
        ?? this.normalizeUrl(primarySignals?.canonicalUrl)
        ?? context.resolvedSources.find((source) => source.url)?.url
        ?? null,
      positioning: this.normalizeString(rawBrand['positioning'], 2000),
      audience: this.normalizeString(rawBrand['audience'], 2000),
      differentiators: this.normalizeString(rawBrand['differentiators'], 2000),
      tone: this.normalizeStringArray(rawBrand['tone'], 12, 50),
      governance: {
        bannedPhrases: this.normalizeStringArray(governance?.['bannedPhrases'], 20, 200),
        requiredPhrases: this.normalizeStringArray(governance?.['requiredPhrases'], 20, 200),
        ctaPreferences: this.normalizeStringArray(governance?.['ctaPreferences'], 20, 100),
        requiredDisclaimer: this.normalizeString(governance?.['requiredDisclaimer'], 1000),
      },
      visualRules: this.compactObject({
        primaryColor: this.normalizeColor(this.normalizeString(visualRules?.['primaryColor'], 20))
          ?? this.normalizeColor(primarySignals?.colors?.[0]),
        secondaryColor: this.normalizeColor(this.normalizeString(visualRules?.['secondaryColor'], 20))
          ?? this.normalizeColor(primarySignals?.colors?.[1]),
        accentColor: this.normalizeColor(this.normalizeString(visualRules?.['accentColor'], 20))
          ?? this.normalizeColor(primarySignals?.colors?.[2]),
        fontFamily: this.normalizeString(visualRules?.['fontFamily'], 100)
          ?? this.normalizeString(primarySignals?.fonts?.[0], 100),
        headingFont: this.normalizeString(visualRules?.['headingFont'], 100)
          ?? this.normalizeString(primarySignals?.fonts?.[0], 100),
        bodyFont: this.normalizeString(visualRules?.['bodyFont'], 100)
          ?? this.normalizeString(primarySignals?.fonts?.[1] ?? primarySignals?.fonts?.[0], 100),
        logoUrls: Array.isArray(visualRules?.['logoUrls']) ? visualRules['logoUrls'].map((l: any) => ({
          url: this.normalizeString(l?.url, 1000),
          type: this.normalizeString(l?.type, 50),
          name: this.normalizeString(l?.name, 100),
        })) : logoUrlFallbacks.length > 0 ? logoUrlFallbacks : null,
      }),
      identity: this.compactObject({
        mission: this.normalizeString(identity?.['mission'], 1000),
        vision: this.normalizeString(identity?.['vision'], 1000),
        values: this.normalizeStringArray(identity?.['values'], 10, 100),
        promise: this.normalizeString(identity?.['promise'], 500),
        personality: this.normalizeString(identity?.['personality'], 500),
      }),
      designTokens: this.compactObject({
        borderRadius: this.normalizeString(designTokens?.['borderRadius'], 50),
        shadows: this.normalizeString(designTokens?.['shadows'], 50),
        spacing: this.normalizeString(designTokens?.['spacing'], 50),
      }),
      strategy: this.compactObject({
        targetLocation: this.normalizeString(strategy?.['targetLocation'], 255),
        ageGroup: this.normalizeString(strategy?.['ageGroup'], 100),
        interests: this.normalizeString(strategy?.['interests'], 1000),
        postingFrequency: this.normalizeEnum(strategy?.['postingFrequency'], ['daily', 'weekly', 'bi-weekly', 'monthly'] as const),
        festivalPosts: this.normalizeBoolean(strategy?.['festivalPosts']),
        offerPosts: this.normalizeBoolean(strategy?.['offerPosts']),
        preferredTypes: this.normalizeStringArray(strategy?.['preferredTypes'], 10, 100),
        contentLanguage: this.normalizeEnum(strategy?.['contentLanguage'], ['tamil', 'english', 'mixed'] as const),
        ctaPreference: this.normalizeEnum(strategy?.['ctaPreference'], ['Call Now', 'DM', 'Visit Website'] as const),
      }),
      designPreferences: this.compactObject({
        preferredStyle: this.normalizeEnum(designPreferences?.['preferredStyle'], ['Minimal', 'Corporate', '3D', 'Modern', 'Playful', 'Luxury'] as const),
        referenceLinks: this.normalizeStringArray(designPreferences?.['referenceLinks'], 5, 1000),
        imageStyle: this.normalizeEnum(designPreferences?.['imageStyle'], ['Minimal', 'Corporate', '3D', 'Modern'] as const),
        animationRequirement: this.normalizeBoolean(designPreferences?.['animationRequirement']),
      }),
      approvalWorkflow: this.compactObject({
        reviewerName: this.normalizeString(approvalWorkflow?.['reviewerName'], 255),
        finalApproverName: this.normalizeString(approvalWorkflow?.['finalApproverName'], 255),
        processSteps: this.normalizeStringArray(approvalWorkflow?.['processSteps'], 10, 100),
        approvalTiming: this.normalizeString(approvalWorkflow?.['approvalTiming'], 100),
        revisionLimit: this.normalizeNumber(approvalWorkflow?.['revisionLimit']),
      }),
      campaignDetails: this.compactObject({
        marketingGoal: this.normalizeEnum(campaignDetails?.['marketingGoal'], ['Brand Awareness', 'Leads', 'Sales'] as const),
        monthlyBudget: this.normalizeNumber(campaignDetails?.['monthlyBudget']),
        duration: this.normalizeString(campaignDetails?.['duration'], 100),
        targetLeads: this.normalizeNumber(campaignDetails?.['targetLeads']),
        adPlatforms: this.normalizeStringArray(campaignDetails?.['adPlatforms'], 10, 100),
      }),
      analyticsConfig: this.compactObject({
        monthlyReport: this.normalizeBoolean(analyticsConfig?.['monthlyReport']),
        kpiExpectations: this.normalizeString(analyticsConfig?.['kpiExpectations'], 1000),
        leadTracking: this.normalizeBoolean(analyticsConfig?.['leadTracking']),
        engagementTracking: this.normalizeBoolean(analyticsConfig?.['engagementTracking']),
      }),
      socialAccess: this.compactObject({
        metaBusinessManagerId: this.normalizeString(socialAccess?.['metaBusinessManagerId'], 100),
        adAccountId: this.normalizeString(socialAccess?.['adAccountId'], 100),
        instagramHandle: this.normalizeString(socialAccess?.['instagramHandle'], 100) ?? socialSignals.instagramHandle ?? null,
        facebookPage: this.normalizeString(socialAccess?.['facebookPage'], 255) ?? socialSignals.facebookPage ?? null,
        linkedinPage: this.normalizeString(socialAccess?.['linkedinPage'], 255) ?? socialSignals.linkedinPage ?? null,
        youtubeChannel: this.normalizeString(socialAccess?.['youtubeChannel'], 255) ?? socialSignals.youtubeChannel ?? null,
        twitterHandle: this.normalizeString(socialAccess?.['twitterHandle'], 100) ?? socialSignals.twitterHandle ?? null,
      }),
      competitors: competitors.map((c: any) => ({
        name: this.normalizeString(c?.name, 255) || 'Unknown',
        website: this.normalizeUrl(this.normalizeString(c?.website, 500)),
        strengths: this.normalizeString(c?.strengths, 1000),
        weaknesses: this.normalizeString(c?.weaknesses, 1000),
      })),
      contactInfo: contactInfo ? {
        personName: this.normalizeString(contactInfo?.['personName'], 255),
        phoneNumber: this.normalizeString(contactInfo?.['phoneNumber'], 50),
        email: this.normalizeString(contactInfo?.['email'], 255),
        officeAddress: this.normalizeString(contactInfo?.['officeAddress'], 500),
      } : null,
    } as BrandAnalysisBrandDto;

    if (!brand.positioning) {
      warnings.push('Positioning could not be confidently derived from the supplied evidence.');
    }
    if (!brand.audience) {
      warnings.push('Audience insight is incomplete; consider adding pricing, case study, or landing page sources.');
    }
    if (brand.tone.length === 0) {
      warnings.push('Tone keywords were weakly supported; review before saving.');
    }

    const parsedResult = brandAnalysisResultSchema.parse({
      brand,
      diagnostics: {
        sourceCount: context.resolvedSources.length,
        evidenceCount: context.resolvedSources.reduce((sum, source) => sum + source.evidenceCount, 0),
        warnings: Array.from(new Set(warnings)),
        sources: context.resolvedSources.map((source) => ({
          type: source.type,
          label: source.label,
          url: source.url ?? null,
          evidenceCount: source.evidenceCount,
          status: source.status ?? null,
        })),
      },
      requestId: context.requestId,
      provider: context.provider,
      model: context.model,
    });

    return {
      ...parsedResult,
      brand,
    } as BrandAnalysisResult;
  }

  private extractJsonObject(content: string): Record<string, unknown> {
    try {
      return this.asObject(JSON.parse(content)) ?? {};
    } catch {
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new BadRequestException('The brand analysis response was not valid JSON.');
      }

      try {
        return this.asObject(JSON.parse(content.slice(firstBrace, lastBrace + 1))) ?? {};
      } catch {
        throw new BadRequestException('The brand analysis response could not be parsed.');
      }
    }
  }

  private extractReadableText(html: string): string {
    return this.normalizeText(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>'),
    );
  }

  private normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private normalizeString(value: unknown, maxLength: number): string | null {
    if (typeof value !== 'string') return null;
    const normalized = this.normalizeText(value);
    return normalized ? normalized.slice(0, maxLength) : null;
  }

  private normalizeStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
    const raw = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(/[\n,;|]/g)
        : [];

    return Array.from(new Set(raw
      .map((item) => this.normalizeString(item, maxLength))
      .filter((item): item is string => Boolean(item))))
      .slice(0, maxItems);
  }

  private normalizeEnum<T extends readonly string[]>(value: unknown, allowed: T): T[number] | undefined {
    return typeof value === 'string' && allowed.includes(value as T[number])
      ? (value as T[number])
      : undefined;
  }

  private normalizeBoolean(value: unknown): boolean | undefined {
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  private normalizeNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private normalizeColor(value: string | null | undefined): string | null {
    if (!value) return null;
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(value) ? value : null;
  }

  private compactObject<T extends Record<string, unknown>>(value: T): T | null {
    const hasMeaningfulValue = Object.values(value).some((entry) => {
      if (entry === null || entry === undefined || entry === '') return false;
      if (Array.isArray(entry)) return entry.length > 0;
      return true;
    });

    return hasMeaningfulValue ? value : null;
  }

  private extractPageSignals(html: string, baseUrl: string): ExtractedPageSignals {
    const title = this.extractTagContent(html, 'title');
    const metaDescription = this.extractMetaContent(html, ['description', 'og:description', 'twitter:description']);
    const siteName = this.extractMetaContent(html, ['og:site_name', 'application-name']);
    const canonicalUrl = this.extractLinkHref(html, 'canonical') ?? baseUrl;
    const headings = this.extractHeadingTexts(html);
    const jsonLdSignals = this.extractJsonLdSignals(html, baseUrl);
    const logoUrls = Array.from(new Set([
      ...jsonLdSignals.logoUrls,
      ...this.extractAssetUrls(html, baseUrl, /<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
        .filter((url) => /logo|brand|icon/i.test(url)),
      ...this.extractAssetUrls(html, baseUrl, /<link[^>]+href=["']([^"']+)["'][^>]*>/gi)
        .filter((url) => /logo|brand|icon/i.test(url)),
    ])).slice(0, 5);
    const fonts = Array.from(new Set(
      [...html.matchAll(/font-family:\s*([^;"'}]+)/gi)]
        .map((match) => (match[1] || '').replace(/["']/g, '').trim())
        .filter(Boolean),
    )).slice(0, 10);
    const colors = Array.from(new Set(
      [...html.matchAll(/(?:color|background-color):\s*(#[0-9a-fA-F]{3,6})/gi)]
        .map((match) => (match[1] || '').trim())
        .filter((color) => /^#([0-9A-Fa-f]{3}){1,2}$/.test(color)),
    )).slice(0, 10);
    const socialLinks = Array.from(new Set([
      ...jsonLdSignals.socialLinks,
      ...this.extractSocialLinks(html, baseUrl),
    ])).slice(0, 10);

    return {
      brandName: this.normalizeString(jsonLdSignals.brandName, 255)
        ?? this.normalizeString(siteName, 255)
        ?? this.deriveBrandNameFromTitle(title),
      siteName: this.normalizeString(siteName, 255) ?? this.normalizeString(jsonLdSignals.siteName, 255) ?? undefined,
      title: this.normalizeString(title, 255) ?? undefined,
      description: this.normalizeString(metaDescription, 2000)
        ?? this.normalizeString(jsonLdSignals.description, 2000)
        ?? undefined,
      canonicalUrl: this.normalizeUrl(canonicalUrl) ?? baseUrl,
      headings,
      logoUrls,
      socialLinks,
      fonts,
      colors,
    };
  }

  private formatPageSignalsForPrompt(signals: ExtractedPageSignals): string {
    return [
      'Structured page signals:',
      signals.brandName ? `Brand name: ${signals.brandName}` : null,
      signals.siteName ? `Site name: ${signals.siteName}` : null,
      signals.title ? `Page title: ${signals.title}` : null,
      signals.description ? `Meta description: ${signals.description}` : null,
      signals.canonicalUrl ? `Canonical URL: ${signals.canonicalUrl}` : null,
      signals.headings.length > 0 ? `Headings: ${signals.headings.join(' | ')}` : null,
      signals.socialLinks.length > 0 ? `Social links: ${signals.socialLinks.join(', ')}` : null,
      signals.logoUrls.length > 0 ? `Logo/image candidates: ${signals.logoUrls.join(', ')}` : null,
      signals.fonts.length > 0 ? `Detected fonts: ${signals.fonts.join(', ')}` : null,
      signals.colors.length > 0 ? `Detected colors: ${signals.colors.join(', ')}` : null,
    ].filter(Boolean).join('\n');
  }

  private extractTagContent(html: string, tagName: string): string | null {
    const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'));
    return match?.[1] ? this.normalizeText(match[1]) : null;
  }

  private extractMetaContent(html: string, keys: string[]): string | null {
    for (const key of keys) {
      const propertyMatch = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${this.escapeRegExp(key)}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`, 'i'));
      if (propertyMatch?.[1]) {
        return this.normalizeText(propertyMatch[1]);
      }

      const contentFirstMatch = html.match(new RegExp(`<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+(?:name|property)=["']${this.escapeRegExp(key)}["'][^>]*>`, 'i'));
      if (contentFirstMatch?.[1]) {
        return this.normalizeText(contentFirstMatch[1]);
      }
    }

    return null;
  }

  private extractLinkHref(html: string, relValue: string): string | null {
    const match = html.match(new RegExp(`<link[^>]+rel=["'][^"']*${this.escapeRegExp(relValue)}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>`, 'i'))
      ?? html.match(new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${this.escapeRegExp(relValue)}[^"']*["'][^>]*>`, 'i'));
    return match?.[1] ?? null;
  }

  private extractHeadingTexts(html: string): string[] {
    const matches = [...html.matchAll(/<h[1-2][^>]*>([\s\S]*?)<\/h[1-2]>/gi)];
    return Array.from(new Set(matches
      .map((match) => this.normalizeText(match[1].replace(/<[^>]+>/g, ' ')))
      .filter((heading) => heading.length > 2)))
      .slice(0, 8);
  }

  private extractAssetUrls(html: string, baseUrl: string, pattern: RegExp): string[] {
    return Array.from(new Set([...html.matchAll(pattern)]
      .map((match) => this.resolveRelativeUrl(match[1] || '', baseUrl))
      .filter((value): value is string => Boolean(value))));
  }

  private extractJsonLdSignals(html: string, baseUrl: string): {
    brandName?: string;
    siteName?: string;
    description?: string;
    logoUrls: string[];
    socialLinks: string[];
  } {
    const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const objects: Array<Record<string, unknown>> = [];

    for (const match of scripts) {
      const raw = match[1]?.trim();
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        const parsedObject = this.asObject(parsed);
        const candidates = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsedObject?.['@graph'])
            ? parsedObject?.['@graph'] as unknown[]
            : [parsed];

        for (const candidate of candidates) {
          const obj = this.asObject(candidate);
          if (obj) objects.push(obj);
        }
      } catch {
        continue;
      }
    }

    const orgLike = objects.find((obj) => {
      const type = obj['@type'];
      if (Array.isArray(type)) {
        return type.some((item) => typeof item === 'string' && /(organization|brand|corporation|localbusiness|website)/i.test(item));
      }

      return typeof type === 'string' && /(organization|brand|corporation|localbusiness|website)/i.test(type);
    });

    const sameAs = Array.isArray(orgLike?.['sameAs'])
      ? (orgLike?.['sameAs'] as unknown[])
        .map((item) => this.resolveRelativeUrl(typeof item === 'string' ? item : '', baseUrl))
        .filter((item): item is string => Boolean(item))
      : [];
    const logoObject = this.asObject(orgLike?.['logo']);
    const logoUrl = this.resolveRelativeUrl(
      typeof orgLike?.['logo'] === 'string'
        ? orgLike['logo']
        : typeof logoObject?.['url'] === 'string'
          ? logoObject['url']
          : '',
      baseUrl,
    );

    return {
      brandName: this.normalizeString(orgLike?.['name'], 255) ?? undefined,
      siteName: this.normalizeString(orgLike?.['alternateName'], 255) ?? undefined,
      description: this.normalizeString(orgLike?.['description'], 2000) ?? undefined,
      logoUrls: logoUrl ? [logoUrl] : [],
      socialLinks: sameAs,
    };
  }

  private deriveBrandNameFromTitle(title: string | null): string | null {
    if (!title) return null;

    const segments = title.split(/\s[\-|–|—|:]\s|[\-|–|—|:]/).map((segment) => segment.trim()).filter(Boolean);
    return this.normalizeString(segments[0] ?? title, 255);
  }

  private extractSocialLinks(html: string, baseUrl: string): string[] {
    return Array.from(new Set([...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)]
      .map((match) => this.resolveRelativeUrl(match[1] || '', baseUrl))
      .filter((url): url is string => Boolean(url))
      .filter((url) => /(linkedin\.com|instagram\.com|facebook\.com|youtube\.com|youtu\.be|twitter\.com|x\.com)/i.test(url))))
      .slice(0, 10);
  }

  private extractSocialAccess(signals?: ExtractedPageSignals): {
    instagramHandle?: string;
    facebookPage?: string;
    linkedinPage?: string;
    youtubeChannel?: string;
    twitterHandle?: string;
  } {
    const socialLinks = signals?.socialLinks ?? [];
    const instagramLink = socialLinks.find((url) => /instagram\.com/i.test(url));
    const facebookLink = socialLinks.find((url) => /facebook\.com/i.test(url));
    const linkedinLink = socialLinks.find((url) => /linkedin\.com/i.test(url));
    const youtubeLink = socialLinks.find((url) => /youtube\.com|youtu\.be/i.test(url));
    const twitterLink = socialLinks.find((url) => /twitter\.com|x\.com/i.test(url));

    return {
      instagramHandle: instagramLink ? this.extractHandleFromUrl(instagramLink) : undefined,
      facebookPage: facebookLink ?? undefined,
      linkedinPage: linkedinLink ?? undefined,
      youtubeChannel: youtubeLink ?? undefined,
      twitterHandle: twitterLink ? this.extractHandleFromUrl(twitterLink) : undefined,
    };
  }

  private extractHandleFromUrl(url: string): string | undefined {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.split('/').filter(Boolean);
      const candidate = path[path.length - 1];
      return candidate ? `@${candidate.replace(/^@/, '')}` : undefined;
    } catch {
      return undefined;
    }
  }

  private resolveRelativeUrl(value: string, baseUrl: string): string | null {
    if (!value) return null;

    try {
      return new URL(value, baseUrl).toString();
    } catch {
      return null;
    }
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private limitText(value: string, maxLength: number): string {
    return value.length <= maxLength ? value : `${value.slice(0, maxLength)}…`;
  }

  private normalizeUrl(value: string | null | undefined): string | null {
    if (!value) return null;

    try {
      const url = value.startsWith('http://') || value.startsWith('https://')
        ? new URL(value)
        : new URL(`https://${value}`);
      return url.toString();
    } catch {
      return null;
    }
  }

  private async validateUrlSafety(url: string): Promise<void> {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(`Non-HTTP protocol rejected: ${parsed.protocol}`);
    }

    try {
      const lookupResult = await dnsLookup(parsed.hostname);
      const address = typeof lookupResult === 'string' ? lookupResult : (lookupResult as any)?.address;
      if (!address) {
        throw new BadRequestException(`Cannot resolve host: ${parsed.hostname}`);
      }
      if (this.isPrivateIp(address)) {
        throw new BadRequestException('Fetching private/reserved IP addresses is blocked.');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(`Cannot resolve host: ${parsed.hostname}`);
    }
  }

  private isPrivateIp(ip: string): boolean {
    const match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (match) {
      const [o1, o2] = match.slice(1).map(Number);
      if (o1 === 127) return true;
      if (o1 === 10) return true;
      if (o1 === 172 && o2 !== undefined && o2 >= 16 && o2 <= 31) return true;
      if (o1 === 192 && o2 === 168) return true;
      if (o1 === 169 && o2 === 254) return true;
      if (ip === '0.0.0.0' || ip === '255.255.255.255') return true;
    }
    if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') ||
        ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
      return true;
    }
    return false;
  }

  private inferBrandName(sources: ResolvedAnalysisSource[]): string | null {
    const firstUrlSource = sources.find((source) => source.url);
    if (!firstUrlSource?.url) {
      return this.normalizeString(sources[0]?.label, 255);
    }

    try {
      const hostname = new URL(firstUrlSource.url).hostname.replace(/^www\./, '');
      const [name] = hostname.split('.');
      return name
        ? name
            .split(/[-_]/g)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
        : null;
    } catch {
      return this.normalizeString(firstUrlSource.label, 255);
    }
  }

  private asObject(value: unknown): Record<string, any> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, any>)
      : null;
  }
}
