# Story 2.4: Multiple Entries & Daily XP Aggregation

Status: ready-for-dev

## Story

As a user,
I want multiple entries on the same day to sum into my daily total,
so that fragmented outings are treated the same as a single long one.

## Acceptance Criteria

1. **Given** the user has already logged one or more entries today
   **When** they log an additional entry
   **Then** the store calculates the new daily total across all entries for today's date
   **And** `calculateDailyXp(dailyTotalMinutes)` is applied to the daily total (not per-entry)
   **And** the XP on the dashboard reflects the daily XP for today (not a running sum of per-entry XP)

2. **Given** a daily total crosses an XP tier threshold on the third entry (e.g. 10+5+15 = 30 min → 5 XP, previously 3 XP)
   **When** the confirmation appears
   **Then** it shows the XP for today's total (e.g. "+5 XP today · That counted.")

3. **Given** XP is accumulated across multiple days within the level
   **When** the user views the dashboard
   **Then** the large XP number reflects total XP accumulated across all logged days in the current level
   **And** the `XpProgressBar` fills proportionally toward 100 XP

## Tasks / Subtasks

- [ ] Task 1: Move aggregation logic into the activity and level state
  - [ ] Add daily-total selectors in the activity store
  - [ ] Compute daily XP from the aggregated minutes, never from per-entry XP
- [ ] Task 2: Update the dashboard and confirmation copy
  - [ ] Show the hero XP value as total level XP across days
  - [ ] Add `XpProgressBar` with the correct current-level total
  - [ ] Update confirmation copy to reflect the new daily total result
- [ ] Task 3: Add fragmented-day tests
  - [ ] Cover multi-entry same-day aggregation, tier crossing, and cross-day level XP accumulation

## Dev Notes

### Implementation Focus

- This story is the anti-perfectionism core: fragmented days must feel rewarded, not second-class.
- The dashboard hero number and progress bar represent current-level XP across days.
- The confirmation copy reflects today's recalculated XP, not the delta of the latest entry alone.

### Guardrails

- Do not store per-entry XP on `ActivityEntry`; compute from aggregated daily minutes.
- Keep the aggregation logic in stores/lib, not duplicated in the page component.
- Reuse the same `calculateDailyXp()` function everywhere.

### Project Structure Notes

- Likely touch: `apps/it-counts/hooks/use-activity-store.ts`, `apps/it-counts/hooks/use-level-store.ts`, `apps/it-counts/components/dashboard/xp-progress-bar.tsx`, `apps/it-counts/app/page.tsx`, `apps/it-counts/__tests__/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 3 — The Fragmented Day (Primary, Edge Case)]
- [Source: _bmad-output/planning-artifacts/prd.md#Measurable Outcomes]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Aggregation as a feature]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Critical Success Moments]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
