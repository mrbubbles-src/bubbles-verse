# Dashboard

`dashboard` is the new shared dashboard app inside the Bubbles Verse monorepo.
At the moment it is intentionally still a scaffold: the app shell, workspace
wiring, and shared package integration are in place so feature work can start on
a clean base.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Shared workspace packages from `@bubbles/*`

## Current scope

- `/` currently renders a placeholder page that confirms the app shell is mounted.
- Shared fonts, globals, theme provider, and toast host are already wired in.
- The app is configured to consume shared source packages from the monorepo.

## Run locally

From the monorepo root:

```bash
bun install
bunx turbo dev --filter=dashboard
```

From the app folder:

```bash
cd apps/dashboard
bun run dev
```

The checked-in `dev` script binds to `http://dashboard.mrbubbles.test:3004`.

## Quality checks

```bash
cd apps/dashboard
bun run lint
bun run typecheck
bun run build
```

## Shared packages

- `@bubbles/ui` - shared globals, fonts, shadcn-style primitives, utilities
- `@bubbles/theme` - shared theme provider and theming behavior
- `@bubbles/footer` - shared footer package available for app-shell use
- `@bubbles/eslint-config` - shared lint configuration
- `@bubbles/typescript-config` - shared TypeScript baseline

## Environment

```env
NEXT_PUBLIC_APP_URL=http://dashboard.mrbubbles.test:3004
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.mrbubbles.test
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
GITHUB_OWNER_ALLOWLIST=mrbubbles
```

`NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` is optional. When it is omitted, the dashboard
derives a shared parent domain from `NEXT_PUBLIC_APP_URL`, which works for
hosts like `dashboard.mrbubbles.test` and `dashboard.mrbubbles-src.dev`.
