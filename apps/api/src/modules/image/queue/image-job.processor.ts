import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { LLMGateway, ImageGateway, VectorService, PosterPromptBuilder } from '@brandflow/ai';
import type { PosterContextPayload, ImageProviderKeys } from '@brandflow/ai';
import { PrismaService } from '../../../common/database/prisma.service';
import { ImageWebSocketGateway } from '../image.gateway';
import { LlmSettingsService } from '../../llm-settings/llm-settings.service';
import { BrandContextResolverService } from '../services/brand-context-resolver.service';
import { ContentContextResolverService } from '../services/content-context-resolver.service';
import { PlatformDimensionService } from '../services/platform-dimension.service';

const IMAGE_GENERATION_QUEUE = 'image-generation';

// ─── Job Data Types ────────────────────────────────────────────────────────────

interface PosterJobData {
  jobId: string;
  businessId: string;
  brandId: string;
  campaignId?: string;
  contentId?: string;
  platform: string;
  category: string;
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
    this.vectorService = new VectorService();
    this.posterPromptBuilder = new PosterPromptBuilder();
    // NOTE: ImageGateway is intentionally NOT created here.
    // It must be created per-job using the user's real API key from LlmSettingsService.
  }

  async process(job: Job<ImageJobData>): Promise<void> {
    const jobData = job.data;
    this.logger.log(
      `[IMAGE_JOB] Processing job ${jobData.jobId} (name="${job.name}", business=${jobData.businessId})`
    );

    if (job.name === 'generate-poster') {
      await this.processPosterJob(jobData as PosterJobData, Date.now());
    } else {
      await this.processLegacyJob(jobData as LegacyImageJobData, Date.now());
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // NEW POSTER PIPELINE
  // ════════════════════════════════════════════════════════════════════════════

  private async processPosterJob(data: PosterJobData, startTime: number): Promise<void> {
    const { jobId, businessId, brandId, campaignId, contentId, platform, category, posterContext, settings } = data;

    await this.updateJobProgress(jobId, 10, 'PROCESSING');
    this.wsGateway.emitJobProgress(businessId, { jobId, progress: 10, status: 'PROCESSING', stage: 'queued' });

    try {
      // ── Stage 1: Resolve user's API key for image generation ──────────────────
      //
      // Priority: imageApiKey (DALL-E specific) → apiKey (if OpenAI provider) → null (mock)
      // NEVER use process.env['OPENAI_API_KEY'] which is a system mock placeholder.
      //
      const llmSettings = await this.llmSettingsService.getSettings(businessId);
      const resolvedProvider = (llmSettings?.provider as string) ?? 'openai';
      const isNvidia = resolvedProvider === 'nvidia';
      const nvidiaTaskModels = (llmSettings?.nvidiaTaskModels as any) ?? {};

      const { key: userApiKey, source: keySource } = await this.llmSettingsService.getDecryptedImageApiKey(businessId);
      const imageGateway = this.buildImageGateway(userApiKey, resolvedProvider);

      this.logger.log(
        `[IMAGE_JOB:${jobId}] Image API key: ${userApiKey ? `found (source=${keySource})` : 'NONE — using mock provider'}. ` +
        `llmProvider=${resolvedProvider}, imageProvider=${settings.provider || 'openai'}`
      );

      // ── Stage 2: Resolve Brand Context ────────────────────────────────────
      this.logger.log(`[IMAGE_JOB:${jobId}] Resolving brand context...`);
      const brandCtx = await this.brandContextResolver.resolve(brandId, businessId);

      await this.updateJobProgress(jobId, 20);
      this.wsGateway.emitJobProgress(businessId, { jobId, progress: 20, status: 'PROCESSING', stage: 'enhancing' });

      // ── Stage 3: Resolve Content Context ──────────────────────────────────
      const contentCtx = contentId
        ? await this.contentContextResolver.resolve(contentId, businessId)
        : null;

      // ── Stage 4: Platform Dimensions ──────────────────────────────────────
      const platformSpec = this.platformDimensionService.getDimensions(platform || 'instagram_post');

      // ── Stage 5: Merge Content ─────────────────────────────────────────────
      const headline =
        contentCtx?.headline ||
        posterContext?.headline ||
        brandCtx.tagline ||
        `${brandCtx.name} — ${category.replace(/_/g, ' ')}`;

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

      // ── Stage 6: Build the final image prompt ─────────────────────────────
      //
      // STRATEGY: Build the poster prompt directly from brand + content context.
      // Then OPTIONALLY enrich it with LLM if user has API key configured.
      // Without enrichment, the direct prompt is already strong and structured.
      //
      const { systemPrompt, userMessage, negativePrompt } = this.posterPromptBuilder.build(posterCtxPayload);

      // Primary poster prompt built directly from brand context (deterministic — no hallucination)
      const directPosterPrompt = this.buildDirectPosterPrompt(posterCtxPayload);

      await this.updateJobProgress(jobId, 35);
      this.wsGateway.emitJobProgress(businessId, { jobId, progress: 35, status: 'PROCESSING', stage: 'enhancing' });

      let finalPrompt = directPosterPrompt;

      // Only call LLM to ENRICH the prompt if user has a valid API key
      if (userApiKey) {
        try {
          this.logger.log(`[IMAGE_JOB:${jobId}] LLM enrichment enabled. Calling LLM (${resolvedProvider})...`);
          const llmModel = isNvidia
            ? (nvidiaTaskModels.imagePromptCreation || 'nvidia/nemotron-nano-8b-instruct')
            : 'gpt-4o-mini';

          const { response } = await this.llm.complete(systemPrompt, userMessage, {
            provider:    resolvedProvider as any,
            model:       llmModel,
            temperature: 0.65,
            apiKey:      userApiKey,
          });

          const llmPrompt = response.content.trim();

          // Validate LLM output: must contain poster-related language
          const isPosterPrompt = llmPrompt.toLowerCase().includes('marketing poster') ||
                                  llmPrompt.toLowerCase().includes('graphic design') ||
                                  llmPrompt.toLowerCase().includes('poster creative') ||
                                  llmPrompt.toLowerCase().includes('layout') ||
                                  llmPrompt.toLowerCase().includes('typography zone');

          if (isPosterPrompt && llmPrompt.length > 100) {
            finalPrompt = llmPrompt;
            this.logger.log(`[IMAGE_JOB:${jobId}] Using LLM-enriched prompt (${llmPrompt.length} chars)`);
          } else {
            this.logger.warn(`[IMAGE_JOB:${jobId}] LLM output failed poster validation — using direct prompt instead`);
            // Prepend to whatever the LLM said to force poster framing
            finalPrompt = `Marketing poster creative, graphic design composition, ${llmPrompt}`;
          }
        } catch (llmErr) {
          this.logger.warn(`[IMAGE_JOB:${jobId}] LLM enrichment failed — using direct poster prompt. Error: ${llmErr}`);
          // directPosterPrompt is already set as finalPrompt — no action needed
        }
      } else {
        this.logger.log(`[IMAGE_JOB:${jobId}] No user API key — using direct poster prompt (no LLM enrichment)`);
      }

      // Final safety guard: ensure prompt always starts with poster prefix
      if (!finalPrompt.startsWith('Marketing poster creative')) {
        finalPrompt = `Marketing poster creative, graphic design composition, ${finalPrompt}`;
      }

      this.logger.log(`[IMAGE_JOB:${jobId}] FINAL PROMPT (${finalPrompt.length} chars): ${finalPrompt.slice(0, 200)}...`);

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data:  { finalPrompt, progress: 50 },
      });
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 50, status: 'PROCESSING', stage: 'generating', finalPrompt,
      });

      // ── Stage 7: Generate Image ────────────────────────────────────────────
      const negativePromptFull = settings.negativePromptExtra
        ? `${negativePrompt}, ${settings.negativePromptExtra}`
        : negativePrompt;

      const imageResponse = await imageGateway.generate(
        settings.provider || (resolvedProvider === 'openai' ? 'openai' : (resolvedProvider === 'nvidia' ? 'nvidia' : 'stability')),
        {
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
      this.wsGateway.emitJobProgress(businessId, { jobId, progress: 80, status: 'PROCESSING', stage: 'finalizing' });

      // ── Stage 8: Persist Results ───────────────────────────────────────────
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

      this.logger.log(`[IMAGE_JOB:${jobId}] Image generated by provider="${providerUsed}", isMock=${providerUsed === 'mock'}`);

      const fileName = `poster_${category.toLowerCase()}_${platform}_${Date.now()}.png`;
      const asset = await this.prismaService.client.asset.create({
        data: {
          businessId, brandId, campaignId,
          type: 'image', fileName, mimeType: 'image/png',
          s3Key:  `assets/${businessId}/${brandId}/posters/${fileName}`,
          cdnUrl: imageUrl,
          metadata: {
            finalPrompt, negativePrompt: negativePromptFull,
            provider: providerUsed, model: modelUsed, costCents: costCentsUsed,
            category, platform, platformLabel: platformSpec.label,
            isPoster: true, brandName: brandCtx.name, headline,
            isMock: providerUsed === 'mock',
          },
        },
      });

      await this.prismaService.client.generatedImage.create({
        data: {
          jobId, businessId, brandId, campaignId, assetId: asset.id,
          width: platformSpec.width, height: platformSpec.height,
          aspectRatio: platformSpec.aspectRatio, promptUsed: finalPrompt,
          metadata: { costCents: costCentsUsed, provider: providerUsed, model: modelUsed, seed: generatedImageNode.seed, category, platform, isPoster: true },
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

      this.logger.log(`[IMAGE_JOB:${jobId}] ✅ Completed. Provider: ${providerUsed}, Asset: ${asset.id}`);

    } catch (err) {
      await this.handleJobError(jobId, businessId, err, startTime, settings.provider);
      throw err;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DIRECT POSTER PROMPT (no LLM dependency — deterministic brand-aware output)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Builds a high-quality poster prompt DIRECTLY from brand + content context.
   * This is the primary generation path — no LLM call required.
   * Used when: (a) user has no LLM API key, or (b) LLM output fails poster validation.
   *
   * The prompt is designed to be strong enough for DALL-E 3 'vivid' mode to produce
   * a compelling marketing poster without additional LLM enrichment.
   */
  private buildDirectPosterPrompt(ctx: PosterContextPayload): string {
    const colorStr = [ctx.primaryColor, ctx.secondaryColor, ctx.accentColor]
      .filter(Boolean)
      .map(c => c!)
      .join(', ');

    const toneStr = (ctx.brandTone || ['professional', 'modern']).slice(0, 3).join(', ');
    const styleStr = ctx.visualStyle
      || 'modern premium corporate';

    // Layout-specific description based on orientation
    const ratio = ctx.width / ctx.height;
    const layoutDesc = ratio > 1.4
      ? 'wide horizontal landscape banner layout with text zone left, hero visual center-right'
      : ratio < 0.7
        ? 'tall vertical portrait layout with logo top, bold headline center, CTA button bottom'
        : 'balanced square layout with centered typography hierarchy and geometric graphic elements';

    // Category-specific visual concept
    const categoryVisual = this.getCategoryVisualConcept(ctx.category, ctx.brandIndustry);

    // Build the full prompt
    const parts = [
      `Marketing poster creative, graphic design composition,`,
      `${styleStr} aesthetic,`,
      `${ctx.platformLabel} format poster design,`,
      `${layoutDesc},`,

      // Brand identity
      colorStr
        ? `dominant brand color palette: ${colorStr}, brand colors used throughout all design elements,`
        : `premium professional brand color palette,`,
      ctx.brandName ? `brand identity for "${ctx.brandName}",` : '',
      ctx.brandIndustry ? `${ctx.brandIndustry} industry sector visual theme,` : '',
      `brand tone: ${toneStr},`,

      // Typography zones
      `bold headline typography zone reading "${ctx.headline}",`,
      ctx.subheadline ? `supporting subheadline text zone: "${ctx.subheadline}",` : '',
      ctx.cta ? `prominent call-to-action button zone: "${ctx.cta}",` : '',

      // Visual concept
      `hero visual element: ${categoryVisual},`,

      // Logo zone
      `brand logo placeholder zone at top-left corner with wordmark,`,

      // Design language
      `professional white space balance, clean typographic hierarchy,`,
      `geometric design accents, premium marketing layout,`,
      `modern sans-serif typography, clear visual hierarchy,`,

      // Quality descriptors
      `ultra-sharp focus, professional marketing artwork,`,
      `commercial advertising quality, print-ready resolution,`,
      `8K detail, vibrant colors, highly polished finish`,
    ].filter(s => s.trim().length > 0).join(' ');

    return parts;
  }

  private getCategoryVisualConcept(category: string, industry?: string): string {
    const ind = industry?.toLowerCase() || 'business';

    const concepts: Record<string, string> = {
      SMO_POSTER:        `abstract geometric shapes in brand colors, dynamic diagonal composition, modern gradient overlay, ${ind}-relevant icon motif`,
      FESTIVAL_BANNER:   `celebratory graphic elements, decorative ornaments in brand palette, festive typography treatment, warm radiant glow effects`,
      OFFER_CREATIVE:    `bold discount badge element, dynamic starburst accent in accent color, product/service icon, urgency-creating visual composition`,
      WEBSITE_HERO:      `full-width split composition, abstract 3D geometric elements on brand gradient, spacious professional header feel, depth and dimension`,
      PRINTABLE_STANDEE: `top-to-bottom vertical flow, large brand monogram or icon, benefit icons in a column, professional trade show quality`,
      PRINTABLE_BANNER:  `wide horizontal brand strip, large-scale typography, minimal distraction design, strong brand color background`,
      PRINTABLE_FLYER:   `structured grid layout, multiple content zones, brand-colored section dividers, professional print design`,
      PRINTABLE_BROCHURE:`elegant multi-section layout, premium paper-like texture, sophisticated typography, brand gradient accents`,
      AD_CREATIVE:       `conversion-optimized layout, bold product/service visualization, benefit icons, strong CTA visual emphasis`,
      SOCIAL_COVER:      `wide panoramic composition, brand identity dominant, abstract background pattern in brand colors, minimal text for cover readability`,
      THUMBNAIL:         `high-contrast close-up focal element, bold text treatment, bright brand accent colors, visual punch for small sizes`,
    };

    return concepts[category] || `brand-relevant abstract geometric elements in brand color palette, modern professional marketing composition`;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BUILD IMAGE GATEWAY WITH USER'S REAL KEY
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Creates a per-job ImageGateway instance using the user's real API key.
   * This is the critical fix: the system env key is a mock placeholder.
   * The real key comes from LlmSettings (encrypted in DB, set by user in Settings UI).
   */
  /**
   * Creates a per-job ImageGateway using the user's real API key injected directly
   * into the constructor — no env variable mutation, fully thread-safe for concurrent jobs.
   *
   * Key resolution:
   *  - userApiKey is from getDecryptedImageApiKey() which already applies priority:
   *    imageApiKey (DALL-E-specific) → apiKey (if OpenAI LLM provider) → null
   *  - If userApiKey is null → only mock provider will be available
   */
  private buildImageGateway(userApiKey: string | null, llmProvider: string): ImageGateway {
    // Inject the key directly — no process.env mutation (thread-safe for concurrent jobs)
    const keys: ImageProviderKeys = {
      openai: userApiKey || null,  // Works for both 'openai' and 'nvidia' LLM providers
      flux:   null,                // Future: extend getDecryptedImageApiKey to support flux key
      stability: null,             // Future: extend to support stability key
      nvidia: llmProvider === 'nvidia' ? (userApiKey || null) : null,
    };

    const gateway = new ImageGateway(
      { defaultProvider: 'openai', fallbackProvider: 'stability' },
      keys,
    );

    if (!gateway.hasRealProvider()) {
      this.logger.warn(
        `[ImageGateway] No real provider registered — will use mock. ` +
        `To fix: go to Settings → AI → add your OpenAI API key.`
      );
    } else {
      this.logger.log(`[ImageGateway] Active providers: ${gateway.registeredProviders().join(', ')}`);
    }

    return gateway;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LEGACY PIPELINE (backward compatibility)
  // ════════════════════════════════════════════════════════════════════════════

  private async processLegacyJob(data: LegacyImageJobData, startTime: number): Promise<void> {
    const { jobId, businessId, brandId, campaignId, rawPrompt, category, settings } = data;

    await this.updateJobProgress(jobId, 10, 'PROCESSING');
    this.wsGateway.emitJobProgress(businessId, { jobId, progress: 10, status: 'PROCESSING', stage: 'queued' });

    try {
      const brand = await this.prismaService.client.brand.findUnique({ where: { id: brandId } });
      if (!brand) throw new Error('Brand not found');

      const llmSettings = await this.llmSettingsService.getSettings(businessId);
      const resolvedProvider = (llmSettings?.provider as string) ?? 'openai';
      const userApiKey = await this.llmSettingsService.getDecryptedApiKey(businessId);
      const imageGateway = this.buildImageGateway(userApiKey, resolvedProvider);

      await this.updateJobProgress(jobId, 30);
      this.wsGateway.emitJobProgress(businessId, { jobId, progress: 30, status: 'PROCESSING', stage: 'enhancing' });

      const enhancedPrompt = await this.enhanceLegacyPrompt(rawPrompt, brand.visualRules, category, settings.style, businessId, userApiKey);
      const cleanPromptForGeneration = this.extractStep3Prompt(enhancedPrompt);

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data:  { finalPrompt: enhancedPrompt, progress: 50 },
      });
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 50, status: 'PROCESSING', stage: 'generating', finalPrompt: enhancedPrompt,
      });

      const imageResponse = await imageGateway.generate(settings.provider || (resolvedProvider === 'nvidia' ? 'nvidia' : 'openai'), {
        prompt:    cleanPromptForGeneration,
        width:     settings.width, height: settings.height,
        quality:   settings.quality, style: settings.style, businessId,
      });

      await this.updateJobProgress(jobId, 80);
      this.wsGateway.emitJobProgress(businessId, { jobId, progress: 80, status: 'PROCESSING', stage: 'finalizing' });

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
          s3Key: `assets/${businessId}/${brandId}/${fileName}`, cdnUrl: imageUrl,
          metadata: { enhancedPrompt, rawPrompt, provider: providerUsed, model: modelUsed, costCents: costCentsUsed, category, generationPrompt: cleanPromptForGeneration },
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
      await this.prismaService.client.imageGenerationJob.update({ where: { id: jobId }, data: { status: 'COMPLETED', progress: 100 } });
      this.wsGateway.emitJobCompleted(businessId, { jobId, progress: 100, status: 'COMPLETED', stage: 'done', imageUrl });

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
    await this.prismaService.client.imageGenerationJob.update({ where: { id: jobId }, data: updateData });
  }

  private async logAIImageResult(businessId: string, provider: string, model: string, latencyMs: number, costCents: number, status: 'SUCCESS' | 'FAILED', errorMessage?: string) {
    try {
      await this.prismaService.client.aIImageLog.create({ data: { businessId, provider, model, latencyMs, costCents, status, errorMessage } });
    } catch (err) {
      this.logger.warn(`Failed to write AI image log: ${err}`);
    }
  }

  private async handleJobError(jobId: string, businessId: string, err: unknown, startTime: number, provider?: string) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.logger.error(`[IMAGE_JOB:${jobId}] ❌ Failed: ${errorMessage}`);
    await this.logAIImageResult(businessId, provider || 'unknown', 'image-generation', Date.now() - startTime, 0, 'FAILED', errorMessage);
    await this.prismaService.client.imageGenerationJob.update({
      where: { id: jobId },
      data:  { status: 'FAILED', progress: 100, error: errorMessage },
    });
    this.wsGateway.emitJobFailed(businessId, { jobId, progress: 100, status: 'FAILED', error: errorMessage });
  }

  private extractStep3Prompt(fullPrompt: string): string {
    const markers = [
      '2. FLUX.1-dev Prompt', 'FLUX.1-dev Prompt',
      '[Step 3: Final Image Prompt]', 'Step 3: Final Image Prompt',
      '### Step 3: Final Image Prompt', '[Step 3]', 'Step 3:', '### Step 3',
    ];
    for (const marker of markers) {
      const index = fullPrompt.indexOf(marker);
      if (index !== -1) {
        let content = fullPrompt.substring(index + marker.length).trim().replace(/^[:\-\s\*\#\n\r]+/, '');
        for (const neg of ['3. Negative Prompt', 'Negative Prompt:']) {
          const negIndex = content.indexOf(neg);
          if (negIndex !== -1) content = content.substring(0, negIndex).trim();
        }
        if (content) return content;
      }
    }
    return fullPrompt;
  }

  private async enhanceLegacyPrompt(
    prompt: string, visualRules: any, category: string,
    styleOverride?: string, businessId?: string, userApiKey?: string | null,
  ): Promise<string> {
    const rules = visualRules || {};
    const baseStyle = styleOverride || rules.style || 'modern, professional';
    const colorTokens: any[] = Array.isArray(rules.colorTokens) ? rules.colorTokens : [];
    const colorStr = colorTokens.length > 0
      ? colorTokens.map((t: any) => `${t.name}: ${t.value}`).join(', ')
      : [rules.primaryColor, rules.secondaryColor].filter(Boolean).join(', ');
    const colors = colorStr ? `Brand palette: ${colorStr}.` : '';

    if (!userApiKey && !businessId) {
      return `[Step 3: Final Image Prompt]\nMarketing poster creative, graphic design composition, ${prompt.slice(0, 300)}, ${baseStyle} style, ${category} layout, professional marketing artwork.`;
    }

    const llmSettings = businessId ? await this.llmSettingsService.getSettings(businessId) : null;
    const resolvedProvider = llmSettings?.provider ?? 'openai';
    const isNvidia = resolvedProvider === 'nvidia';
    const nvidiaTaskModels = (llmSettings?.nvidiaTaskModels as any) ?? {};
    const resolvedModel = isNvidia ? (nvidiaTaskModels.imagePromptCreation || 'nvidia/nemotron-nano-8b-instruct') : 'gpt-4o-mini';

    const systemPrompt = `You are a Creative Director. Generate ONLY a DALL-E/image prompt for a marketing poster.
Category: "${category}". Style: "${baseStyle}". ${colors}
Output ONLY [Step 3: Final Image Prompt] starting with "Marketing poster creative, graphic design composition," — nothing else.`;
    const userMessage = `Create a marketing poster prompt for: ${prompt}`;

    try {
      const apiKeyToUse = userApiKey || undefined;
      const { response } = await this.llm.complete(systemPrompt, userMessage, {
        provider: resolvedProvider as any, model: resolvedModel, temperature: 0.7, apiKey: apiKeyToUse,
      });
      return response.content;
    } catch (err) {
      this.logger.error('Legacy prompt enhancement failed', err);
      return `[Step 3: Final Image Prompt]\nMarketing poster creative, graphic design composition, ${prompt.slice(0, 300)}, ${baseStyle} style.`;
    }
  }
}
