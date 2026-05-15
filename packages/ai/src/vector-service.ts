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
    
    // Without pgvector, we can't do efficient similarity in SQL easily.
    // For now, we'll pull the last 20 entries and do similarity in JS,
    // or just return the most recent entries as a placeholder.
    // REAL SOLUTION: Enable pgvector and use the <=> operator.
    
    const results = await prisma.knowledgeEntry.findMany({
      where: { businessId, embedding: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: limit * 4,
    });

    if (results.length === 0) return [];

    // Simple JS cosine similarity
    const scored = results.map((entry: any) => {
      const entryEmbedding = entry.embedding as number[];
      const score = this.cosineSimilarity(embedding, entryEmbedding);
      return { ...entry, similarity: score };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }
}
