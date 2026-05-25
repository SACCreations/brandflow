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
  firstName: z.string().min(1).max(100).nullish(),
  lastName: z.string().min(1).max(100).nullish(),
  businessName: z.string().min(1).max(255).nullish(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().length(6).nullish(),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
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
    .nullish(),
});
export type CreateBusinessDto = z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema = createBusinessSchema.partial();
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;

// ─── Brand Analysis ──────────────────────────────────────────────
export const brandAnalysisSourceSchema = z.object({
  type: z.enum(['url', 'text']),
  value: z.string().min(1).max(100_000),
  label: z.string().max(255).nullish(),
});
export type BrandAnalysisSourceDto = z.infer<typeof brandAnalysisSourceSchema>;

export const brandAnalysisRequestSchema = z
  .object({
    sourceIds: z.array(z.string().uuid()).min(1).max(10).nullish(),
    sources: z.array(brandAnalysisSourceSchema).min(1).max(5).nullish(),
  })
  .refine((value) => (value.sourceIds?.length ?? 0) + (value.sources?.length ?? 0) > 0, {
    message: 'At least one source is required for brand analysis',
    path: ['sourceIds'],
  });
export type BrandAnalysisRequestDto = z.infer<typeof brandAnalysisRequestSchema>;

export const brandAnalysisBrandSchema = z.object({
  name: z.string().min(1).max(255),
  tagline: z.string().max(255).nullish(),
  description: z.string().max(2000).nullish(),
  industry: z.string().max(100).nullish(),
  website: z.string().max(500).nullish(),
  positioning: z.string().max(2000).nullish(),
  audience: z.string().max(2000).nullish(),
  differentiators: z.string().max(2000).nullish(),
  tone: z.array(z.string().min(1).max(50)).max(12).default([]),
  governance: z.object({
    bannedPhrases: z.array(z.string().min(1).max(200)).max(20).default([]),
    requiredPhrases: z.array(z.string().min(1).max(200)).max(20).default([]),
    ctaPreferences: z.array(z.string().min(1).max(100)).max(20).default([]),
    requiredDisclaimer: z.string().max(1000).nullish(),
  }),
  visualRules: z.object({
    primaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
    secondaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
    accentColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
    neutralColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
    semanticColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
    fontFamily: z.string().max(100).nullish().or(z.literal('')),
    headingFont: z.string().max(100).nullish().or(z.literal('')),
    bodyFont: z.string().max(100).nullish().or(z.literal('')),
    supportingFont: z.string().max(100).nullish().or(z.literal('')),
    backupFont: z.string().max(100).nullish().or(z.literal('')),
    logoUrls: z.array(z.object({
      url: z.string().max(1000).nullish().or(z.literal('')),
      type: z.string().max(50).nullish(),
      name: z.string().max(100).nullish(),
    })).max(20).nullish(),
  }).nullish(),
  identity: z.object({
    mission: z.string().max(1000).nullish(),
    vision: z.string().max(1000).nullish(),
    values: z.array(z.string()).nullish(),
    promise: z.string().max(500).nullish(),
    personality: z.string().max(500).nullish(),
  }).nullish(),
  designTokens: z.object({
    borderRadius: z.string().nullish(),
    shadows: z.string().nullish(),
    spacing: z.string().nullish(),
  }).nullish(),
  strategy: z.object({
    targetLocation: z.string().max(255).nullish().or(z.literal('')),
    ageGroup: z.string().max(100).nullish().or(z.literal('')),
    interests: z.string().max(1000).nullish().or(z.literal('')),
    postingFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']).nullish(),
    festivalPosts: z.boolean().nullish(),
    offerPosts: z.boolean().nullish(),
    preferredTypes: z.array(z.string()).nullish(),
    contentLanguage: z.enum(['tamil', 'english', 'mixed']).nullish(),
    ctaPreference: z.enum(['Call Now', 'DM', 'Visit Website']).nullish(),
  }).nullish(),
  designPreferences: z.object({
    preferredStyle: z.enum(['Minimal', 'Corporate', '3D', 'Modern', 'Playful', 'Luxury']).nullish(),
    referenceLinks: z.array(z.string().url()).nullish(),
    imageStyle: z.enum(['Minimal', 'Corporate', '3D', 'Modern']).nullish(),
    animationRequirement: z.boolean().nullish(),
  }).nullish(),
  approvalWorkflow: z.object({
    reviewerName: z.string().max(255).nullish().or(z.literal('')),
    finalApproverName: z.string().max(255).nullish().or(z.literal('')),
    processSteps: z.array(z.string()).nullish(),
    approvalTiming: z.string().max(100).nullish().or(z.literal('')),
    revisionLimit: z.number().int().min(0).max(10).nullish(),
  }).nullish(),
  campaignDetails: z.object({
    marketingGoal: z.enum(['Brand Awareness', 'Leads', 'Sales']).nullish(),
    monthlyBudget: z.number().min(0).nullish(),
    duration: z.string().max(100).nullish().or(z.literal('')),
    targetLeads: z.number().int().min(0).nullish(),
    adPlatforms: z.array(z.string()).nullish(),
  }).nullish(),
  analyticsConfig: z.object({
    monthlyReport: z.boolean().nullish(),
    kpiExpectations: z.string().max(1000).nullish().or(z.literal('')),
    leadTracking: z.boolean().nullish(),
    engagementTracking: z.boolean().nullish(),
  }).nullish(),
  socialAccess: z.object({
    metaBusinessManagerId: z.string().max(100).nullish().or(z.literal('')),
    adAccountId: z.string().max(100).nullish().or(z.literal('')),
    instagramHandle: z.string().max(100).nullish().or(z.literal('')),
    facebookPage: z.string().max(255).nullish().or(z.literal('')),
    linkedinPage: z.string().max(255).nullish().or(z.literal('')),
    youtubeChannel: z.string().max(255).nullish().or(z.literal('')),
    twitterHandle: z.string().max(100).nullish().or(z.literal('')),
  }).nullish(),
  competitors: z.array(z.object({
    name: z.string().min(1).max(255),
    website: z.string().url().nullish().or(z.literal('')),
    strengths: z.string().max(1000).nullish().or(z.literal('')),
    weaknesses: z.string().max(1000).nullish().or(z.literal('')),
  })).nullish(),
  contactInfo: z.object({
    personName: z.string().max(255).nullish().or(z.literal('')),
    phoneNumber: z.string().max(50).nullish().or(z.literal('')),
    email: z.string().email().nullish().or(z.literal('')),
    officeAddress: z.string().max(500).nullish().or(z.literal('')),
  }).nullish(),
});
export type BrandAnalysisBrandDto = z.infer<typeof brandAnalysisBrandSchema>;

