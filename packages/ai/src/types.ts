import type { AIProvider, BrandContext, GenerationRequest, GenerationResponse, LLMConfig, QualityCheckResult } from '@brandflow/shared';

// ─── Provider Interface ───────────────────────────────────────────
export interface LLMProvider {
  readonly name: AIProvider;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
  isAvailable(): boolean;
}

// ─── Provider Request/Response ────────────────────────────────────
export interface ProviderRequest {
  systemPrompt: string;
  userPrompt: string | Array<{role: string, content: string}>;
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

// ─── Gateway Config ───────────────────────────────────────────────
export interface GatewayConfig {
  defaultProvider: AIProvider;
  fallbackProvider?: AIProvider;
  requestTimeoutMs?: number;
  maxRetries?: number;
  onBeforeComplete?: (options: LLMConfig) => Promise<void> | void;
}

// ─── Prompt Resolution ───────────────────────────────────────────
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

// ─── Rate Limit State ────────────────────────────────────────────
export interface TokenBudget {
  businessId: string;
  budgetTotal: number;
  budgetUsed: number;
  remaining: number;
  isExhausted: boolean;
}

// ─── Re-export shared types for convenience ───────────────────────
export type {
  GenerationRequest,
  GenerationResponse,
  QualityCheckResult,
  QualityViolation,
  KnowledgeCitation,
  BrandContext,
  CostEventPayload,
  LLMConfig,
} from '@brandflow/shared';

