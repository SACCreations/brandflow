# BrandFlow — Agency-First SaaS Roadmap

Updated: May 2026

This document turns the current codebase into a concrete product roadmap.
It complements `../PLAN.md`, which now serves as the architecture and delivery index.

---

## Product thesis

BrandFlow should become an **agency-first AI brand and marketing operations platform**.

The codebase already contains the right primitives for that direction:

- multi-tenant workspaces
- subscriptions and token budgets
- customers and projects for agency delivery
- brand intelligence and knowledge ingestion
- prompt layering and quality control
- content generation, approvals, scheduling, and automation
- analytics and attribution scaffolding

The goal is not to invent a new platform from scratch.
The goal is to **productize and connect what already exists**.

---

## Target customers

### Primary ICP

**Agencies managing multiple clients, brands, and delivery workflows**

Typical users:

- agency owner
- strategist or account lead
- content operator
- approver or client reviewer
- performance/reporting lead

### Secondary ICP

**In-house marketing teams** using a single workspace with multiple brands or business units.

### Later expansion

**Enterprise teams** needing white-label, advanced governance, compliance, and SSO.

---

## Product pillars

### 1. Workspace and agency operations

Own the operating model for agencies:

- businesses and memberships
- parent/child workspace model
- customers and projects
- team roles and permissions
- future white-label support

**Key files and modules**

- `apps/api/src/modules/business`
- `apps/api/src/modules/customer`
- `apps/api/src/modules/project`
- `apps/api/src/modules/auth`
- `packages/db/prisma/schema.prisma`

### 2. Brand intelligence system

Build the brand brain that powers every downstream action:

- brands and governance
- knowledge ingestion
- source reviews and freshness
- layered prompts
- quality checks and factual grounding

**Key files and modules**

- `apps/api/src/modules/brand`
- `apps/api/src/modules/knowledge`
- `apps/api/src/modules/prompt`
- `apps/api/src/modules/quality`
- `packages/ai/src/*`

### 3. Planning and creation workflow

Connect planning directly to output:

- briefs
- campaigns
- templates
- generated content
- image and asset support
- versioning and editing

**Key files and modules**

- `apps/api/src/modules/brief`
- `apps/api/src/modules/campaign`
- `apps/api/src/modules/content`
- `apps/api/src/modules/template`
- `apps/api/src/modules/image`

### 4. Review and publishing operations

Turn generated work into shipped work:

- approval queues
- scheduling
- social connection management
- publish jobs and retries
- operational notifications

**Key files and modules**

- `apps/api/src/modules/approval`
- `apps/api/src/modules/scheduler`
- `apps/api/src/modules/social`
- `apps/api/src/modules/automation`

### 5. Analytics, billing, and learning loop

Make SaaS value and cost visible:

- analytics events
- performance metrics and attribution
- usage tracking
- token budgets
- subscriptions and billing controls

**Key files and modules**

- `apps/api/src/modules/analytics`
- `apps/api/src/modules/llm-settings`
- `packages/db/prisma/schema.prisma` (`Subscription`, `CostEvent`, `PerformanceMetric`)
- `apps/web/src/app/(dashboard)/analytics`
- `apps/web/src/app/(dashboard)/settings/billing`

---

## Current state summary

### Already strong

- API coverage across most major product pillars
- solid schema support for agency workflows
- auth/session bootstrap with workspace creation
- AI generation path with quality checks and cost event persistence
- early agency-facing UX via projects and clients
- a shared dashboard shell and navigation model

### Still uneven

The current web app has mixed fidelity.
Some areas are operational, while others are still visual placeholders.

#### More operational today

- `apps/web/src/app/(dashboard)/intelligence/brands/page.tsx`
- `apps/web/src/app/(dashboard)/campaigns/page.tsx`
- `apps/web/src/app/(dashboard)/projects/page.tsx`
- `apps/web/src/app/(dashboard)/settings/clients/page.tsx`
- `apps/web/src/app/(dashboard)/automations/page.tsx`

#### Still mock-heavy or incomplete

- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- `apps/web/src/app/(dashboard)/intelligence/knowledge/page.tsx`
- `apps/web/src/app/(dashboard)/analytics/page.tsx`
- `apps/web/src/app/(dashboard)/publish/social/page.tsx`
- `apps/web/src/app/(dashboard)/settings/billing/page.tsx`

### Strategic implication

The next wave should focus on:

1. stabilizing platform behavior
2. connecting agency workflows
3. replacing mock surfaces with live data
4. strengthening the end-to-end journey from intelligence to publishing

---

## Phased roadmap

## Phase 0 — Product framing and repo alignment

**Goal:** make the repository reflect one clear product story.

### Deliverables

- define BrandFlow as agency-first in repo docs
- separate architecture docs from roadmap docs
- align navigation terminology with product pillars
- identify mock vs live surfaces explicitly

### Success criteria

- `PLAN.md` reflects architecture and current implementation priorities
- roadmap exists in `docs/agency-first-saas-roadmap.md`
- implementation work can be tracked against a shared phase model

---

## Phase 1 — Platform stabilization

**Goal:** make the existing system reliable enough to productize.

### Focus areas

- tenant enforcement and permission behavior
- config and TypeScript/tooling cleanup
- auth/session consistency between API and web
- better operational visibility for queues and failures
- cleanup of prototype-only behavior in critical flows

### Main files and modules

- `apps/api/src/common/*`
- `apps/api/src/modules/auth/*`
- `apps/api/src/modules/business/*`
- `apps/web/src/store/auth.store.ts`
- `apps/web/src/lib/api-client.ts`
- `packages/tsconfig/*`

### Exit criteria

- workspace auth and refresh flows are stable
- tenant boundaries are consistently enforced
- current build/typecheck warnings are controlled
- core errors are visible and diagnosable

---

## Phase 2 — Agency operating core

**Goal:** turn the existing customer/project model into a first-class agency workflow.

### Focus areas

- clarify the client model
- support agency team workflows across customers, projects, campaigns, and brands
- unify client, project, and workspace relationships in UX
- improve team invitation and role behavior

### Main files and modules

- `apps/api/src/modules/customer/*`
- `apps/api/src/modules/project/*`
- `apps/api/src/modules/business/*`
- `apps/web/src/app/(dashboard)/settings/clients/*`
- `apps/web/src/app/(dashboard)/projects/*`
- `apps/web/src/app/(dashboard)/settings/team/*`

### Product decision to lock early

Choose the primary model:

1. **Client as CRM entity under one agency workspace**, or
2. **Client as child workspace using `Business.parentId`**

The schema can support both, but implementation should optimize for one first.

### Exit criteria

- agencies can manage clients and projects as one operating flow
- team and workspace concepts are clearer in navigation and data ownership
- downstream campaign/brand work can be tied to client/project context

---

## Phase 3 — Intelligence system productization

**Goal:** make the brand brain the core product differentiator.

### Focus areas

- ingestion reliability and status visibility
- source freshness and review workflows
- stronger brand-analysis and prompt transparency
- governance and knowledge health surfaced in UI
- connect knowledge quality to downstream generation quality

### Main files and modules

- `apps/api/src/modules/knowledge/*`
- `apps/api/src/modules/brand/*`
- `apps/api/src/modules/prompt/*`
- `apps/api/src/modules/quality/*`
- `apps/web/src/app/(dashboard)/intelligence/*`

### Exit criteria

- sources can be added, tracked, reviewed, and trusted operationally
- brand context is clearly derived from knowledge, not magic hand-waving
- prompt layers and governance affect real generation behavior

---

## Phase 4 — Planning and creation funnel

**Goal:** connect planning to generation as one workflow.

### Focus areas

- brief → campaign → generate content/image → edit/version → quality
- shared status model across campaigns, briefs, and content
- better draft behavior and handoff between screens
- templates as accelerators, not isolated CRUD data

### Main files and modules

- `apps/api/src/modules/brief/*`
- `apps/api/src/modules/campaign/*`
- `apps/api/src/modules/content/*`
- `apps/api/src/modules/template/*`
- `apps/api/src/modules/image/*`
- `apps/web/src/app/(dashboard)/create/*`
- `apps/web/src/app/(dashboard)/campaigns/*`

