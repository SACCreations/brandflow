# BrandFlow — Architecture & Delivery Index

**Agency-first AI brand and marketing operations platform**  
Updated: May 2026

This file is the architecture and execution index for the repository.

- For the product roadmap, see `docs/agency-first-saas-roadmap.md`
- For the source-of-truth domain model, see `packages/db/prisma/schema.prisma`
- For the current module wiring, see `apps/api/src/app.module.ts`

---

## 1. Product direction

BrandFlow is being built as a top-level SaaS product for teams that run brand, content, approvals, publishing, and performance workflows in one place.

The current implementation direction is:

- **Serve both segments eventually, but optimize first for agencies**
- Support **multi-client delivery**, **brand intelligence**, **content operations**, and **usage-based AI workflows**
- Grow from a strong backend/module foundation into a cohesive product experience instead of a set of isolated tools

### Primary ICP

1. **Agency owners and operators** managing multiple clients, brands, and projects
2. **Marketing teams** running one workspace with multiple contributors
3. **Future enterprise customers** needing white-label, governance, and compliance controls

---

## 2. Repository structure

```text
brandflow/
├── apps/
│   ├── api/                  # NestJS API and async workers
│   └── web/                  # Next.js dashboard application
├── packages/
│   ├── ai/                   # LLM gateway, prompt engine, quality control
│   ├── db/                   # Prisma schema, client, seed, RLS helpers
│   ├── shared/               # Shared types, validators, constants
│   ├── tsconfig/             # Central TS config presets
│   └── ui/                   # Shared React UI primitives
├── docs/                     # Product docs, ADRs, runbooks, roadmap
├── infra/                    # Local infra and deployment support
├── package.json
├── turbo.json
└── PLAN.md
```

### Runtime defaults

- Web local dev: `http://localhost:3002`
- API local dev: `http://localhost:4000`
- API docs in development: `http://localhost:4000/docs`

---

## 3. Architecture overview

### Application layers

| Layer | Responsibility | Main locations |
| --- | --- | --- |
| Experience | Auth, dashboard, workspace flows, dashboards, editors | `apps/web` |
| API | Business logic, auth, queues, publishing, SaaS rules | `apps/api` |
| Domain model | Multi-tenant schema and relations | `packages/db/prisma/schema.prisma` |
| AI platform | Provider routing, prompt resolution, quality control, cost tracking | `packages/ai` |
| Shared contracts | DTOs, schemas, constants, types | `packages/shared` |
| Design system | Shared UI components and utility functions | `packages/ui` |

### Core system shape

1. **Workspace and access** — auth, memberships, roles, sessions, subscriptions
2. **Agency operating model** — businesses, child businesses, customers, projects
3. **Intelligence system** — brands, knowledge sources, entries, prompts, quality
4. **Planning and creation** — briefs, campaigns, content, templates, assets
5. **Operations layer** — approvals, schedules, publish jobs, social accounts, notifications
6. **Learning and monetization** — analytics events, performance metrics, cost events, LLM settings

---

## 4. Backend module inventory

The API already exposes most of the platform surface through top-level feature modules:

| Module | Purpose | Current role in product |
| --- | --- | --- |
| `auth` | Register, login, refresh, MFA, OAuth, sessions | Core foundation |
| `business` | Workspace settings, members, invites | Core foundation |
| `brand` | Brand identities, health score, AI analysis | Strategic differentiator |
| `knowledge` | Ingestion pipeline, entries, reviews, jobs | Strategic differentiator |
| `prompt` | Layered prompt versioning | AI control plane |
| `content` | AI generation, versions, quality, cost tracking | Core creation engine |
| `brief` | Brief capture and AI suggestions | Planning layer |
| `campaign` | Campaign grouping and health | Planning layer |
| `approval` | Review queue and decisions | Operations layer |
| `social` | Social account connection and token handling | Operations layer |
| `scheduler` | Scheduling and publish queue handoff | Operations layer |
| `automation` | Triggered workflow execution | Growth/scale layer |
| `analytics` | Event collection and attribution | Monetization/learning layer |
| `customer` | Client CRM records | Agency operating model |
| `project` | Client delivery/projects | Agency operating model |
| `image` | Asset upload and creative generation scaffolding | Creation support |
| `template` | Reusable content templates | Creation support |
| `llm-settings` | Per-business provider and API-key config | AI controls |
| `quality` | Content validation and remediation | Governance layer |

