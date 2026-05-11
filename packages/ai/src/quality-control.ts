import type { BrandContext, QualityCheckResult, QualityViolation } from './types';
import { LLMGateway } from './gateway';

export class QualityControl {
  constructor(private readonly gateway: LLMGateway) {}

  /**
   * Run brand compliance and basic fact-check on generated content.
   */
  async check(
    content: string,
    brand: BrandContext,
    knowledgeFacts: string[] = [],
  ): Promise<QualityCheckResult> {
    const violations: QualityViolation[] = [];

    // 1. Rule-based checks (fast, no LLM call needed)
    this.checkBannedPhrases(content, brand, violations);
    this.checkTone(content, brand, violations);

    // 2. LLM-based fact-check (if knowledge facts available)
    if (knowledgeFacts.length > 0) {
      const llmViolations = await this.llmFactCheck(content, brand, knowledgeFacts);
      violations.push(...llmViolations);
    }

    const highSeverityCount = violations.filter((v) => v.severity === 'high').length;
    const mediumSeverityCount = violations.filter((v) => v.severity === 'medium').length;

    const passed = highSeverityCount === 0 && mediumSeverityCount <= 1;
    const confidenceScore = Math.max(0, 1 - (highSeverityCount * 0.4 + mediumSeverityCount * 0.1));

    return { passed, confidenceScore, violations };
  }

  private checkBannedPhrases(
    content: string,
    brand: BrandContext,
    violations: QualityViolation[],
  ): void {
    const bannedPhrases = brand.governance?.bannedPhrases ?? [];
    const lowerContent = content.toLowerCase();

    for (const phrase of bannedPhrases) {
      const idx = lowerContent.indexOf(phrase.toLowerCase());
      if (idx !== -1) {
        violations.push({
          type: 'banned_phrase',
          severity: 'high',
          detail: `Contains banned phrase: "${phrase}"`,
          position: idx,
        });
      }
    }
  }

  private checkTone(
    content: string,
    brand: BrandContext,
    violations: QualityViolation[],
  ): void {
    const requiredTones = brand.tone ?? [];
    if (requiredTones.length === 0) return;

    // Simple heuristic: check for informal markers when brand expects professional tone
    if (requiredTones.includes('professional')) {
      const informalMarkers = /\b(gonna|wanna|gotta|kinda|sorta|ya|ur|lol|omg)\b/gi;
      if (informalMarkers.test(content)) {
        violations.push({
          type: 'tone_mismatch',
          severity: 'medium',
          detail: 'Content contains informal language inconsistent with professional brand tone',
        });
      }
    }
  }

  private async llmFactCheck(
    content: string,
    brand: BrandContext,
    facts: string[],
  ): Promise<QualityViolation[]> {
    const systemPrompt = `You are a fact-checking assistant for ${brand.name}.
Your job is to identify factual inaccuracies and potential hallucinations in marketing content.

Known facts about the brand:
${facts.slice(0, 5).map((f, i) => `${i + 1}. ${f}`).join('\n')}

Respond ONLY with valid JSON matching this schema:
{"violations": [{"type": "factual_error"|"hallucination", "severity": "low"|"medium"|"high", "detail": "string"}]}
If no violations found, respond: {"violations": []}`;

    const userPrompt = `Check this content for factual errors:\n\n${content}`;

    try {
      const { response } = await this.gateway.complete(systemPrompt, userPrompt, {
        maxTokens: 512,
        temperature: 0.1,
      });

      // Safely parse JSON response
      const parsed = JSON.parse(response.content) as { violations: QualityViolation[] };
      return parsed.violations ?? [];
    } catch {
      // Non-critical: if LLM fact-check fails, skip it
      return [];
    }
  }
}
