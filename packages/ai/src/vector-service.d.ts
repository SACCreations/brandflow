export declare class VectorService {
    private openai;
    constructor(apiKey?: string);
    /**
     * Generates a 1536-dimensional embedding for the given text.
     * Requires a valid OpenAI API key.
     */
    generateEmbedding(text: string, apiKey?: string): Promise<number[]>;
    /**
     * Helper to format a number array for storage.
     */
    formatForStorage(embedding: number[]): any;
    /**
     * Performs a vector similarity search to find the most relevant context.
     * Uses parameterized queries to prevent SQL injection.
     */
    findRelevantContext(prisma: any, businessId: string, query: string, limit?: number, brandId?: string, apiKey?: string): Promise<any[]>;
    private cosineSimilarity;
}
//# sourceMappingURL=vector-service.d.ts.map