"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION = exports.CACHE_TTL = exports.QUEUES = exports.SCHEDULE_STATUSES = exports.SCHEDULE_TYPES = exports.ASSET_TYPES = exports.AI_PROVIDERS = exports.PERMISSIONS = exports.SYSTEM_ROLES = exports.NOTIFICATION_CHANNELS = exports.NOTIFICATION_TYPES = exports.AUTOMATION_RUN_STATUSES = exports.AUTOMATION_TRIGGER_TYPES = exports.PROMPT_MODULES = exports.PROMPT_LAYERS = exports.KNOWLEDGE_ENTRY_TYPES = exports.KNOWLEDGE_SOURCE_STATUSES = exports.KNOWLEDGE_SOURCE_TYPES = exports.PUBLISH_FAILURE_CLASSES = exports.PUBLISH_JOB_STATUSES = exports.REVIEW_TYPES = exports.APPROVAL_STATUSES = exports.CAMPAIGN_STATUSES = exports.CONTENT_FORMATS = exports.CONTENT_STATUSES = exports.CONTENT_TYPES = exports.SOCIAL_PLATFORMS = exports.SUBSCRIPTION_STATUSES = exports.PLAN_LIMITS = exports.PLANS = void 0;
// ─── Platform Plans ───────────────────────────────────────────────
exports.PLANS = ['starter', 'growth', 'agency', 'enterprise'];
exports.PLAN_LIMITS = {
    starter: { seats: 3, tokenBudget: 100_000 },
    growth: { seats: 10, tokenBudget: 500_000 },
    agency: { seats: 50, tokenBudget: 2_000_000 },
    enterprise: { seats: Infinity, tokenBudget: Infinity },
};
// ─── Subscription Statuses ────────────────────────────────────────
exports.SUBSCRIPTION_STATUSES = [
    'active',
    'past_due',
    'canceled',
    'trialing',
];
// ─── Social Platforms ─────────────────────────────────────────────
exports.SOCIAL_PLATFORMS = [
    'linkedin',
    'instagram',
    'facebook',
    'twitter',
    'tiktok',
];
// ─── Content Types ────────────────────────────────────────────────
exports.CONTENT_TYPES = [
    'post',
    'caption',
    'ad_copy',
    'blog_snippet',
    'hook',
    'cta',
    'email',
    'article',
];
exports.CONTENT_STATUSES = [
    'draft',
    'in_review',
    'revision_requested',
    'approved',
    'scheduled',
    'published',
    'archived',
];
exports.CONTENT_FORMATS = [
    'post',
    'carousel',
    'story',
    'reel',
    'article',
    'newsletter',
];
// ─── Campaign Statuses ────────────────────────────────────────────
exports.CAMPAIGN_STATUSES = [
    'draft',
    'active',
    'completed',
    'archived',
];
// ─── Approval ─────────────────────────────────────────────────────
exports.APPROVAL_STATUSES = [
    'pending',
    'approved',
    'rejected',
    'revision_requested',
];
exports.REVIEW_TYPES = ['internal', 'client', 'owner', 'legal'];
// ─── Publish Jobs ─────────────────────────────────────────────────
exports.PUBLISH_JOB_STATUSES = [
    'pending',
    'processing',
    'published',
    'failed',
    'retrying',
    'dead_letter',
    'cancelled',
];
exports.PUBLISH_FAILURE_CLASSES = [
    'token_expired',
    'api_failure',
    'invalid_media',
    'rate_limit',
    'permission_denied',
    'content_policy_violation',
];
// ─── Knowledge ───────────────────────────────────────────────────
exports.KNOWLEDGE_SOURCE_TYPES = [
    'pdf',
    'docx',
    'url',
    'text',
    'api',
    'video_transcript',
];
exports.KNOWLEDGE_SOURCE_STATUSES = [
    'pending',
    'processing',
    'completed',
    'failed',
];
exports.KNOWLEDGE_ENTRY_TYPES = [
    'fact',
    'faq',
    'claim',
    'offer',
    'pain_point',
    'testimonial',
    'case_study',
];
// ─── Prompt Layers ────────────────────────────────────────────────
exports.PROMPT_LAYERS = [
    'platform',
    'business',
    'brand',
    'campaign',
];
exports.PROMPT_MODULES = [
    'social',
    'ad',
    'blog',
    'email',
    'compliance',
    'analysis',
    'generation',
];
// ─── Automation ──────────────────────────────────────────────────
exports.AUTOMATION_TRIGGER_TYPES = [
    'cron',
    'event',
    'webhook',
    'manual',
];
exports.AUTOMATION_RUN_STATUSES = [
    'running',
    'completed',
    'failed',
    'paused',
];
// ─── Notification Types ──────────────────────────────────────────
exports.NOTIFICATION_TYPES = [
    'approval_pending',
    'approval_decided',
    'publish_failed',
    'publish_success',
    'token_expiry',
    'sla_breach',
    'budget_warning',
    'quality_check_failed',
];
exports.NOTIFICATION_CHANNELS = [
    'in_app',
    'email',
    'webhook',
];
// ─── Roles ────────────────────────────────────────────────────────
exports.SYSTEM_ROLES = [
    'owner',
    'admin',
    'editor',
    'reviewer',
    'viewer',
];
exports.PERMISSIONS = [
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
];
// ─── AI Providers ─────────────────────────────────────────────────
exports.AI_PROVIDERS = ['openai', 'anthropic', 'fallback'];
// ─── Asset Types ─────────────────────────────────────────────────
exports.ASSET_TYPES = [
    'image',
    'logo',
    'video',
    'document',
    'font',
];
// ─── Schedule Types ───────────────────────────────────────────────
exports.SCHEDULE_TYPES = ['one_time', 'recurring'];
exports.SCHEDULE_STATUSES = [
    'pending',
    'published',
    'cancelled',
    'failed',
];
// ─── Queue Names ──────────────────────────────────────────────────
exports.QUEUES = {
    PUBLISH: 'publish',
    KNOWLEDGE_INGESTION: 'knowledge-ingestion',
    AI_GENERATION: 'ai-generation',
    ANALYTICS_COLLECTION: 'analytics-collection',
    NOTIFICATIONS: 'notifications',
    AUTOMATION: 'automation',
};
// ─── Cache Keys ──────────────────────────────────────────────────
exports.CACHE_TTL = {
    SESSION: 7 * 24 * 60 * 60, // 7 days in seconds
    BRAND: 5 * 60, // 5 minutes
    PROMPT: 10 * 60, // 10 minutes
    SUBSCRIPTION: 5 * 60, // 5 minutes
};
// ─── Pagination Defaults ─────────────────────────────────────────
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
//# sourceMappingURL=index.js.map