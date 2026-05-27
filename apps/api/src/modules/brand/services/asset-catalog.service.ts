import { Injectable, Logger } from '@nestjs/common';
import { LLMGateway } from '@brandflow/ai';

@Injectable()
export class AssetCatalogService {
  private readonly logger = new Logger(AssetCatalogService.name);

  async buildCatalog(
    gateway: LLMGateway,
    imageUrls: string[],
    provider: string,
    apiKey?: string,
    model?: string
  ): Promise<any> {
    if (!imageUrls || imageUrls.length === 0) return null;
    this.logger.log(`Building advanced asset catalog from ${imageUrls.length} images`);
    
    // We pass the raw urls and ask the LLM to categorize them into our strict taxonomy
    const systemPrompt = `You are a digital asset librarian and brand identity manager.
Given this list of discovered image URLs from a brand's website, categorize them logically into a persistent Asset Catalog structure.

Return a JSON object:
{
  "assetCatalog": {
    "logos": {
      "primary": ["urls"],
      "secondary": ["urls"],
      "symbol": ["urls"],
      "favicon": ["urls"]
    },
    "brandImages": {
      "hero": ["urls"],
      "product": ["urls"],
      "team": ["urls"],
      "ui": ["urls"],
      "marketing": ["urls"]
    },
    "illustrations": ["urls"],
    "motion": ["urls of gifs or videos"]
  }
}`;

    try {
      const result = await gateway.complete(
        systemPrompt,
        `Discovered Image URLs:\n${imageUrls.join('\n')}`,
        {
          provider: provider as any,
          apiKey,
          model,
          jsonMode: true,
          temperature: 0.1,
          maxTokens: 4000
        }
      );
      return JSON.parse(result.response.content);
    } catch (e: any) {
      this.logger.error('Asset catalog generation failed: ' + e.message);
      return null;
    }
  }
}
