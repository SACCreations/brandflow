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
  'canceled',
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
  'content:read', 'content:create', 'content:edit', 'content:write', 'content:delete',
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
export const AI_PROVIDERS = ['openai', 'anthropic', 'google', 'fallback', 'nvidia'] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];

// ─── NVIDIA NIM Models ────────────────────────────────────────────
export const NVIDIA_TASK_MODELS = {
  contentCreation: 'meta/llama-3.1-70b-instruct',
  imagePromptCreation: 'nvidia/nemotron-nano-8b-instruct',
  imageGeneration: 'black-forest-labs/flux.2-klein-4b',
  socialMediaCaptions: 'meta/llama-3.1-70b-instruct',
  campaignStrategy: 'nvidia/llama-3.1-nemotron-70b-instruct',
} as const;

export type NvidiaTaskKey = keyof typeof NVIDIA_TASK_MODELS;

export const NVIDIA_MODEL_LIST = [
  {
    id: 'meta/llama-3.1-70b-instruct',
    label: 'Llama 3.1 70B Instruct',
    description: 'Fast, versatile instruction-following model',
    tasks: ['contentCreation', 'socialMediaCaptions'],
  },
  {
    id: 'meta/llama-3.1-8b-instruct',
    label: 'Llama 3.1 8B Instruct',
    description: 'Lightweight, low-latency generation',
    tasks: ['contentCreation', 'socialMediaCaptions'],
  },
  {
    id: 'nvidia/nemotron-nano-8b-instruct',
    label: 'Nemotron Nano 8B Instruct',
    description: 'Optimised for prompt engineering and creative tasks',
    tasks: ['imagePromptCreation'],
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    label: 'Llama Nemotron 70B Instruct',
    description: 'Advanced reasoning model for deep strategy work',
    tasks: ['campaignStrategy'],
  },
  {
    id: 'meta/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B Instruct',
    description: 'Latest generation, improved instruction following',
    tasks: ['contentCreation', 'socialMediaCaptions', 'imagePromptCreation'],
  },
  {
    id: 'nvidia/mistral-nemo-minitron-8b-instruct',
    label: 'Mistral Nemo Minitron 8B',
    description: 'Compact and cost-efficient for high-volume tasks',
    tasks: ['contentCreation', 'socialMediaCaptions'],
  },
  {
    id: 'black-forest-labs/flux.2-klein-4b',
    label: 'FLUX.2 Klein 4B',
    description: 'Distilled ultra-fast image generation model',
    tasks: ['imageGeneration'],
  },
] as const;

