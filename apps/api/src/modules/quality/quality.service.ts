import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { QualityControl, LLMGateway, VectorService } from '@brandflow/ai';
import type { QualityCheckResult, BrandContext } from '@brandflow/shared';
import { LlmSettingsService } from '../llm-settings/llm-settings.service';

type QualityViolationLike = QualityCheckResult['violations'][number] & {
  suggestion?: string;
  location?: unknown;
};

type KnowledgeCitationLike = {
  entryId: string;
  claimSnippet: string;
  matchScore: number;
};

type QualityCheckResultLike = QualityCheckResult & {
  overallGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
  complianceScore?: number;
  factualScore?: number;
  safetyScore?: number;
  citations?: KnowledgeCitationLike[];
  violations: QualityViolationLike[];
};

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);
  private readonly qc: QualityControl;
  private readonly vector: VectorService;

  constructor(private readonly llmSettingsService: LlmSettingsService) {
    const gateway = new LLMGateway({ defaultProvider: 'openai' });
    this.qc = new QualityControl(gateway);
    this.vector = new VectorService();
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
    this.logger.log(`Starting Enterprise Quality Check for Content ${contentId}`);

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

    // 2. Fetch Relevant Knowledge Facts via Semantic Search
    const apiKey = await this.llmSettingsService.getDecryptedApiKey(businessId) ?? undefined;
    const relevantEntries = await this.vector.findRelevantContext(
      prisma,
      businessId,
      body,
      10, // Take top 10 relevant facts
      undefined,
      apiKey,
    );

    const facts = relevantEntries.map((e) => ({ id: e.id, content: e.content }));

    // 3. Run Validation Pipeline
    const brandContext: BrandContext = {
      name: brand.name,
      tone: brand.tone as string[],
      positioning: brand.positioning,
      audience: brand.audience,
      governance: brand.governance as any,
    };

    const result = await this.qc.check(body, brandContext, facts as any, { apiKey }) as QualityCheckResultLike;
    const overallGrade = result.overallGrade ?? 'C';
    const violations = result.violations as QualityViolationLike[];
    const citations: KnowledgeCitationLike[] = result.citations ?? [];


    // 4. Persist Results (Atomic Transaction)
    await prisma.$transaction(async (tx) => {
      const qcRecord = await tx.qualityCheck.create({
        data: {
          businessId,
          contentId,
          passed: result.passed,
          confidenceScore: result.confidenceScore,
          overallGrade,
          complianceScore: result.complianceScore,
          factualScore: result.factualScore,
          safetyScore: result.safetyScore,
          metadata: { engine: 'brandflow-qc-v2', timestamp: new Date() } as any,
        },
      });


      // Create violations
      if (violations.length > 0) {
        await tx.qualityViolation.createMany({
          data: violations.map((v) => ({
            qualityCheckId: qcRecord.id,
            type: v.type,
            severity: v.severity,
            detail: v.detail,
            suggestion: v.suggestion,
            location: v.location as any,
          })),
        });
      }

      // Create citations
      if (citations.length > 0) {
        await tx.knowledgeCitation.createMany({
          data: citations.map((c) => ({
            qualityCheckId: qcRecord.id,
            entryId: c.entryId,
            claimSnippet: c.claimSnippet,
            matchScore: c.matchScore,
          })),
        });
      }

      // 5. Human Review Routing Logic (Enterprise Grade)
      const needsReview = 
        !result.passed || 
        overallGrade === 'C' || 
        overallGrade === 'D' || 
        (result.factualScore ?? 0) < 0.8 || 
        (result.complianceScore ?? 0) < 0.8 ||
        (result.safetyScore ?? 0) < 0.95;

      if (needsReview) {
        const priority = 
          overallGrade === 'F' || (result.safetyScore ?? 0) < 0.9 ? 'critical' : 
          overallGrade === 'D' || (result.factualScore ?? 0) < 0.6 ? 'high' : 'medium';

        let reason = `Automated QC Grade: ${overallGrade}.`;
        if ((result.factualScore ?? 0) < 0.8) reason += ' Potential hallucination detected.';
        if ((result.complianceScore ?? 0) < 0.8) reason += ' Brand compliance risk.';
        if ((result.safetyScore ?? 0) < 0.95) reason += ' Content safety warning.';

        await tx.reviewTask.create({
          data: {
            businessId,
            contentId,
            qualityCheckId: qcRecord.id,
            status: 'pending',
            priority,
            reason,
          },
        });

        // 5b. Auto-route to approval queue if grade < B
        const gradesBelowB = ['C', 'D', 'F'];
        if (gradesBelowB.includes(overallGrade)) {
          // Check no existing pending approval
          const existingApproval = await tx.approval.findFirst({
            where: { contentId, status: 'pending' },
          });

          if (!existingApproval) {
            await tx.approval.create({
              data: {
                businessId,
                contentId,
                reviewType: 'internal',
                status: 'pending',
                routeReason: `Auto-routed: quality grade ${overallGrade}`,
                slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
              } as any,
            });

            await tx.content.update({
              where: { id: contentId },
              data: { status: 'in_review' },
            });

            this.logger.log(
              `Auto-routed content ${contentId} to approval queue (grade: ${overallGrade})`,
            );
          }
        }
      }

      // 6. Update content quality score
      await tx.content.update({
        where: { id: contentId },
        data: { qualityScore: result.confidenceScore },
      });
    });

    return result;
  }
}

