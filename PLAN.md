# BrandFlow — Implementation Plan

**AI Brand & Marketing Automation Platform**
Version 2.0 | May 2026

---

## 1. Architecture & Stack

### Monorepo (Turborepo)

```
brandflow/
├── apps/
│   ├── web/                  # Next.js 15 frontend
│   └── api/                  # NestJS backend
├── packages/
│   ├── ui/                   # shadcn/ui component library
│   ├── db/                   # Prisma schema, migrations, seed
│   ├── ai/                   # LLM gateway, prompt engine, quality control
│   └── shared/               # Types, constants, validators (zod)
├── infra/                    # Docker, docker-compose, IaC
├── docs/                     # ADRs, API docs, runbooks
├── turbo.json
├── package.json
├── .env.example
└── PLAN.md
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL 16 (Row-Level Security) |
| ORM | Prisma 6 |
| Cache | Redis 7 |
| Queue | BullMQ |
| Storage | S3-compatible (AWS S3 / MinIO local) |
| AI | Internal LLM Gateway (OpenAI, Anthropic, open-source fallback) |
| Auth | Custom JWT + refresh rotation, OAuth 2.0, optional SAML |
| Billing | Stripe (subscriptions, metering, invoices) |
| Observability | OpenTelemetry, structured JSON logging, Sentry |
| CI/CD | GitHub Actions |
| Containerization | Docker, docker-compose (dev), Kubernetes (prod) |

---

## 2. Backend Module Map

```
apps/api/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/               # AuthGuard, RolesGuard, TenantGuard
│   ├── interceptors/         # LoggingInterceptor, TenantInterceptor
│   ├── decorators/           # @CurrentUser, @Roles, @TenantId
│   ├── filters/              # GlobalExceptionFilter
│   ├── middleware/            # TenantContextMiddleware, RateLimitMiddleware
│   └── pipes/                # ZodValidationPipe
├── modules/
│   ├── auth/                 # Login, register, OAuth, MFA, sessions, tokens
│   ├── business/             # Workspace CRUD, onboarding, health score
│   ├── brand/                # Brand profiles, assets, governance rules
│   ├── knowledge/            # Ingestion pipeline, KB entries, staleness
│   ├── prompt/               # Versioned prompts, layers, A/B, routing
│   ├── content/              # Generator, editor, versions, briefs
│   ├── image/                # Image generation, compliance, alt text
│   ├── template/             # Template CRUD, placeholders, performance
│   ├── campaign/             # Campaign container, cloning, health score
│   ├── approval/             # Workflow engine, SLA, escalation, compliance
│   ├── social/               # Account connector, OAuth tokens, refresh
│   ├── scheduler/            # Scheduling, timezone, optimal time
│   ├── automation/           # Triggers, flows, blocks, error recovery
│   └── analytics/            # Event pipeline, metrics, learning loop
└── config/
    ├── database.config.ts
    ├── redis.config.ts
    ├── s3.config.ts
    ├── stripe.config.ts
    └── llm.config.ts
