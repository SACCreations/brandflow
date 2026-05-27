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

Return a JSON object:
{
  "personality": "string description of overall personality (e.g. 'Formal and Corporate' or 'Youthful and Experimental')",
  "tone": ["Trait1", "Trait2", "Trait3", "Trait4"],
  "audience": {
    "primaryAudience": "string | null",
    "secondaryAudience": "string | null",
    "marketLevel": "B2B | B2C | SMB | Enterprise | Startups | Industrial | Healthcare | Retail | null",
    "customerMaturity": "string | null"
  },
  "competitors": [
    {
      "name": "string name of visually or categorically similar competitor",
      "visualSimilarity": "string reasoning (e.g., 'Shares similar geometric sans-serif typography and minimal layouts')",
      "positioningSimilarity": "string reasoning",
      "categoryOverlap": "string reasoning"
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
          temperature: 0.2,
          maxTokens: 1000
        }
      );
      return JSON.parse(result.response.content);
    } catch (e: any) {
      this.logger.error('Personality engine failed: ' + e.message);
      return null;
    }
  }
}