export const brandAnalysisResultSchema = z.object({
  brand: brandAnalysisBrandSchema,
  diagnostics: z.object({
    sourceCount: z.number().int().min(1),
    evidenceCount: z.number().int().min(1),
    warnings: z.array(z.string()).default([]),
    sources: z.array(z.object({
      type: z.enum(['knowledge_source', 'url', 'text']),
      label: z.string().min(1).max(255),
      url: z.string().max(1000).nullish(),
      evidenceCount: z.number().int().min(0),
      status: z.string().max(100).nullish(),
    })),
  }),
  requestId: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
});
export type BrandAnalysisResultDto = z.infer<typeof brandAnalysisResultSchema>;

// ─── Brand ────────────────────────────────────────────────────────
export const createBrandSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only').nullish(),
  tagline: z.string().max(255).nullish(),
  description: z.string().max(2000).nullish(),
  industry: z.string().max(100).nullish(),
  website: z.string().url().or(z.string().regex(/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/, 'Invalid URL format')).nullish().or(z.literal('')),
  differentiators: z.string().max(2000).nullish().or(z.literal('')),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).nullish(),
  headquarters: z.string().max(255).nullish(),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  
  positioning: z.string().max(2000).nullish().or(z.literal('')),
  audience: z.string().max(2000).nullish().or(z.literal('')),
  tone: z.union([z.string(), z.array(z.string().max(50))]).nullish().or(z.literal('')),
  
  visualRules: z
    .object({
      primaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
      secondaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
      accentColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
      neutralColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
      semanticColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid Hex Color').nullish().or(z.literal('')),
      fontFamily: z.string().max(100).nullish().or(z.literal('')),
      headingFont: z.string().max(100).nullish().or(z.literal('')),
      bodyFont: z.string().max(100).nullish().or(z.literal('')),
      supportingFont: z.string().max(100).nullish().or(z.literal('')),
      backupFont: z.string().max(100).nullish().or(z.literal('')),
      logoUrls: z
        .array(
          z.object({
            url: z.string().max(1000).nullish().or(z.literal('')),
            type: z.string().max(50).nullish(),
            name: z.string().max(100).nullish(),
          })
        )
        .max(20)
        .nullish(),
    })
    .nullish(),
    
  identity: z
    .object({
      mission: z.string().max(1000).nullish(),
      vision: z.string().max(1000).nullish(),
      values: z.array(z.string()).nullish(),
      promise: z.string().max(500).nullish(),
      personality: z.string().max(500).nullish(),
    })
    .nullish(),
    
  designTokens: z
    .object({
      borderRadius: z.string().nullish(),
      shadows: z.string().nullish(),
      spacing: z.string().nullish(),
    })
    .nullish(),
    
  governance: z
    .object({
      bannedPhrases: z.union([z.string(), z.array(z.string().max(200))]).nullish().or(z.literal('')),
      requiredPhrases: z.union([z.string(), z.array(z.string().max(200))]).nullish().or(z.literal('')),
      ctaPreferences: z.union([z.string(), z.array(z.string().max(100))]).nullish().or(z.literal('')),
      requiredDisclaimer: z.string().max(1000).nullish().or(z.literal('')),
    })
    .nullish(),

  strategy: z
    .object({
      targetLocation: z.string().max(255).nullish().or(z.literal('')),
      ageGroup: z.string().max(100).nullish().or(z.literal('')),
      interests: z.string().max(1000).nullish().or(z.literal('')),
      postingFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']).nullish(),
      festivalPosts: z.boolean().default(false),
      offerPosts: z.boolean().default(false),
      preferredTypes: z.array(z.string()).nullish(), // Poster, Reel, Video, Carousel, Blog
      contentLanguage: z.enum(['tamil', 'english', 'mixed']).default('english'),
      ctaPreference: z.enum(['Call Now', 'DM', 'Visit Website']).nullish(),
    })
    .nullish(),

  designPreferences: z
    .object({
      preferredStyle: z.enum(['Minimal', 'Corporate', '3D', 'Modern', 'Playful', 'Luxury']).nullish(),
      referenceLinks: z.array(z.string().url()).nullish(),
      imageStyle: z.enum(['Minimal', 'Corporate', '3D', 'Modern']).nullish(),
      animationRequirement: z.boolean().default(false),
    })
    .nullish(),

  approvalWorkflow: z
    .object({
      reviewerName: z.string().max(255).nullish().or(z.literal('')),
      finalApproverName: z.string().max(255).nullish().or(z.literal('')),
      processSteps: z.array(z.string()).nullish(),
      approvalTiming: z.string().max(100).nullish().or(z.literal('')),
      revisionLimit: z.number().int().min(0).max(10).nullish(),
    })
    .nullish(),

  campaignDetails: z
    .object({
      marketingGoal: z.enum(['Brand Awareness', 'Leads', 'Sales']).nullish(),
      monthlyBudget: z.number().min(0).nullish(),
      duration: z.string().max(100).nullish().or(z.literal('')),
      targetLeads: z.number().int().min(0).nullish(),
      adPlatforms: z.array(z.string()).nullish(),
    })
    .nullish(),

  analyticsConfig: z
    .object({
      monthlyReport: z.boolean().default(true),
      kpiExpectations: z.string().max(1000).nullish().or(z.literal('')),
      leadTracking: z.boolean().default(false),
      engagementTracking: z.boolean().default(true),
    })
    .nullish(),

  socialAccess: z
    .object({
      metaBusinessManagerId: z.string().max(100).nullish().or(z.literal('')),
      adAccountId: z.string().max(100).nullish().or(z.literal('')),
      instagramHandle: z.string().max(100).nullish().or(z.literal('')),
      facebookPage: z.string().max(255).nullish().or(z.literal('')),
      linkedinPage: z.string().max(255).nullish().or(z.literal('')),
      youtubeChannel: z.string().max(255).nullish().or(z.literal('')),
      twitterHandle: z.string().max(100).nullish().or(z.literal('')),
    })
    .nullish(),

  competitors: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        website: z.string().url().nullish().or(z.literal('')),
        strengths: z.string().max(1000).nullish().or(z.literal('')),
        weaknesses: z.string().max(1000).nullish().or(z.literal('')),
      }),
    )
    .nullish(),

  contactInfo: z
    .object({
      personName: z.string().max(255).nullish().or(z.literal('')),
      phoneNumber: z.string().max(50).nullish().or(z.literal('')),
      email: z.string().email().nullish().or(z.literal('')),
      officeAddress: z.string().max(500).nullish().or(z.literal('')),
    })
    .nullish(),
});

