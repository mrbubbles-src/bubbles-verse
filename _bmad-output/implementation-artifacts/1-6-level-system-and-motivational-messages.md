# Story 1.6: Level System & Motivational Messages

Status: ready-for-dev

## Story

As a developer,
I want `lib/levels.ts` and `lib/messages.ts` implemented,
so that level progression rules and hardcoded messages are centralized and independently testable.

## Acceptance Criteria

1. **Given** the level system requires week tracking and XP thresholds
   **When** `lib/levels.ts` is created
   **Then** it exports: level definitions for Levels 1–3 (requirements, unlocked abilities), `isLevelUpEligible(xp: number, weeksElapsed: number): boolean`, `calculateOverXp(xp: number): number`, `getOverXpPace(overXp: number): 'on-track' | 'slightly-over' | 'well-over'`
   **And** level definitions are structured extensibly (Level 4+ can be added without schema changes)
   **And** `__tests__/lib/levels.test.ts` covers: 27 days = not eligible (4-week gate), 99 XP = not eligible, 100 XP + 28 days = eligible; OverXP thresholds: 0 = on-track, 1–19 = slightly-over, 20+ = well-over

2. **Given** messages are needed in 4 contexts
   **When** `lib/messages.ts` is created
   **Then** it exports `getRandomMessage(context: 'log-confirm' | 'weekly-reset' | 'goal-reached' | 'session-start'): string` with ≥5 messages per context
   **And** no message is judgmental, comparative, or implies the entry was insufficient

## Tasks / Subtasks

- [ ] Task 1: Create the level definition module
  - [ ] Add extensible Level 1-3 definitions plus eligibility, OverXP, and pace helpers in `apps/it-counts/lib/levels.ts`
  - [ ] Keep the schema easy to extend for Level 4+ without changing persisted data shape
- [ ] Task 2: Create the motivational message provider
  - [ ] Add `apps/it-counts/lib/messages.ts` with the four required contexts and at least five messages each
  - [ ] Keep tone calm, validating, and never comparative
- [ ] Task 3: Add guardrail tests
  - [ ] Add `apps/it-counts/__tests__/lib/levels.test.ts`
  - [ ] Add a small message smoke test if needed to lock in context coverage and non-empty output

## Dev Notes

### Implementation Focus

- Reuse Story 1.5 helpers for week math and keep level logic independent from store/UI code.
- Model level definitions as data first, not switch statements, so future levels can be appended cleanly.
- If the level requirements deserve human-readable reference notes, add `apps/it-counts/documentation/level-design.md` rather than burying everything in component code.

### Guardrails

- `getOverXpPace()` returns domain values; UI copy happens later in dashboard components.
- `getRandomMessage()` should stay deterministic enough to test around shape/context, but not hardcode the same string every time.
- Add JSDoc to exported helpers and types.

### Project Structure Notes

- Likely touch: `apps/it-counts/lib/levels.ts`, `apps/it-counts/lib/messages.ts`, `apps/it-counts/__tests__/lib/levels.test.ts`, `apps/it-counts/documentation/level-design.md`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Impact Analysis]
- [Source: _bmad-output/planning-artifacts/prd.md#Level Progression]
- [Source: _bmad-output/planning-artifacts/prd.md#Motivational Messaging]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Desired Emotional Response]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
