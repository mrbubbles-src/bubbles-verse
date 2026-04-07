# Story 4.2: Weekly Grouping & Aggregated XP Totals

Status: ready-for-dev

## Story

As a user,
I want my daily entries grouped by week with a weekly XP total,
so that I can see my consistency across weeks at a glance.

## Acceptance Criteria

1. **Given** the user has entries spanning multiple weeks
   **When** the history page renders
   **Then** `DailyGroup` components are wrapped in `WeeklyGroup` components, one per Monday–Sunday week
   **And** each `WeeklyGroup` shows the week range (e.g. "Apr 7 – Apr 13") and the total XP for that week
   **And** weeks are displayed in reverse-chronological order (most recent week first)
   **And** days with no entries are not shown — only days that have at least one entry appear

2. **Given** the current week has entries
   **When** the history page renders
   **Then** the current (incomplete) week appears at the top with its partial XP total

3. **Given** no entries exist yet (first open)
   **When** the history page renders
   **Then** the empty state from Story 4.1 is shown — no week headers, no empty week containers

## Tasks / Subtasks

- [ ] Task 1: Add weekly grouping on top of daily grouping
  - [ ] Create `WeeklyGroup`
  - [ ] Group days under Monday-Sunday week containers in reverse-chronological order
- [ ] Task 2: Add weekly XP totals and labels
  - [ ] Show the formatted week range and weekly XP sum
  - [ ] Keep the current partial week at the top
- [ ] Task 3: Extend history tests
  - [ ] Cover multi-week grouping, weekly totals, partial current week, and the shared empty state

## Dev Notes

### Implementation Focus

- Weekly grouping is a wrapper around the existing daily groups, not a second independent history structure.
- Reuse `getWeekStart()` everywhere so history and dashboard share the same week semantics.
- Only render days with entries; never fabricate empty day or week placeholders.

### Guardrails

- Monday-Sunday is the business rule, not a locale guess.
- Keep the empty state from Story 4.1 unchanged.
- Do not introduce chart-heavy or analytics-heavy UI here.

### Project Structure Notes

- Likely touch: `apps/it-counts/components/history/weekly-group.tsx`, `apps/it-counts/app/history/page.tsx`, `apps/it-counts/__tests__/components/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Activity History]
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Aggregation as a feature]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