export type CreateBrandDto = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = createBrandSchema.partial();
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;

// ─── Knowledge ────────────────────────────────────────────────────
export const createKnowledgeSourceSchema = z.object({
  brandId: z.string().uuid(),
  name: z.string().max(255).nullish(),
  type: z.enum(['pdf', 'docx', 'xlsx', 'csv', 'pptx', 'txt', 'url', 'text', 'manual', 'api', 'video_transcript']),
  sourceUrl: z.string().url().nullish(),
  text: z.string().max(70_000_000).nullish(), // ~50MB base64
  trustLevel: z.enum(['high', 'medium', 'low']).default('high'),
  syncFrequency: z.enum(['manual', 'daily', 'weekly', 'monthly']).default('manual'),
  locale: z.string().max(10).default('en-US'),
  metadata: z.record(z.unknown()).nullish(),
});
export type CreateKnowledgeSourceDto = z.infer<typeof createKnowledgeSourceSchema>;

export const knowledgeReviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
  note: z.string().max(2000).nullish(),
});
export type KnowledgeReviewDto = z.infer<typeof knowledgeReviewSchema>;

// ─── Content ──────────────────────────────────────────────────────
export const generateContentSchema = z.object({
  brandId: z.string().uuid().nullish(),
  briefId: z.string().uuid().nullish(),
  campaignId: z.string().uuid().nullish(),
  platform: z.string().min(1),
  type: z.string().min(1),
  topic: z.string().min(1).max(1000).nullish(),
  topics: z.array(z.string().min(1)).nullish(),
  category: z.string().nullish(),
  count: z.coerce.number().int().min(1).max(100).default(1).nullish(),
  additionalContext: z.string().max(2000).nullish(),
  tone: z.string().max(100).nullish(),
  temperature: z.number().min(0).max(2).nullish(),
  maxTokens: z.number().int().min(1).max(32000).nullish(),
  language: z.string().nullish(),
  cta: z.string().nullish(),
  creativity: z.number().min(0).max(2).nullish(),
  seoOptimized: z.boolean().nullish(),
  complianceStrictness: z.enum(['low', 'medium', 'high']).nullish(),
  approvalRequired: z.boolean().nullish(),
}).refine((value) => Boolean(value.brandId || value.briefId), {
  message: 'Either brandId or briefId is required',
  path: ['brandId'],
});
export type GenerateContentDto = z.infer<typeof generateContentSchema>;