```

Each module follows NestJS convention:
```
modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.guard.ts
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── refresh-token.dto.ts
├── strategies/
│   ├── jwt.strategy.ts
│   ├── google.strategy.ts
│   └── github.strategy.ts
└── auth.spec.ts
```

---

## 3. Frontend Structure

```
apps/web/
├── app/                      # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── layout.tsx        # Sidebar + TopBar shell
│   │   ├── page.tsx          # Home dashboard
│   │   ├── intelligence/
│   │   │   ├── brands/
│   │   │   ├── knowledge/
│   │   │   └── prompts/
│   │   ├── planning/
│   │   │   ├── briefs/
│   │   │   └── campaigns/
│   │   ├── create/
│   │   │   ├── content/
│   │   │   ├── images/
│   │   │   ├── design/
│   │   │   └── templates/
│   │   ├── libraries/
│   │   │   ├── assets/
│   │   │   ├── content/
│   │   │   └── brand/
│   │   ├── review/
│   │   │   ├── approvals/
│   │   │   ├── compliance/
│   │   │   └── audit/
│   │   ├── publish/
│   │   │   ├── calendar/
│   │   │   ├── queue/
│   │   │   └── connections/
│   │   ├── automate/
│   │   │   ├── builder/
│   │   │   └── active/
│   │   ├── analytics/
│   │   │   ├── performance/
│   │   │   └── insights/
│   │   └── settings/
│   │       ├── workspace/
│   │       ├── team/
│   │       ├── billing/
│   │       ├── api-keys/
│   │       ├── integrations/
│   │       └── llm/
│   └── api/                  # Next.js API routes (BFF proxy)
├── components/
│   ├── layout/               # Sidebar, TopBar, Breadcrumbs
│   ├── content/              # ContentEditor, ContentCard
│   ├── brand/                # BrandProfileForm, BrandAssets
│   ├── campaign/             # CampaignBuilder, CampaignHealth
│   ├── calendar/             # CalendarView, ScheduleCard
│   ├── approval/             # ApprovalQueue, ReviewPanel
│   ├── automation/           # FlowBuilder, TriggerConfig
│   └── analytics/            # Charts, MetricCards
├── hooks/
├── lib/
│   ├── api-client.ts         # Typed fetch wrapper
│   ├── auth.ts               # Session management
│   └── utils.ts
├── stores/                   # Zustand stores
└── styles/
```

---

## 4. Database Schema (Core Entities)

All tables include: `id UUID PK DEFAULT gen_random_uuid()`, `created_at`, `updated_at`, `business_id UUID NOT NULL` (tenant key).

### Layer 0–1: Foundation

```prisma
model Business {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  parentId        String?  // Agency parent
  whiteLabel      Json?    // logo, domain, colors
  healthScore     Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  parent          Business?      @relation("AgencyChildren", fields: [parentId], references: [id])
  children        Business[]     @relation("AgencyChildren")
  memberships     Membership[]
  brands          Brand[]
  subscriptions   Subscription[]
  auditLogs       AuditLog[]
}

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  passwordHash    String?
  mfaEnabled      Boolean  @default(false)
  mfaSecret       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  memberships     Membership[]
  sessions        Session[]
}

model Membership {
  id              String   @id @default(uuid())
  userId          String
  businessId      String
  roleId          String
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id])
  business        Business @relation(fields: [businessId], references: [id])
  role            Role     @relation(fields: [roleId], references: [id])

  @@unique([userId, businessId])
}

model Role {
  id              String   @id @default(uuid())
  businessId      String?  // null = system role
  name            String
  permissions     Json     // string[]
  isCustom        Boolean  @default(false)
  createdAt       DateTime @default(now())

  memberships     Membership[]
}

model Session {
  id              String   @id @default(uuid())
  userId          String
  refreshToken    String   @unique
  deviceInfo      Json?
  expiresAt       DateTime
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id])
}

model Subscription {
  id              String   @id @default(uuid())
  businessId      String
  plan            String   // starter, growth, agency, enterprise
  status          String   // active, past_due, canceled, trialing
  stripeCustomerId    String?
  stripeSubscriptionId String?
  currentPeriodEnd    DateTime?
  seatLimit       Int      @default(3)
  tokenBudget     Int      @default(100000)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business        Business @relation(fields: [businessId], references: [id])
}

model AuditLog {
  id              String   @id @default(uuid())
  businessId      String
  userId          String?
  action          String
  entityType      String
  entityId        String?
  before          Json?
  after           Json?
  hash            String   // SHA-256 chain
  previousHash    String?
  createdAt       DateTime @default(now())

  business        Business @relation(fields: [businessId], references: [id])
}

model CostEvent {
  id              String   @id @default(uuid())
  businessId      String
  module          String   // generation, compliance, analysis
  model           String   // gpt-4o, claude-sonnet, etc.
  inputTokens     Int
  outputTokens    Int
  costCents       Int
  requestId       String
  createdAt       DateTime @default(now())
}
```

### Layer 2: Intelligence

```prisma
model Brand {
  id              String   @id @default(uuid())
  businessId      String
  name            String
  positioning     String?
  audience        String?
  tone            Json?    // string[]
  visualRules     Json?    // colors, typography, logo URLs
  governance      Json?    // banned phrases, required phrases, CTA prefs
  healthScore     Int      @default(0)
  version         Int      @default(1)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business        Business @relation(fields: [businessId], references: [id])
  knowledgeSources KnowledgeSource[]
  contents        Content[]
}

