# Story 2.2: Duration-Based Activity Logging

Status: ready-for-dev

## Story

As a user,
I want to log a movement by entering a duration in minutes,
so that I can record my activity in under 30 seconds and see the XP immediately.

## Acceptance Criteria

1. **Given** the user taps "Log Activity" on the dashboard
   **When** the bottom sheet opens
   **Then** the `DurationInput` field is auto-focused and ready for input
   **And** as the user types a duration, the XP tier previews live (e.g. "= 5 XP" appears once ≥30 min entered)
   **And** tapping "Log it" creates a new `ActivityEntry` with `crypto.randomUUID()` id, today's date, the entered duration, and current ISO timestamp
   **And** the entry is written to `it-counts:entries` in localStorage immediately
   **And** inline confirmation appears within the sheet: "+X XP · That counted." followed by a `getRandomMessage('log-confirm')` message
   **And** the sheet closes after confirmation; the dashboard XP display updates to reflect the new entry
   **And** on first load of the session (no previous session message shown), a `getRandomMessage('session-start')` message appears on the dashboard

## Tasks / Subtasks

- [ ] Task 1: Build the logging sheet flow
  - [ ] Create `LogEntrySheet` and `DurationInput`
  - [ ] Auto-focus the minutes field when the sheet opens
- [ ] Task 2: Wire duration logging end to end
  - [ ] Show live XP preview while the user types
  - [ ] Reuse the activity store for entry creation and immediate write-through
  - [ ] Show inline confirmation inside the sheet, then close it
- [ ] Task 3: Add dashboard session messaging and tests
  - [ ] Render one `session-start` message per session through the UI store
  - [ ] Add tests for live preview, entry creation, storage write, and inline confirmation

## Dev Notes

### Implementation Focus

- The confirmation belongs inside the sheet, not in Sonner.
- Entry creation must use `crypto.randomUUID()`, today's local date string, and an ISO timestamp.
- Keep the logging path synchronous and fast; MVP should not show loading states.

### Guardrails

- Use the store and pure lib modules; do not calculate XP separately in the component tree.
- Validation and UI strings live at the form boundary, not in the lib files.
- `session-start` is session-scoped only; do not persist it in localStorage.

### Project Structure Notes

- Likely touch: `apps/it-counts/components/logging/log-entry-sheet.tsx`, `apps/it-counts/components/logging/duration-input.tsx`, `apps/it-counts/components/shared/motivational-message.tsx`, `apps/it-counts/app/page.tsx`, `apps/it-counts/__tests__/components/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 1 — The Normal Day (Primary, Success Path)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Critical Success Moments]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Loading State Patterns]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
