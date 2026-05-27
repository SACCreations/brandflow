import { Injectable, Logger } from '@nestjs/common';
import { LLMGateway } from '@brandflow/ai';
import { ScreenshotResult } from './screenshot.service';

@Injectable()
export class VisionAnalysisService {
  private readonly logger = new Logger(VisionAnalysisService.name);

  async analyzeVisuals(
    gateway: LLMGateway,
    screenshots: ScreenshotResult,
    imageUrls: string[],
    provider: string,
    apiKey?: string,
    model?: string
  ): Promise<any> {
    this.logger.log('Analyzing visual DNA with Vision AI');
    
    const content: any[] = [
      { type: 'text', text: 'Analyze these screenshots and images of a brand. Extract the Visual DNA, UI language, mood, and brand maturity. Categorize the images into heroImages, productVisuals, and uiScreenshots.' }
    ];
    
    if (screenshots.homepageBase64) {
      content.push({ type: 'text', text: 'Homepage Desktop:' });
      content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${screenshots.homepageBase64}` } });
    }
    
    if (screenshots.mobileBase64) {
      content.push({ type: 'text', text: 'Homepage Mobile:' });
      content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${screenshots.mobileBase64}` } });
    }

    if (screenshots.subpagesBase64 && screenshots.subpagesBase64.length > 0) {
      screenshots.subpagesBase64.forEach((base64, index) => {
        content.push({ type: 'text', text: `Subpage ${index + 1}:` });
        content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } });
      });
    }

    for (const url of imageUrls.slice(0, 5)) {
      content.push({ type: 'text', text: `Image candidate: ${url}` });
      content.push({ type: 'image_url', image_url: { url } });
    }

    const systemPrompt = `You are an expert brand identity designer. 
Analyze the provided visual assets. 
Return a JSON object with:
{
  "brandDNA": {
    "style": "string | null",
    "mood": "string | null",
    "colorPsychology": "string | null",
    "composition": "string | null",
    "illustrationType": "string | null",
    "photographyStyle": "string | null",
    "textureUsage": "string | null",
    "uiLanguage": "string | null",
    "shapeLanguage": "string | null",
    "motionStyle": "string | null",
    "brandMaturity": "string | null",
    "dnaMoodboardDescriptors": ["string array of rich descriptive visual keywords like 'Minimalist glassmorphism on deep slate' or 'Cyberpunk neon accents'"]
  },
  "visualExtraction": {
    "heroImages": ["urls"],
    "productVisuals": ["urls"],
    "uiScreenshots": ["urls"],
    "marketingImages": ["urls"],
    "designConsistencyScore": 8.5
  },
  "logoVariants": {
    "primary": ["urls of primary full logos"],
    "secondary": ["urls of secondary or alternate logos"],
    "symbol": ["urls of icon marks or logomarks"],
    "favicon": ["urls of tiny app icons or favicons"]
  }
}`;

    try {
      const result = await gateway.complete(
        systemPrompt,
        [{ role: 'user', content }] as any,
        {
          provider: provider as any,
          apiKey,
          model,
          temperature: 0.2,
          maxTokens: 1500,
          jsonMode: true
        }
      );
      return JSON.parse(result.response.content);
    } catch (e: any) {
      this.logger.error('Vision analysis failed with primary provider: ' + e.message + '. Attempting fallback to OpenAI.');
      try {
        // Fallback to OpenAI gpt-4o which is multimodal, in case the user's selected provider (e.g. nvidia text model) doesn't support images
        const fallbackResult = await gateway.complete(
          systemPrompt,
          [{ role: 'user', content }] as any,
          {
            provider: 'openai',
            model: 'gpt-4o', // known multimodal model
            temperature: 0.2,
            maxTokens: 1500,
            jsonMode: true
          }
        );
        return JSON.parse(fallbackResult.response.content);
      } catch (fallbackErr: any) {
        this.logger.error('Vision analysis fallback also failed: ' + fallbackErr.message);
        return null;
      }
    }
  }
}
