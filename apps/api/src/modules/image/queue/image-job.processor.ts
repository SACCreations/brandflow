import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUES } from '@brandflow/shared';
import { LLMGateway, ImageGateway, VectorService } from '@brandflow/ai';
import { PrismaService } from '../../../common/database/prisma.service';

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

@Processor(QUEUES.IMAGE_GENERATION)
export class ImageJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageJobProcessor.name);
  private readonly llm: LLMGateway;
  private readonly imageGateway: ImageGateway;
  private readonly vectorService: VectorService;

  constructor(private readonly prismaService: PrismaService) {
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

    try {
      const brand = await this.prismaService.client.brand.findUnique({
        where: { id: brandId },
      });
      if (!brand) throw new Error('Brand not found');

      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data: { progress: 30 },
      });

      const enhancedPrompt = await this.enhancePrompt(rawPrompt, brand.visualRules, category, settings.style, businessId);
      
      await this.prismaService.client.imageGenerationJob.update({
        where: { id: jobId },
        data: { 
          finalPrompt: enhancedPrompt,
          progress: 50
        },
      });

      const imageResponse = await this.imageGateway.generate(settings.provider, {
        prompt: enhancedPrompt,
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
          promptUsed: enhancedPrompt,
          metadata: {
            costCents: costCentsUsed,
            provider: providerUsed,
            model: modelUsed,
            seed: generatedImageNode.seed,
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

      throw err;
    }
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
    const colors = rules.colors ? `Respect brand visual palette: ${JSON.stringify(rules.colors)}.` : '';

    let knowledgeBlock = '';
    if (businessId) {
      try {
        const relevantFacts = await this.vectorService.findRelevantContext(
          this.prismaService.client,
          businessId,
          category || prompt,
          5
        );
        if (relevantFacts && relevantFacts.length > 0) {
          knowledgeBlock = `Brand Context Insights:\n${relevantFacts.map((f: any) => `- ${f.content}`).join('\n')}`;
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch vector context for image generation: ${err}`);
      }
    }

    const systemPrompt = `You are a high-fidelity Creative Automation Prompt Architect.
Expand the user prompt into a rich, detailed, concrete description for an AI image generator (Stable Diffusion XL / DALL-E 3).
Inject concrete styling cues aligned with the selected content category: "${category}".

${knowledgeBlock}`;

    const userMessage = `User Prompt: ${prompt}
Brand Design Tokens & Rules: Style = "${baseStyle}"; ${colors}
Output only the finished enhanced prompt string. No chat, no intros. Focus on layout, lighting detail, texture depth, and brand consistency.`;

    try {
      const { response } = await this.llm.complete(systemPrompt, userMessage, {
        model: 'gpt-4o-mini',
        temperature: 0.7,
      });
      return response.content;
    } catch (err) {
      this.logger.error('Failed to enhance image prompt, using fallback format', err);
      return `${prompt}, in a high-fidelity ${baseStyle} style, tailored for ${category}`;
    }
  }
}
