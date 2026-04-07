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

## Quality Checks

Use the app-local scripts when validating changes:

```bash
cd apps/it-counts
bun run typecheck
bun run lint
bun run build
```

## Current Scope

- `app/page.tsx` remains a starter placeholder on purpose
- shared shadcn primitives live in `packages/ui/src/components/shadcn`
- app-local documentation and release notes stay inside `apps/it-counts`
