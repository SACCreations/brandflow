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
    this.logger.log('Inferring brand personality and competitor mapping');
    const systemPrompt = `You are a senior brand strategist and audience intelligence analyst.
Analyze the provided brand text and extract its personality, tone, inferred audience, and competitor style mapping.
Be highly descriptive, analytical, and provide in-depth details. Do not use generic placeholders.

Return a JSON object:
{
  "personality": "string | Detailed, in-depth description of the overall personality, voice, and core archetype (e.g. 'Highly formal, authoritative corporate entity blending trust with cutting-edge technology')",
  "tone": ["Trait1", "Trait2", "Trait3", "Trait4"],
  "audience": {
    "primaryAudience": "string | null | In-depth demographic and psychographic description",
    "secondaryAudience": "string | null | In-depth description",
    "marketLevel": "B2B | B2C | SMB | Enterprise | Startups | Industrial | Healthcare | Retail | null",
    "customerMaturity": "string | null"
  },
  "competitors": [
    {
      "name": "string | Name of visually or categorically similar competitor",
      "visualSimilarity": "string | Detailed reasoning (e.g., 'Shares similar geometric sans-serif typography and minimal layouts')",
      "positioningSimilarity": "string | Detailed reasoning",
      "categoryOverlap": "string | Detailed reasoning"
    }
  ]
}`;

    try {
      const result = await gateway.complete(
        systemPrompt,
        text.slice(0, 30000), // Ensure we pass a healthy chunk of text
        {
          provider: provider as any,
          apiKey,
          model,
          jsonMode: true,
          temperature: 0.3,
          maxTokens: 2500
        }
      );
      return JSON.parse(result.response.content);
    } catch (e: any) {
      this.logger.error('Personality engine failed: ' + e.message);
      return null;
    }
  }
}
