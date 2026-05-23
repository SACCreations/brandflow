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

interface ResolvedAnalysisSource {
  type: 'knowledge_source' | 'url' | 'text';
  label: string;
  url?: string;
  text: string;
  evidenceCount: number;
  status?: string;
  warnings: string[];
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
    
    // Extract metadata before stripping tags
    const logoMatches = [...rawContent.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    const linkMatches = [...rawContent.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi)];
    
    const potentialLogos = [
      ...logoMatches.filter(m => /logo/i.test(m[0]) || /brand/i.test(m[0])).map(m => m[1] || ''),
      ...linkMatches.filter(m => /rel=["'].*icon.*["']/i.test(m[0])).map(m => m[1] || '')
    ].filter(Boolean).map(url => {
        try {
           return new URL(url, normalizedUrl).toString();
        } catch {
           return url;
        }
      });
      
    const fontMatches = [...rawContent.matchAll(/font-family:\s*([^;"'}]+)/gi)];
    const potentialFonts = Array.from(new Set(fontMatches.map(m => (m[1] || '').replace(/['"]/g, '').trim()))).filter(Boolean);
    
    const colorMatches = [...rawContent.matchAll(/(color|background-color):\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))/gi)];
    const potentialColors = Array.from(new Set(colorMatches.map(m => (m[2] || '').trim()))).filter(Boolean);

    const baseText = this.limitText(this.extractReadableText(rawContent), 6_000);
    
    const text = `${baseText}\n\n--- Metadata for AI Analysis ---\nPotential Logo URLs: ${potentialLogos.slice(0, 5).join(', ')}\nPotential Fonts: ${potentialFonts.slice(0, 10).join(', ')}\nPotential Brand Colors: ${potentialColors.slice(0, 10).join(', ')}`;

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

    const warnings = Array.from(new Set([
      ...context.resolvedSources.flatMap((source) => source.warnings),
      ...(context.resolvedSources.length < 2
        ? ['Add more than one source for higher-confidence brand analysis.']
        : []),
    ]));

    const brand: BrandAnalysisBrandDto = {
      name: this.normalizeString(rawBrand['name'], 255)
        ?? this.inferBrandName(context.resolvedSources)
        ?? 'Untitled Brand',
      tagline: this.normalizeString(rawBrand['tagline'], 255),
      description: this.normalizeString(rawBrand['description'], 2000),
      industry: this.normalizeString(rawBrand['industry'], 100),
      website: this.normalizeUrl(this.normalizeString(rawBrand['website'], 500))
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
      visualRules: visualRules ? {
        primaryColor: this.normalizeString(visualRules['primaryColor'], 20),
        secondaryColor: this.normalizeString(visualRules['secondaryColor'], 20),
        accentColor: this.normalizeString(visualRules['accentColor'], 20),
        fontFamily: this.normalizeString(visualRules['fontFamily'], 100),
        headingFont: this.normalizeString(visualRules['headingFont'], 100),
        bodyFont: this.normalizeString(visualRules['bodyFont'], 100),
        logoUrls: Array.isArray(visualRules['logoUrls']) ? visualRules['logoUrls'].map((l: any) => ({
          url: this.normalizeString(l?.url, 1000),
          type: this.normalizeString(l?.type, 50),
          name: this.normalizeString(l?.name, 100),
        })) : null,
      } : null,
      identity: identity ? {
        mission: this.normalizeString(identity['mission'], 1000),
        vision: this.normalizeString(identity['vision'], 1000),
        values: this.normalizeStringArray(identity['values'], 10, 100),
        promise: this.normalizeString(identity['promise'], 500),
        personality: this.normalizeString(identity['personality'], 500),
      } : null,
      designTokens: designTokens ? {
        borderRadius: this.normalizeString(designTokens['borderRadius'], 50),
        shadows: this.normalizeString(designTokens['shadows'], 50),
        spacing: this.normalizeString(designTokens['spacing'], 50),
      } : null,
      strategy: strategy ? {
        targetLocation: this.normalizeString(strategy['targetLocation'], 255),
        ageGroup: this.normalizeString(strategy['ageGroup'], 100),
        interests: this.normalizeString(strategy['interests'], 1000),
        postingFrequency: strategy['postingFrequency'] as any,
        festivalPosts: strategy['festivalPosts'] === true || strategy['festivalPosts'] === 'true',
        offerPosts: strategy['offerPosts'] === true || strategy['offerPosts'] === 'true',
        preferredTypes: this.normalizeStringArray(strategy['preferredTypes'], 10, 100),
        contentLanguage: strategy['contentLanguage'] as any || 'english',
        ctaPreference: strategy['ctaPreference'] as any,
      } : null,
      designPreferences: designPreferences ? {
        preferredStyle: designPreferences['preferredStyle'] as any,
        referenceLinks: this.normalizeStringArray(designPreferences['referenceLinks'], 5, 1000),
        imageStyle: designPreferences['imageStyle'] as any,
        animationRequirement: designPreferences['animationRequirement'] === true || designPreferences['animationRequirement'] === 'true',
      } : null,
      approvalWorkflow: approvalWorkflow ? {
        reviewerName: this.normalizeString(approvalWorkflow['reviewerName'], 255),
        finalApproverName: this.normalizeString(approvalWorkflow['finalApproverName'], 255),
        processSteps: this.normalizeStringArray(approvalWorkflow['processSteps'], 10, 100),
        approvalTiming: this.normalizeString(approvalWorkflow['approvalTiming'], 100),
        revisionLimit: typeof approvalWorkflow['revisionLimit'] === 'number' ? approvalWorkflow['revisionLimit'] : null,
      } : null,
      campaignDetails: campaignDetails ? {
        marketingGoal: campaignDetails['marketingGoal'] as any,
        monthlyBudget: typeof campaignDetails['monthlyBudget'] === 'number' ? campaignDetails['monthlyBudget'] : null,
        duration: this.normalizeString(campaignDetails['duration'], 100),
        targetLeads: typeof campaignDetails['targetLeads'] === 'number' ? campaignDetails['targetLeads'] : null,
        adPlatforms: this.normalizeStringArray(campaignDetails['adPlatforms'], 10, 100),
      } : null,
      analyticsConfig: analyticsConfig ? {
        monthlyReport: analyticsConfig['monthlyReport'] === true || analyticsConfig['monthlyReport'] === 'true',
        kpiExpectations: this.normalizeString(analyticsConfig['kpiExpectations'], 1000),
        leadTracking: analyticsConfig['leadTracking'] === true || analyticsConfig['leadTracking'] === 'true',
        engagementTracking: analyticsConfig['engagementTracking'] !== false && analyticsConfig['engagementTracking'] !== 'false',
      } : null,
      socialAccess: socialAccess ? {
        metaBusinessManagerId: this.normalizeString(socialAccess['metaBusinessManagerId'], 100),
        adAccountId: this.normalizeString(socialAccess['adAccountId'], 100),
        instagramHandle: this.normalizeString(socialAccess['instagramHandle'], 100),
        facebookPage: this.normalizeString(socialAccess['facebookPage'], 255),
        linkedinPage: this.normalizeString(socialAccess['linkedinPage'], 255),
        youtubeChannel: this.normalizeString(socialAccess['youtubeChannel'], 255),
        twitterHandle: this.normalizeString(socialAccess['twitterHandle'], 100),
      } : null,
      competitors: competitors.map((c: any) => ({
        name: this.normalizeString(c?.name, 255) || 'Unknown',
        website: this.normalizeUrl(this.normalizeString(c?.website, 500)),
        strengths: this.normalizeString(c?.strengths, 1000),
        weaknesses: this.normalizeString(c?.weaknesses, 1000),
      })),
      contactInfo: contactInfo ? {
        personName: this.normalizeString(contactInfo['personName'], 255),
        phoneNumber: this.normalizeString(contactInfo['phoneNumber'], 50),
        email: this.normalizeString(contactInfo['email'], 255),
        officeAddress: this.normalizeString(contactInfo['officeAddress'], 500),
      } : null,
    };

    if (!brand.positioning) {
      warnings.push('Positioning could not be confidently derived from the supplied evidence.');
    }
    if (!brand.audience) {
      warnings.push('Audience insight is incomplete; consider adding pricing, case study, or landing page sources.');
    }
    if (brand.tone.length === 0) {
      warnings.push('Tone keywords were weakly supported; review before saving.');
    }

    return brandAnalysisResultSchema.parse({
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
