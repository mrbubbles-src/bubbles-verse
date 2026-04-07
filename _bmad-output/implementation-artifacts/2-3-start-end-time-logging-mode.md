# Story 2.3: Start/End Time Logging Mode

Status: ready-for-dev

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

- [ ] Task 1: Add the reversible second input mode
  - [ ] Create `TimeRangeInput` with start, end, and non-walking fields
  - [ ] Add the subtle toggle link to swap between duration and time-range modes
- [ ] Task 2: Implement validation and calculation
  - [ ] Show inline field-level errors for invalid time order and invalid non-walking totals
  - [ ] Disable submit until the form is valid
  - [ ] Reuse the same store action and confirmation flow as duration mode
- [ ] Task 3: Add regression tests
  - [ ] Cover invalid end time, invalid non-walking time, reversible mode switching, and valid submission

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

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
