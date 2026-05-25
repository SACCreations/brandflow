FROM node:20-alpine AS alpine
RUN apk update && apk add --no-cache libc6-compat python3 make g++

FROM alpine AS builder
# Set working directory
WORKDIR /app
RUN yarn global add pnpm turbo
COPY . .
# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune --scope=@brandflow/api --docker

FROM alpine AS installer
WORKDIR /app
RUN yarn global add pnpm
# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
# Generate Prisma Client
RUN pnpm --filter @brandflow/db run db:generate || true
RUN pnpm turbo run build --filter=@brandflow/api...

FROM alpine AS runner
WORKDIR /app
RUN yarn global add pnpm

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Copy pruned workspace
COPY --from=installer --chown=nestjs:nodejs /app .

WORKDIR /app/apps/api

# Start the server by default, this can be overwritten at runtime
CMD ["pnpm", "run", "start"]
EXPOSE 3001
