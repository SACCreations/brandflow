# BrandFlow Production Deployment Guide

This document outlines the steps to deploy the BrandFlow monorepo to production. The architecture is split between a Next.js frontend (deployed to Vercel) and a NestJS backend (deployed to a container platform like Render or Railway).

---

## 1. Environment Variables

Before deploying, ensure you have the following secrets ready.

### Shared / Database
- `DATABASE_URL`: Production PostgreSQL connection string (e.g., Supabase, Neon).
- `REDIS_URL`: Production Redis URL for BullMQ (e.g., Upstash).

### Backend (`apps/api`)
- `JWT_SECRET`: A secure random string for signing auth tokens.
- `STRIPE_SECRET_KEY`: Live Stripe API secret key.
- `STRIPE_WEBHOOK_SECRET`: Live Stripe Webhook secret (retrieved after setting up the webhook endpoint).
- `OPENAI_API_KEY`: Production OpenAI API key.

### Frontend (`apps/web`)
- `NEXT_PUBLIC_API_URL`: The deployed URL of your backend (e.g., `https://api.brandflow.com`).

---

## 2. Deploying the Frontend (Vercel)

The `apps/web` project is pre-configured with a `vercel.json` for seamless deployment.

1. Connect your GitHub repository to Vercel.
2. Ensure the **Root Directory** in Vercel settings is set to `apps/web`.
3. Vercel will automatically detect the custom `buildCommand` and `installCommand` specified in `vercel.json` that leverage `turbo` to build the workspace efficiently.
4. Add the `NEXT_PUBLIC_API_URL` to Vercel's Environment Variables settings.

---

## 3. Deploying the Backend (Render/Railway/AWS)

The `apps/api` project contains a production-ready, multi-stage `Dockerfile` optimized for Turborepo.

1. Connect your GitHub repository to your container hosting provider.
2. Set the **Root Directory** (or build context) to the **Root of the Monorepo** (not `apps/api`), because Turborepo needs the root `pnpm-workspace.yaml` and `turbo.json` to prune and build the workspace.
3. Specify the Dockerfile path as `apps/api/Dockerfile`.
4. The build process uses `turbo prune` to extract only the `@brandflow/api` dependencies, resulting in a minimal production image.
5. Provide all required backend Environment Variables to the container instance.

---

## 4. Database Migrations

By default, the backend Dockerfile generates the Prisma Client (`db:generate`) but **does not** automatically apply schema migrations (`db:migrate` or `db:push`) to prevent destructive actions on boot.

For production, it is recommended to run migrations manually or via a CI/CD pipeline step prior to deploying the API instance:

```bash
cd packages/db
npx prisma migrate deploy
```
