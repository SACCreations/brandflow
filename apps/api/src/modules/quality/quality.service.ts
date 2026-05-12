import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { QualityControl, LLMGateway } from '@brandflow/ai';
import type { QualityCheckResult, BrandContext } from '@brandflow/shared';

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);
  private readonly qc: QualityControl;

  constructor() {
    // In production, the gateway should be injected or configured per business
    const gateway = new LLMGateway({ defaultProvider: 'openai' });
    this.qc = new QualityControl(gateway);
  }

  /**
   * Performs a comprehensive quality check on generated content.
   * Cross-references against brand rules and the Knowledge Hub.
   */
  async runCheck(
    contentId: string,
    body: string,
    businessId: string,
    brandId: string,
  ): Promise<QualityCheckResult> {
    this.logger.log(`Starting Quality Check for Content ${contentId}`);

    // 1. Fetch Brand Context
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        name: true,
        tone: true,
        positioning: true,
        audience: true,
        governance: true,
      },
    });

    if (!brand) throw new Error('Brand not found for quality check');

    // 2. Fetch Relevant Knowledge Facts (RAG-lite for fact-checking)
    // In a real production app, we would use vector search here.
    // For this implementation, we fetch the most recent/relevant atoms.
    const entries = await prisma.knowledgeEntry.findMany({
      where: { businessId, source: { brandId } },
      take: 10,
      orderBy: { confidence: 'desc' },
      select: { content: true },
    });

    const facts = entries.map((e) => e.content);

    // 3. Run Validation Pipeline
    const brandContext: BrandContext = {
      name: brand.name,
      tone: brand.tone as string[],
      positioning: brand.positioning,
      audience: brand.audience,
      governance: brand.governance as any,
    };

    const result = await this.qc.check(body, brandContext, facts);

    // 4. Persist Results
    await prisma.qualityCheck.create({
      data: {
        businessId,
        contentId,
        passed: result.passed,
        confidenceScore: result.confidenceScore,
        violations: result.violations as any,
        category: this.determinePrimaryCategory(result.violations),
        remediation: this.generateRemediationHint(result.violations),
      },
    });

    // 5. Update content quality score
    await prisma.content.update({
      where: { id: contentId },
      data: { qualityScore: result.confidenceScore },
    });

    return result;
  }

  private determinePrimaryCategory(violations: any[]): string {
    if (violations.length === 0) return 'none';
    const counts: Record<string, number> = {};
    violations.forEach((v) => {
      counts[v.type] = (counts[v.type] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  private generateRemediationHint(violations: any[]): string {
    if (violations.length === 0) return 'Content passed all checks.';
    return violations
      .map((v) => `[${v.severity.toUpperCase()}] ${v.detail}`)
      .join('\n');
  }
}
