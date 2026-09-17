# Membra

NestJS modular monolith with Drizzle ORM and PostgreSQL (`app` schema).

## Stack

- NestJS + TypeScript
- Drizzle ORM + PostgreSQL
- Local PostgreSQL for development; Scaleway Serverless SQL (via `DATABASE_URL`) for deployed environments

```bash
cp .env.example .env
# set DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
npm install
npm run db:migrate
npm run db:seed:genders
npm run db:seed:activities
npm run db:seed:languages
npm run dev
```

Open [http://localhost:3000/api/docs](http://localhost:3000/api/docs). Health: [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Architecture (modular monolith)

Organize by **business module**, not by a global technical layer.

```text
src/
├── main.ts       # NestJS bootstrap
├── app.module.ts
├── modules/      # feature modules (auth, clubs, …)
├── db/           # shared Drizzle client + centralized PostgreSQL schema
├── docs/         # OpenAPI composition + Swagger UI
├── health/       # liveness / DB ping
└── shared/       # errors, HTTP helpers, validation
```

**Dependency direction**

```text
NestJS Controller (cookies, Zod pipe, guards)
  → UseCase.execute()
  → Repository(DbOrTx)
  → injected Drizzle client / transaction
```

- Controllers stay thin: validation pipes, session guard, cookie set/clear.
- Use cases own business workflows and open `db.transaction` when atomicity is required.
- Repositories accept `DbOrTx` so all writes in one use case share the same transaction.
- Modules expose a public API via `index.ts`; do not deep-import another module’s internals.
- Table definitions live only in `src/db/schema/`; modules import them from there.

Application errors live in `src/shared/errors` (`AppError`, `toHttpError`). Do not expose raw PostgreSQL/Drizzle errors to clients.

## Authentication

Cookie name: `membra_session` (HttpOnly, SameSite=Lax, Secure in production). Login identity is `user_credentials.email` (normalized lowercase). `user_emails` is a contact copy written on signup only.

Session TTL is 24 hours by default (signup and login). `rememberMe: true` on login extends to 7 days. Each user may have at most 5 active sessions; a sixth login revokes the oldest. Session capping uses `SELECT … FOR UPDATE` and needs a **direct or session-mode** Postgres connection (not transaction-mode PgBouncer / Neon pooled `-pooler.` URL).

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/signup` | Email + password; sets 24h session cookie |
| POST | `/api/auth/login` | Credentials email + password; optional `rememberMe` |
| GET | `/api/auth/active-sessions` | Lists sessions; `isCurrent` marks the cookie |
| POST | `/api/auth/logout` | Optional `sessionId`; omit to log out current cookie |
| POST | `/api/auth/forgot-password` | Generic 200; mailer after token commit |
| POST | `/api/auth/reset-password` | Single-use token consume; revokes all sessions |
| GET | `/api/users/me` | Current user; includes `profileComplete`, signed `avatars`, `primaryEmail`, `primaryPhone` |
| POST | `/api/users/complete-profile` | Session required. `genderId` from `GET /api/reference/genders` |
| PUT | `/api/users/avatars` | Session required. Multipart field `avatar` (JPEG, PNG, HEIC, HEIF, WebP, AVIF); server stores 384×384 / 96×96 / 32×32 AVIF as avatar1–3 on Scaleway |
| GET | `/api/users/avatars` | Session required. Signed GET URLs (1h) or null per slot |
| GET | `/api/reference/genders` | Reference rows from `app.genders` (`{ id, gender }`) |

Signup / login / forgot-password / reset-password are rate limited (5 requests / minute / IP).

Password hashing: Argon2id (`@node-rs/argon2`, 19 MiB, 2 iterations). Unknown emails still run a dummy verify so login timing does not enumerate accounts.

If `SMTP_HOST` and `SMTP_FROM` are unset, password-reset emails use a console mailer (logged, not delivered). The API still returns success; forgot-password never fails boot or the request because SMTP is missing.

Avatar uploads require Scaleway Object Storage env (`SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `SCW_S3_BUCKET`, region/endpoint). See `.env.example`.

CORS and CSRF Origin checks use `APP_BASE_URL` (and optional `CORS_ORIGINS`). Browser mutating requests with an `Origin` header must match that allowlist.

## Clubs

