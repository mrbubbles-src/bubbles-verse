# Story 4.1: Activity History Page — Chronological Daily View

Status: review

## Story

As a user,
I want to see all my past activity entries grouped by day,
so that I can look back at my movement history and see daily totals at a glance.

## Acceptance Criteria

1. **Given** the user navigates to `/history`
   **When** there are no entries in localStorage
   **Then** a neutral empty state is shown: "Nothing logged yet. Your history will appear here."
   **And** no sad face, no pressure to log, no call-to-action

2. **Given** the user has logged one or more entries
   **When** the history page renders
   **Then** entries are grouped into `DailyGroup` components, one per calendar day, in reverse-chronological order (most recent first)
   **And** each `DailyGroup` shows the date, a list of individual entries (duration in minutes, time logged), and the daily total (e.g. "30 min total · 5 XP")
   **And** individual entries within a day are shown in chronological order (earliest first)
   **And** there is no edit or delete action on any entry — entries are permanent

3. **Given** the user has logged entries across multiple sessions
   **When** the history page renders
   **Then** all entries appear correctly (FR26 — data persists from localStorage via the activity store)

## Tasks / Subtasks

- [x] Task 1: Create the history route and empty state
  - [x] Add `apps/it-counts/app/history/page.tsx`
  - [x] Render the neutral empty state when there are no entries
- [x] Task 2: Build `DailyGroup`
  - [x] Group entries by day in reverse-chronological order
  - [x] Render per-entry times oldest-first inside each group
  - [x] Show daily total minutes and daily XP
- [x] Task 3: Add tests for ordering and permanence
  - [x] Cover empty state, day grouping, entry order, and the absence of edit/delete actions

## Dev Notes

### Implementation Focus

- History is proof, not a productivity dashboard. Keep it readable and factual.
- No edit/delete controls by product philosophy.
- Reuse activity-store selectors instead of regrouping entries ad hoc inside JSX.

### Guardrails

- Use a friendly empty state without pressure or CTA.
- Preserve the data exactly as logged across sessions.
- Keep mobile-first spacing and avoid dense table layouts.

### Project Structure Notes

- Likely touch: `apps/it-counts/app/history/page.tsx`, `apps/it-counts/components/history/daily-group.tsx`, `apps/it-counts/__tests__/components/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 3 — The Fragmented Day (Primary, Edge Case)]
- [Source: _bmad-output/planning-artifacts/prd.md#Activity History]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#History as proof]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Empty States]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Replaced placeholder `app/history/page.tsx` with full implementation; client component using `useActivityStore`
- Grouping logic in `useMemo`: `Map<date, entries[]>`, entries sorted by `loggedAt`, dates sorted reverse-chronologically
- Created `components/history/daily-group.tsx`: `<article>` with date heading, per-entry list (durationMin + formatted time), and daily total (`N min total · N XP`)
- `DailyGroup` uses `calculateDailyXp` from `@/lib/xp` — no ad-hoc XP logic
- Empty state: plain neutral text, no CTA, no sad face
- 8 tests: empty state, no buttons, 2 groups, order, totals, individual entries, no edit/delete
- 25 test files / 146 tests all pass

### File List

- apps/it-counts/app/history/page.tsx (modified)
- apps/it-counts/components/history/daily-group.tsx (new)
- apps/it-counts/__tests__/components/history/history-page.test.tsx (new)

## Change Log

- 2026-04-08: Implemented activity history page with `DailyGroup` component, reverse-chronological grouping, neutral empty state, and full test coverage (Story 4.1)
