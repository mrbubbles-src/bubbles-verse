# Story 2.1: Dashboard Shell with Typography Hero Layout

Status: ready-for-dev

## Story

As a user,
I want to open the app and see my XP prominently displayed with a clear "Log Activity" button,
so that I can immediately orient myself and start logging without searching.

## Acceptance Criteria

1. **Given** the user opens the app for the first time (no entries yet)
   **When** the dashboard page renders
   **Then** a large XP number (Montserrat 800, 64–80px) is the dominant visual element, showing "0 / 100 XP"
   **And** a "Log Activity" primary button is visible and tappable
   **And** a bottom navigation shows 3 items: Dashboard, + (log), History
   **And** the `@bubbles/theme` ThemeToggle is accessible (e.g. in a header or nav)
   **And** the layout is single-column on mobile, centered `max-w-md` on desktop
   **And** all touch targets use the `touch-hitbox` utility class

## Tasks / Subtasks

- [ ] Task 1: Replace the starter page with the dashboard shell
  - [ ] Rewrite `apps/it-counts/app/page.tsx` around the hero XP layout instead of the `create-next-app` starter
  - [ ] Keep the first-pass data wired to the new stores, even if values are still empty-state placeholders
- [ ] Task 2: Add the shell components
  - [ ] Create a primary `LogActivityButton`
  - [ ] Add a simple header/nav placement for `ThemeToggle`
  - [ ] Add a 3-item bottom navigation for Dashboard, log, and History
- [ ] Task 3: Add UI verification
  - [ ] Add a dashboard render test or component smoke test
  - [ ] Verify mobile-first layout and desktop max-width constraints

## Dev Notes

### Implementation Focus

- Keep the UI calm and typography-led. Avoid card overload and unnecessary wrapper elements.
- Reuse shared shadcn primitives from `@bubbles/ui`; do not create a local `components/ui` tree.
- The dashboard shell should be useful before logging is complete, so plan for empty-state data from the stores.

### Guardrails

- Use the shared fonts already applied in `app/layout.tsx`; do not re-import fonts in page-level code.
- Theme toggle must remain accessible and keyboard reachable.
- Keep one primary CTA per screen.

### Project Structure Notes

- Likely touch: `apps/it-counts/app/page.tsx`, `apps/it-counts/components/dashboard/...`, `apps/it-counts/components/shared/...`, `apps/it-counts/__tests__/components/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns]
- [Source: apps/it-counts/app/page.tsx]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
