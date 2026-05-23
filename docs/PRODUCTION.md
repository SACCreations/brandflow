# Production Deployment Guide

## Environment Variables

### Required (API)
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/brandflow

# Redis  
REDIS_URL=redis://host:6379

# Encryption (32-char random string)
ENCRYPTION_KEY=<generate with: openssl rand -hex 16>

# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# JWT
JWT_SECRET=<generate with: openssl rand -hex 32>
JWT_EXPIRATION=7d

# Application
NODE_ENV=production
PORT=4000
CORS_ORIGINS=https://yourdomain.com
```

### Required (Web)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### Optional
```env
# Stripe (billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# S3/MinIO (image storage)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=brandflow-assets

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/v1/auth/google/callback

# Sentry (error tracking)
SENTRY_DSN=https://...@sentry.io/...

# Social (publishing)
META_APP_ID=...
META_APP_SECRET=...
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
```

## Docker Production Build

```bash
# Build all packages
pnpm install --frozen-lockfile
pnpm build

# API Docker
docker build -f apps/api/Dockerfile -t brandflow-api .

# Web Docker  
docker build -f apps/web/Dockerfile -t brandflow-web .
```

## Database Setup

```bash
# Run migrations
cd packages/db && npx prisma migrate deploy

# Seed data (optional)
npx prisma db seed
```

## Health Check

- **Full check**: `GET /health` — returns DB, Redis, and memory status
- **Readiness probe**: `GET /health/ready` — returns 200 if healthy, 503 if not

## Infrastructure Requirements

- PostgreSQL 16+ (with pgvector, pgcrypto, pg_trgm extensions)
- Redis 7+ (for BullMQ job queues)
- Node.js 20+
- MinIO or S3-compatible storage (for image assets)

## Monitoring

- All API requests include `x-correlation-id` header for distributed tracing
- AI requests are logged to `AIRequestLog` table with latency, tokens, and cost
- Sentry integration for error tracking (if SENTRY_DSN configured)
- Health endpoint exposes DB/Redis latency metrics

## Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS_ORIGINS to exact production domains
- [ ] Use strong ENCRYPTION_KEY (not placeholder)
- [ ] Enable Helmet CSP in production
- [ ] Set up rate limiting (ThrottlerModule already configured)
- [ ] Configure Stripe webhook signature verification
- [ ] Enable PostgreSQL RLS policies per tenant
- [ ] Rotate JWT_SECRET periodically
