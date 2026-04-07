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

Story 1.6 extends the pure business-logic layer:

- `lib/levels.ts` defines Levels 1-3 as extensible data and exposes eligibility, OverXP, and pace helpers
- `lib/messages.ts` centralizes the MVP motivational message library across the four required contexts
- `documentation/level-design.md` keeps the human-readable level table close to the implementation
- `__tests__/lib/levels.test.ts` and `__tests__/lib/messages.test.ts` guard the new level and message rules

Story 1.7 scaffolds the Zustand state layer:

- `hooks/use-activity-store.ts` manages the activity log with write-through persistence and date/week selectors
- `hooks/use-level-store.ts` manages level progress with derived `isEligible` and `triggerLevelUp`
- `hooks/use-ui-store.ts` tracks ephemeral session state (no persistence)
- `components/shared/store-hydrator.tsx` hydrates activity and level stores on mount as a client component inside the server layout

Story 2.2 adds the first end-user logging flow:

- `components/logging/log-entry-sheet.tsx` opens the dashboard bottom sheet and owns validation, confirmation, and auto-close
- `components/logging/duration-input.tsx` keeps minute entry mobile-first with live XP preview from `lib/xp.ts`
- `hooks/use-activity-store.ts` now creates duration entries with `crypto.randomUUID()` and immediate localStorage write-through
- `hooks/use-level-store.ts` now mirrors earned XP into `it-counts:current-level` immediately
- `components/dashboard/session-start-message.tsx` shows one `session-start` message per in-memory app session
- `components/shared/motivational-message.tsx` keeps confirmation and dashboard encouragement text-only and reusable

Story 2.4 and review hardening extend this flow:

- level progress now recomputes from aggregated daily XP and uses `levelStartAt` to exclude same-day entries logged before a level-up
- `components/dashboard/xp-progress-bar.tsx` now keeps ARIA progress semantics clamped to the 0-100 range
- `components/logging/log-entry-sheet.tsx` reads daily totals from the activity-store selector and confirms with a daily-total message (`Today total: X XP`)

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

- `app/page.tsx` is now the real duration-logging dashboard entry point
- `/log` remains a lightweight fallback route that sends the user back to the dashboard flow
- shared shadcn primitives live in `packages/ui/src/components/shadcn`
- app-local documentation and release notes stay inside `apps/it-counts`
