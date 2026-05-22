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
    const isMock =
      !this.openai.apiKey ||
      this.openai.apiKey.startsWith('sk-mock') ||
      this.openai.apiKey.includes('mock') ||
      this.openai.apiKey === 'undefined';

    if (isMock) {
      return new Array(1536).fill(0);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '),
        encoding_format: 'float',
      });

      return response.data?.[0]?.embedding || [];
    } catch (err) {
      console.warn('[VectorService] OpenAI embeddings API call failed, falling back to dummy vector.', err);
      return new Array(1536).fill(0);
    }
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
    brandId?: string,
  ): Promise<any[]> {
    const embedding = await this.generateEmbedding(query);
    const vectorString = `[${embedding.join(',')}]`;

    try {
      // Use pgvector's cosine distance operator <=>
      // We order by distance ascending (closest first)
      // similarity = 1 - distance
      const results = await prisma.$queryRawUnsafe(`
        SELECT 
          ke.id, 
          ke.content, 
          ke.metadata, 
          ke.classification,
          1 - (ke.embedding <=> '${vectorString}'::vector) as similarity
        FROM "knowledge_entries" ke
        ${brandId ? `JOIN "knowledge_sources" ks ON ke."sourceId" = ks.id` : ''}
        WHERE ke."businessId" = '${businessId}'
        ${brandId ? `AND ks."brandId" = '${brandId}'` : ''}
        ORDER BY ke.embedding <=> '${vectorString}'::vector
        LIMIT ${limit}
      `);

      return results as any[];
    } catch (err: any) {
      console.warn('[VectorService] pgvector query failed (possibly missing extension), falling back to basic scalar query.');
      
      try {
        const fallbackResults = await prisma.$queryRawUnsafe(`
          SELECT 
            ke.id, 
            ke.content, 
            ke.metadata, 
            ke.classification,
            ke.embedding
          FROM "knowledge_entries" ke
          ${brandId ? `JOIN "knowledge_sources" ks ON ke."sourceId" = ks.id` : ''}
          WHERE ke."businessId" = '${businessId}'
          ${brandId ? `AND ks."brandId" = '${brandId}'` : ''}
        `);
        
        const parsedResults = (fallbackResults as any[]).map((r) => {
          let emb: number[] = [];
          if (typeof r.embedding === 'string') {
            try { emb = JSON.parse(r.embedding); } catch {}
          } else if (Array.isArray(r.embedding)) {
            emb = r.embedding;
          }
          return {
            id: r.id,
            content: r.content,
            metadata: r.metadata,
            classification: r.classification,
            similarity: this.cosineSimilarity(embedding, emb)
          };
        });
        
        parsedResults.sort((a, b) => b.similarity - a.similarity);
        return parsedResults.slice(0, limit);
      } catch (innerErr) {
        console.error('[VectorService] Extreme fallback failed:', innerErr);
        return [];
      }
    }
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
