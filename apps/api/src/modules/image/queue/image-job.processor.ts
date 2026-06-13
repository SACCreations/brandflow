import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { LLMGateway, ImageGateway, VectorService, PosterPromptBuilder } from '@brandflow/ai';
import type { PosterContextPayload } from '@brandflow/ai';
import { PrismaService } from '../../../common/database/prisma.service';
import { ImageWebSocketGateway } from '../image.gateway';
import { LlmSettingsService } from '../../llm-settings/llm-settings.service';
import { BrandContextResolverService } from '../services/brand-context-resolver.service';
import { ContentContextResolverService } from '../services/content-context-resolver.service';
import { PlatformDimensionService } from '../services/platform-dimension.service';

const IMAGE_GENERATION_QUEUE = 'image-generation';

// ─── Job Data Types ────────────────────────────────────────────────────────────

/** New poster generation job (via generate-poster queue name) */
interface PosterJobData {
  jobId: string;
  businessId: string;
  brandId: string;
  campaignId?: string;
  contentId?: string;
  platform: string;   // e.g. 'instagram_post'
  category: string;   // e.g. 'SMO_POSTER'
  posterContext?: {
    headline?: string;
    subheadline?: string;
    cta?: string;
    additionalContext?: string;
  };
  settings: {
    width: number;
    height: number;
    aspectRatio: string;
    style?: string;
    quality?: 'standard' | 'hd';
    provider?: string;
    negativePromptExtra?: string;
  };
}

/** Legacy raw-prompt job (via generate-image queue name) */
interface LegacyImageJobData {
  jobId: string;
  businessId: string;
  brandId: string;
  campaignId?: string;
  rawPrompt: string;
  category: string;
  settings: {
    width: number;
    height: number;
    aspectRatio: string;
    style?: string;
    quality?: 'standard' | 'hd';
    provider?: string;
  };
}

type ImageJobData = PosterJobData | LegacyImageJobData;

// ─── Processor ────────────────────────────────────────────────────────────────

