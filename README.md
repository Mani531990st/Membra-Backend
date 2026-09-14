# Membra

NestJS modular monolith with Drizzle ORM and PostgreSQL (`app` schema).

## Stack

- NestJS + TypeScript
- Drizzle ORM + PostgreSQL
- Local PostgreSQL for development; Neon (via `DATABASE_URL`) for production

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

Session TTL is 24 hours by default (signup and login). `rememberMe: true` on login extends to 7 days. Each user may have at most 5 active sessions; a sixth login revokes the oldest. Session capping uses `SELECT … FOR UPDATE` and needs a **session-mode** Postgres connection (not transaction-mode PgBouncer / Neon pooled URL).

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/signup` | Email + password; sets 24h session cookie |
| POST | `/api/auth/login` | Credentials email + password; optional `rememberMe` |
| GET | `/api/auth/active-sessions` | Lists sessions; `isCurrent` marks the cookie |
| POST | `/api/auth/logout` | Optional `sessionId`; omit to log out current cookie |
| POST | `/api/auth/forgot-password` | Generic 200; mailer after token commit |
| POST | `/api/auth/reset-password` | Single-use token consume; revokes all sessions |
| GET | `/api/users/me` | Current user; includes `profileComplete` |
| POST | `/api/users/complete-profile` | Session required. `gender` is `male` \| `female` \| `others` |
| PUT | `/api/users/avatars` | Session required. Multipart field `avatar` (JPEG, PNG, HEIC, HEIF, WebP, AVIF); server stores original / 512px / 128px AVIF as avatar1–3 on Scaleway |
| GET | `/api/users/avatars` | Session required. Signed GET URLs (1h) or null per slot |
| GET | `/api/reference/genders` | Reference rows from `app.genders` |

Signup / login / forgot-password / reset-password are rate limited (5 requests / minute / IP).

Password hashing: Argon2id (`@node-rs/argon2`, 19 MiB, 2 iterations). Unknown emails still run a dummy verify so login timing does not enumerate accounts.

Production **refuses to boot** unless `SMTP_HOST` and `SMTP_FROM` are set. Development uses a console mailer.

Avatar uploads require Scaleway Object Storage env (`SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `SCW_S3_BUCKET`, region/endpoint). See `.env.example`.

CORS and CSRF Origin checks use `APP_BASE_URL` (and optional `CORS_ORIGINS`). Browser mutating requests with an `Origin` header must match that allowlist.

## Clubs

Any authenticated user can create a club and becomes its first admin (`club_admins`). Country is stored as ISO alpha-2 `countryCode` (no countries table). Club avatars mirror user avatars (three AVIF sizes on Scaleway).

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/clubs/activities` | Activity catalog |
| GET | `/api/clubs/languages` | Language catalog |
| POST | `/api/clubs` | Create club; creator becomes admin |
| GET | `/api/clubs/:clubId` | Club detail including signed `avatars` |
| PATCH | `/api/clubs/:clubId` | Update profile / activities / languages (admin) |
| POST | `/api/clubs/:clubId/addresses` | Add structured address (admin) |
| PATCH | `/api/clubs/:clubId/addresses/:addressId` | Update address (admin) |
| POST | `/api/clubs/:clubId/addresses/:addressId/primary` | Make address primary (admin) |
| PUT | `/api/clubs/:clubId/avatars` | Multipart `avatar`; three size variants (admin) |
| GET | `/api/clubs/:clubId/avatars` | Signed avatar URLs |

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
