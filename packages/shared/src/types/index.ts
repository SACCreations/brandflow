import type { AIProvider } from '../constants';

// ─── JWT Payload ──────────────────────────────────────────────────
export interface JwtPayload {
  sub: string; // userId
  businessId: string;
  email: string;
  roleId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string; // userId
  sessionId: string;
  iat?: number;
  exp?: number;
}

// ─── Auth Response ────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    mfaEnabled: boolean;
  };
  business: {
    id: string;
    name: string;
    slug: string;
  };
}

// ─── Paginated Response ───────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ─── API Error ────────────────────────────────────────────────────
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// ─── Quality Check Result ─────────────────────────────────────────
export interface QualityViolation {
  type: 'banned_phrase' | 'tone_mismatch' | 'factual_error' | 'hallucination' | 'cta_missing';
  severity: 'low' | 'medium' | 'high';
  detail: string;
  position?: number;
}

export interface QualityCheckResult {
  passed: boolean;
  confidenceScore: number;
  violations: QualityViolation[];
}

// ─── AI Providers (handled in constants) ──────────────────────────

export interface LLMConfig {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  jsonMode?: boolean;
}

// ─── AI Generation Request ────────────────────────────────────────
export interface GenerationRequest {
  module: string;
  businessId: string;
  brandId?: string;
  promptId?: string;
  variables: Record<string, string | string[]>;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResponse {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  requestId: string;
  qualityCheck?: QualityCheckResult;
}

// ─── Cost Tracking ────────────────────────────────────────────────
export interface CostEventPayload {
  businessId: string;
  module: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  requestId: string;
}

// ─── Automation Block Types ───────────────────────────────────────
export interface AutomationStep {
  type:
    | 'generate_content'
    | 'quality_check'
    | 'request_approval'
    | 'schedule_publish'
    | 'send_notification'
    | 'wait'
    | 'condition';
  config: Record<string, unknown>;
  order: number;
}

export interface AutomationErrorPolicy {
  maxRetries: number;
  retryDelayMs: number;
  circuitBreakerThreshold: number;
}

// ─── Brand Context (for AI) ───────────────────────────────────────
export interface BrandContext {
  name: string;
  positioning?: string | null;
  audience?: string | null;
  tone?: string[] | null;
  governance?: {
    bannedPhrases?: string[];
    requiredPhrases?: string[];
    ctaPreferences?: string[];
    requiredDisclaimer?: string | null;
  } | null;
  knowledgeEntries?: string[];
}

// ─── Webhook Event ────────────────────────────────────────────────
export interface WebhookEvent {
  id: string;
  businessId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  timestamp: string;
  signature: string;
}

// ─── Publish Job ─────────────────────────────────────────────────
export interface PublishJobPayload {
  publishJobId: string;
  contentId: string;
  socialAccountId: string;
  businessId: string;
  platform: string;
  retryCount: number;
}

// ─── Analytics Event ─────────────────────────────────────────────
export interface AnalyticsEventPayload {
  businessId: string;
  contentId?: string;
  platform?: string;
  source?: 'publish' | 'approval' | 'generation' | 'social_api';
  eventType: string;
  entityType?: string;
  entityId?: string;
  value?: number;
  occurredAt?: string | Date;
  meta?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}
