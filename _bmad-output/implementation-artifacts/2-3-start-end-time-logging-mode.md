# Story 2.3: Start/End Time Logging Mode

Status: done

## Story

As a user,
I want to log activity using start time, end time, and non-walking time,
so that I can accurately capture trips where I know the times rather than the total duration.

## Acceptance Criteria

1. **Given** the log sheet is open showing the duration input
   **When** the user taps "Use start / end time instead"
   **Then** the `TimeRangeInput` is revealed with three fields: start time, end time, non-walking minutes
   **And** tapping "Use duration instead" returns to the `DurationInput` (toggle is reversible)

2. **Given** the user fills in start and end time
   **When** end time is before or equal to start time
   **Then** an inline error appears below the affected field; the submit button is disabled

3. **Given** the user fills in non-walking time
   **When** non-walking time exceeds the total (end − start) duration
   **Then** an inline error appears; the submit button is disabled

4. **Given** all fields are valid
   **When** the user submits
   **Then** walking time is calculated as `(end − start) − non_walking_time`, minimum 0 minutes
   **And** the entry is logged identically to Story 2.2 (same store action, same confirmation, same localStorage write)

## Tasks / Subtasks

- [x] Task 1: Add the reversible second input mode
  - [x] Create `TimeRangeInput` with start, end, and non-walking fields
  - [x] Add the subtle toggle link to swap between duration and time-range modes
- [x] Task 2: Implement validation and calculation
  - [x] Show inline field-level errors for invalid time order and invalid non-walking totals
  - [x] Disable submit until the form is valid
  - [x] Reuse the same store action and confirmation flow as duration mode
- [x] Task 3: Add regression tests
  - [x] Cover invalid end time, invalid non-walking time, reversible mode switching, and valid submission

## Dev Notes

### Implementation Focus

- Duration mode remains the default and should stay the fastest path.
- Keep the toggle as a subtle text action, not tabs or segmented controls.
- Treat calculated walking minutes as `Math.max(0, ...)` and hand the final duration to the same entry pipeline as Story 2.2.

### Guardrails

- Inline errors only; no toasts or modal errors.
- Do not fork storage or confirmation logic between the two input modes.
- Keep labels visible above inputs; no placeholder-only labelling.

### Project Structure Notes

- Likely touch: `apps/it-counts/components/logging/time-range-input.tsx`, `apps/it-counts/components/logging/log-entry-sheet.tsx`, `apps/it-counts/__tests__/components/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/prd.md#Activity Logging]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Mental Model]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless Interactions]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implemented `TimeRangeInput` as a purely presentational controlled component; all validation state is computed in the parent to avoid callback dependency issues and keep components simple.
- Added `computeTimeRange()` pure function in `log-entry-sheet.tsx` — calculates errors and walking minutes from raw string inputs; co-located with its sole consumer.
- Toggle uses `<button type="button">` for correct semantics inside the form.
- Submit disabled logic: `confirmation !== null || (inputMode === 'time-range' && !isTimeRangeValid)` — no branching needed in the submit handler for the "incomplete" case.
- `resetSheetState()` now clears all time-range fields and resets `inputMode` to `'duration'` on sheet close.
- 5 new tests added; all 79 tests pass with no regressions.

### File List

- `apps/it-counts/components/logging/time-range-input.tsx` (new)
- `apps/it-counts/components/logging/log-entry-sheet.tsx` (modified)
- `apps/it-counts/__tests__/components/log-entry-sheet.test.tsx` (modified)

## Change Log

- 2026-04-07: Story 2.3 implemented — reversible start/end time logging mode with inline validation, `computeTimeRange` helper, and 5 new tests (79 total, 0 regressions).
- 2026-04-07: Code review — `parseTimeToMinutes` now rejects non-integer parts and out-of-range hours/minutes (0–23 / 0–59).

### Review Findings

- [x] [Review][Patch] Harden parseTimeToMinutes with hour (0–23) and minute (0–59) range checks [apps/it-counts/components/logging/log-entry-sheet.tsx:parseTimeToMinutes]
- [x] [Review][Defer] AC4 persistence (`same localStorage write`) is not proven for the time-range submit path; component tests still mock the store — deferred, pre-existing test strategy (same pattern as duration mode)
