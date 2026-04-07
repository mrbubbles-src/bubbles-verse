# Story 3.4: Level Transition & `/level-up` Page

Status: review

## Story

As a user,
I want a dedicated level-up page with brief confetti and a clear summary,
so that reaching a new level feels genuinely earned before returning to calm.

## Acceptance Criteria

1. **Given** the user navigates to `/level-up` (only accessible when eligible)
   **When** the page loads
   **Then** a brief confetti burst plays (short, non-looping, respects `prefers-reduced-motion`)
   **And** a summary of the completed level is shown: total XP earned, OverXP, pace indicator
   **And** the upcoming level's requirements and newly unlocked abilities are displayed (FR14)
   **And** a primary "Start Level [N+1]" button is visible

2. **Given** the user taps "Start Level [N+1]"
   **When** the action executes
   **Then** `triggerLevelUp()` is called on the level store: XP resets to 0, level increments by 1, `startDate` set to today
   **And** the updated `LevelState` is written to `it-counts:current-level` in localStorage immediately
   **And** the user is navigated back to the dashboard via View Transitions
   **And** the dashboard reflects the new level and 0 / 100 XP

3. **Given** the user navigates directly to `/level-up` when NOT eligible
   **When** the page loads
   **Then** they are redirected to the dashboard — no level-up can be triggered without meeting both conditions

## Tasks / Subtasks

- [x] Task 1: Build the `/level-up` route
  - [x] Create `apps/it-counts/app/level-up/page.tsx`
  - [x] Render the completed-level summary, OverXP, pace, and next-level requirements
- [x] Task 2: Add the transition behavior
  - [x] Implement a brief confetti effect that respects reduced motion
  - [x] Wire the primary CTA to `triggerLevelUp()` and navigate back to the dashboard
- [x] Task 3: Add route guards and tests
  - [x] Redirect ineligible visits away from `/level-up`
  - [x] Verify level reset, persisted write-through, and post-level-up dashboard state

## Dev Notes

### Implementation Focus

- Keep the celebration brief and earned. A tiny CSS or lightweight component solution is preferable to a heavy dependency.
- The state update should happen immediately; animation runs alongside the data change, not before it.
- Render the route only from eligible state and redirect early when the preconditions are not met.

### Guardrails

- Respect `prefers-reduced-motion` for confetti and transitions.
- Do not make `/level-up` a hidden side effect of the dashboard; it remains a deliberate navigation target.
- Avoid adding large animation libraries unless the bundle cost is clearly justified.

### Project Structure Notes

- Likely touch: `apps/it-counts/app/level-up/page.tsx`, `apps/it-counts/components/dashboard/...`, `apps/it-counts/hooks/use-level-store.ts`, `apps/it-counts/__tests__/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 4 — The Level-Up (Primary, Milestone)]
- [Source: _bmad-output/planning-artifacts/prd.md#UX & Animations]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Level-up]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Desired Emotional Response]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Created `app/level-up/page.tsx` — client component with `useEffect`-based redirect for ineligible users (`router.replace('/')`)
- Created `components/level-up/confetti-burst.tsx` — Canvas-based particle burst, non-looping, respects `prefers-reduced-motion`, no external deps
- Page shows: completed level heading, XP total, OverXP + pace label (when overXp > 0), next-level requirements + unlocked abilities from `LEVEL_DEFINITIONS`
- CTA "Start Level [N+1]" calls `triggerLevelUp()` then `startVt(() => router.push('/'))` — state mutation before navigation
- 9 tests: redirect when ineligible, heading, XP, overXP, pace, next requirements, unlocked abilities, CTA label, CTA click behavior
- 24 test files / 138 tests all pass

### File List

- apps/it-counts/app/level-up/page.tsx (new)
- apps/it-counts/components/level-up/confetti-burst.tsx (new)
- apps/it-counts/__tests__/components/level-up-page.test.tsx (new)

## Change Log

- 2026-04-08: Implemented `/level-up` page with confetti burst, completed-level summary, next-level preview, ineligible redirect, and `triggerLevelUp()` CTA with View Transition (Story 3.4)
