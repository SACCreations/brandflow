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
    const systemPrompt = `You are a Brand Compliance Auditor for ${brand.name}.
Your task is to evaluate if the content matches the brand tone: ${brand.tone?.join(', ') || 'N/A'}.
Also check for mandatory disclosures or required phrases: ${brand.governance?.requiredPhrases?.join(', ') || 'None'}.

Respond in JSON:
{"score": 0.0-1.0, "violations": [{"type": "tone_mismatch"|"compliance_risk", "severity": "low"|"medium"|"high", "detail": "string", "suggestion": "string"}]}`;

    try {
      const { response } = await this.gateway.complete(systemPrompt, content, { temperature: 0.1 });
      const parsed = JSON.parse(response.content);
      return { score: parsed.score ?? 1.0, violations: parsed.violations ?? [] };
    } catch {
      return { score: 1.0, violations: [] };
    }
  }

  private async evalFactuality(
    content: string,
    brand: BrandContext,
    facts: { id: string; content: string }[],
  ) {
    if (facts.length === 0) return { score: 1.0, violations: [], citations: [] };

    const systemPrompt = `You are a Fact-Checking Agent. Cross-reference the content against these brand facts:
${facts.map((f, i) => `[ID:${f.id}] ${f.content}`).join('\n')}

Identify hallucinations or errors. Map claims to source IDs for citations.
Respond in JSON:
{"score": 0.0-1.0, "violations": [...], "citations": [{"entryId": "string", "claimSnippet": "string", "matchScore": 0.0-1.0}]}`;

    try {
      const { response } = await this.gateway.complete(systemPrompt, content, { temperature: 0 });
      const parsed = JSON.parse(response.content);
      return { 
        score: parsed.score ?? 1.0, 
        violations: parsed.violations ?? [], 
        citations: parsed.citations ?? [] 
      };
    } catch {
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

