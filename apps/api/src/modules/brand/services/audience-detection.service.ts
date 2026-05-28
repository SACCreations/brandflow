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
    const systemPrompt = `You are a market research expert and senior brand strategist.
Analyze the following text and deeply infer the target audience for this brand. Provide rich, highly descriptive insights.
Do not use placeholder text. Be highly analytical.

Return a JSON object:
{
  "audience": {
    "primaryAudience": "string | Detailed description of the primary audience (demographics, psychographics, pain points)",
    "secondaryAudience": "string | null | Detailed description of the secondary audience",
    "marketLevel": "string | null (e.g. B2B, B2C, Enterprise, Mid-Market, SMB)",
    "brandTone": "string | null (e.g. authoritative, playful, clinical)",
    "customerMaturity": "string | null (e.g. early adopters, mainstream, late majority)"
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
          temperature: 0.3,
          maxTokens: 1500
        }
      );
      return JSON.parse(result.response.content);
    } catch (e: any) {
      this.logger.error('Audience detection failed: ' + e.message);
      return null;
    }
  }
}
