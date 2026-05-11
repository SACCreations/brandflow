import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@brandflow/db';
import { LLMGateway } from '@brandflow/ai';
import { KnowledgeService } from '../knowledge/knowledge.service';

@Injectable()
export class BrandAnalyserService {
  private readonly gateway: LLMGateway;

  constructor(
    private readonly knowledgeService: KnowledgeService,
  ) {
    this.gateway = new LLMGateway({
      defaultProvider: 'openai',
      fallbackProvider: 'anthropic',
    });
  }

  async analyse(businessId: string, sourceIds: string[]) {
    // 1. Fetch knowledge entries for all provided sources
    const entries = await prisma.knowledgeEntry.findMany({
      where: { 
        sourceId: { in: sourceIds }, 
        businessId 
      },
      orderBy: { confidence: 'desc' },
      take: 40, // Increased to get more context from multiple sources
    });

    if (entries.length === 0) {
      throw new NotFoundException('No knowledge entries found for this source. Please wait for ingestion to complete.');
    }

    const contextText = entries.map(e => e.content).join('\n\n');

    // 2. Run analysis prompt
    const systemPrompt = `You are a Brand Strategy Expert. 
Your task is to analyze the provided text from a company's website or documents and extract their brand identity.

Extract the following in JSON format:
{
  "name": "Company Name",
  "positioning": "A concise core value proposition and positioning statement.",
  "audience": "The primary target audience and customer personas.",
  "tone": ["keyword1", "keyword2", ...],
  "governance": {
    "bannedPhrases": ["phrase1", ...],
    "requiredPhrases": ["phrase1", ...],
    "ctaPreferences": ["preference1", ...]
  }
}

Be accurate, professional, and insightful. If information is missing, use your best strategic judgement based on the context.`;

    const userPrompt = `Analyze the following brand context:\n\n${contextText}`;

    const { response } = await this.gateway.complete(systemPrompt, userPrompt, {
      temperature: 0.2, // Keep it factual
      maxTokens: 1000,
      jsonMode: true, // Assuming LLMGateway supports JSON mode or we parse it
    });

    try {
      const result = JSON.parse(response.content);
      return result;
    } catch (err) {
      throw new Error('Failed to parse brand analysis result');
    }
  }
}
