# Solo - Freelance Activity Tracker

## Cursor Cloud specific instructions

### Overview

Solo is a Next.js 16 freelance time-tracking app using PostgreSQL (via Drizzle ORM), Better Auth for authentication, and Tailwind CSS v4 + shadcn/ui for the UI.

### Services

| Service | Command | Notes |
|---------|---------|-------|
| Next.js dev server | `pnpm dev` | Runs on port 3000 |
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | Must be running before dev server |

### Local Database Setup

The app was originally built for Neon serverless PostgreSQL (cloud). For local development, `lib/db/index.ts` has been patched to support a standard `pg` driver when `USE_LOCAL_DB=true` is set in `.env.local`.

**Required `.env.local` variables:**
- `DATABASE_URL` — PostgreSQL connection string (e.g., `postgresql://postgres:postgres@localhost:5432/solo_dev`)
- `BETTER_AUTH_URL` — App URL for Better Auth (e.g., the local dev server URL)
- `NEXT_PUBLIC_APP_URL` — Public app URL for auth client (same as BETTER_AUTH_URL for local dev)
- `BETTER_AUTH_SECRET` — Secret key for Better Auth sessions
- `AI_ALLOWED_EMAILS` — Comma-separated allowlist for AI features (e.g., `tommaso.carnemolla@gmail.com`)
- `USE_LOCAL_DB=true` — Enables the standard `pg` driver instead of Neon HTTP driver

**Database initialization:** Auth tables (user, session, account, verification, rate_limit) and app tables (clients, areas, projects, time_entries) must be created manually since `drizzle-kit push` has issues with the split schema setup. The auth schema is in `lib/auth/schema.ts` and app schema is in `lib/db/schema.ts`. Create tables using `psql` SQL statements matching these schemas.

### Gotchas

- **Next.js 16 uses `proxy.ts` instead of `middleware.ts`**: The auth middleware is in `proxy.ts` (not `middleware.ts`). Do NOT rename it or create a `middleware.ts` — that will cause a conflict error.
- **`pnpm lint` does not work**: The `ultracite lint` subcommand does not exist. Use `pnpm check` for linting and `pnpm fix` for auto-fixing.
- **Build scripts need approval**: `package.json` has `pnpm.onlyBuiltDependencies` configured. If new native dependencies are added, they must be listed there.
- **Pre-existing lint warnings**: `pnpm check` may show a few pre-existing formatting/lint issues in the codebase (e.g., CSS class sorting, import ordering). These are not regressions.

### Standard Commands

See `package.json` scripts: `pnpm dev`, `pnpm build`, `pnpm check`, `pnpm fix`, `pnpm db:push`, `pnpm db:generate`.
