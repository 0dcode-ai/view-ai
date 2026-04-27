# Mobile Separation Architecture

This repository is now organized as a transition monorepo:

- `apps/api`: NestJS REST API for mobile clients.
- `apps/mobile`: Expo React Native app.
- `packages/shared`: DTO types, Zod schemas, and typed API client shared by API and mobile.
- root Next app: legacy web/admin app kept as a reference during migration.

## Local Development

1. Install workspace dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   - `apps/api` reads `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AUTH_DISABLED`, `DEV_USER_*`.
   - `apps/mobile` reads `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

3. Generate and push the API database schema:

   ```bash
   npm run prisma:generate -w apps/api
   npm run prisma:push -w apps/api
   ```

4. Run the separated API and mobile app:

   ```bash
   npm run dev:api
   npm run dev:mobile
   ```

For local development without Supabase Auth, set `AUTH_DISABLED=true` for `apps/api`.

## Data Migration

The migration is deliberately two-step so the legacy SQLite Prisma client and the new Postgres Prisma client do not conflict.

1. Export current SQLite data from the legacy app:

   ```bash
   npm run legacy:export
   ```

   This writes `data/legacy-export.json`.

2. Import public templates and legacy private data into Supabase/Postgres:

   ```bash
   BOOTSTRAP_USER_EMAIL="you@example.com" npm run migrate:legacy -w apps/api
   ```

The import also reads `data/interview-internal-reference.json` and upserts it into `QuestionTemplate`. Re-running the import is safe: question templates are deduped by `sourceKey`, and private legacy records are deduped by `legacyId`.

## API Contract

All business endpoints live under `/v1` and require `Authorization: Bearer <supabase-access-token>` unless `AUTH_DISABLED=true`.

Core resources:

- `/v1/daily`
- `/v1/knowledge`
- `/v1/question-templates`
- `/v1/resumes`
- `/v1/job-targets`
- `/v1/interviews`
- `/v1/reviews`
- `/v1/sprints`
- `/v1/labs`
- `/v1/experiences`
- `/v1/companies/:id/intel`

Swagger docs are exposed at `/docs` when `apps/api` is running.
