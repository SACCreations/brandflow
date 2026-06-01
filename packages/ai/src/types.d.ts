import type { AIProvider, BrandContext, LLMConfig } from '@brandflow/shared';
export interface LLMProvider {
    readonly name: AIProvider;
    complete(request: ProviderRequest): Promise<ProviderResponse>;
    isAvailable(): boolean;
}
export type MultimodalContent = string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
        url: string;
    };
}>;
export interface ProviderRequest {
    systemPrompt: string;
    userPrompt: string | Array<{
        role: string;
        content: MultimodalContent;
    }>;
    maxTokens?: number;
    temperature?: number;
    requestId: string;
    model?: string;
    jsonMode?: boolean;
}
export interface ProviderResponse {
    content: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
}
export interface GatewayConfig {
    defaultProvider: AIProvider;
    fallbackProvider?: AIProvider;
    requestTimeoutMs?: number;
    maxRetries?: number;
    onBeforeComplete?: (options: LLMConfig) => Promise<void> | void;
}
export interface ResolvedPrompt {
    promptId: string;
    template: string;
    layer: string;
    version: number;
}
export interface PromptContext {
    businessId?: string;
    brandId?: string;
    brand?: BrandContext;
    knowledgeEntries?: string[];
    campaignContext?: Record<string, string>;
    extra?: Record<string, string | string[]>;
}
export interface TokenBudget {
    businessId: string;
    budgetTotal: number;
    budgetUsed: number;
    remaining: number;
    isExhausted: boolean;
}
export type { GenerationRequest, GenerationResponse, QualityCheckResult, QualityViolation, KnowledgeCitation, BrandContext, CostEventPayload, LLMConfig, } from '@brandflow/shared';
//# sourceMappingURL=types.d.ts.map