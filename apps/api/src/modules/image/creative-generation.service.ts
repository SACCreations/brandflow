import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { LLMGateway } from '@brandflow/ai';

@Injectable()
export class CreativeGenerationService {
  private readonly logger = new Logger(CreativeGenerationService.name);
  private readonly ai: LLMGateway;

  constructor() {
    this.ai = new LLMGateway({ defaultProvider: 'openai' });
  }

  /**
   * Generates a brand-aligned image prompt and then calls the image generation model.
   */
  async generateCreative(businessId: string, brandId: string, userPrompt: string, format: string = 'square') {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId }
    });

    if (!brand) throw new Error('Brand not found');

    // 1. Enhance the prompt with Brand Visual Identity
    const enhancedPrompt = await this.enhancePrompt(userPrompt, brand.visualRules as any);
    
    this.logger.log(`Generated enhanced prompt: ${enhancedPrompt}`);

    // 2. In production, we'd call DALL-E 3 or Stable Diffusion here via ImageGateway
    // For now, we simulate the asset registration
    const mockImageKey = `assets/${businessId}/${brandId}/${Date.now()}.png`;
    
    const asset = await prisma.asset.create({
      data: {
        businessId,
        brandId: brand.id,
        type: 'image',
        fileName: `creative_${Date.now()}.png`,
        mimeType: 'image/png',
        s3Key: mockImageKey,
        metadata: {
          prompt: enhancedPrompt,
          originalPrompt: userPrompt,
          format,
          source: 'ai_generation'
        }
      }
    });

    return {
      assetId: asset.id,
      prompt: enhancedPrompt,
      previewUrl: `https://mock-image-gen.brandflow.ai/preview/${asset.id}`
    };
  }

  private async enhancePrompt(prompt: string, visualRules: any): Promise<string> {
    const rules = visualRules || {};
    const style = rules.style || 'modern, professional, high-fidelity';
    const colors = rules.colors ? `Use the following color palette: ${JSON.stringify(rules.colors)}.` : '';

    const systemPrompt = `You are a professional Creative Director. 
      Your goal is to expand a simple image prompt into a high-detail, artistic prompt for an AI image generator (like Midjourney or DALL-E 3).
      Always ensure the brand style and colors are respected.`;

    const userMessage = `Original Prompt: ${prompt}
      Brand Style: ${style}
      ${colors}
      
      Return only the expanded, high-detail prompt. Focus on lighting, texture, and brand-consistency.`;

    try {
      const { response } = await this.ai.complete(systemPrompt, userMessage, { temperature: 0.8 });
      return response.content;
    } catch (error) {
      this.logger.error('Failed to enhance creative prompt', error);
      return `${prompt} in a ${style} style.`;
    }
  }
}
