import { OpenAI } from 'openai';

export class VectorService {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env['OPENAI_API_KEY'],
    });
  }

  /**
   * Generates a 1536-dimensional embedding for the given text.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' '),
      encoding_format: 'float',
    });

    return response.data?.[0]?.embedding || [];
  }

  /**
   * Helper to format a number array for Postgres vector input.
   * e.g. [0.1, 0.2] -> "[0.1, 0.2]"
   */
  formatForPostgres(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Performs a vector similarity search to find the most relevant context.
   * Note: This requires a Prisma instance to run raw SQL.
   */
  async findRelevantContext(
    prisma: any,
    businessId: string,
    query: string,
    limit: number = 5,
  ): Promise<string[]> {
    const embedding = await this.generateEmbedding(query);
    const vectorString = this.formatForPostgres(embedding);

    const results = await prisma.$queryRawUnsafe(
      `SELECT content, "sourceId", 1 - (embedding <=> $1::vector) as similarity
       FROM knowledge_entries
       WHERE "businessId" = $2 AND embedding IS NOT NULL
       ORDER BY similarity DESC
       LIMIT $3`,
      vectorString,
      businessId,
      limit,
    );

    return results as any[];
  }
}
