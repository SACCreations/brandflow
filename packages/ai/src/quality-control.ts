import type { BrandContext, QualityCheckResult, QualityViolation, KnowledgeCitation } from './types';
import { LLMGateway } from './gateway';

export class QualityControl {
  constructor(private readonly gateway: LLMGateway) {}

  /**
   * Run comprehensive multi-layered quality control pipeline.
   */
  async check(
    content: string,
    brand: BrandContext,
    knowledgeFacts: { id: string; content: string }[] = [],
  ): Promise<QualityCheckResult> {
    const violations: QualityViolation[] = [];
    const citations: KnowledgeCitation[] = [];

    // Phase 1: Rule-based Compliance
    this.checkBannedPhrases(content, brand, violations);

    // Phase 2: AI-driven Evaluation Layers
    const [complianceResult, factCheckResult, safetyResult] = await Promise.all([
      this.evalCompliance(content, brand),
      this.evalFactuality(content, brand, knowledgeFacts),
      this.evalSafety(content),
    ]);

    violations.push(...complianceResult.violations);
    violations.push(...factCheckResult.violations);
    violations.push(...safetyResult.violations);
    citations.push(...factCheckResult.citations);

    // Phase 3: Scoring & Grading
    const complianceScore = complianceResult.score;
    const factualScore = factCheckResult.score;
    const safetyScore = safetyResult.score;

    // Weighted aggregation
    const confidenceScore = (complianceScore * 0.4) + (factualScore * 0.5) + (safetyScore * 0.1);
    const overallGrade = this.calculateGrade(confidenceScore, violations);
    const passed = overallGrade !== 'F' && !violations.some(v => v.severity === 'critical');

    return {
      passed,
      confidenceScore,
      overallGrade,
      complianceScore,
      factualScore,
      safetyScore,
      violations,
      citations,
    };
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
          detail: `Contains restricted brand phrase: "${phrase}"`,
          position: idx,
        });
      }
    }
  }

  private async evalCompliance(content: string, brand: BrandContext) {
    const toneDescription = Array.isArray(brand.tone) ? brand.tone.join(', ') : JSON.stringify(brand.tone);
    
    const systemPrompt = `You are a Senior Brand Auditor for "${brand.name}".
Evaluate the provided content for strict adherence to brand guidelines.

BRAND TONE: ${toneDescription}
BRAND POSITIONING: ${brand.positioning || 'N/A'}
REQUIRED DISCLOSURES: ${brand.governance?.requiredPhrases?.join(', ') || 'None'}

CRITERIA:
1. Tone Consistency: Does the voice match the brand dimensions exactly?
2. Positioning Alignment: Does it reflect the brand's core positioning?
3. Mandatory Compliance: Are all required disclosures present?

Respond in JSON format:
{
  "score": 0.0-1.0,
  "violations": [
    {
      "type": "tone_mismatch" | "compliance_risk" | "positioning_error",
      "severity": "low" | "medium" | "high",
      "detail": "Detailed explanation of the issue",
      "suggestion": "Specific instruction on how to fix it"
    }
  ]
}`;

    try {
      const { response } = await this.gateway.complete(systemPrompt, content, { temperature: 0.1 });
      const parsed = JSON.parse(response.content);
      return { score: parsed.score ?? 1.0, violations: parsed.violations ?? [] };
    } catch (err: any) {
      console.error(`Compliance evaluation failed: ${err.message}`);
      return { score: 1.0, violations: [] };
    }
  }

  private async evalFactuality(
    content: string,
    brand: BrandContext,
    facts: { id: string; content: string }[],
  ) {
    if (facts.length === 0) return { score: 1.0, violations: [], citations: [] };

    const systemPrompt = `You are an expert Fact-Checker. Cross-reference the content against the following Brand Knowledge Base:

KNOWLEDGE BASE:
${facts.map((f) => `[Fact ID: ${f.id}] ${f.content}`).join('\n')}

INSTRUCTIONS:
1. Identify all factual claims in the content.
2. For each claim, check if it is supported, contradicted, or not mentioned in the Knowledge Base.
3. Mark any claims not supported as "hallucinations".
4. Provide citations for supported claims.

Respond in JSON format:
{
  "score": 0.0-1.0,
  "violations": [
    {
      "type": "hallucination" | "factual_error",
      "severity": "high" | "medium",
      "detail": "Explanation of the error",
      "suggestion": "The correct fact from the source"
    }
  ],
  "citations": [
    {
      "entryId": "Fact ID string",
      "claimSnippet": "The text from the content being cited",
      "matchScore": 0.0-1.0
    }
  ]
}`;

    try {
      const { response } = await this.gateway.complete(systemPrompt, content, { temperature: 0 });
      const parsed = JSON.parse(response.content);
      return { 
        score: parsed.score ?? 1.0, 
        violations: parsed.violations ?? [], 
        citations: parsed.citations ?? [] 
      };
    } catch (err: any) {
      console.error(`Factuality evaluation failed: ${err.message}`);
      return { score: 1.0, violations: [], citations: [] };
    }
  }

  private async evalSafety(content: string) {
    const systemPrompt = `Analyze content for safety: hate speech, harassment, NSFW, or extreme bias.
Respond in JSON: {"score": 0.0-1.0, "violations": [{"type": "unsafe_content", "severity": "critical", "detail": "string"}]}`;

    try {
      const { response } = await this.gateway.complete(systemPrompt, content, { temperature: 0 });
      const parsed = JSON.parse(response.content);
      return { score: parsed.score ?? 1.0, violations: parsed.violations ?? [] };
    } catch {
      return { score: 1.0, violations: [] };
    }
  }

  private calculateGrade(score: number, violations: QualityViolation[]): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (violations.some(v => v.severity === 'critical')) return 'F';
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.6) return 'C';
    if (score >= 0.4) return 'D';
    return 'F';
  }
}

