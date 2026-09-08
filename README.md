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
npm run dev
```

Open [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

## Architecture (modular monolith)

Organize by **business module**, not by a global technical layer.

```text
src/
├── main.ts       # NestJS bootstrap
├── app.module.ts
├── modules/      # feature modules (auth, …) — add when building features
├── db/           # shared Drizzle client + centralized PostgreSQL schema
├── docs/         # OpenAPI composition + Swagger UI
└── shared/       # errors, HTTP helpers, validation
```

**Dependency direction**

```text
NestJS Controller
  → UseCase.execute()
  → Repository(DbOrTx)
  → shared db / transaction
```

- Controllers stay thin; no multi-step DB workflows or business rules.
- Use cases own business workflows and open `db.transaction` when atomicity is required.
- Repositories accept `DbOrTx` so all writes in one use case share the same transaction.
- Modules expose a public API via `index.ts`; do not deep-import another module’s internals.
- Table definitions live only in `src/db/schema/`; modules import them from there.
- Build modules **incrementally** when implementing real features — no empty boilerplate trees.

Application errors live in `src/shared/errors` (`AppError`, `toHttpError`). Do not expose raw PostgreSQL/Drizzle errors to clients.

## API Documentation

Swagger UI:

http://localhost:3000/api/docs

OpenAPI JSON:

http://localhost:3000/api/openapi.json

Specification version: **OpenAPI 3.1.0**.

### Enabling docs

| `ENABLE_API_DOCS` | Behavior |
|-------------------|----------|
| `true` | Docs always available |
| `false` | Docs always disabled (404) |
| unset | Enabled outside production; disabled in production |

Set `ENABLE_API_DOCS=true` in production if you want Swagger UI and the OpenAPI JSON exposed. Docs never include secrets or `DATABASE_URL`.

### Registering module documentation

When a feature module exposes HTTP APIs, add OpenAPI docs under that module and compose them centrally:

```text
src/modules/users/
├── schemas/          # Zod schemas (validation + OpenAPI source)
├── docs/
│   ├── paths.ts      # registry.registerPath(...)
│   └── schemas.ts    # registry.register(...) if needed
└── index.ts          # export registerUsersDocs(registry)
```

1. Define request/response Zod schemas with `z` from `src/shared/validation/zod` (OpenAPI-extended).
2. In `docs/paths.ts`, register paths with summary, description, tags (business module names only), parameters, request body, response schemas, and error responses via `standardErrorResponses()` from `src/docs/openapi`.
3. Export a single registrar, e.g. `registerUsersDocs(registry)`.
4. Append it to `moduleDocsRegistrars` in [`src/docs/openapi/modules.ts`](src/docs/openapi/modules.ts).

Do not put large OpenAPI objects in NestJS route handlers or controllers. Tags should be module/capability names (`Users`, `Clubs`), not technical layers (`Controllers`, `Repositories`).

Authentication security schemes use an HTTP-only session cookie (`SessionCookie` in OpenAPI).

### Authentication

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/signup` | Profile + email + credentials (atomic); `gender` is genders.id |
| POST | `/api/auth/login` | Active email + password; sets session cookie |
| GET | `/api/auth/me` | Current user from session cookie |
| POST | `/api/auth/logout` | Revokes session + clears cookie |
| POST | `/api/auth/forgot-password` | Generic response; mailer runs after token commit |
| POST | `/api/auth/reset-password` | Single-use token; revokes all sessions |

Password hashing: Argon2id (`@node-rs/argon2`, Node.js runtime only).

**TODO:** rate limiting is not implemented for auth endpoints — do not treat auth as production-hardened without it.

**TODO:** configure a production `PasswordResetMailer` (dev uses console logging).

## Database

Central schema: `src/db/schema/` (PostgreSQL schema `app`).

Migrations: `drizzle/migrations/` (committed SQL + `meta/`).

```bash
# after editing src/db/schema/*
npm run db:generate
# review the SQL under drizzle/migrations/
npm run db:migrate
# seed reference genders (idempotent)
npm run db:seed:genders
```

- Do **not** use `db:push` as the production migration strategy.
- Development and production both use `DATABASE_URL` (local Postgres vs Neon).
- Signup expects `gender` as a numeric ID from `app.genders` (not `"male"` / `"female"` / `"others"`).

If adopting an already-populated database, mark the baseline migration applied without re-running its DDL (see `scripts/mark-baseline-applied.mjs`).
