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
   * Helper to format a number array for storage.
   */
  formatForStorage(embedding: number[]): any {
    return embedding;
  }

  /**
   * Performs a vector similarity search to find the most relevant context.
   * Fallback for when pgvector is not available.
   */
  async findRelevantContext(
    prisma: any,
    businessId: string,
    query: string,
    limit: number = 5,
  ): Promise<any[]> {
    const embedding = await this.generateEmbedding(query);
    const vectorString = `[${embedding.join(',')}]`;

    // Use pgvector's cosine distance operator <=>
    // We order by distance ascending (closest first)
    // similarity = 1 - distance
    const results = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        content, 
        metadata, 
        classification,
        1 - (embedding <=> '${vectorString}'::vector) as similarity
      FROM "knowledge_entries"
      WHERE "businessId" = '${businessId}'
      ORDER BY embedding <=> '${vectorString}'::vector
      LIMIT ${limit}
    `);

    return results as any[];
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    const len = Math.min(v1.length, v2.length);
    for (let i = 0; i < len; i++) {
      const val1 = v1[i] ?? 0;
      const val2 = v2[i] ?? 0;
      dotProduct += val1 * val2;
      mag1 += val1 * val1;
      mag2 += val2 * val2;
    }
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }
}