model KnowledgeSource {
  id              String   @id @default(uuid())
  businessId      String
  brandId         String
  type            String   // pdf, docx, url, text, api
  sourceUrl       String?
  fileName        String?
  status          String   // pending, processing, completed, failed
  lastIngested    DateTime?
  createdAt       DateTime @default(now())

  brand           Brand    @relation(fields: [brandId], references: [id])
  entries         KnowledgeEntry[]
}

model KnowledgeEntry {
  id              String   @id @default(uuid())
  businessId      String
  sourceId        String
  type            String   // fact, faq, claim, offer, pain_point, testimonial
  content         String
  confidence      Float    @default(1.0)
  isStale         Boolean  @default(false)
  staleAt         DateTime?
  embedding       Bytes?   // vector embedding for RAG
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  source          KnowledgeSource @relation(fields: [sourceId], references: [id])
}

model Prompt {
  id              String   @id @default(uuid())
  businessId      String?  // null = platform-level
  module          String   // social, ad, blog, compliance
  layer           String   // platform, business, brand, campaign
  name            String
  template        String   @db.Text
  version         Int      @default(1)
  isActive        Boolean  @default(true)
  abVariant       String?  // A, B, control
  performanceScore Float?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model QualityCheck {
  id              String   @id @default(uuid())
  businessId      String
  contentId       String
  passed          Boolean
  confidenceScore Float
  violations      Json?    // {type, severity, detail}[]
  checkedAt       DateTime @default(now())
}
```

### Layer 3–4: Planning & Creation

```prisma
model Campaign {
  id              String   @id @default(uuid())
  businessId      String
  name            String
  status          String   // draft, active, completed, archived
  healthScore     Int      @default(0)
  clonedFromId    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  briefs          Brief[]
  contents        Content[]
  schedules       Schedule[]
}

model Brief {
  id              String   @id @default(uuid())
  businessId      String
  campaignId      String?
  objective       String
  audience        String?
  platform        String?  // linkedin, instagram, facebook, twitter
  cta             String?
  tone            String?
  format          String?  // post, carousel, story, reel, article
  contentType     String?  // organic, ad, blog
  businessGoal    String?
  isComplete      Boolean  @default(false)
  createdAt       DateTime @default(now())

  campaign        Campaign? @relation(fields: [campaignId], references: [id])
  contents        Content[]
}

model Content {
  id              String   @id @default(uuid())
  businessId      String
  brandId         String
  briefId         String?
  campaignId      String?
  platform        String
  type            String   // post, caption, ad_copy, blog_snippet, hook, cta
  body            String   @db.Text
  status          String   // draft, in_review, revision_requested, approved, scheduled, published, archived
  qualityScore    Float?
  promptId        String?
  promptVersion   Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  brand           Brand    @relation(fields: [brandId], references: [id])
  brief           Brief?   @relation(fields: [briefId], references: [id])
  campaign        Campaign? @relation(fields: [campaignId], references: [id])
  versions        ContentVersion[]
  approvals       Approval[]
  qualityChecks   QualityCheck[]
  publishJobs     PublishJob[]
}

model ContentVersion {
  id              String   @id @default(uuid())
  contentId       String
  version         Int
  body            String   @db.Text
  editedBy        String?
  createdAt       DateTime @default(now())

  content         Content  @relation(fields: [contentId], references: [id])
}

model Asset {
  id              String   @id @default(uuid())
  businessId      String
  type            String   // image, logo, video, document
  fileName        String
  mimeType        String
  s3Key           String
  cdnUrl          String?
  tags            Json?    // string[]
  metadata        Json?
  version         Int      @default(1)
  createdAt       DateTime @default(now())
}

model Template {
  id              String   @id @default(uuid())
  businessId      String?  // null = global
  type            String   // social_post, ad, creative, campaign, workflow
  name            String
  body            String   @db.Text
  placeholders    Json?    // string[]
  performanceScore Float?
  usageCount      Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Layer 5–7: Operations

```prisma
model SocialAccount {
  id              String   @id @default(uuid())
  businessId      String
  platform        String   // linkedin, instagram, facebook
  accountType     String   // personal, company, page
  externalId      String
  name            String
  accessToken     String   // encrypted
  refreshToken    String?  // encrypted
  tokenExpiresAt  DateTime?
  scopes          Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  publishJobs     PublishJob[]
}

model Approval {
  id              String   @id @default(uuid())
  businessId      String
  contentId       String
  reviewerId      String?
  reviewType      String   // internal, client, owner
  status          String   // pending, approved, rejected, revision_requested
  slaDeadline     DateTime?
  note            String?
  reason          String?  // rejection reason
  decidedAt       DateTime?
  createdAt       DateTime @default(now())

  content         Content  @relation(fields: [contentId], references: [id])
}

model Schedule {
  id              String   @id @default(uuid())
  businessId      String
  contentId       String?
  campaignId      String?
  socialAccountId String
  scheduledAt     DateTime
  timezone        String   @default("UTC")
  type            String   // one_time, recurring
  recurringRule   String?  // cron expression
  status          String   // pending, published, cancelled
  createdAt       DateTime @default(now())

  campaign        Campaign? @relation(fields: [campaignId], references: [id])
}

model PublishJob {
  id              String   @id @default(uuid())
  businessId      String
  contentId       String
  socialAccountId String
  status          String   // pending, processing, published, failed, retrying, dead_letter
  failureReason   String?
  failureClass    String?  // token_expired, api_failure, invalid_media, rate_limit
  retryCount      Int      @default(0)
  maxRetries      Int      @default(3)
  nextRetryAt     DateTime?
  publishedAt     DateTime?
  externalPostId  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  content         Content       @relation(fields: [contentId], references: [id])
  socialAccount   SocialAccount @relation(fields: [socialAccountId], references: [id])
}

model Notification {
  id              String   @id @default(uuid())
  businessId      String
  userId          String
  type            String   // approval_pending, publish_failed, publish_success, token_expiry, sla_breach
  channel         String   // in_app, email, webhook
  title           String
  body            String?
  isRead          Boolean  @default(false)
  deliveredAt     DateTime?
  createdAt       DateTime @default(now())
}
```

### Layer 8–9: Automation & Analytics

```prisma
model Automation {
  id              String   @id @default(uuid())
  businessId      String
  name            String
  triggerType     String   // cron, event, webhook
  triggerConfig   Json     // cron expression, event name, webhook path
  steps           Json     // ordered block definitions
  isActive        Boolean  @default(false)
  isDryRun        Boolean  @default(false)
  errorPolicy     Json?    // retry counts, circuit breaker config
  lastRunAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AutomationRun {
  id              String   @id @default(uuid())
  automationId    String
  businessId      String
  status          String   // running, completed, failed, paused
  triggerEvent    Json?
  stepResults     Json?    // per-step outcome
  failedAtStep    Int?
  isDryRun        Boolean  @default(false)
  startedAt       DateTime @default(now())
  completedAt     DateTime?
}

model AnalyticsEvent {
  id              String   @id @default(uuid())
  businessId      String
  source          String   // publish, approval, generation, social_api
  eventType       String
  entityType      String?
  entityId        String?
  payload         Json
  createdAt       DateTime @default(now())
}

model PerformanceMetric {
  id              String   @id @default(uuid())
  businessId      String
  contentId       String
  platform        String
  reach           Int      @default(0)
  impressions     Int      @default(0)
  engagement      Int      @default(0)
  clicks          Int      @default(0)
  ctr             Float    @default(0)
  collectedAt     DateTime @default(now())
}
```

---

## 5. packages/ai — LLM Gateway Design

```
packages/ai/
├── src/
│   ├── gateway.ts            # Route requests to correct provider
│   ├── providers/
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   └── fallback.ts
│   ├── prompt-engine.ts      # Resolve prompt layers, inject context
│   ├── quality-control.ts    # Fact-check, hallucination detect, brand validate
│   ├── cost-tracker.ts       # Emit CostEvent per request
│   ├── rate-limiter.ts       # Per-business token budget enforcement
│   └── types.ts
├── package.json
└── tsconfig.json
```

**Request flow:**
```
User Request
  → Prompt Engine (resolve layers, inject brand/KB context)
  → Cost Check (budget remaining?)
  → LLM Gateway (route to provider)
  → Quality Control (fact-check, brand compliance)
  → Cost Event (emit usage)
  → Response
```

---

## 6. packages/db — Prisma + RLS

```
packages/db/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── client.ts             # PrismaClient singleton
│   ├── rls.ts                # SET app.current_tenant_id before queries
│   └── types.ts              # Re-export generated types
├── package.json
└── tsconfig.json
```

**Row-Level Security**: PostgreSQL RLS policies on every tenant-scoped table:
```sql
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON contents
  USING (business_id = current_setting('app.current_tenant_id')::uuid);
```

Prisma `$executeRaw` sets tenant context before each request via middleware.

---

## 7. Phased Delivery Plan

### Phase 1 — MVP (Weeks 1–12)

**Goal:** First paying customer publishes their first post.

| Week | Sprint Focus | Deliverables |
|------|-------------|-------------|
| 1–2 | **Infra & Foundation** | Monorepo setup (Turborepo), Docker dev env, PostgreSQL + Redis, Prisma schema (Foundation tables), RLS policies, CI pipeline, env config |
| 3–4 | **Auth & Billing** | Email/password auth, JWT + refresh rotation, OAuth (Google), MFA (TOTP), session management, Stripe integration (Starter plan), subscription lifecycle, TenantGuard |
| 5–6 | **Brand & Knowledge** | Brand CRUD + governance rules, knowledge ingestion pipeline (PDF, DOCX, URL, text), KB entry management, staleness detection, embedding generation |
| 7–8 | **AI Core & Content** | LLM Gateway (OpenAI + Anthropic), prompt engine (versioned, layered), content generator (social posts), quality control (fact-check + brand compliance), cost tracking |
| 9–10 | **Approval & Publishing** | Approval workflow (draft → approved → published), basic compliance checker (rule engine), LinkedIn connector (OAuth + publish), publishing queue + DLQ, scheduler (one-time) |
| 11–12 | **Dashboard & Polish** | Home dashboard, observability (structured logging, tracing, health checks), onboarding wizard, content editor (basic), rate limiting, E2E testing, staging deploy |

**Phase 1 Exit Criteria:**
- [ ] Auth flow complete (email + OAuth + MFA)
- [ ] At least 1 Stripe plan live with metering
- [ ] Brand → Knowledge → Generate → Approve → Publish flow works end-to-end
- [ ] LinkedIn publishing with DLQ and retry
- [ ] Publish success rate > 98%
- [ ] Quality control catches brand violations
- [ ] RLS enforced on all tenant tables
- [ ] Observability: logs, traces, error tracking live
- [ ] 3 paying businesses onboarded

### Phase 2 — Growth (Weeks 13–24)

**Goal:** Agency accounts live, automation running, multi-channel publishing.

| Week | Sprint Focus | Deliverables |
|------|-------------|-------------|
| 13–14 | **Image & Design** | Image generator (template-based + AI), image compliance, alt text, web design editor (canvas), asset library with CDN |
| 15–16 | **Multi-Channel** | Instagram connector, Facebook connector, per-platform preview, content calendar (monthly/weekly), drag-and-drop reschedule |
| 17–18 | **Campaign Module** | Campaign CRUD, briefs system, campaign health score, campaign cloning, cross-campaign view |
| 19–20 | **Automation Engine** | Trigger system (cron + event), flow builder UI, automation blocks (generate → approve → schedule → publish), basic error handling |
| 21–22 | **Agency & API** | Agency parent/child model, reseller billing, client portals, REST API (OpenAPI spec), API keys, webhook events, developer docs |
| 23–24 | **Analytics v1** | Analytics event pipeline, performance dashboard (reach, engagement, CTR), content library with performance tagging, best-time-to-post |

**Phase 2 Exit Criteria:**
- [ ] 3 social platforms publishing successfully
- [ ] Campaign → multi-post → multi-channel flow works
- [ ] At least 1 automation running in production
- [ ] Agency with 3+ child businesses active
- [ ] Public API serving external integrations
- [ ] Analytics dashboard showing real metrics

### Phase 3 — Scale (Weeks 25–40)

**Goal:** Enterprise accounts, platform intelligence, self-optimizing system.

| Week | Sprint Focus | Deliverables |
|------|-------------|-------------|
| 25–28 | **Intelligence Loop** | Learning loop (performance → prompt optimization), prompt A/B testing framework, regression detection, content decay tracking |
| 29–32 | **Advanced Automation** | Error recovery (step-level retry, circuit breaker), dry-run mode, flow simulation, human escalation, partial flow recovery |
| 33–36 | **Enterprise** | SAML SSO, white-label (custom domain, branding), multi-language + locale, GDPR tooling (export, delete, DPA), data warehouse export |
| 37–40 | **Mobile & Scale** | PWA (approval on mobile, push notifications), cross-business recommendations, advanced analytics (cohort analysis, comparative periods), platform admin dashboard |

---

## 8. Key Infrastructure Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Tenant isolation** | PostgreSQL RLS | DB-level enforcement, no app-layer leaks |
| **Auth tokens** | JWT access (15min) + refresh rotation (7d) | Stateless auth with revocation capability |
| **Queue** | BullMQ on Redis | Native Node.js, reliable, DLQ support built-in |
| **File storage** | S3 + CDN (CloudFront) | Scalable, MinIO for local dev |
| **AI routing** | Internal gateway, not direct API calls | Cost tracking, fallback chains, prompt versioning |
| **Audit log** | Append-only with SHA-256 chain | Compliance-ready, tamper-evident |
| **Billing events** | Emit on every AI call | Usage-based pricing requires accurate metering from day 1 |
| **Prompt management** | Versioned in DB, not hardcoded | Rollback, A/B test, regression tracking |
| **API design** | REST + OpenAPI | SDK generation, developer portal |
| **State management (FE)** | Zustand + TanStack Query | Lightweight, server-state focused |

---

## 9. Development Environment Setup

```bash
# Prerequisites
node >= 20, pnpm >= 9, docker, docker-compose

# Clone & install
git clone <repo> && cd brandflow
pnpm install

# Start infrastructure
docker-compose up -d  # PostgreSQL, Redis, MinIO

# Setup database
pnpm --filter db db:push
pnpm --filter db db:seed

# Run development
pnpm dev  # Starts both web (3000) and api (4000)
```

### docker-compose services:
- `postgres:16` — port 5432
- `redis:7` — port 6379
- `minio` — port 9000 (S3-compatible local storage)

---

## 10. Testing Strategy

| Type | Tool | Coverage Target |
|------|------|----------------|
| Unit | Vitest | Services, utilities, prompt engine |
| Integration | Vitest + Testcontainers | DB queries, queue processing, API endpoints |
| E2E | Playwright | Critical flows: auth → generate → approve → publish |
| API | Supertest | All REST endpoints |
| Load | k6 | Publishing queue, AI gateway under load |

**Critical test scenarios (Phase 1):**
1. Full publish flow: brand → knowledge → generate → quality check → approve → schedule → publish
2. Tenant isolation: User A cannot see User B's data
3. DLQ: Failed publish → retry → dead letter → manual retry
4. Cost enforcement: Hard limit blocks generation
5. Token refresh: Expired OAuth token → auto-refresh → retry publish

---

## 11. Security Checklist

- [x] Password hashing: argon2id
- [x] JWT: short-lived access (15min), refresh rotation
- [x] RLS on all tenant tables
- [x] Rate limiting per endpoint per business
- [x] Prompt injection detection on user inputs
- [x] Content safety filter on AI outputs
- [x] OAuth token encryption at rest
- [x] CORS restricted to known origins
- [x] CSRF protection on state-changing endpoints
- [x] Input validation (Zod) on all endpoints
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] File upload validation (type, size, content scanning)
- [x] Secrets management (env vars, never in code)
- [x] Audit logging on all sensitive actions

---

## 12. Monitoring & Alerting

| Metric | Threshold | Action |
|--------|-----------|--------|
| Publish success rate | < 98% | Page on-call |
| API p95 latency | > 2s | Alert in Slack |
| Queue backlog | > 100 jobs | Alert + scale workers |
| Error rate | > 1% of requests | Page on-call |
| Token budget at 80% | Per business | Notify business admin |
| OAuth token expiry | 7 days before | Notify + in-app prompt |
| DLQ depth | > 10 jobs | Alert + dashboard flag |
| AI quality check failure rate | > 20% | Alert AI team |

---

*BrandFlow — Implementation Plan v2.0*
*Generated May 2026*
