# Development Guide

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| Node.js | >=22 <25 (pinned: 24.14.1 via `.nvmrc`) | `nvm use` at repo root |
| Bun | 1.3.11 | Declared as `packageManager` in root `package.json` |
| PostgreSQL | Latest | Required only for `the-coding-vault` |

## First-Time Setup

```bash
git clone <repo-url> bubbles-verse
cd bubbles-verse
nvm use                    # Match .nvmrc (Node 24.14.1)
bun install                # Install all workspace dependencies from root
```

Always install from the **repository root**. Bun links `workspace:*` packages automatically.

## Environment Variables

### Portfolio
Copy `apps/portfolio/.env.example` to `apps/portfolio/.env`. Required keys:
- `RESEND_API_KEY` — Email sending via Resend
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile CAPTCHA
- `NEXT_PUBLIC_SITE_URL` — Canonical URL

### TeacherBuddy
No required env vars. Optional:
- `NEXT_PUBLIC_SITE_URL` — For canonical/OG URLs

### The Coding Vault
Copy `apps/the-coding-vault/.env.example` to `apps/the-coding-vault/.env`. Required keys:
- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL connection
- `JWT_SECRET` — JWT signing
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary media
- `DISCORD_WEBHOOK_URL` — Error notifications (optional)
- `THE_CODING_VAULT_ENABLE_NO_DB_FALLBACK` — Set `1` for local UI work without PostgreSQL

### Turbo Environment Hash
All env vars that affect build/dev must be listed in `turbo.json` under `tasks.build.env` and `tasks.dev.env`. Currently 19 keys are declared. When adding new `process.env.*` reads, update both lists to prevent cache divergence.

## Daily Commands

All commands run from the **repository root**:

| Command | Description |
|---------|-------------|
| `bun run dev` | Start ALL workspaces with `dev` scripts (multi-port) |
| `bun run build` | Build all (respects `^build` dependency order) |
| `bun run lint` | ESLint across all workspaces |
| `bun run format` | Prettier where configured |
| `bun run typecheck` | `tsc --noEmit` across workspaces |

### Single-App Focus

```bash
bunx turbo dev --filter=portfolio
bunx turbo dev --filter=teacherbuddy
bunx turbo dev --filter=the-coding-vault
# Or directly:
cd apps/portfolio && bun run dev
```

Filter uses the `name` from each `package.json` (e.g., `portfolio`, `teacherbuddy`, `@bubbles/ui`).

## Build Process

Turborepo orchestrates builds via `turbo.json`:
- **Order:** `dependsOn: ["^build"]` — packages build before dependent apps
- **Outputs:** `.next/**` (excluding `.next/cache`)
- **Inputs:** `$TURBO_DEFAULT$` + `.env*` files
- **Caching:** Deterministic hash includes all declared env vars

All Next.js apps run on Bun runtime: `bun --bun next build`.

## Testing

### TeacherBuddy (Only app with tests)

```bash
cd apps/teacherbuddy
bun run test              # Watch mode
bun run test:run          # Single run
bun run test:ui           # Vitest UI
bun run test:coverage     # Coverage report (text + HTML)
```

**Framework:** Vitest 4.0 + React Testing Library + jsdom

**Config:** `vitest.config.ts`
- Environment: jsdom
- Globals: enabled
- Setup: `vitest.setup.ts`
- Coverage: `lib/`, `hooks/`, `context/`
- Path alias: `@/` maps to app root

**Test locations:**
- `__tests__/test-utils.tsx` — Shared test utilities/providers
- `components/quizzes/__tests__/` — Quiz editor/selector tests
- `components/students/__tests__/` — Student form tests
- `components/ui/__tests__/` — Select component tests
- `components/utility/__tests__/` — Page info dialog tests
- `context/__tests__/` — App reducer tests
- `hooks/__tests__/` — Custom hook tests
- `lib/__tests__/` — Utility function tests

### Other Apps
Portfolio and The Coding Vault do not have test suites currently.

## Database (The Coding Vault)

**ORM:** Drizzle ORM 0.45 with PostgreSQL

```bash
cd apps/the-coding-vault
bun run seed              # Run seed script (tsx ./drizzle/db/seed.ts)
```

**Drizzle Kit** (`drizzle.config.ts`):
- Schema: `./drizzle/db/schema.ts`
- Output: `./drizzle/` (migrations)
- Dialect: PostgreSQL
- Uses `DATABASE_URL` env var

**No-DB Fallback:** Set `THE_CODING_VAULT_ENABLE_NO_DB_FALLBACK=1` for local UI development without a running database.

## Code Style & Formatting

### Prettier
Root `.prettierrc` with plugins:
- `prettier-plugin-tailwindcss` — Tailwind class sorting (references `packages/ui/src/styles/globals.css`)
- `@ianvs/prettier-plugin-sort-imports` — Import ordering

Settings: single quotes, trailing commas (ES5), 2-space tabs, LF line endings.

### ESLint
Flat configs from `@bubbles/eslint-config`:
- `base` — Shared rules (TypeScript, Turbo, Prettier compat)
- `next-js` — Next.js apps
- `react-internal` — React library packages

### TypeScript
Strict mode via `@bubbles/typescript-config`:
- `base.json` — Shared strict settings
- `nextjs.json` — Next.js apps (extends base)
- `react-library.json` — React packages (extends base)

Root `tsconfig.json` extends `@bubbles/typescript-config/base.json`.

## Deployment

- **Platform:** Vercel-ready (`turbo.json` includes `VERCEL_*` env vars)
- **No CI/CD pipelines** configured yet (no `.github/workflows/`, no Dockerfile)
- **No containerization** (no Docker)

## Before a PR

```bash
bun run lint
bun run typecheck
# If touching TeacherBuddy:
cd apps/teacherbuddy && bun run test:run
```

## Adding a New Workspace

1. Create `apps/<name>` or `packages/<name>` with `package.json` (`name` field required)
2. Add workspace deps as `"workspace:*"`
3. Extend `@bubbles/typescript-config` and `@bubbles/eslint-config`
4. Register Turbo scripts (`dev`, `build`, `lint`, `typecheck`)
5. Add new build-time env vars to `turbo.json` `env` lists

## Common Issues

| Issue | Fix |
|-------|-----|
| `turbo` stale cache | Add new `process.env.*` to `turbo.json` env lists; use `--force` to invalidate |
| `Cannot find module '@bubbles/ui'` | Run `bun install` from root; check `workspace:*` in consumer's `package.json` |
| Node version warnings | Run `nvm use` to match `.nvmrc` (24.14.1) |
| Prettier class sort wrong | Verify `tailwindStylesheet` in `.prettierrc` points to `packages/ui/src/styles/globals.css` |
| Next.js API differences | Check `node_modules/next/dist/docs/` for latest docs (Next 16 has breaking changes) |
