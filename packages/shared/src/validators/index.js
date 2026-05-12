"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiKeySchema = exports.inviteMemberSchema = exports.createPromptSchema = exports.createAutomationSchema = exports.createScheduleSchema = exports.submitApprovalDecisionSchema = exports.createBriefSchema = exports.updateCampaignSchema = exports.createCampaignSchema = exports.updateContentSchema = exports.generateContentSchema = exports.createKnowledgeSourceSchema = exports.updateBrandSchema = exports.createBrandSchema = exports.updateBusinessSchema = exports.createBusinessSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
// ─── Pagination ───────────────────────────────────────────────────
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
// ─── Auth ─────────────────────────────────────────────────────────
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
    password: zod_1.z
        .string()
        .min(8)
        .max(128)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain uppercase, lowercase, number, and special character'),
    firstName: zod_1.z.string().min(1).max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    businessName: zod_1.z.string().min(1).max(255).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
    mfaCode: zod_1.z.string().length(6).optional(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z
        .string()
        .min(8)
        .max(128)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
});
// ─── Business ─────────────────────────────────────────────────────
exports.createBusinessSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    slug: zod_1.z
        .string()
        .min(2)
        .max(100)
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
        .optional(),
});
exports.updateBusinessSchema = exports.createBusinessSchema.partial();
// ─── Brand ────────────────────────────────────────────────────────
exports.createBrandSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    positioning: zod_1.z.string().max(1000).optional(),
    audience: zod_1.z.string().max(1000).optional(),
    tone: zod_1.z.array(zod_1.z.string().max(50)).max(10).optional(),
    visualRules: zod_1.z
        .object({
        primaryColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        secondaryColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        fontFamily: zod_1.z.string().max(100).optional(),
        logoUrls: zod_1.z.array(zod_1.z.string().url()).max(5).optional(),
    })
        .optional(),
    governance: zod_1.z
        .object({
        bannedPhrases: zod_1.z.array(zod_1.z.string().max(200)).max(100).optional(),
        requiredPhrases: zod_1.z.array(zod_1.z.string().max(200)).max(50).optional(),
        ctaPreferences: zod_1.z.array(zod_1.z.string().max(100)).max(10).optional(),
        requiredDisclaimer: zod_1.z.string().max(500).optional(),
    })
        .optional(),
});
exports.updateBrandSchema = exports.createBrandSchema.partial();
// ─── Knowledge ────────────────────────────────────────────────────
exports.createKnowledgeSourceSchema = zod_1.z.object({
    brandId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['pdf', 'docx', 'url', 'text', 'api', 'video_transcript']),
    sourceUrl: zod_1.z.string().url().optional(),
    text: zod_1.z.string().max(100_000).optional(),
});
// ─── Content ──────────────────────────────────────────────────────
exports.generateContentSchema = zod_1.z.object({
    brandId: zod_1.z.string().uuid(),
    briefId: zod_1.z.string().uuid().optional(),
    campaignId: zod_1.z.string().uuid().optional(),
    platform: zod_1.z.enum(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok']),
    type: zod_1.z.enum(['post', 'caption', 'ad_copy', 'blog_snippet', 'hook', 'cta', 'email', 'article']),
    topic: zod_1.z.string().min(1).max(1000),
    additionalContext: zod_1.z.string().max(2000).optional(),
    tone: zod_1.z.string().max(100).optional(),
});
exports.updateContentSchema = zod_1.z.object({
    body: zod_1.z.string().min(1).max(50_000),
});
// ─── Campaign ─────────────────────────────────────────────────────
exports.createCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    clonedFromId: zod_1.z.string().uuid().optional(),
});
exports.updateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    status: zod_1.z.enum(['draft', 'active', 'completed', 'archived']).optional(),
});
// ─── Brief ────────────────────────────────────────────────────────
exports.createBriefSchema = zod_1.z.object({
    campaignId: zod_1.z.string().uuid().optional(),
    objective: zod_1.z.string().min(1).max(1000),
    audience: zod_1.z.string().max(500).optional(),
    platform: zod_1.z.enum(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok']).optional(),
    cta: zod_1.z.string().max(200).optional(),
    tone: zod_1.z.string().max(100).optional(),
    format: zod_1.z.enum(['post', 'carousel', 'story', 'reel', 'article', 'newsletter']).optional(),
    contentType: zod_1.z.enum(['organic', 'ad', 'blog']).optional(),
    businessGoal: zod_1.z.string().max(500).optional(),
});
// ─── Approval ─────────────────────────────────────────────────────
exports.submitApprovalDecisionSchema = zod_1.z.object({
    status: zod_1.z.enum(['approved', 'rejected', 'revision_requested']),
    note: zod_1.z.string().max(2000).optional(),
    reason: zod_1.z.string().max(2000).optional(),
});
// ─── Schedule ─────────────────────────────────────────────────────
exports.createScheduleSchema = zod_1.z.object({
    contentId: zod_1.z.string().uuid().optional(),
    campaignId: zod_1.z.string().uuid().optional(),
    socialAccountId: zod_1.z.string().uuid(),
    scheduledAt: zod_1.z.coerce.date().min(new Date()),
    timezone: zod_1.z.string().max(100).default('UTC'),
    type: zod_1.z.enum(['one_time', 'recurring']).default('one_time'),
    recurringRule: zod_1.z.string().max(200).optional(),
});
// ─── Automation ──────────────────────────────────────────────────
exports.createAutomationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    triggerType: zod_1.z.enum(['cron', 'event', 'webhook', 'manual']),
    triggerConfig: zod_1.z.record(zod_1.z.unknown()),
    steps: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        config: zod_1.z.record(zod_1.z.unknown()),
        order: zod_1.z.number().int().min(0),
    })),
    errorPolicy: zod_1.z
        .object({
        maxRetries: zod_1.z.number().int().min(0).max(10).default(3),
        retryDelayMs: zod_1.z.number().int().min(1000).default(5000),
        circuitBreakerThreshold: zod_1.z.number().int().min(1).default(5),
    })
        .optional(),
});
// ─── Prompt ──────────────────────────────────────────────────────
exports.createPromptSchema = zod_1.z.object({
    module: zod_1.z.enum(['social', 'ad', 'blog', 'email', 'compliance', 'analysis', 'generation']),
    layer: zod_1.z.enum(['platform', 'business', 'brand', 'campaign']),
    name: zod_1.z.string().min(1).max(255),
    template: zod_1.z.string().min(1).max(20_000),
    abVariant: zod_1.z.string().max(10).optional(),
});
// ─── Invite Team Member ──────────────────────────────────────────
exports.inviteMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    roleId: zod_1.z.string().uuid(),
});
// ─── API Key ─────────────────────────────────────────────────────
exports.createApiKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    scopes: zod_1.z.array(zod_1.z.string()).min(1),
    expiresAt: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=index.js.map