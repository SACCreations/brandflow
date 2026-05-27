import { Injectable, Logger } from '@nestjs/common';
import { LLMGateway } from '@brandflow/ai';

@Injectable()
export class AudienceDetectionService {
  private readonly logger = new Logger(AudienceDetectionService.name);

  async inferAudience(
    gateway: LLMGateway,
    text: string,
    provider: string,
    apiKey?: string,
    model?: string
  ): Promise<any> {
    this.logger.log('Inferring audience');
    const systemPrompt = `You are a market research expert.
Analyze the following text and infer the target audience for this brand.
Return a JSON object:
{
  "audience": {
    "primaryAudience": "string | null",
    "secondaryAudience": "string | null",
    "marketLevel": "string | null",
    "brandTone": "string | null",
    "customerMaturity": "string | null"
  }
}`;

    try {
      const result = await gateway.complete(
        systemPrompt,
        text,
        {
          provider: provider as any,
          apiKey,
          model,
          jsonMode: true,
          temperature: 0.2,
          maxTokens: 500
        }
      );
      return JSON.parse(result.response.content);
    } catch (e: any) {
      this.logger.error('Audience detection failed: ' + e.message);
      return null;
    }
  }
}
