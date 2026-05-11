import { z } from 'zod';

// ─── Pagination ───────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationDto = z.infer<typeof paginationSchema>;

// ─── Auth ─────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number, and special character',
    ),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  businessName: z.string().min(1).max(255).optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().length(6).optional(),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
});

// ─── Business ─────────────────────────────────────────────────────
export const createBusinessSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
    .optional(),
});
export type CreateBusinessDto = z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema = createBusinessSchema.partial();
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;

// ─── Brand ────────────────────────────────────────────────────────
export const createBrandSchema = z.object({
  name: z.string().min(1).max(255),
  positioning: z.string().max(1000).optional(),
  audience: z.string().max(1000).optional(),
  tone: z.array(z.string().max(50)).max(10).optional(),
  visualRules: z
    .object({
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      fontFamily: z.string().max(100).optional(),
      logoUrls: z.array(z.string().url()).max(5).optional(),
    })
    .optional(),
  governance: z
    .object({
      bannedPhrases: z.array(z.string().max(200)).max(100).optional(),
      requiredPhrases: z.array(z.string().max(200)).max(50).optional(),
      ctaPreferences: z.array(z.string().max(100)).max(10).optional(),
      requiredDisclaimer: z.string().max(500).optional(),
    })
    .optional(),
});
export type CreateBrandDto = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = createBrandSchema.partial();
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;

// ─── Knowledge ────────────────────────────────────────────────────
export const createKnowledgeSourceSchema = z.object({
  brandId: z.string().uuid(),
  type: z.enum(['pdf', 'docx', 'url', 'text', 'api', 'video_transcript']),
  sourceUrl: z.string().url().optional(),
  text: z.string().max(100_000).optional(),
});
export type CreateKnowledgeSourceDto = z.infer<typeof createKnowledgeSourceSchema>;

// ─── Content ──────────────────────────────────────────────────────
export const generateContentSchema = z.object({
  brandId: z.string().uuid(),
  briefId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  platform: z.enum(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok']),
  type: z.enum(['post', 'caption', 'ad_copy', 'blog_snippet', 'hook', 'cta', 'email', 'article']),
  topic: z.string().min(1).max(1000),
  additionalContext: z.string().max(2000).optional(),
  tone: z.string().max(100).optional(),
});
export type GenerateContentDto = z.infer<typeof generateContentSchema>;

export const updateContentSchema = z.object({
  body: z.string().min(1).max(50_000),
});
export type UpdateContentDto = z.infer<typeof updateContentSchema>;

// ─── Campaign ─────────────────────────────────────────────────────
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  clonedFromId: z.string().uuid().optional(),
});
export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
});
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;

// ─── Brief ────────────────────────────────────────────────────────
export const createBriefSchema = z.object({
  campaignId: z.string().uuid().optional(),
  objective: z.string().min(1).max(1000),
  audience: z.string().max(500).optional(),
  platform: z.enum(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok']).optional(),
  cta: z.string().max(200).optional(),
  tone: z.string().max(100).optional(),
  format: z.enum(['post', 'carousel', 'story', 'reel', 'article', 'newsletter']).optional(),
  contentType: z.enum(['organic', 'ad', 'blog']).optional(),
  businessGoal: z.string().max(500).optional(),
});
export type CreateBriefDto = z.infer<typeof createBriefSchema>;

// ─── Approval ─────────────────────────────────────────────────────
export const submitApprovalDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'revision_requested']),
  note: z.string().max(2000).optional(),
  reason: z.string().max(2000).optional(),
});
export type SubmitApprovalDecisionDto = z.infer<typeof submitApprovalDecisionSchema>;

// ─── Schedule ─────────────────────────────────────────────────────
export const createScheduleSchema = z.object({
  contentId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  socialAccountId: z.string().uuid(),
  scheduledAt: z.coerce.date().min(new Date()),
  timezone: z.string().max(100).default('UTC'),
  type: z.enum(['one_time', 'recurring']).default('one_time'),
  recurringRule: z.string().max(200).optional(),
});
export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;

// ─── Automation ──────────────────────────────────────────────────
export const createAutomationSchema = z.object({
  name: z.string().min(1).max(255),
  triggerType: z.enum(['cron', 'event', 'webhook', 'manual']),
  triggerConfig: z.record(z.unknown()),
  steps: z.array(
    z.object({
      type: z.string(),
      config: z.record(z.unknown()),
      order: z.number().int().min(0),
    }),
  ),
  errorPolicy: z
    .object({
      maxRetries: z.number().int().min(0).max(10).default(3),
      retryDelayMs: z.number().int().min(1000).default(5000),
      circuitBreakerThreshold: z.number().int().min(1).default(5),
    })
    .optional(),
});
export type CreateAutomationDto = z.infer<typeof createAutomationSchema>;

// ─── Prompt ──────────────────────────────────────────────────────
export const createPromptSchema = z.object({
  module: z.enum(['social', 'ad', 'blog', 'email', 'compliance', 'analysis', 'generation']),
  layer: z.enum(['platform', 'business', 'brand', 'campaign']),
  name: z.string().min(1).max(255),
  template: z.string().min(1).max(20_000),
  abVariant: z.string().max(10).optional(),
});
export type CreatePromptDto = z.infer<typeof createPromptSchema>;

// ─── Invite Team Member ──────────────────────────────────────────
export const inviteMemberSchema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
});
export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;

// ─── API Key ─────────────────────────────────────────────────────
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1),
  expiresAt: z.coerce.date().optional(),
});
export type CreateApiKeyDto = z.infer<typeof createApiKeySchema>;

// ─── LLM Settings ────────────────────────────────────────────────
export const updateLlmSettingsSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'fallback']).optional(),
  model: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
  apiKey: z.string().max(500).optional(),
  isFallbackEnabled: z.boolean().optional(),
});
export type UpdateLlmSettingsDto = z.infer<typeof updateLlmSettingsSchema>;
