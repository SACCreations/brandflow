import { Injectable, Logger } from '@nestjs/common';
import { LLMGateway } from '@brandflow/ai';

@Injectable()
export class PersonalityEngineService {
  private readonly logger = new Logger(PersonalityEngineService.name);

  async inferPersonality(
    gateway: LLMGateway,
    text: string,
    provider: string,
    apiKey?: string,
    model?: string
  ): Promise<any> {
    this.logger.log('Inferring brand personality');
    const systemPrompt = `You are a brand strategist.
Analyze the brand's text and extract its personality.
Return JSON:
{
  "personality": "string | null",
  "tone": ["Trait1", "Trait2"]
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
          maxTokens: 300
        }
      );
      return JSON.parse(result.response.content);
    } catch (e: any) {
      this.logger.error('Personality engine failed: ' + e.message);
      return null;
    }
  }
}