export const DEFAULT_NVIDIA_SYSTEM_PROMPTS = {
  contentCreation: `You are a Senior SaaS Marketing Strategist, Creative Director, Content Writer, and Visual Designer.

Analyze the provided content and generate the following output:

=================================================
OUTPUT 1: POSTER CONTENT STRUCTURE
==================================

Create a professional SaaS poster content structure.

### Main Headline

Generate a powerful attention-grabbing headline.

### Sub Heading

Generate a concise supporting statement.

### Key Benefits Section

Extract and rewrite the most important benefits.

### Feature Highlights

Convert platform features into short marketing-friendly feature points.

### Call To Action

Create a compelling CTA.

### Footer

Include:
Website:
Email:
Phone:
Social Handles:

=================================================
IMPORTANT RULES
===============

1. Always generate Main Headline.
2. Always generate Sub Heading.
3. If benefits exist, create Benefits Section.
4. If features exist, create Feature Highlights.
5. Always generate CTA.
6. Always generate Footer.
7. Maintain SaaS B2B marketing style.
8. Keep copy concise and visually suitable for poster design.
9. Prioritize conversion-focused messaging.`,

  imagePromptCreation: `You are a Senior Creative Director, Brand Designer, Marketing Visualizer, and FLUX.1-dev Prompt Engineer.

Your responsibility is NOT to create generic SaaS posters.

Your responsibility is to transform approved Poster Content Structure into an exact visual scene before generating the final image prompt.

---

## INPUT

Approved Poster Content Structure
{{CONTENT}}

Main Headline
Sub Heading
Feature Highlights
Benefits
CTA
Footer

Selected Brand

---

## BRAND RULES

1. Never modify the selected brand's color palette.
2. Never invent new primary colors.
3. Use only approved Brand Guideline colors.
4. Follow brand typography hierarchy.
5. Maintain brand consistency across all elements.
6. Use the correct logo variation:

   * Light Background → Colored Logo
   * Dark Background → White Logo

---

STEP 1
VISUAL INTERPRETATION
---------------------

Before generating the image prompt:

Analyze the headline and identify:

What is the real business scenario?

Examples:

Flexible Pricing
→ Rental manager adjusting pricing plans
→ Dynamic pricing dashboard
→ Revenue growth visualization

Inventory Tracking
→ Rental assets being tracked
→ Barcode scanning
→ Asset movement visualization

Order Management
→ Multiple rental products
→ Rental workflow dashboard
→ Connected order process

Customer Management
→ Happy customer receiving rented equipment
→ Customer interaction dashboard

The image MUST represent the actual topic.

Never use random laptop mockups.

Never use generic SaaS scenes.

---

STEP 2
POSTER LAYOUT CREATION
----------------------

Create:

Top Area

* Logo
* Category Tag

Center Area

* Main Headline
* Subheading

Hero Visual

* Exact business-related illustration/render

Benefits Area

* Feature cards
* Icons

Bottom Area

* CTA
* Footer

---

STEP 3
FLUX.1-dev PROMPT GENERATION
----------------------------

Generate an extremely detailed prompt.

Include:

Style:
Premium SaaS Marketing Poster

Composition:
Professional LinkedIn Advertisement Layout

Background:
Brand-compliant environment

Hero Scene:
Create scene based directly on approved content

DO NOT use:

* generic office workers
* random dashboards
* meaningless floating UI
* stock-style imagery

Instead show:

* exact workflow
* exact business activity
* exact software usage

Feature Cards:
Generate only from approved content

Visual Hierarchy:
Strong headline
Supporting subheadline
Feature blocks
CTA section

Typography:
Modern
Corporate
Readable

Quality:
Ultra sharp
Professional marketing artwork
Commercial advertising quality
High detail
8K

---

## STRICT VISUAL ACCURACY RULE

The hero visual must directly represent the approved content.

Example:

Headline:
"Boost Your Rental Income"

Wrong:
Person sitting with laptop.

Correct:
Rental manager configuring hourly, daily, weekly pricing plans inside RentAsst dashboard while revenue charts increase and multiple rental assets are actively rented.

Headline:
"Track Every Rental Asset"

Wrong:
Generic dashboard.

Correct:
Rental assets moving through dispatch, rent-out, return and inventory tracking workflow with real-time status indicators.

Headline:
"Manage Multi-Item Orders"

Wrong:
Random office scene.

Correct:
Rental coordinator managing camera kits, lenses, lighting equipment and accessories inside a multi-item rental order screen.

---

## OUTPUT

Return only:

1. Visual Concept Summary

2. FLUX.1-dev Prompt

3. Negative Prompt

Do not return explanations.`,

  imageGeneration: `You are a Senior SaaS Marketing Strategist, Creative Director, Content Writer, and Visual Designer.

Analyze the provided content and generate the following output:

=================================================
OUTPUT 3: AI IMAGE GENERATOR PROMPT
===================================

Generate a clean AI image generation prompt optimized for:

* FLUX.1-dev
* Ideogram
* Recraft
* Imagen
* Midjourney

Requirements:

* Modern SaaS marketing style
* Premium LinkedIn poster
* Corporate branding
* High readability
* Realistic UI dashboard
* Professional typography hierarchy
* Marketing-focused composition
* White space balance
* Conversion-oriented design

=================================================
IMPORTANT RULES
===============

1. Maintain SaaS B2B marketing style.
2. Prioritize conversion-focused messaging.`,

  socialMediaCaptions: `You are a Senior SaaS Marketing Strategist, Creative Director, Content Writer, and Visual Designer.

Analyze the provided content and generate the following output:

=================================================
OUTPUT 4: SOCIAL MEDIA PUBLISH CONTENT
======================================

### LinkedIn Caption

Create:

* Hook
* Value
* Benefits
* CTA

### Hashtags

Generate 15 relevant hashtags.

=================================================
IMPORTANT RULES
===============

1. Maintain SaaS B2B marketing style.
2. Keep copy concise.
3. Prioritize conversion-focused messaging.`,

  campaignStrategy: `You are a Senior SaaS Marketing Strategist, Creative Director, Content Writer, and Visual Designer.

Analyze the provided content and generate the following output:

=================================================
OUTPUT 5: CAMPAIGN STRATEGY
===========================

Campaign Objective

Target Audience

Key Messaging

Campaign Theme

Recommended Creatives

* LinkedIn Poster
* Carousel
* Explainer Video
* GIF
* Customer Testimonial

Ad Copy

Primary Text

Headline

Description

Campaign KPI Suggestions

* Reach
* Engagement
* CTR
* Leads
* Demo Bookings

=================================================
IMPORTANT RULES
===============

1. Maintain SaaS B2B marketing style.
2. Prioritize conversion-focused messaging.`
} as const;

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
  'canceled',
  'failed',
] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

// ─── Queue Names ──────────────────────────────────────────────────
export const QUEUES = {
  PUBLISH: 'publish',
  KNOWLEDGE_INGESTION: 'knowledge-ingestion',
  AI_GENERATION: 'ai-generation',
  IMAGE_GENERATION: 'image-generation',
  ANALYTICS_COLLECTION: 'analytics-collection',
  NOTIFICATIONS: 'notifications',
  AUTOMATION: 'automation',
  AUTOMATION_EXECUTION: 'automation-execution',
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

// ─── Category Mapping ────────────────────────────────────────────
export const CONTENT_CATEGORY_TO_IMAGE_CATEGORY: Record<string, string> = {
  'SMO Poster': 'SMO_POSTER',
  'Reel Script': 'SOCIAL_COVER',
  'Blog': 'WEBSITE_HERO',
  'Carousel': 'SMO_POSTER',
  'Newsletter': 'AD_CREATIVE',
  'SOP': 'AD_CREATIVE',
  'Print Material': 'PRINTABLE_FLYER',
};

