# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/survey-engine/package.json packages/survey-engine/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY packages/billing/package.json packages/billing/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @surveymasterai/database generate
RUN pnpm --filter @surveymasterai/web build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start", "-p", "3000"]
