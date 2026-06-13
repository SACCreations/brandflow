import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { LLMGateway, ImageGateway, VectorService } from '@brandflow/ai';
import { PrismaService } from '../../../common/database/prisma.service';
import { ImageWebSocketGateway } from '../image.gateway';
import { LlmSettingsService } from '../../llm-settings/llm-settings.service';

const IMAGE_GENERATION_QUEUE = 'image-generation';

interface ImageJobData {
  jobId: string;
  businessId: string;
  brandId: string;
  campaignId?: string;
  contentId?: string;
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

@Processor(IMAGE_GENERATION_QUEUE, { concurrency: 3 })
export class ImageJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageJobProcessor.name);
  private readonly llm: LLMGateway;
  private readonly imageGateway: ImageGateway;
  private readonly vectorService: VectorService;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly wsGateway: ImageWebSocketGateway,
    private readonly llmSettingsService: LlmSettingsService,
  ) {
    super();
    this.llm = new LLMGateway({ defaultProvider: 'openai' });
    this.imageGateway = new ImageGateway({ defaultProvider: 'stability' });
    this.vectorService = new VectorService();
  }

  async process(job: Job<ImageJobData>): Promise<void> {
    const { jobId, businessId, brandId, campaignId, contentId, rawPrompt, category, settings } = job.data;
    const startTime = Date.now();

    this.logger.log(`[IMAGE_JOB] Processing generation job ${jobId} for business ${businessId}`);

    await this.prismaService.client.imageGenerationJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', progress: 10 },
    });
    this.wsGateway.emitJobProgress(businessId, {
      jobId, progress: 10, status: 'PROCESSING', stage: 'queued',
    });

    try {
      const brand = await this.prismaService.client.brand.findUnique({
        where: { id: brandId },
      });
      if (!brand) throw new Error('Brand not found');

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data: { progress: 30 },
      });
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 30, status: 'PROCESSING', stage: 'enhancing',
      });

      const enhancedPrompt = await this.enhancePrompt(rawPrompt, brand.visualRules, category, settings.style, businessId);
      const cleanPromptForGeneration = this.extractStep3Prompt(enhancedPrompt);
      
      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data: { 
          finalPrompt: enhancedPrompt,
          progress: 50
        },
      });
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 50, status: 'PROCESSING', stage: 'generating', finalPrompt: enhancedPrompt,
      });

      const imageResponse = await this.imageGateway.generate(settings.provider, {
        prompt: cleanPromptForGeneration,
        width: settings.width,
        height: settings.height,
        quality: settings.quality,
        style: settings.style,
        businessId,
      });

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data: { progress: 80 },
      });
      this.wsGateway.emitJobProgress(businessId, {
        jobId, progress: 80, status: 'PROCESSING', stage: 'finalizing',
      });

      if (!imageResponse || !imageResponse.images || imageResponse.images.length === 0) {
        throw new Error('Provider failed to return image artifacts from gateway');
      }

      const generatedImageNode = imageResponse.images[0];
      if (!generatedImageNode) throw new Error('Provider returned empty image node');

      const imageUrl = generatedImageNode.url || `data:image/png;base64,${generatedImageNode.base64}`;
      const fileName = `ai_creative_${Date.now()}.png`;

      // More robust asset metadata extraction
      const providerUsed = imageResponse.provider || settings.provider || 'unknown';
      const modelUsed = imageResponse.model || 'unknown';
      const costCentsUsed = typeof imageResponse.costCents === 'number' ? imageResponse.costCents : 0;

      const asset = await this.prismaService.client.asset.create({
        data: {
          businessId,
          brandId,
          campaignId,
          type: 'image',
          fileName,
          mimeType: 'image/png',
          s3Key: `assets/${businessId}/${brandId}/${fileName}`,
          cdnUrl: imageUrl,
          metadata: {
            enhancedPrompt,
            rawPrompt,
            provider: providerUsed,
            model: modelUsed,
            costCents: costCentsUsed,
            category,
            generationPrompt: cleanPromptForGeneration,
          },
        },
      });

      await this.prismaService.client.generatedImage.create({
        data: {
          jobId,
          businessId,
          brandId,
          campaignId,
          assetId: asset.id,
          width: settings.width,
          height: settings.height,
          aspectRatio: settings.aspectRatio,
          promptUsed: cleanPromptForGeneration,
          metadata: {
            costCents: costCentsUsed,
            provider: providerUsed,
            model: modelUsed,
            seed: generatedImageNode.seed,
            fullContentAnalysis: enhancedPrompt,
          },
        },
      });

      const latencyMs = Date.now() - startTime;
      await this.prismaService.client.aIImageLog.create({
        data: {
          businessId,
          provider: providerUsed,
          model: modelUsed,
          latencyMs,
          costCents: costCentsUsed,
          status: 'SUCCESS',
        },
      });

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
        },
      });

      this.wsGateway.emitJobCompleted(businessId, {
        jobId, progress: 100, status: 'COMPLETED', stage: 'done', imageUrl: imageUrl,
      });

      this.logger.log(`[IMAGE_JOB] Completed generation job ${jobId} successfully. Asset ID: ${asset.id}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`[IMAGE_JOB] Job ${jobId} failed: ${errorMessage}`);

      const latencyMs = Date.now() - startTime;
      try {
        await this.prismaService.client.aIImageLog.create({
          data: {
            businessId,
            provider: settings.provider || 'unknown',
            model: 'image-generation',
            latencyMs,
            costCents: 0,
            status: 'FAILED',
            errorMessage,
          },
        });
      } catch (logErr) {
        this.logger.error(`Failed to write AI failure log: ${logErr}`);
      }

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          progress: 100,
          error: errorMessage,
        },
      });

      this.wsGateway.emitJobFailed(businessId, {
        jobId, progress: 100, status: 'FAILED', error: errorMessage,
      });

      throw err;
    }
  }

  private extractStep3Prompt(fullPrompt: string): string {
    const markers = [
      '2. FLUX.1-dev Prompt',
      'FLUX.1-dev Prompt',
      'OUTPUT 3: AI IMAGE GENERATOR PROMPT',
      '[Step 3: Final Image Prompt]',
      'Step 3: Final Image Prompt',
      '### Step 3: Final Image Prompt',
      '[Step 3]',
      'Step 3:',
      '### Step 3',
    ];
    
    for (const marker of markers) {
      const index = fullPrompt.indexOf(marker);
      if (index !== -1) {
        let content = fullPrompt.substring(index + marker.length).trim();
        // Remove leading headers/bullet/markdown indicators
        content = content.replace(/^[:\-\s\*\#\n\r]+/, '');
        
        // Exclude the Negative Prompt section if it exists
        const negMarkers = ['3. Negative Prompt', 'Negative Prompt:'];
        for (const neg of negMarkers) {
          const negIndex = content.indexOf(neg);
          if (negIndex !== -1) {
            content = content.substring(0, negIndex).trim();
          }
        }
        
        if (content) {
          return content;
        }
      }
    }
    
    // Fallback if marker not found or empty
    return fullPrompt;
  }

  private async enhancePrompt(
    prompt: string,
    visualRules: any,
    category: string,
    styleOverride?: string,
    businessId?: string
  ): Promise<string> {
    const rules = visualRules || {};
    const baseStyle = styleOverride || rules.style || 'modern, professional, visual harmony';
    let colorTokensString = '';
    if (Array.isArray(rules.colorTokens) && rules.colorTokens.length > 0) {
      colorTokensString = rules.colorTokens.map((t: any) => `${t.name} (${t.type}): ${t.value}`).join(', ');
    } else {
      const primaryColor = rules.primaryColor ? `Primary Color: ${rules.primaryColor}` : '';
      const secondaryColor = rules.secondaryColor ? `Secondary Color: ${rules.secondaryColor}` : '';
      colorTokensString = [primaryColor, secondaryColor].filter(Boolean).join(', ');
    }
    const colors = colorTokensString ? `Respect brand visual palette tokens: ${colorTokensString}.` : '';

    let knowledgeBlock = '';
    if (businessId) {
      try {
        const apiKey = (await this.llmSettingsService.getDecryptedApiKey(businessId)) ?? undefined;
        const relevantFacts = await this.vectorService.findRelevantContext(
          this.prismaService.client,
          businessId,
          category || prompt,
          5,
          undefined,
          apiKey,
        );
        if (relevantFacts && relevantFacts.length > 0) {
          knowledgeBlock = `Brand Context Insights:\n${relevantFacts.map((f: any) => `- ${f.content}`).join('\n')}`;
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch vector context for image generation: ${err}`);
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

    let systemPrompt = `You are an expert Creative Director, Brand Strategist, and SaaS Marketing Designer.

You are operating in CONTENT ANALYSIS MODE. Before generating the final prompt for the image generator, you MUST perform a complete content analysis.
Your output MUST contain three distinct steps in the following exact format:

[Step 1: Content Extraction]
- Headline: [Extract or suggest a clear headline from the content]
- Subheadline: [Extract or suggest a supporting subheadline]
- Benefits: [Extract key benefits/value proposition]
- Features: [Extract key features/functional components]
- CTA: [Extract call-to-action]
- Industry: [Identify the target industry/domain]
- Audience: [Identify the target audience]

[Step 2: Visual Strategy]
Describe the visual strategy. Detail how visual metaphors, composition, colors, and layout will represent the extracted content and narrative. Explain how the image will communicate this strategy even if all text/words are removed.

[Step 3: Final Image Prompt]
Generate a rich, detailed, concrete description of the poster visual scene that directly represents the extracted content.
Crucial instructions for Step 3:
1. The visual scene MUST communicate the content, industry, and benefits even if all text is removed.
2. Structure the graphic appropriately for the category: "${category}". 
3. Adapt the visual composition to best fit the requested format, whether it's a social banner, a printable poster, or a hero image. Ensure the layout makes sense for its intended use case.
4. Use the selected brand logo/mark layout or placement description.
5. Respect the brand colors and visual identity if provided.
6. Do NOT generate generic office interiors, random workspaces, or generic business scenes (like office hallways, generic desks, or people shaking hands in a meeting room). Every visual element must support the content narrative.
7. Provide a premium, high-fidelity visual composition.

Strict output rule: Do not write conversational intro/outro text. Output only the structured steps.

Selected content category: "${category}".

${knowledgeBlock}`;

    if (isNvidia) {
      if (nvidiaSystemPrompts.imagePromptCreation) {
        let template = nvidiaSystemPrompts.imagePromptCreation;
        const inputContent = `Category: ${category}\nPrompt/Content: ${prompt}\nStyle: "${baseStyle}"\n${colors}\n${knowledgeBlock}`;
        template = template.replace(/\{\{CONTENT\}\}/g, inputContent);
        template = template.replace(/\{\{[^}]+\}\}/g, '');
        systemPrompt = template;
      }
    }

    const userMessage = `User Prompt/Content: ${prompt}
Brand Design Tokens & Rules: Style = "${baseStyle}"; ${colors}
Perform the 3-step Content Analysis (Extraction, Visual Strategy, Final Image Prompt) for this content.`;

    try {
      const apiKey = (businessId ? await this.llmSettingsService.getDecryptedApiKey(businessId) : undefined) ?? undefined;
      const { response } = await this.llm.complete(systemPrompt, userMessage, {
        provider: resolvedProvider as any,
        model: resolvedModel,
        temperature: 0.7,
        apiKey,
      });
      return response.content;
    } catch (err) {
      this.logger.error('Failed to enhance image prompt, using fallback format', err);
      return `[Step 1: Content Extraction]
- Headline: Marketing Poster
- Subheadline: Professional creative
- Benefits: High fidelity
- Features: Automatic enhancement
- CTA: Learn more
- Industry: Business
- Audience: Target clients

[Step 2: Visual Strategy]
Clean modern design showcase.

[Step 3: Final Image Prompt]
${prompt.substring(0, 500)}, in a high-fidelity ${baseStyle} style, tailored for ${category}`;
    }
  }
}
