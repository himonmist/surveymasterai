# SurveyMasterAI

AI-powered survey, research and analytics platform. Create surveys from a sentence, a document, or a template; collect responses; get AI-generated analytics and executive reports — all inside a multi-tenant SaaS with RBAC, configurable subscription plans, and a Super Admin console.

This repository is a working implementation of the product's **foundation and core survey lifecycle** (Phases 1–6 of the roadmap below), built to be extended rather than a static mockup: every screen is backed by a real Postgres database, real auth, and a real (if pluggable) AI layer.

## Quick start

Prerequisites: Node 20+, pnpm 10+, PostgreSQL 16, Redis (optional in this phase — see [What's not wired up](#whats-not-wired-up-yet)).

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# edit .env — the defaults work against a local Postgres at
# postgresql://surveymaster:surveymaster_dev@localhost:5432/surveymasterai

# 3. Create the database (or use docker-compose, see below)
createdb surveymasterai

# 4. Generate the Prisma client, run migrations, seed demo data
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Run the app
pnpm dev
```

Open http://localhost:3000. The seed script prints demo credentials, also shown on the login screen:

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@surveymasterai.dev` | `Demo123!` |
| Org Admin | `sarah@acme-demo.com` | `Demo123!` |
| Manager | `marcus@acme-demo.com` | `Demo123!` |
| Respondent | `james@acme-demo.com` | `Demo123!` |

### Docker Compose

```bash
docker compose up --build
```

Spins up Postgres, Redis, and the app. Run migrations/seed once against the containerized Postgres the same way as above (point `DATABASE_URL` at `localhost:5432`).

## Architecture

Monorepo managed with pnpm workspaces:

```
apps/
  web/                  Next.js 14 (App Router) — UI + REST API routes
packages/
  database/             Prisma schema, client, seed script
  auth/                 Password hashing, RBAC permission matrix, tokens
  survey-engine/        Survey JSON schema (zod), branching-logic evaluator, response validation
  ai/                   AIProvider abstraction: dev (offline, deterministic) + OpenAI + Anthropic
  billing/               PaymentProvider abstraction: dev (auto-activates) + Stripe
  config/                Default plan catalog, feature flags (seed data, not hard-coded limits)
infrastructure/docker/   Production Dockerfile
```

**Multi-tenancy**: every survey, response, member, and subscription row is scoped by `organizationId`, and every API route re-derives the caller's organization from their session before touching data — there is no client-supplied tenant id.

**RBAC**: `ORG_ADMIN`, `MANAGER`, `RESPONDENT` org roles plus a platform-level `isSuperAdmin` flag on the user record. The permission matrix lives in `packages/auth/src/rbac.ts` and is enforced in every mutating API route via `resolveApiOrgContext` + `requirePermissionOrError`.

**Survey data model**: `Survey → SurveySection → Question → QuestionOption / QuestionLogic`, plus `SurveyResponse → ResponseAnswer`. The builder UI mutates this graph directly through granular REST endpoints (`/api/v1/surveys/:id/sections`, `.../questions/:id`, `.../questions/reorder`, …); AI-driven edits (chat assistant, "improve survey") replace the whole section/question tree in one transaction.

**AI layer**: `packages/ai` defines an `AIProvider` interface (`generateSurvey`, `improveSurvey`, `checkQuality`, `analyzeResponses`, `generateExecutiveReport`, `chatAssistant`). The default `AI_PROVIDER=dev` implementation is a deterministic, offline generator — template-matching plus heuristic question synthesis — so the entire AI-generation → quality-check → AI-insights journey works with **no API key**. Setting `AI_PROVIDER=openai` or `anthropic` with the matching API key switches to a real LLM for generation and analysis; if the call fails or no key is set, it falls back to the dev provider rather than breaking the app.

**Billing**: `packages/billing` defines a `PaymentProvider` interface. `PAYMENT_PROVIDER=dev` (default) activates subscriptions immediately with no charge, so plan upgrades/downgrades and usage-limit enforcement work out of the box. `PAYMENT_PROVIDER=stripe` creates a real Stripe Checkout Session for paid plans (webhook finalization is not wired — see roadmap).

**Plans are data, not code**: `Plan` rows (price, survey/response/AI-credit/team-member limits, feature flags) are seeded from `packages/config/src/plans.ts` but live entirely in the database. Super Admin can edit them at `/admin/plans`; limits are enforced in `apps/web/lib/limits.ts`.

## What's implemented

Following the phased roadmap in the product spec:

- **Phase 1 — Foundation**: auth (credentials + bcrypt), registration creates an org, RBAC, multi-tenant data access, dashboard shells per role, design system (Tailwind).
- **Phase 2 — Survey engine**: drag-and-drop builder (`@dnd-kit`), 26 question types, sections, per-question conditional SHOW/HIDE logic, validation config, themed public respondent UI, preview.
- **Phase 3 — Response engine**: public survey pages with autosave (localStorage + server draft), password/org-only/private access control, anonymous responses, resume-later, submission + thank-you.
- **Phase 4 — Analytics**: per-survey dashboard (completion rate, per-question charts via Recharts — bar/NPS/averages/word-frequency), CSV export.
- **Phase 5 — AI**: AI survey generation from text, AI quality scoring (leading/duplicate/double-barrelled/missing-options detection), "Ask AI about my survey", AI executive report, in-builder AI chat copilot ("add 3 questions about X", "make question 2 a likert scale", "make this survey shorter").
- **Phase 6 — SaaS**: configurable plans, subscriptions, usage-limit enforcement (surveys/responses/AI credits/team members), pricing page driven entirely by DB data, Super Admin dashboard (platform KPIs, organizations, plan editor).
- **Phase 7 — Enterprise (partial)**: audit logging, org branding fields. SSO, white-label domains, webhooks, and the public OpenAPI-documented REST surface are not built — see below.

## What's not wired up yet

Being upfront about the gap between this codebase and the full 74-section spec:

- **Document/screenshot → survey (OCR/vision)**: the AI provider abstraction supports it in principle (`generateSurvey` could accept a document), but file upload, OCR, and vision-model parsing are not implemented — the file upload question type also just records a filename.
- **Redis**: included in docker-compose and `.env.example` for sessions/caching/queues/rate-limiting, but nothing in the app currently uses it — auth uses JWT sessions, and there's no background job queue (BullMQ) yet. AI/report generation runs synchronously in the request.
- **Object storage (S3)**: abstraction is stubbed in `.env.example` only; no file/report upload path exists yet.
- **Stripe webhooks**: Checkout Session creation exists; the `/api/webhooks/stripe` handler to finalize the subscription after payment does not.
- **Email provider**: invitations return a copyable link in the UI instead of sending an email (no SMTP/provider wired).
- **SSO / white-label custom domains / marketplace**: schema has room for them (`customDomain` on `Organization`) but no implementation.
- **i18n, WCAG audit, E2E test suite**: not built in this pass.

None of these are silently mocked in a way that would mislead a user — they're either absent, or (AI/payments) backed by a working, clearly-named "dev" provider with a real abstraction ready for a production provider to be dropped in.

## Environment variables

See `.env.example` for the full list. The important ones:

- `AI_PROVIDER`: `dev` (default, offline) | `openai` | `anthropic`
- `PAYMENT_PROVIDER`: `dev` (default, auto-activates) | `stripe`
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`

## Scripts

```bash
pnpm dev              # start the web app in dev mode
pnpm build            # build the web app for production
pnpm db:generate      # regenerate the Prisma client
pnpm db:migrate       # create/apply a dev migration
pnpm db:seed          # seed demo org, users, templates, sample responses
pnpm db:studio        # open Prisma Studio
```
