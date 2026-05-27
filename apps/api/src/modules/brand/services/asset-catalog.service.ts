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
    this.logger.log('Building asset catalog');
    const systemPrompt = `You are an asset librarian. Categorize these image URLs into a catalog.
Return JSON:
{
  "assetCatalog": {
    "images": [
      {
        "url": "url",
        "assetType": "logo | hero-image | icon | illustration | product-shot | team-photo | generic",
        "usage": "string"
      }
    ]
  }
}`;

    try {
      const result = await gateway.complete(
        systemPrompt,
        `Image URLs:\n${imageUrls.join('\n')}`,
        {
          provider: provider as any,
          apiKey,
          model,
          jsonMode: true,
          temperature: 0.1,
          maxTokens: 800
        }
      );
      return JSON.parse(result.response.content);
    } catch (e: any) {
      this.logger.error('Asset catalog failed: ' + e.message);
      return null;
    }
  }
}