export const updateContentSchema = z.object({
  body: z.string().min(1).max(50_000),
});
export type UpdateContentDto = z.infer<typeof updateContentSchema>;

// ─── Campaign ─────────────────────────────────────────────────────
export const campaignWorkflowMetadataSchema = z.object({
  source: z.enum(['manual', 'brief', 'clone']).default('manual'),
  sourceBriefId: z.string().uuid().nullish(),
  projectId: z.string().uuid().nullish(),
  customerId: z.string().uuid().nullish(),
  brandId: z.string().uuid().nullish(),
});
export type CampaignWorkflowMetadataDto = z.infer<typeof campaignWorkflowMetadataSchema>;

const campaignPayloadSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).nullish().or(z.literal('')),
  status: z.enum(['draft', 'active', 'completed', 'archived']).default('draft'),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
  clonedFromId: z.string().uuid().nullish(),
  metadata: campaignWorkflowMetadataSchema.nullish(),
});

export const createCampaignSchema = campaignPayloadSchema.refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
});
export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = campaignPayloadSchema.partial().refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
});
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;

// ─── Brief ────────────────────────────────────────────────────────
export const briefWorkflowMetadataSchema = z.object({
  projectId: z.string().uuid().nullish(),
  customerId: z.string().uuid().nullish(),
  brandId: z.string().uuid().nullish(),
  status: z.enum(['draft', 'in_review', 'approved']).default('draft'),
  source: z.enum(['manual', 'project', 'campaign']).default('manual'),
  deliverables: z.array(z.string().min(1).max(255)).max(20).default([]),
  constraints: z.array(z.string().min(1).max(500)).max(20).default([]),
});
export type BriefWorkflowMetadataDto = z.infer<typeof briefWorkflowMetadataSchema>;

