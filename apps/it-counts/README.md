# It Counts

It Counts is the bubbles-verse app for the upcoming habit and XP tracking experience. Story 1.3 keeps this app intentionally lean: the app is wired into the monorepo, consumes shared packages, and keeps the starter route as a placeholder until feature work lands.

## Monorepo Workflow

Run commands from the repository root unless you are targeting this app directly:

```bash
bun install
bunx turbo dev --filter=it-counts
```

Direct app work also uses Bun:

```bash
cd apps/it-counts
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) after the dev server starts.

## Shared Packages

`apps/it-counts` depends on shared workspace packages instead of local copies:

- `@bubbles/ui` for global styles, fonts, and shared shadcn primitives
- `@bubbles/theme` for the shared `ThemeProvider`
- `@bubbles/eslint-config` for the shared Next.js ESLint config
- `@bubbles/typescript-config` for the shared Next.js TypeScript baseline

The root layout imports `@bubbles/ui/globals.css`, applies shared font variables from `@bubbles/ui/fonts`, and keeps app-specific CSS in `app/it-counts.css`.

## Local Data Model

Story 1.4 adds the first app-local business modules:

- `types/index.ts` defines `ActivityEntry`, `LevelState`, and `AppSettings`
- `lib/storage.ts` is the only localStorage boundary for `it-counts:entries`, `it-counts:current-level`, and `it-counts:settings`
- malformed or missing storage payloads fall back to safe defaults so future UI stories can hydrate defensively

Story 1.5 adds the first pure business-logic helpers:

- `lib/dates.ts` centralizes device-local `YYYY-MM-DD` handling, Monday week starts, and elapsed-level-week math
- `lib/xp.ts` applies the fixed daily XP tier table with the 30-minute cap enforced
- `__tests__/lib/dates.test.ts` and `__tests__/lib/xp.test.ts` lock in the edge cases before stores and UI start consuming these helpers

## Quality Checks

Use the app-local scripts when validating changes:

```bash
cd apps/it-counts
bun run typecheck
bun run lint
bun run test:run
bun run build
```

## Current Scope

- `app/page.tsx` remains a starter placeholder on purpose
- shared shadcn primitives live in `packages/ui/src/components/shadcn`
- app-local documentation and release notes stay inside `apps/it-counts`
