# Story 1.7: Zustand Stores Scaffolding

Status: ready-for-dev

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

- [ ] Task 1: Add the three domain stores
  - [ ] Create `apps/it-counts/hooks/use-activity-store.ts`
  - [ ] Create `apps/it-counts/hooks/use-level-store.ts`
  - [ ] Create `apps/it-counts/hooks/use-ui-store.ts`
- [ ] Task 2: Add client-side store hydration
  - [ ] Create a small client component such as `components/shared/store-hydrator.tsx`
  - [ ] Mount it from `app/layout.tsx` so `loadFromStorage()` runs on the client, not in the server layout itself
- [ ] Task 3: Add focused store tests
  - [ ] Cover write-through behavior, derived selectors, and `triggerLevelUp()`
  - [ ] Keep tests in `apps/it-counts/__tests__/...`, never next to the store files

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

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
