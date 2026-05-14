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
}
