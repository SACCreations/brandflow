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

    if (screenshots.pricingBase64) {
      content.push({ type: 'text', text: 'Pricing Page:' });
      content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${screenshots.pricingBase64}` } });
    }

    if (screenshots.aboutBase64) {
      content.push({ type: 'text', text: 'About Page:' });
      content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${screenshots.aboutBase64}` } });
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
    "brandMaturity": "string | null"
  },
  "visualExtraction": {
    "heroImages": ["urls"],
    "productVisuals": ["urls"],
    "uiScreenshots": ["urls"],
    "designConsistencyScore": 8.5
  }
}`;

    try {
      const result = await gateway.complete(
        systemPrompt,
        [{ role: 'user', content }] as any,
        {
          provider: provider as any,
          apiKey,
          model: model || 'gpt-4o', // prefer vision model
          jsonMode: true,
          temperature: 0.1,
          maxTokens: 1500
        }
      );
      
      const parsed = JSON.parse(result.response.content);
      return parsed;
    } catch (e: any) {
      this.logger.error(`Vision analysis failed: ${e.message}`);
      return null;
    }
  }
}
