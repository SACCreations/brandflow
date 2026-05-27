import { Injectable, Logger } from '@nestjs/common';
import { LLMGateway } from '@brandflow/ai';

@Injectable()
export class FontDetectionService {
  private readonly logger = new Logger(FontDetectionService.name);

  async detectFonts(
    gateway: LLMGateway,
    html: string,
    provider: string,
    apiKey?: string,
    model?: string
  ): Promise<any> {
    this.logger.log('Detecting typography intelligence');
    
    // Extract base font candidates to save tokens
    const fontFaces = [...html.matchAll(/@font-face\s*{([^}]+)}/gi)];
    const detectedFontFamilies = [];
    
    for (const match of fontFaces) {
      const familyMatch = match[1]?.match(/font-family:\s*["']?([^"';]+)["']?/i);
      if (familyMatch && familyMatch[1]) {
        detectedFontFamilies.push(familyMatch[1].trim());
      }
    }
    
    const googleFonts = [...html.matchAll(/fonts\.googleapis\.com\/css2\?family=([^&:]+)/gi)];
    for (const match of googleFonts) {
      if (match[1]) {
        detectedFontFamilies.push(match[1].replace(/\+/g, ' ').split(':')[0]);
      }
    }

    const inlineFonts = [...html.matchAll(/font-family:\s*([^;"'}]+)/gi)]
      .map(match => (match[1] || '').replace(/["']/g, '').trim().split(',')[0])
      .filter(Boolean);

    const candidates = Array.from(new Set([...detectedFontFamilies, ...inlineFonts])).slice(0, 15);

    if (candidates.length === 0) return null;

    const systemPrompt = `You are a typography expert analyzing a brand's font usage.
Given these detected font families extracted from the website's code, classify them into their proper typographic roles and infer their style.

Return a JSON object:
{
  "typographySystem": {
    "headingFont": "string | null",
    "bodyFont": "string | null",
    "supportingFont": "string | null",
    "pairings": ["string array"],
    "hierarchy": "string | null",
    "personality": "string description of the typographic mood (e.g., 'Modern Geometric Sans with high legibility' or 'Elegant Serif')",
    "recommendations": ["string array of improvements"]
  },
  "fonts": [
    {
      "url": "string url to google fonts or leaving empty",
      "family": "string name",
      "weight": "string inferred weight usage",
      "classification": "Sans Serif | Geometric Sans | Humanist Sans | Serif | Display | Mono | Handwritten"
    }
  ]
}`;

    try {
      const result = await gateway.complete(
        systemPrompt,
        `Detected Font Candidates: ${candidates.join(', ')}`,
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
      this.logger.error('Font detection failed: ' + e.message);
      return { extractedFonts: candidates };
    }
  }
}
