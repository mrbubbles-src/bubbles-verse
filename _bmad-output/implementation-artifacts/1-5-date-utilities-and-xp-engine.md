# Story 1.5: Date Utilities & XP Engine

Status: done

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

- [x] Task 1: Implement device-local date helpers
  - [x] Create `apps/it-counts/lib/dates.ts` with the exact exported functions from the AC
  - [x] Keep all calculations based on device-local `YYYY-MM-DD` strings and Monday-start weeks
- [x] Task 2: Implement the XP engine
  - [x] Create `apps/it-counts/lib/xp.ts` with a pure `calculateDailyXp(totalMinutes)` function
  - [x] Encode the fixed tier table and 30-minute cap without side effects
- [x] Task 3: Add focused unit coverage
  - [x] Add `apps/it-counts/__tests__/lib/dates.test.ts`
  - [x] Add `apps/it-counts/__tests__/lib/xp.test.ts`

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

- `bun run test:run -- __tests__/lib/dates.test.ts __tests__/lib/xp.test.ts` in `apps/it-counts` — red phase failed first on missing `@/lib/dates` and `@/lib/xp`, then passed after implementation (`12` tests)
- `bun run test:run` in `apps/it-counts` — passes (`3` files, `17` tests)
- `bun run lint` in `apps/it-counts` — passes
- `bun run build` in `apps/it-counts` — passes on Next.js `16.2.2`
- `bun run typecheck` in `apps/it-counts` — passes after Next.js regenerated `.next/types` during the build step
- Manual code review across implementation, tests, and story ACs — no findings; story accepted as done

### Completion Notes List

- Added `apps/it-counts/lib/dates.ts` with pure helpers for local `YYYY-MM-DD` formatting, Monday week starts, exact same-day comparison, and full-week elapsed calculations
- Added `apps/it-counts/lib/xp.ts` with the fixed daily XP tier table so the highest qualifying threshold wins and 30+ minutes caps at `5` XP
- Added focused unit tests for Sunday-to-Monday week boundaries, week `0` vs week `1`, and every required XP tier threshold
- Updated the app README and changelog so the new shared business-logic modules are documented close to the code
- Reviewed the delivered scope against Story 1.5 acceptance criteria and found no open issues

### File List

- `_bmad-output/implementation-artifacts/1-5-date-utilities-and-xp-engine.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/it-counts/__tests__/lib/dates.test.ts`
- `apps/it-counts/__tests__/lib/xp.test.ts`
- `apps/it-counts/CHANGELOG.md`
- `apps/it-counts/README.md`
- `apps/it-counts/lib/dates.ts`
- `apps/it-counts/lib/xp.ts`
