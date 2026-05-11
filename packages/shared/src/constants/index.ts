// ─── Platform Plans ───────────────────────────────────────────────
export const PLANS = ['starter', 'growth', 'agency', 'enterprise'] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LIMITS: Record<Plan, { seats: number; tokenBudget: number }> = {
  starter: { seats: 3, tokenBudget: 100_000 },
  growth: { seats: 10, tokenBudget: 500_000 },
  agency: { seats: 50, tokenBudget: 2_000_000 },
  enterprise: { seats: Infinity, tokenBudget: Infinity },
};

// ─── Subscription Statuses ────────────────────────────────────────
export const SUBSCRIPTION_STATUSES = [
  'active',
  'past_due',
  'canceled',
  'trialing',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// ─── Social Platforms ─────────────────────────────────────────────
export const SOCIAL_PLATFORMS = [
  'linkedin',
  'instagram',
  'facebook',
  'twitter',
  'tiktok',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

// ─── Content Types ────────────────────────────────────────────────
export const CONTENT_TYPES = [
  'post',
  'caption',
  'ad_copy',
  'blog_snippet',
  'hook',
  'cta',
  'email',
  'article',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = [
  'draft',
  'in_review',
  'revision_requested',
  'approved',
  'scheduled',
  'published',
  'archived',
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_FORMATS = [
  'post',
  'carousel',
  'story',
  'reel',
  'article',
  'newsletter',
] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

// ─── Campaign Statuses ────────────────────────────────────────────
export const CAMPAIGN_STATUSES = [
  'draft',
  'active',
  'completed',
  'archived',
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

// ─── Approval ─────────────────────────────────────────────────────
export const APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'revision_requested',
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const REVIEW_TYPES = ['internal', 'client', 'owner', 'legal'] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

// ─── Publish Jobs ─────────────────────────────────────────────────
export const PUBLISH_JOB_STATUSES = [
  'pending',
  'processing',
  'published',
  'failed',
  'retrying',
  'dead_letter',
  'cancelled',
] as const;
export type PublishJobStatus = (typeof PUBLISH_JOB_STATUSES)[number];

export const PUBLISH_FAILURE_CLASSES = [
  'token_expired',
  'api_failure',
  'invalid_media',
  'rate_limit',
  'permission_denied',
  'content_policy_violation',
] as const;
export type PublishFailureClass = (typeof PUBLISH_FAILURE_CLASSES)[number];

// ─── Knowledge ───────────────────────────────────────────────────
export const KNOWLEDGE_SOURCE_TYPES = [
  'pdf',
  'docx',
  'url',
  'text',
  'api',
  'video_transcript',
] as const;
export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number];

export const KNOWLEDGE_SOURCE_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const;
export type KnowledgeSourceStatus = (typeof KNOWLEDGE_SOURCE_STATUSES)[number];

export const KNOWLEDGE_ENTRY_TYPES = [
  'fact',
  'faq',
  'claim',
  'offer',
  'pain_point',
  'testimonial',
  'case_study',
] as const;
export type KnowledgeEntryType = (typeof KNOWLEDGE_ENTRY_TYPES)[number];

// ─── Prompt Layers ────────────────────────────────────────────────
export const PROMPT_LAYERS = [
  'platform',
  'business',
  'brand',
  'campaign',
] as const;
export type PromptLayer = (typeof PROMPT_LAYERS)[number];

export const PROMPT_MODULES = [
  'social',
  'ad',
  'blog',
  'email',
  'compliance',
  'analysis',
  'generation',
] as const;
export type PromptModule = (typeof PROMPT_MODULES)[number];

// ─── Automation ──────────────────────────────────────────────────
export const AUTOMATION_TRIGGER_TYPES = [
  'cron',
  'event',
  'webhook',
  'manual',
] as const;
export type AutomationTriggerType = (typeof AUTOMATION_TRIGGER_TYPES)[number];

export const AUTOMATION_RUN_STATUSES = [
  'running',
  'completed',
  'failed',
  'paused',
] as const;
export type AutomationRunStatus = (typeof AUTOMATION_RUN_STATUSES)[number];

// ─── Notification Types ──────────────────────────────────────────
export const NOTIFICATION_TYPES = [
  'approval_pending',
  'approval_decided',
  'publish_failed',
  'publish_success',
  'token_expiry',
  'sla_breach',
  'budget_warning',
  'quality_check_failed',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = [
  'in_app',
  'email',
  'webhook',
] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// ─── Roles ────────────────────────────────────────────────────────
export const SYSTEM_ROLES = [
  'owner',
  'admin',
  'editor',
  'reviewer',
  'viewer',
] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const PERMISSIONS = [
  'brand:read', 'brand:write', 'brand:delete',
  'content:read', 'content:write', 'content:delete',
  'campaign:read', 'campaign:write', 'campaign:delete',
  'knowledge:read', 'knowledge:write',
  'approval:read', 'approval:write',
  'analytics:read',
  'social:read', 'social:write', 'social:delete',
  'team:read', 'team:invite', 'team:remove',
  'billing:read', 'billing:write',
  'automation:read', 'automation:write', 'automation:delete',
  'prompt:read', 'prompt:write',
  'template:read', 'template:write', 'template:delete',
  'asset:read', 'asset:write', 'asset:delete',
  'settings:read', 'settings:write',
  '*',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

// ─── AI Providers ─────────────────────────────────────────────────
export const AI_PROVIDERS = ['openai', 'anthropic', 'fallback'] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];

// ─── Asset Types ─────────────────────────────────────────────────
export const ASSET_TYPES = [
  'image',
  'logo',
  'video',
  'document',
  'font',
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

// ─── Schedule Types ───────────────────────────────────────────────
export const SCHEDULE_TYPES = ['one_time', 'recurring'] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export const SCHEDULE_STATUSES = [
  'pending',
  'published',
  'cancelled',
  'failed',
] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

// ─── Queue Names ──────────────────────────────────────────────────
export const QUEUES = {
  PUBLISH: 'publish',
  KNOWLEDGE_INGESTION: 'knowledge-ingestion',
  AI_GENERATION: 'ai-generation',
  ANALYTICS_COLLECTION: 'analytics-collection',
  NOTIFICATIONS: 'notifications',
  AUTOMATION: 'automation',
} as const;

// ─── Cache Keys ──────────────────────────────────────────────────
export const CACHE_TTL = {
  SESSION: 7 * 24 * 60 * 60, // 7 days in seconds
  BRAND: 5 * 60, // 5 minutes
  PROMPT: 10 * 60, // 10 minutes
  SUBSCRIPTION: 5 * 60, // 5 minutes
} as const;

// ─── Pagination Defaults ─────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