Any authenticated user can create a club and becomes its first admin (`club_admins`). Until a members table exists, **admins are the only members** — GET club detail and avatars require membership (404 for strangers). Country is stored as ISO alpha-2 `countryCode` (no countries table). Club avatars mirror user avatars (three AVIF sizes on Scaleway).

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/clubs/activities` | Activity catalog |
| GET | `/api/clubs/languages` | Language catalog |
| POST | `/api/clubs` | Multipart create; creator becomes admin; optional `avatar` file |
| GET | `/api/clubs/:clubId` | Club detail including signed `avatars` (**member/admin only**) |
| PATCH | `/api/clubs/:clubId` | Update profile / activities / languages (admin) |
| POST | `/api/clubs/:clubId/addresses` | Add structured address (admin) |
| PATCH | `/api/clubs/:clubId/addresses/:addressId` | Update address (admin) |
| POST | `/api/clubs/:clubId/addresses/:addressId/primary` | Make address primary (admin) |
| PUT | `/api/clubs/:clubId/avatars` | Multipart `avatar`; three size variants (admin) |
| GET | `/api/clubs/:clubId/avatars` | Signed avatar URLs (**member/admin only**) |

## API Documentation

| `ENABLE_API_DOCS` | Behavior |
|-------------------|----------|
| `true` | Docs always available |
| `false` | Docs always disabled (404) |
| unset | Enabled outside production; disabled in production |

Swagger UI: http://localhost:3000/api/docs  
OpenAPI JSON: http://localhost:3000/api/openapi.json (OpenAPI 3.1.0)

When a feature module exposes HTTP APIs, add OpenAPI docs under that module and append the registrar to [`src/docs/openapi/modules.ts`](src/docs/openapi/modules.ts). Tags should be module names (`Authentication`, `Clubs`), not technical layers.

## Database

Central schema: `src/db/schema/` (PostgreSQL schema `app`).

`DATABASE_URL` must be a **direct or session-mode** Postgres URL. Transaction-mode poolers break session capping (`SELECT … FOR UPDATE`).

```bash
npm run db:generate
npm run db:migrate
npm run db:seed:genders
```

- Do **not** use `db:push` as the production migration strategy.
- If adopting an already-populated database, mark the baseline migration applied without re-running its DDL (`scripts/mark-baseline-applied.mjs`).

## Scripts

```bash
npm run lint
npm test
npm run build
```

## Deploy (Scaleway test via GitHub Actions)

You create Scaleway resources in the console. GitHub Actions does not provision them. Pushing to `development` runs [`.github/workflows/deploy-test.yml`](.github/workflows/deploy-test.yml): lint/test/build, push a Docker image, migrate, update the Serverless Container, then `GET /api/health`.

Pull requests run [`.github/workflows/ci.yml`](.github/workflows/ci.yml) only.

Do not put test/production keys in `.env`. That file is local-only and is not copied into the image.

### Three API keys (do not mix)

- **Object Storage** access + secret: Scaleway container secret env vars (`SCW_ACCESS_KEY` / `SCW_SECRET_KEY`). Not in GitHub.
- **DB** IAM application: Postgres user is the application ID, password is the secret key. Same `DATABASE_URL` on the container and in GitHub (migrations).
- **Container** access + secret: GitHub Actions secrets only (registry push + container update). Not on the running API container.

`DATABASE_URL` must include `sslmode=require`, for example:

```text
postgresql://<db-application-id>:<db-secret-key>@<host>:5432/<database>?sslmode=require
```

If a client fails TLS/SNI, append `&options=databaseid%3D<database-id>`.

### GitHub Environment `test` secrets

These `SCW_ACCESS_KEY` / `SCW_SECRET_KEY` values are the **container** key, not Object Storage.

- `SCW_ACCESS_KEY`
- `SCW_SECRET_KEY`
- `SCW_DEFAULT_ORGANIZATION_ID`
- `SCW_DEFAULT_PROJECT_ID`
- `SCW_DEFAULT_REGION` (`nl-ams`)
- `CONTAINER_REGISTRY_ENDPOINT` (e.g. `rg.nl-ams.scw.cloud/membra-test`)
- `SCW_CONTAINER_ID`
- `DATABASE_URL`
- `CONTAINER_HEALTH_URL` (e.g. `https://<host>/api/health`)

Create the Environment under the repo **Settings → Environments → test**.

Optional catalogs seed (genders, activities, languages): **Actions → Deploy test → Run workflow → seed catalogs**. Do not seed `db:seed:dev-user` unless you want a test account.

### Scaleway console (test, region `nl-ams`)

- IAM: Object Storage app → bucket read/write; DB app → `ServerlessSQLDatabaseReadWrite`; Container app → registry **push** + Serverless Containers **update**.
- Serverless SQL database; copy the connection string for the **db** IAM application.
- Private Object Storage bucket for test avatars (prefer a bucket separate from production).
- Private Container Registry namespace.
- Serverless Containers namespace and public container (port **8080**, HTTP probe `/api/health`, 1024 MB RAM).

Runtime env on the **container** (use **secret** variables for `DATABASE_URL`, `SCW_SECRET_KEY`, and SMTP passwords — regular env vars are printed by the Scaleway CLI):

- `NODE_ENV=production` (the Docker image already sets this)
- `PORT` is injected by Scaleway from the container port (8080)
- `DATABASE_URL`
- `APP_BASE_URL` / `CORS_ORIGINS` (the public frontend/API origin, not `http://localhost:3000`)
- `SMTP_HOST` / `SMTP_FROM` (optional; without them password-reset emails are only logged). Add `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` as needed
- Object Storage: `SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `SCW_S3_BUCKET`, `SCW_DEFAULT_REGION`, `SCW_S3_ENDPOINT`
- `ENABLE_API_DOCS=true` if you want Swagger on test

