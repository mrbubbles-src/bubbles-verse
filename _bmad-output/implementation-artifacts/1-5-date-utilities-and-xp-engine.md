# Story 1.5: Date Utilities & XP Engine

Status: ready-for-dev

## Story

As a developer,
I want `lib/dates.ts` and `lib/xp.ts` as pure, fully-tested functions,
so that all date/time and XP calculations are centralized, correct, and independently verifiable.

## Acceptance Criteria

1. **Given** the app uses device local time for all date logic
   **When** `lib/dates.ts` is created
   **Then** it exports: `getTodayString(): string` (YYYY-MM-DD, device local), `getWeekStart(date: string): string` (Monday of that week), `getWeeksElapsedInLevel(levelStartDate: string, today: string): number`, `isSameDay(a: string, b: string): boolean`
   **And** `__tests__/lib/dates.test.ts` covers Sunday→Monday week boundary, week 0 vs week 1 edge cases

2. **Given** the XP tier table (5min→1XP, 10min→2XP, 20min→3XP, 30+min→5XP)
   **When** `lib/xp.ts` is created
   **Then** it exports `calculateDailyXp(totalMinutes: number): number` applying the highest qualifying tier with cap enforced
   **And** `__tests__/lib/xp.test.ts` covers: 0 min = 0 XP, 4 min = 0 XP, 5 min = 1 XP, 9 min = 1 XP, 10 min = 2 XP, 20 min = 3 XP, 30 min = 5 XP, 60 min = 5 XP (cap)
   **And** both modules contain no React imports

## Tasks / Subtasks

- [ ] Task 1: Implement device-local date helpers
  - [ ] Create `apps/it-counts/lib/dates.ts` with the exact exported functions from the AC
  - [ ] Keep all calculations based on device-local `YYYY-MM-DD` strings and Monday-start weeks
- [ ] Task 2: Implement the XP engine
  - [ ] Create `apps/it-counts/lib/xp.ts` with a pure `calculateDailyXp(totalMinutes)` function
  - [ ] Encode the fixed tier table and 30-minute cap without side effects
- [ ] Task 3: Add focused unit coverage
  - [ ] Add `apps/it-counts/__tests__/lib/dates.test.ts`
  - [ ] Add `apps/it-counts/__tests__/lib/xp.test.ts`

## Dev Notes

### Implementation Focus

- Keep both modules fully pure so later stores and components can reuse them without hidden state.
- Treat week calculations as a business rule, not a display concern: Monday-Sunday everywhere.
- Add concise JSDoc comments to exported helpers and document any edge-case assumptions inline.

### Guardrails

- Do not read from storage or import React in `lib/dates.ts` or `lib/xp.ts`.
- Do not introduce external date libraries unless the story proves they are necessary; the current architecture expects lean bundle size.
- Build on Story 1.4 types if they already exist; do not duplicate date or XP shapes in multiple files.

### Project Structure Notes

- Likely touch: `apps/it-counts/lib/dates.ts`, `apps/it-counts/lib/xp.ts`, `apps/it-counts/__tests__/lib/dates.test.ts`, `apps/it-counts/__tests__/lib/xp.test.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Impact Analysis]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- [Source: _bmad-output/planning-artifacts/prd.md#Technical Success]
- [Source: _bmad-output/planning-artifacts/prd.md#Performance]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
