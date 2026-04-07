# Story 1.7: Zustand Stores Scaffolding

Status: done

## Story

As a developer,
I want the three Zustand stores scaffolded and wired to `lib/storage.ts`,
so that all app state has a single source of truth that persists correctly and components can start consuming data.

## Acceptance Criteria

1. **Given** three domain stores are needed
   **When** `hooks/use-activity-store.ts` is created
   **Then** it exposes: `entries: ActivityEntry[]`, `addEntry(entry): void` (write-through to storage immediately), `loadFromStorage(): void`, `getDailyEntries(date: string): ActivityEntry[]`, `getWeeklyEntries(weekStart: string): ActivityEntry[]`

2. **When** `hooks/use-level-store.ts` is created
   **Then** it exposes: `levelState: LevelState`, `loadFromStorage(): void`, `triggerLevelUp(): void` (resets XP to 0, increments level, sets new startDate to today, write-through), `isEligible: boolean` (derived from xp + weeksElapsed)

3. **When** `hooks/use-ui-store.ts` is created
   **Then** it exposes: `sessionMessageShown: boolean`, `setSessionMessageShown(): void`

4. **And** `app/layout.tsx` calls `loadFromStorage()` for both activity and level stores on mount
   **And** every store mutation writes through to `lib/storage.ts` immediately — no deferred flush
   **And** no store file contains React component imports

## Tasks / Subtasks

- [x] Task 1: Add the three domain stores
  - [x] Create `apps/it-counts/hooks/use-activity-store.ts`
  - [x] Create `apps/it-counts/hooks/use-level-store.ts`
  - [x] Create `apps/it-counts/hooks/use-ui-store.ts`
- [x] Task 2: Add client-side store hydration
  - [x] Create a small client component such as `components/shared/store-hydrator.tsx`
  - [x] Mount it from `app/layout.tsx` so `loadFromStorage()` runs on the client, not in the server layout itself
- [x] Task 3: Add focused store tests
  - [x] Cover write-through behavior, derived selectors, and `triggerLevelUp()`
  - [x] Keep tests in `apps/it-counts/__tests__/...`, never next to the store files

## Dev Notes

### Implementation Focus

- The architecture wants one store per concern, no slice pattern, and immediate write-through on every mutation.
- `app/layout.tsx` is currently a Server Component. Do not try to use `useEffect` there directly; use a client child for hydration.
- Build selectors on top of the pure lib modules instead of reimplementing date, XP, or level rules in the stores.

### Guardrails

- No React component imports in store files.
- Do not bypass `lib/storage.ts`.
- Keep `isEligible` derived from XP plus weeks elapsed, not stored as an independent persisted boolean.

### Project Structure Notes

- Likely touch: `apps/it-counts/hooks/use-activity-store.ts`, `apps/it-counts/hooks/use-level-store.ts`, `apps/it-counts/hooks/use-ui-store.ts`, `apps/it-counts/components/shared/store-hydrator.tsx`, `apps/it-counts/app/layout.tsx`, `apps/it-counts/__tests__/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7]
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management Patterns (Zustand)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Hydration]
- [Source: _bmad-output/planning-artifacts/architecture.md#Business Logic Boundary]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: apps/it-counts/app/layout.tsx]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Senior Developer Review (AI)

**Review Date:** 2026-04-07
**Review Outcome:** Approve
**Reviewer Model:** Claude Opus 4.6

#### Summary

All four acceptance criteria satisfied. One medium-severity finding identified and resolved in the same session.

#### Findings

- [x] **[Med] Default level state used module-level `getTodayString()` call** — `DEFAULT_LEVEL_STATE` was a module-level constant, freezing `startDate` at import time. Refactored to `createDefaultLevelState()` factory function that produces a fresh date on every call. Resolved.

#### Verification

- All 50 tests pass (8 files), zero regressions
- TypeScript and ESLint checks clean
- Write-through confirmed: every `addEntry` and `triggerLevelUp` call persists to localStorage immediately
- `isEligible` derived from `isLevelUpEligible(xp, weeksElapsed)` — not stored independently
- No React component imports in any store file (verified via grep)
- `StoreHydrator` renders `null` and hydrates both stores via `useEffect`

### Completion Notes List

- Installed zustand@5.0.12 as runtime dependency
- Three stores created: activity (entries CRUD + date filtering), level (state + derived isEligible + triggerLevelUp), UI (session-only flag)
- All store mutations write through to `lib/storage.ts` immediately — no deferred flush
- `isEligible` is derived from XP + weeksElapsed on every `loadFromStorage()` call, not stored independently
- StoreHydrator client component mounted in layout.tsx to trigger hydration without polluting the server layout
- No React component imports in any store file
- 50 tests pass across 8 files (17 new store tests added), zero regressions
- TypeScript and ESLint checks clean

### Change Log

- 2026-04-07: Story implemented — 3 Zustand stores, client hydrator, 3 test files, layout wired
- 2026-04-07: Review completed — 1 medium finding (DEFAULT_LEVEL_STATE timing) resolved, status → done

### File List

- apps/it-counts/hooks/use-activity-store.ts (new)
- apps/it-counts/hooks/use-level-store.ts (new)
- apps/it-counts/hooks/use-ui-store.ts (new)
- apps/it-counts/components/shared/store-hydrator.tsx (new)
- apps/it-counts/app/layout.tsx (modified)
- apps/it-counts/package.json (modified — added zustand)
- apps/it-counts/__tests__/hooks/use-activity-store.test.ts (new)
- apps/it-counts/__tests__/hooks/use-level-store.test.ts (new)
- apps/it-counts/__tests__/hooks/use-ui-store.test.ts (new)
