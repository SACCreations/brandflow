"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorService = void 0;
const openai_1 = require("openai");
class VectorService {
    openai;
    constructor(apiKey) {
        this.openai = new openai_1.OpenAI({
            apiKey: apiKey || process.env['OPENAI_API_KEY'],
        });
    }
    /**
     * Generates a 1536-dimensional embedding for the given text.
     * Requires a valid OpenAI API key.
     */
    async generateEmbedding(text, apiKey) {
        const client = apiKey ? new openai_1.OpenAI({ apiKey }) : this.openai;
        if (!client.apiKey || client.apiKey === 'undefined') {
            throw new Error('OpenAI API key is required for embedding generation. ' +
                'Please add your API key in Settings → AI Provider.');
        }
        const response = await client.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.replace(/\n/g, ' ').substring(0, 8000),
            encoding_format: 'float',
        });
        const embedding = response.data?.[0]?.embedding;
        if (!embedding || embedding.length === 0) {
            throw new Error('OpenAI returned empty embedding response');
        }
        return embedding;
    }
    /**
     * Helper to format a number array for storage.
     */
    formatForStorage(embedding) {
        return embedding;
    }
    /**
     * Performs a vector similarity search to find the most relevant context.
     * Uses parameterized queries to prevent SQL injection.
     */
    async findRelevantContext(prisma, businessId, query, limit = 5, brandId, apiKey) {
        const embedding = await this.generateEmbedding(query, apiKey);
        const vectorString = `[${embedding.join(',')}]`;
        try {
            // Use pgvector's cosine distance operator <=>
            // Parameterized query to prevent SQL injection
            if (brandId) {
                const results = await prisma.$queryRawUnsafe(`SELECT 
            ke.id, 
            ke.content, 
            ke.metadata, 
            ke.classification,
            ke."sourceId",
            1 - (ke.embedding <=> $1::vector) as similarity
          FROM "knowledge_entries" ke
          JOIN "knowledge_sources" ks ON ke."sourceId" = ks.id
          WHERE ke."businessId" = $2
          AND ks."brandId" = $3
          AND ke."isStale" = false
          ORDER BY ke.embedding <=> $1::vector
          LIMIT $4`, vectorString, businessId, brandId, limit);
                return results;
            }
            else {
                const results = await prisma.$queryRawUnsafe(`SELECT 
            ke.id, 
            ke.content, 
            ke.metadata, 
            ke.classification,
            ke."sourceId",
            1 - (ke.embedding <=> $1::vector) as similarity
          FROM "knowledge_entries" ke
          WHERE ke."businessId" = $2
          AND ke."isStale" = false
          ORDER BY ke.embedding <=> $1::vector
          LIMIT $3`, vectorString, businessId, limit);
                return results;
            }
        }
        catch (err) {
            // Fallback: if pgvector extension is not available, use application-level cosine similarity
            console.warn('[VectorService] pgvector query failed, using application-level similarity search.');
            try {
                const fallbackResults = brandId
                    ? await prisma.$queryRawUnsafe(`SELECT 
                ke.id, ke.content, ke.metadata, ke.classification, ke.embedding, ke."sourceId", ke."createdAt"
              FROM "knowledge_entries" ke
              JOIN "knowledge_sources" ks ON ke."sourceId" = ks.id
              WHERE ke."businessId" = $1 AND ks."brandId" = $2 AND ke."isStale" = false
              ORDER BY ke."createdAt" DESC
              LIMIT 50`, businessId, brandId)
                    : await prisma.$queryRawUnsafe(`SELECT 
                ke.id, ke.content, ke.metadata, ke.classification, ke.embedding, ke."sourceId", ke."createdAt"
              FROM "knowledge_entries" ke
              WHERE ke."businessId" = $1 AND ke."isStale" = false
              ORDER BY ke."createdAt" DESC
              LIMIT 50`, businessId);
                const parsedResults = fallbackResults.map((r) => {
                    let emb = [];
                    if (typeof r.embedding === 'string') {
                        try {
                            emb = JSON.parse(r.embedding);
                        }
                        catch { }
                    }
                    else if (Array.isArray(r.embedding)) {
                        emb = r.embedding;
                    }
                    return {
                        id: r.id,
                        content: r.content,
                        metadata: r.metadata,
                        classification: r.classification,
                        sourceId: r.sourceId,
                        similarity: this.cosineSimilarity(embedding, emb),
                    };
                });
                parsedResults.sort((a, b) => b.similarity - a.similarity);
                return parsedResults.slice(0, limit);
            }
            catch (innerErr) {
                console.error('[VectorService] Fallback query also failed:', innerErr);
                return [];
            }
        }
    }
    cosineSimilarity(v1, v2) {
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
        if (mag1 === 0 || mag2 === 0)
            return 0;
        return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
    }
}
exports.VectorService = VectorService;
//# sourceMappingURL=vector-service.js.map