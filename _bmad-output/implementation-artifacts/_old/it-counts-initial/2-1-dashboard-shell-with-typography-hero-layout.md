# Story 2.1: Dashboard Shell with Typography Hero Layout

Status: done

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

- [x] Task 1: Replace the starter page with the dashboard shell
  - [x] Rewrite `apps/it-counts/app/page.tsx` around the hero XP layout instead of the `create-next-app` starter
  - [x] Keep the first-pass data wired to the new stores, even if values are still empty-state placeholders
- [x] Task 2: Add the shell components
  - [x] Create a primary `LogActivityButton`
  - [x] Add a simple header/nav placement for `ThemeToggle`
  - [x] Add a 3-item bottom navigation for Dashboard, log, and History
- [x] Task 3: Add UI verification
  - [x] Add a dashboard render test or component smoke test
  - [x] Verify mobile-first layout and desktop max-width constraints

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

Claude Opus 4.6

### Debug Log References

- Fixed lint warning: replaced `<a>` elements in BottomNav with Next.js `<Link>` components
- Added `@testing-library/jest-dom/vitest` import to vitest.setup.ts to enable DOM matchers
- Review fix: created placeholder pages for /log and /history to prevent 404 dead ends
- Review fix: wired LogActivityButton to /log via Link inside Button
- Review fix: replaced fixed bottom nav with sticky, removed pb-20 compensation, switched min-h-dvh to min-h-svh
- Review fix: moved @bubbles/ui/globals.css from JS import to CSS @import in it-counts.css (fixes Tailwind IntelliSense)
- Review fix: resolved base-ui nativeButton console error by using Link-inside-Button pattern

### Completion Notes List

- Replaced create-next-app starter with typography-led dashboard shell
- XpHero component uses Montserrat 800, clamp(4rem,10vw,5rem) as dominant visual element, wired to useLevelStore
- LogActivityButton wraps shared Button from @bubbles/ui, links to /log
- BottomNav: sticky 3-item navigation (Dashboard/+/History) using Next.js Link and hugeicons
- ThemeToggle placed in header, imported from @bubbles/theme
- Layout: single-column mobile, centered max-w-md on desktop, sticky bottom nav
- Placeholder pages for /log and /history with back-to-dashboard links
- CSS import chain: it-counts.css → @import @bubbles/ui/globals.css (enables Tailwind IntelliSense)
- All touch targets use touch-hitbox utility class
- 15 component tests across 4 test files, all 65 tests pass, lint clean

### Change Log

- 2026-04-07: Implemented dashboard shell with typography hero layout, shell components, and UI verification tests
- 2026-04-07: Addressed code review findings — 5 items resolved (placeholder pages, CTA wiring, layout composition, CSS import chain, base-ui error)

### File List

- apps/it-counts/app/page.tsx (modified — replaced starter with dashboard shell)
- apps/it-counts/app/layout.tsx (modified — removed JS import of @bubbles/ui/globals.css)
- apps/it-counts/app/it-counts.css (modified — added @import @bubbles/ui/globals.css)
- apps/it-counts/app/log/page.tsx (new — placeholder)
- apps/it-counts/app/history/page.tsx (new — placeholder)
- apps/it-counts/components/dashboard/xp-hero.tsx (new)
- apps/it-counts/components/dashboard/log-activity-button.tsx (new)
- apps/it-counts/components/dashboard/bottom-nav.tsx (new)
- apps/it-counts/vitest.setup.ts (modified — added jest-dom/vitest import)
- apps/it-counts/__tests__/components/dashboard.test.tsx (new)
- apps/it-counts/__tests__/components/xp-hero.test.tsx (new)
- apps/it-counts/__tests__/components/bottom-nav.test.tsx (new)
- apps/it-counts/__tests__/components/log-activity-button.test.tsx (new)
