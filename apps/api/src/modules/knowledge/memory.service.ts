import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { LLMGateway } from '@brandflow/ai';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly ai: LLMGateway;

  constructor() {
    this.ai = new LLMGateway({ defaultProvider: 'openai' });
  }

  /**
   * Distills the "Core Brand Identity" from all known facts for a business/brand.
   * This serves as the 'Long-term Memory' summary.
   */
  async distillIdentity(businessId: string, brandId?: string) {
    this.logger.log(`Distilling Brand Memory for business: ${businessId}`);

    // Fetch top 100 most confident and fresh facts
    const facts = await prisma.knowledgeEntry.findMany({
      where: { 
        businessId,
        confidence: { gte: 0.7 },
        isStale: false,
      },
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100,
    });

    if (facts.length === 0) {
      return "No brand knowledge atoms found to distill.";
    }

    const factText = facts.map(f => `- [${f.classification}] ${f.content}`).join('\n');

    const prompt = `
      You are a Strategic Brand Architect. Below is a collection of "Identity Atoms" (atomic facts) extracted for a brand.
      Your task is to distill these facts into a cohesive "Brand Memory Summary".
      
      Structure your response as follows:
      1. **Core Essence**: The high-level value proposition.
      2. **Strategic Pillar**: Key themes found across multiple facts.
      3. **Voice & Personality**: Inferred personality of the brand.
      4. **Competitive Edge**: What makes them unique based on these claims.
      5. **Memory Conflicts**: Identify any atoms that contradict each other or seem outdated.

      Identity Atoms:
      ${factText}
    `;

    try {
      const { response } = await this.ai.complete(
        "You synthesize brand knowledge into strategic summaries. Be concise but deep.",
        prompt,
        { model: 'gpt-4o' }
      );

      return response.content;
    } catch (err) {
      this.logger.error(`Memory distillation failed: ${err}`);
      throw err;
    }
  }

  /**
   * Identifies conflicting knowledge entries.
   */
  async findConflicts(businessId: string) {
    // This would ideally use a vector search to find similar contents with different claims
    // For now, it's a placeholder for the advanced memory resolution logic
    this.logger.debug(`Conflict detection triggered for ${businessId}`);
    return [];
  }
}