### Exit criteria

- users can go from idea to draft content in one connected path
- campaign health has real operational meaning
- content versions and quality checks are visible and trustworthy

---

## Phase 5 — Review, scheduling, publishing, and automation

**Goal:** make execution operationally real.

### Focus areas

- approval queues with meaningful status/SLA behavior
- reliable schedule creation and publish-job handling
- real connector strategy, starting with LinkedIn
- queue visibility, retries, and remediation workflows
- automation runs and logs that matter in daily operations

### Main files and modules

- `apps/api/src/modules/approval/*`
- `apps/api/src/modules/scheduler/*`
- `apps/api/src/modules/social/*`
- `apps/api/src/modules/automation/*`
- `apps/web/src/app/(dashboard)/review/*`
- `apps/web/src/app/(dashboard)/publish/*`
- `apps/web/src/app/(dashboard)/automations/*`

### Connector priority

Recommended order:

1. LinkedIn
2. X / Twitter
3. Instagram
4. Facebook

This matches the current agency-first, B2B-heavy product posture.

### Exit criteria

- approved content can be reliably scheduled and published
- at least one connector is production-quality
- automation runs can be monitored and trusted

---

## Phase 6 — Analytics, billing, and SaaS controls

**Goal:** expose value, cost, and plan-aware behavior.

### Focus areas

- dashboard metrics backed by live API data
- attribution from intelligence/content to performance
- Stripe lifecycle and billing UX
- token budgets, usage visibility, and gating
- plan-aware features and entitlement handling

### Main files and modules

- `apps/api/src/modules/analytics/*`
- `apps/api/src/modules/content/content.service.ts`
- `apps/api/src/config/stripe.config.ts`
- `apps/web/src/app/(dashboard)/dashboard/*`
- `apps/web/src/app/(dashboard)/analytics/*`
- `apps/web/src/app/(dashboard)/settings/billing/*`

### Exit criteria

- dashboards reflect live platform data
- customers can see usage and plan boundaries
- billing and AI consumption support a real SaaS business model

---

## Phase 7 — Enterprise and white-label expansion

**Goal:** add higher-order controls without breaking the core product.

### Focus areas

- white-label branding and custom domain support
- advanced roles and audit/reporting depth
- locale-aware governance and multi-market workflows
- possible SSO/SAML if driven by customer demand
- client-facing approval or portal experiences

### Main schema primitives already supporting this direction

- `Business.parentId`
- `Business.whiteLabel`
- audit log structures
- locale fields across business/brand/content/knowledge
- subscriptions and tiering

### Exit criteria

- agency-plus-enterprise scenarios are supportable without reworking the core domain model

---

## Release gates and validation

Every phase should be validated against real user journeys.

### Core journeys

1. register workspace and log in
2. invite team member
3. create client and project
4. create or analyze a brand
5. ingest knowledge source and review entries
6. create brief and campaign
7. generate content with brand context
8. request approval and approve/reject
9. schedule and publish
10. review analytics, usage, and ROI

### Minimum verification stack

- typecheck and build at workspace level
- API tests around core services and flows
- manual validation of the above user journeys
- removal or clear labeling of remaining mock UI

---

## What should happen next

### Recommended immediate implementation order

1. stabilize platform and tooling noise
2. harden the agency/customer/project model
3. convert mock dashboard and analytics surfaces into live data
4. make knowledge and publishing operationally trustworthy

### Immediate code targets

- `packages/tsconfig/*`
- `apps/api/src/common/*`
- `apps/api/src/modules/business/*`
- `apps/api/src/modules/customer/*`
- `apps/api/src/modules/project/*`
- `apps/web/src/app/(dashboard)/dashboard/*`
- `apps/web/src/app/(dashboard)/analytics/*`
- `apps/web/src/app/(dashboard)/settings/billing/*`

---

## Summary

BrandFlow already has the domain model and module map needed for an agency-first SaaS.
The roadmap is about **connecting, hardening, and productizing** those parts in the right order.

The first wave should prioritize reliability and agency operations.
The second wave should connect intelligence to execution.
The third wave should turn analytics, billing, and white-label depth into durable SaaS advantages.