---

## 5. Frontend product surface

The Next.js dashboard is broad, but current maturity is mixed.

### Already API-backed or close to operational

- `intelligence/brands`
- `campaigns`
- `projects`
- `settings/clients`
- `automations`
- auth flows and shared dashboard shell

### Present in navigation but still static, mock-heavy, or partial

- `dashboard`
- `intelligence/knowledge`
- `analytics`
- `publish/social`
- `settings/billing`
- parts of review/publish/intelligence monitoring

### Practical implication

The main implementation focus is **productization**:

- connect currently isolated CRUD flows into full journeys
- convert mock dashboards into live API-backed screens
- tighten information architecture around the agency-first experience

---

## 6. Domain model highlights

The Prisma schema already supports the intended SaaS shape.

### Strong foundations already present

- **Hierarchical workspaces** through `Business.parentId`
- **White-label potential** through `Business.whiteLabel`
- **Usage and billing primitives** through `Subscription`, `CostEvent`, `LlmSettings`
- **Agency operations** through `Customer` and `Project`
- **Brand intelligence** through `Brand`, `KnowledgeSource`, `KnowledgeEntry`, `Prompt`, `QualityCheck`
- **Execution system** through `Approval`, `Schedule`, `PublishJob`, `Automation`, `AutomationRun`
- **Learning loop** through `AnalyticsEvent` and `PerformanceMetric`

### Source of truth

Do not duplicate the schema here. Use:

- `packages/db/prisma/schema.prisma` as the canonical data model
- `packages/db/src/rls.ts` for tenant-context and isolation behavior

---

## 7. Product maturity snapshot

### What is already strong

- broad backend module coverage
- coherent multi-tenant schema
- AI generation path with cost tracking and quality checks
- auth/session bootstrapping and workspace creation
- early agency-facing surfaces via clients and projects

### What still needs product work

- real social connectors and publish reliability
- live analytics and billing UX
- better permissions and tenant-context enforcement depth
- replacement of mock dashboards with production data
- clearer agency/client workspace UX and navigation

---

## 8. Current implementation priorities

### Priority 1 — Platform stabilization

- tighten tenant and permission enforcement
- reduce configuration drift and tooling warnings
- improve operational visibility around generation, approvals, queues, and publishing

### Priority 2 — Agency operating core

- connect business, customers, projects, and brands into one coherent workflow
- support agency teams managing multiple client engagements without screen-hopping

### Priority 3 — Intelligence-to-execution loop

- brand + knowledge → prompt resolution → content generation → approval → schedule → publish → analytics

### Priority 4 — Monetization and controls

- live billing, entitlements, usage dashboards, token budgets, and plan-aware feature gating

The detailed phased roadmap for this work lives in `docs/agency-first-saas-roadmap.md`.

---

## 9. Engineering conventions for this repo

- Use the root workspace package manager: **pnpm**, not per-package npm installs
- Prefer root scripts such as `pnpm build`, `pnpm typecheck`, and `pnpm test`
- Treat `packages/db/prisma/schema.prisma` as the canonical domain contract
- Prefer shared package changes over duplicating logic inside `apps/api` or `apps/web`
- Keep navigation aligned with features that are genuinely live; do not overexpose mock screens

---

## 10. Document map

| Document | Purpose |
| --- | --- |
| `PLAN.md` | Architecture, repo structure, implementation priorities |
| `docs/agency-first-saas-roadmap.md` | Product roadmap, phases, release sequencing |
| `packages/db/prisma/schema.prisma` | Canonical domain model |
| `apps/api/src/app.module.ts` | Active backend module composition |
| `apps/web/src/components/layout/sidebar.tsx` | Current product navigation and IA |

---

## 11. Immediate execution checklist

- [ ] stabilize TypeScript/tooling warnings and shared config drift
- [ ] document the agency-first roadmap in repo docs
- [ ] convert dashboard, analytics, knowledge, and billing screens from mock to live data
- [ ] formalize the agency/client/project operating flow
- [ ] connect the end-to-end intelligence-to-publishing journey

---

*BrandFlow architecture index — maintained alongside active implementation.*