@Processor(IMAGE_GENERATION_QUEUE, { concurrency: 3 })
export class ImageJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageJobProcessor.name);
  private readonly llm: LLMGateway;
  private readonly imageGateway: ImageGateway;
  private readonly vectorService: VectorService;
  private readonly posterPromptBuilder: PosterPromptBuilder;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly wsGateway: ImageWebSocketGateway,
    private readonly llmSettingsService: LlmSettingsService,
    private readonly brandContextResolver: BrandContextResolverService,
    private readonly contentContextResolver: ContentContextResolverService,
    private readonly platformDimensionService: PlatformDimensionService,
  ) {
    super();
    this.llm = new LLMGateway({ defaultProvider: 'openai' });
    this.imageGateway = new ImageGateway({ defaultProvider: 'openai' });
    this.vectorService = new VectorService();
    this.posterPromptBuilder = new PosterPromptBuilder();
  }

  async process(job: Job<ImageJobData>): Promise<void> {
    const jobData = job.data;
    const startTime = Date.now();

    this.logger.log(
      `[IMAGE_JOB] Processing job ${jobData.jobId} ` +
      `(name="${job.name}", business=${jobData.businessId})`
    );

    // Route to the appropriate pipeline
    if (job.name === 'generate-poster') {
      await this.processPosterJob(jobData as PosterJobData, startTime);
    } else {
      // Legacy pipeline — uses the old raw-prompt enhancer
      await this.processLegacyJob(jobData as LegacyImageJobData, startTime);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // NEW POSTER PIPELINE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Brand-aware poster generation pipeline.
   *
   * Flow:
   * 1. Mark job as PROCESSING
   * 2. Resolve brand context (colors, logo, fonts, tone)
   * 3. Resolve content context (headline, CTA — if contentId provided)
   * 4. Get platform dimensions
   * 5. Build poster prompt (system + user messages + negative prompt)
   * 6. Call LLM → generates structured DALL-E/FLUX prompt
   * 7. Call image provider → generate the poster
   * 8. Save Asset + GeneratedImage records
   * 9. Emit WebSocket completion
   */
  private async processPosterJob(data: PosterJobData, startTime: number): Promise<void> {
    const { jobId, businessId, brandId, campaignId, contentId, platform, category, posterContext, settings } = data;

    // ── Stage 1: Mark Processing ──────────────────────────────────────────────
    await this.updateJobProgress(jobId, 10, 'PROCESSING');
    this.wsGateway.emitJobProgress(businessId, {
      jobId, progress: 10, status: 'PROCESSING', stage: 'queued',
    });

    try {
      // ── Stage 2: Resolve Brand Context ──────────────────────────────────────
      this.logger.log(`[IMAGE_JOB:${jobId}] Stage 2: Resolving brand context...`);
      const brandCtx = await this.brandContextResolver.resolve(brandId, businessId);

      await this.updateJobProgress(jobId, 20);
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 20, status: 'PROCESSING', stage: 'enhancing',
      });

      // ── Stage 3: Resolve Content Context ────────────────────────────────────
      this.logger.log(`[IMAGE_JOB:${jobId}] Stage 3: Resolving content context...`);
      const contentCtx = contentId
        ? await this.contentContextResolver.resolve(contentId, businessId)
        : null;

      // ── Stage 4: Platform Dimensions ────────────────────────────────────────
      const platformSpec = this.platformDimensionService.getDimensions(platform || 'instagram_post');

      // ── Stage 5: Build Poster Prompt Context ────────────────────────────────
      this.logger.log(`[IMAGE_JOB:${jobId}] Stage 5: Building poster prompt context...`);

      // Resolve headline: contentCtx → posterContext → brand tagline → brand name
      const headline = contentCtx?.headline
        || posterContext?.headline
        || brandCtx.tagline
        || `${brandCtx.name} — ${category.replace(/_/g, ' ')}`;

      const posterCtxPayload: PosterContextPayload = {
        // Brand
        brandName:       brandCtx.name,
        brandTagline:    brandCtx.tagline,
        brandIndustry:   brandCtx.industry,
        brandTone:       brandCtx.tone,
        primaryColor:    brandCtx.primaryColor,
        secondaryColor:  brandCtx.secondaryColor,
        accentColor:     brandCtx.accentColor,
        fontFamily:      brandCtx.fontFamily,
        visualStyle:     brandCtx.visualStyle || settings.style,
        logoUrl:         brandCtx.logoUrl,
        logoDescription: brandCtx.logoDescription,

        // Content
        headline,
        subheadline:       contentCtx?.subheadline || posterContext?.subheadline,
        cta:               contentCtx?.cta         || posterContext?.cta,
        body:              contentCtx?.body,
        campaignObjective: contentCtx?.campaignObjective,

        // Platform
        platform:      platform || 'instagram_post',
        platformLabel: platformSpec.label,
        width:         platformSpec.width,
        height:        platformSpec.height,

        // Category
        category,
      };

      // ── Stage 6: Build LLM-ready messages ───────────────────────────────────
      const { systemPrompt, userMessage, negativePrompt } =
        this.posterPromptBuilder.build(posterCtxPayload);

      // ── Stage 7: LLM generates the final image prompt ───────────────────────
      this.logger.log(`[IMAGE_JOB:${jobId}] Stage 7: Calling LLM to generate poster prompt...`);

      const llmSettings = await this.llmSettingsService.getSettings(businessId);
      const isNvidia = llmSettings?.provider === 'nvidia';
      const nvidiaTaskModels = (llmSettings?.nvidiaTaskModels as any) ?? {};
      const resolvedProvider = llmSettings?.provider ?? 'openai';
      const resolvedModel = isNvidia
        ? (nvidiaTaskModels.imagePromptCreation || 'nvidia/nemotron-nano-8b-instruct')
        : 'gpt-4o-mini';

      let finalPrompt: string;
      try {
        const apiKey = (await this.llmSettingsService.getDecryptedApiKey(businessId)) ?? undefined;
        const { response } = await this.llm.complete(systemPrompt, userMessage, {
          provider:    resolvedProvider as any,
          model:       resolvedModel,
          temperature: 0.7,
          apiKey,
        });
        finalPrompt = response.content.trim();

        // Safety guard: ensure prompt starts with the required poster prefix
        if (!finalPrompt.toLowerCase().includes('marketing poster')) {
          finalPrompt = `Marketing poster creative, graphic design composition, ${finalPrompt}`;
        }
      } catch (llmErr) {
        this.logger.warn(`[IMAGE_JOB:${jobId}] LLM prompt enhancement failed, using fallback poster prompt. Error: ${llmErr}`);
        // Fallback: build a decent prompt directly from the poster context
        finalPrompt = this.buildFallbackPosterPrompt(posterCtxPayload);
      }

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data:  { finalPrompt, progress: 50 },
      });
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 50, status: 'PROCESSING', stage: 'generating', finalPrompt,
      });

      // ── Stage 8: Generate Image ──────────────────────────────────────────────
      this.logger.log(`[IMAGE_JOB:${jobId}] Stage 8: Generating image (provider=${settings.provider || 'openai'})...`);

      const negativePromptFull = settings.negativePromptExtra
        ? `${negativePrompt}, ${settings.negativePromptExtra}`
        : negativePrompt;

      const imageResponse = await this.imageGateway.generate(settings.provider, {
        prompt:         finalPrompt,
        negativePrompt: negativePromptFull,
        width:          platformSpec.width,
        height:         platformSpec.height,
        quality:        settings.quality,
        style:          settings.style,
        businessId,
        posterContext: {
          primaryColor:   brandCtx.primaryColor,
          secondaryColor: brandCtx.secondaryColor,
          category,
          platform,
          isPoster:       true,
        },
      });

      await this.updateJobProgress(jobId, 80);
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 80, status: 'PROCESSING', stage: 'finalizing',
      });

      // ── Stage 9: Save Asset + GeneratedImage ────────────────────────────────
      if (!imageResponse?.images?.length) {
        throw new Error('Image provider returned no images');
      }

      const generatedImageNode = imageResponse.images[0]!;
      const imageUrl = generatedImageNode.url
        || (generatedImageNode.base64 ? `data:image/png;base64,${generatedImageNode.base64}` : null);

      if (!imageUrl) throw new Error('Image provider returned empty image data');

      const providerUsed  = imageResponse.provider  || settings.provider || 'unknown';
      const modelUsed     = imageResponse.model      || 'unknown';
      const costCentsUsed = typeof imageResponse.costCents === 'number' ? imageResponse.costCents : 0;

      const fileName = `poster_${category.toLowerCase()}_${platform}_${Date.now()}.png`;

      const asset = await this.prismaService.client.asset.create({
        data: {
          businessId,
          brandId,
          campaignId,
          type:     'image',
          fileName,
          mimeType: 'image/png',
          s3Key:    `assets/${businessId}/${brandId}/posters/${fileName}`,
          cdnUrl:   imageUrl,
          metadata: {
            finalPrompt,
            negativePrompt: negativePromptFull,
            provider:       providerUsed,
            model:          modelUsed,
            costCents:      costCentsUsed,
            category,
            platform,
            platformLabel:  platformSpec.label,
            isPoster:       true,
            brandName:      brandCtx.name,
            headline,
          },
        },
      });

      await this.prismaService.client.generatedImage.create({
        data: {
          jobId,
          businessId,
          brandId,
          campaignId,
          assetId:     asset.id,
          width:       platformSpec.width,
          height:      platformSpec.height,
          aspectRatio: platformSpec.aspectRatio,
          promptUsed:  finalPrompt,
          metadata: {
            costCents:     costCentsUsed,
            provider:      providerUsed,
            model:         modelUsed,
            seed:          generatedImageNode.seed,
            category,
            platform,
            isPoster:      true,
          },
        },
      });

      // ── Stage 10: Log + Complete ─────────────────────────────────────────────
      const latencyMs = Date.now() - startTime;
      await this.logAIImageResult(businessId, providerUsed, modelUsed, latencyMs, costCentsUsed, 'SUCCESS');

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data:  { status: 'COMPLETED', progress: 100 },
      });

      this.wsGateway.emitJobCompleted(businessId, {
        jobId, progress: 100, status: 'COMPLETED', stage: 'done', imageUrl,
      });

      this.logger.log(`[IMAGE_JOB:${jobId}] ✅ Poster generation completed. Asset: ${asset.id}`);

    } catch (err) {
      await this.handleJobError(jobId, businessId, err, startTime, settings.provider);
      throw err;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LEGACY PIPELINE (backward compatibility)
  // ════════════════════════════════════════════════════════════════════════════

  private async processLegacyJob(data: LegacyImageJobData, startTime: number): Promise<void> {
    const { jobId, businessId, brandId, campaignId, rawPrompt, category, settings } = data;

    await this.updateJobProgress(jobId, 10, 'PROCESSING');
    this.wsGateway.emitJobProgress(businessId, {
      jobId, progress: 10, status: 'PROCESSING', stage: 'queued',
    });

    try {
      const brand = await this.prismaService.client.brand.findUnique({ where: { id: brandId } });
      if (!brand) throw new Error('Brand not found');

      await this.updateJobProgress(jobId, 30);
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 30, status: 'PROCESSING', stage: 'enhancing',
      });

      const enhancedPrompt = await this.enhanceLegacyPrompt(rawPrompt, brand.visualRules, category, settings.style, businessId);
      const cleanPromptForGeneration = this.extractStep3Prompt(enhancedPrompt);

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data:  { finalPrompt: enhancedPrompt, progress: 50 },
      });
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 50, status: 'PROCESSING', stage: 'generating', finalPrompt: enhancedPrompt,
      });

      const imageResponse = await this.imageGateway.generate(settings.provider, {
        prompt:    cleanPromptForGeneration,
        width:     settings.width,
        height:    settings.height,
        quality:   settings.quality,
        style:     settings.style,
        businessId,
      });

      await this.updateJobProgress(jobId, 80);
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 80, status: 'PROCESSING', stage: 'finalizing',
      });

      if (!imageResponse?.images?.length) throw new Error('Provider returned no images');

      const generatedImageNode = imageResponse.images[0]!;
      const imageUrl = generatedImageNode.url || `data:image/png;base64,${generatedImageNode.base64}`;
      const fileName = `ai_creative_${Date.now()}.png`;

      const providerUsed  = imageResponse.provider  || settings.provider || 'unknown';
      const modelUsed     = imageResponse.model      || 'unknown';
      const costCentsUsed = typeof imageResponse.costCents === 'number' ? imageResponse.costCents : 0;

      const asset = await this.prismaService.client.asset.create({
        data: {
          businessId, brandId, campaignId,
          type: 'image', fileName, mimeType: 'image/png',
          s3Key:  `assets/${businessId}/${brandId}/${fileName}`,
          cdnUrl: imageUrl,
          metadata: {
            enhancedPrompt, rawPrompt, provider: providerUsed, model: modelUsed,
            costCents: costCentsUsed, category, generationPrompt: cleanPromptForGeneration,
          },
        },
      });

      await this.prismaService.client.generatedImage.create({
        data: {
          jobId, businessId, brandId, campaignId, assetId: asset.id,
          width: settings.width, height: settings.height, aspectRatio: settings.aspectRatio,
          promptUsed: cleanPromptForGeneration,
          metadata: { costCents: costCentsUsed, provider: providerUsed, model: modelUsed, seed: generatedImageNode.seed, fullContentAnalysis: enhancedPrompt },
        },
      });

      const latencyMs = Date.now() - startTime;
      await this.logAIImageResult(businessId, providerUsed, modelUsed, latencyMs, costCentsUsed, 'SUCCESS');

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data:  { status: 'COMPLETED', progress: 100 },
      });

      this.wsGateway.emitJobCompleted(businessId, {
        jobId, progress: 100, status: 'COMPLETED', stage: 'done', imageUrl,
      });

    } catch (err) {
      await this.handleJobError(jobId, businessId, err, startTime, settings.provider);
      throw err;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════════════════════

  private async updateJobProgress(jobId: string, progress: number, status?: string) {
    const updateData: any = { progress };
    if (status) updateData.status = status;
    await this.prismaService.client.imageGenerationJob.update({
      where: { id: jobId },
      data:  updateData,
    });
  }

  private async logAIImageResult(
    businessId: string, provider: string, model: string,
    latencyMs: number, costCents: number, status: 'SUCCESS' | 'FAILED',
    errorMessage?: string,
  ) {
    try {
      await this.prismaService.client.aIImageLog.create({
        data: { businessId, provider, model, latencyMs, costCents, status, errorMessage },
      });
    } catch (err) {
      this.logger.warn(`Failed to write AI image log: ${err}`);
    }
  }

  private async handleJobError(
    jobId: string, businessId: string, err: unknown,
    startTime: number, provider?: string,
  ) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.logger.error(`[IMAGE_JOB:${jobId}] ❌ Failed: ${errorMessage}`);

    const latencyMs = Date.now() - startTime;
    await this.logAIImageResult(businessId, provider || 'unknown', 'image-generation', latencyMs, 0, 'FAILED', errorMessage);

    await this.prismaService.client.imageGenerationJob.update({
      where: { id: jobId },
      data:  { status: 'FAILED', progress: 100, error: errorMessage },
    });

    this.wsGateway.emitJobFailed(businessId, {
      jobId, progress: 100, status: 'FAILED', error: errorMessage,
    });
  }

  /**
   * Builds a fallback poster prompt without LLM when the LLM call fails.
   * Still produces a structured marketing poster prompt.
   */
  private buildFallbackPosterPrompt(ctx: PosterContextPayload): string {
    const colorStr = [ctx.primaryColor, ctx.secondaryColor, ctx.accentColor]
      .filter(Boolean).join(', ');

    return [
      'Marketing poster creative, graphic design composition,',
      `professional ${ctx.category.replace(/_/g, ' ').toLowerCase()} design,`,
      ctx.visualStyle ? `${ctx.visualStyle} aesthetic,` : 'modern premium aesthetic,',
      `${ctx.platformLabel} format (${ctx.width}×${ctx.height}px),`,
      colorStr ? `brand color palette: ${colorStr},` : 'professional brand color palette,',
      `bold headline text zone at top reading "${ctx.headline}",`,
      ctx.cta ? `prominent CTA button zone at bottom reading "${ctx.cta}",` : '',
      ctx.brandName ? `${ctx.brandName} brand identity,` : '',
      ctx.brandIndustry ? `${ctx.brandIndustry} industry visual theme,` : '',
      'clean typographic layout, high-contrast design, professional marketing artwork,',
      'ultra-sharp, 8K quality, commercial advertising quality, print-ready design',
    ].filter(Boolean).join(' ');
  }

  /**
   * Extracts just the [Step 3] portion from the legacy 3-step LLM output.
   */
  private extractStep3Prompt(fullPrompt: string): string {
    const markers = [
      '2. FLUX.1-dev Prompt', 'FLUX.1-dev Prompt',
      'OUTPUT 3: AI IMAGE GENERATOR PROMPT',
      '[Step 3: Final Image Prompt]', 'Step 3: Final Image Prompt',
      '### Step 3: Final Image Prompt', '[Step 3]', 'Step 3:', '### Step 3',
    ];

    for (const marker of markers) {
      const index = fullPrompt.indexOf(marker);
      if (index !== -1) {
        let content = fullPrompt.substring(index + marker.length).trim();
        content = content.replace(/^[:\-\s\*\#\n\r]+/, '');
        for (const neg of ['3. Negative Prompt', 'Negative Prompt:']) {
          const negIndex = content.indexOf(neg);
          if (negIndex !== -1) content = content.substring(0, negIndex).trim();
        }
        if (content) return content;
      }
    }

    return fullPrompt;
  }

  /**
   * Legacy 3-step prompt enhancement (kept for backward compatibility with old jobs).
   */
  private async enhanceLegacyPrompt(
    prompt: string,
    visualRules: any,
    category: string,
    styleOverride?: string,
    businessId?: string,
  ): Promise<string> {
    const rules = visualRules || {};
    const baseStyle = styleOverride || rules.style || 'modern, professional, visual harmony';
    let colorTokensString = '';

    if (Array.isArray(rules.colorTokens) && rules.colorTokens.length > 0) {
      colorTokensString = rules.colorTokens.map((t: any) => `${t.name} (${t.type}): ${t.value}`).join(', ');
    } else {
      const parts = [
        rules.primaryColor   ? `Primary: ${rules.primaryColor}`   : '',
        rules.secondaryColor ? `Secondary: ${rules.secondaryColor}` : '',
      ].filter(Boolean);
      colorTokensString = parts.join(', ');
    }

    const colors = colorTokensString ? `Brand palette: ${colorTokensString}.` : '';

    let knowledgeBlock = '';
    if (businessId) {
      try {
        const apiKey = (await this.llmSettingsService.getDecryptedApiKey(businessId)) ?? undefined;
        const relevantFacts = await this.vectorService.findRelevantContext(
          this.prismaService.client, businessId, category || prompt, 5, undefined, apiKey,
        );
        if (relevantFacts?.length > 0) {
          knowledgeBlock = `Brand Context:\n${relevantFacts.map((f: any) => `- ${f.content}`).join('\n')}`;
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch vector context: ${err}`);
      }
    }

    const llmSettings = businessId ? await this.llmSettingsService.getSettings(businessId) : null;
    const isNvidia = llmSettings?.provider === 'nvidia';
    const nvidiaTaskModels = (llmSettings?.nvidiaTaskModels as any) ?? {};
    const nvidiaSystemPrompts = (llmSettings?.nvidiaSystemPrompts as any) ?? {};

    const resolvedProvider = llmSettings?.provider ?? 'openai';
    const resolvedModel = isNvidia
      ? (nvidiaTaskModels.imagePromptCreation || 'nvidia/nemotron-nano-8b-instruct')
      : 'gpt-4o-mini';

    let systemPrompt = `You are an expert Creative Director and SaaS Marketing Designer.
Your output MUST contain three steps:

[Step 1: Content Extraction] – Extract headline, subheadline, benefits, features, CTA, industry, audience.
[Step 2: Visual Strategy] – How visuals, composition, colors, layout will represent the content.
[Step 3: Final Image Prompt] – Rich, detailed poster prompt. Must NOT show generic office/meeting scenes. Category: "${category}"

${knowledgeBlock}`;

    if (isNvidia && nvidiaSystemPrompts.imagePromptCreation) {
      let template = nvidiaSystemPrompts.imagePromptCreation;
      const inputContent = `Category: ${category}\nPrompt/Content: ${prompt}\nStyle: "${baseStyle}"\n${colors}\n${knowledgeBlock}`;
      template = template.replace(/\{\{CONTENT\}\}/g, inputContent).replace(/\{\{[^}]+\}\}/g, '');
      systemPrompt = template;
    }

    const userMessage = `Content: ${prompt}\nBrand Design: Style = "${baseStyle}"; ${colors}\nGenerate the 3-step analysis.`;

    try {
      const apiKey = (businessId ? await this.llmSettingsService.getDecryptedApiKey(businessId) : undefined) ?? undefined;
      const { response } = await this.llm.complete(systemPrompt, userMessage, {
        provider: resolvedProvider as any,
        model:    resolvedModel,
        temperature: 0.7,
        apiKey,
      });
      return response.content;
    } catch (err) {
      this.logger.error('Failed to enhance legacy prompt, using fallback', err);
      return `[Step 3: Final Image Prompt]\nMarketing poster creative, graphic design composition, ${prompt.substring(0, 300)}, ${baseStyle} style, ${category} layout, professional marketing artwork.`;
    }
  }
}
