# Story 3.3: Level-Up Eligibility CTA

Status: review

## Story

As a user,
I want a calm button to appear on the dashboard when I'm eligible to level up,
so that I know I can level up without being pressured or auto-redirected.

## Acceptance Criteria

1. **Given** the user has accumulated ≥100 XP AND ≥4 full weeks have elapsed in the current level
   **When** the dashboard renders
   **Then** a `Button` CTA appears with text "Level [N+1] ready — Level Up →"
   **And** the button is calm (not flashing, not pulsing, no urgency animation)
   **And** tapping the button navigates to `/level-up` via View Transitions

2. **Given** either condition is not yet met (XP < 100 OR weeks < 4)
   **When** the dashboard renders
   **Then** the level-up CTA is not shown — no placeholder, no countdown, no hint

3. **Given** the user is eligible and opens the app
   **When** navigating to the dashboard
   **Then** no toast, no banner, no automatic redirect occurs — the CTA button is the only indicator

## Tasks / Subtasks

- [x] Task 1: Add the eligibility CTA to the dashboard
  - [x] Render it only from derived store state
  - [x] Keep the copy exactly calm and conditional
- [x] Task 2: Wire navigation to `/level-up`
  - [x] Use the existing App Router pattern
  - [x] If programmatic navigation is used, wrap it in the shared view-transition helper instead of adding a new library
- [x] Task 3: Add coverage for eligible and ineligible cases
  - [x] Verify the CTA is the only indicator and fully disappears when conditions are not met

## Dev Notes

### Implementation Focus

- This CTA is the entire eligibility signal. It should feel discoverable, not promotional.
- Reuse `isEligible` from the level store; do not duplicate the XP/week check in the page.
- `@bubbles/theme` already exports `startVt()` if a programmatic navigation transition wrapper is needed.

### Guardrails

- No banner, toast, auto-open, countdown, pulse, or urgency animation.
- Do not show a disabled button or placeholder when ineligible.
- Keep keyboard and touch accessibility intact through the shared Button primitive.

### Project Structure Notes

- Likely touch: `apps/it-counts/app/page.tsx`, `apps/it-counts/components/dashboard/level-up-indicator.tsx`, `apps/it-counts/__tests__/components/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 4 — The Level-Up (Primary, Milestone)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Level-up eligibility]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns]
- [Source: packages/theme/src/view-transition.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Created `LevelUpIndicator` component reading `isEligible` and `level` directly from `useLevelStore` — no local eligibility logic
- Navigation via `useRouter().push('/level-up')` wrapped in `startVt()` from `@bubbles/theme`
- Button uses `variant="outline"` — calm, no urgency animations
- Returns `null` when `!isEligible` — no placeholder, no countdown
- Integrated into `app/page.tsx` between `LevelRequirements` and `SessionStartMessage`
- Added `next/navigation` and `startVt` mocks to `dashboard.test.tsx` to prevent regression failures after adding the new component
- 6 new tests cover: eligible render, level number, no banner/toast, click navigation, ineligible null, ineligible no hint
- 23 test files / 129 tests all pass

### File List

- apps/it-counts/components/dashboard/level-up-indicator.tsx (new)
- apps/it-counts/app/page.tsx (modified)
- apps/it-counts/__tests__/components/dashboard/level-up-indicator.test.tsx (new)
- apps/it-counts/__tests__/components/dashboard.test.tsx (modified)

## Change Log

- 2026-04-08: Implemented `LevelUpIndicator` component with calm CTA button, `startVt` navigation, and full eligible/ineligible test coverage (Story 3.3)
