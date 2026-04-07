# Story 3.3: Level-Up Eligibility CTA

Status: ready-for-dev

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

- [ ] Task 1: Add the eligibility CTA to the dashboard
  - [ ] Render it only from derived store state
  - [ ] Keep the copy exactly calm and conditional
- [ ] Task 2: Wire navigation to `/level-up`
  - [ ] Use the existing App Router pattern
  - [ ] If programmatic navigation is used, wrap it in the shared view-transition helper instead of adding a new library
- [ ] Task 3: Add coverage for eligible and ineligible cases
  - [ ] Verify the CTA is the only indicator and fully disappears when conditions are not met

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

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