export const createBriefSchema = z.object({
  campaignId: z.string().uuid().nullish(),
  objective: z.string().min(1).max(1000),
  audience: z.string().max(500).nullish(),
  platform: z.enum(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok']).nullish(),
  cta: z.string().max(200).nullish(),
  tone: z.string().max(100).nullish(),
  format: z.enum(['post', 'carousel', 'story', 'reel', 'article', 'newsletter']).nullish(),
  contentType: z.enum(['organic', 'ad', 'blog']).nullish(),
  businessGoal: z.string().max(500).nullish(),
  campaignTheme: z.string().max(500).nullish(),
  metadata: briefWorkflowMetadataSchema.nullish(),
});
export type CreateBriefDto = z.infer<typeof createBriefSchema>;

export const updateBriefSchema = createBriefSchema.partial();
export type UpdateBriefDto = z.infer<typeof updateBriefSchema>;

// ─── Approval ─────────────────────────────────────────────────────
export const requestApprovalSchema = z.object({
  contentId: z.string().uuid(),
  reviewType: z.enum(['internal', 'client', 'owner', 'legal']).default('internal'),
});
export type RequestApprovalDto = z.infer<typeof requestApprovalSchema>;

export const submitApprovalDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'revision_requested']),
  note: z.string().max(2000).nullish(),
  reason: z.string().max(2000).nullish(),
});
export type SubmitApprovalDecisionDto = z.infer<typeof submitApprovalDecisionSchema>;

export const bulkApprovalSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  note: z.string().max(2000).nullish(),
});
export type BulkApprovalDto = z.infer<typeof bulkApprovalSchema>;

// ─── Social Accounts ─────────────────────────────────────────────
export const connectSocialAccountSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok']),
  accountType: z.string().min(1).max(50).default('company'),
  externalId: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  accessToken: z.string().min(1).max(5000),
  refreshToken: z.string().max(5000).nullish(),
  tokenExpiresAt: z.coerce.date().nullish(),
  scopes: z.array(z.string().min(1).max(100)).max(50).default([]),
});
export type ConnectSocialAccountDto = z.infer<typeof connectSocialAccountSchema>;

// ─── Schedule ─────────────────────────────────────────────────────
export const createScheduleSchema = z.object({
  contentId: z.string().uuid().nullish(),
  campaignId: z.string().uuid().nullish(),
  socialAccountId: z.string().uuid(),
  scheduledAt: z.coerce.date().min(new Date()),
  timezone: z.string().max(100).default('UTC'),
  type: z.enum(['one_time', 'recurring']).default('one_time'),
  recurringRule: z.string().max(200).nullish(),
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
    .nullish(),
});
export type CreateAutomationDto = z.infer<typeof createAutomationSchema>;

// ─── Prompt ──────────────────────────────────────────────────────
export const createPromptSchema = z.object({
  module: z.enum(['social', 'ad', 'blog', 'email', 'compliance', 'analysis', 'generation']),
  layer: z.enum(['platform', 'business', 'brand', 'campaign']),
  name: z.string().min(1).max(255),
  template: z.string().min(1).max(20_000),
  abVariant: z.string().max(10).nullish(),
});
export type CreatePromptDto = z.infer<typeof createPromptSchema>;

// ─── Invite Team Member ──────────────────────────────────────────
export const inviteMemberSchema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
});
export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;

// ─── Customers ───────────────────────────────────────────────────
export const createCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255).nullish().or(z.literal('')),
  company: z.string().max(255).nullish().or(z.literal('')),
  phone: z.string().max(50).nullish().or(z.literal('')),
  status: z.enum(['active', 'lead', 'inactive']).default('active'),
  metadata: z.record(z.unknown()).nullish(),
});
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;

// ─── Projects ────────────────────────────────────────────────────
const projectPayloadSchema = z.object({
  customerId: z.string().uuid().nullish(),
  name: z.string().min(1).max(255),
  description: z.string().max(5000).nullish().or(z.literal('')),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
  budget: z.number().int().min(0).max(1_000_000_000).nullish(),
  metadata: z.record(z.unknown()).nullish(),
});

export const createProjectSchema = projectPayloadSchema.refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });
export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = projectPayloadSchema
  .partial()
  .refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;

// ─── API Key ─────────────────────────────────────────────────────
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1),
  expiresAt: z.coerce.date().nullish(),
});
export type CreateApiKeyDto = z.infer<typeof createApiKeySchema>;

// ─── LLM Settings ────────────────────────────────────────────────
export const updateLlmSettingsSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'fallback', 'nvidia']).nullish(),
  model: z.string().max(100).nullish(),
  temperature: z.number().min(0).max(2).nullish(),
  maxTokens: z.number().int().min(1).max(32000).nullish(),
  apiKey: z.string().max(500).nullish(),
  isFallbackEnabled: z.boolean().nullish(),
});
export type UpdateLlmSettingsDto = z.infer<typeof updateLlmSettingsSchema>;
