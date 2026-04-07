# Story 2.2: Duration-Based Activity Logging

Status: done
Review: passed (2026-04-07)

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

- [x] Task 1: Build the logging sheet flow
  - [x] Create `LogEntrySheet` and `DurationInput`
  - [x] Auto-focus the minutes field when the sheet opens
- [x] Task 2: Wire duration logging end to end
  - [x] Show live XP preview while the user types
  - [x] Reuse the activity store for entry creation and immediate write-through
  - [x] Show inline confirmation inside the sheet, then close it
- [x] Task 3: Add dashboard session messaging and tests
  - [x] Render one `session-start` message per session through the UI store
  - [x] Add tests for live preview, entry creation, storage write, and inline confirmation

### Review Findings

- [x] [Review][Patch] XP wird jetzt kumulativ pro Tag berechnet — `addDurationEntry` summiert alle heutigen Einträge und berechnet XP-Delta. DurationInput-Preview nutzt ebenfalls kumulative Berechnung. Test für kumulative Logik hinzugefügt.
- [x] [Review][Patch] Validierungs-Test hinzugefügt — log-entry-sheet.test.tsx prüft jetzt die Fehlermeldung bei leerer/ungültiger Eingabe.
- [x] [Review][Defer] localStorage QuotaExceededError wird still geschluckt — saveEntries/saveCurrentLevel catch block returnt still, in-memory State divergiert von persistiertem State. Pre-existing pattern in storage.ts.
- [x] [Review][Defer] "+0 XP" Bestätigung bei Einträgen < 5 min — User loggt 1-4 Minuten, bekommt "+0 XP · That counted." angezeigt. Funktionell korrekt aber potenziell verwirrend.
- [x] [Review][Defer] DurationInput akzeptiert beliebige Strings — pattern="[0-9]*" ist kosmetisch, onChange leitet e.target.value ungefiltert weiter. Dezimalzahlen und Buchstaben möglich im Eingabefeld.
- [x] [Review][Defer] Keine Atomizität zwischen addDurationEntry und addXp — zwei Stores werden sequenziell mutiert ohne Rollback. Akzeptabel für MVP sync flow.
- [x] [Review][Defer] /log Route ist vestigial — zeigt nur "logging jetzt vom Dashboard" Text. Könnte entfernt oder redirected werden.
- [x] [Review][Defer] addXp schluckt ungültige Werte still — silent return bei NaN/negative/Infinity, Caller bekommt kein Feedback.
- [x] [Review][Defer] autoFocus doppelt — sowohl autoFocus-Prop als auch manueller requestAnimationFrame-Focus. Belt-and-suspenders für Sheet-Animation.
- [x] [Review][Defer] Storage-Validator akzeptiert durationMin:0 aber Form lehnt es ab — leichte Inkonsistenz an der Validation-Boundary.

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

- Added `addDurationEntry()` to the activity store and `addXp()` to the level store so logging stays synchronous while the UI remains thin.
- Replaced the dashboard CTA link with a bottom-sheet composition using shared shadcn/Base UI sheet and input primitives.
- Verified the rendered flow in a browser against the running dev server on `http://localhost:3000` after the full automated suite passed.

### Completion Notes List

- Implemented `LogEntrySheet`, `DurationInput`, `MotivationalMessage`, and `SessionStartMessage` to ship the inline duration logging flow on the dashboard.
- Duration logging now creates `ActivityEntry` records with `crypto.randomUUID()`, today's local date key, and ISO timestamps, then writes to `it-counts:entries` immediately.
- Dashboard XP now updates immediately through `useLevelStore.addXp()` after a successful log, and the sheet shows inline `log-confirm` feedback before auto-closing.
- Added coverage for the new UI flow plus store write-through behavior; `bun run test:run`, `bun run typecheck`, `bun run lint`, and `bun run build` all pass.

### Change Log

- 2026-04-07: Implemented the duration-based dashboard logging sheet, session-start messaging, and the supporting store/test updates.

### File List

- apps/it-counts/app/page.tsx
- apps/it-counts/app/log/page.tsx
- apps/it-counts/components/dashboard/log-activity-button.tsx
- apps/it-counts/components/dashboard/session-start-message.tsx
- apps/it-counts/components/logging/duration-input.tsx
- apps/it-counts/components/logging/log-entry-sheet.tsx
- apps/it-counts/components/shared/motivational-message.tsx
- apps/it-counts/hooks/use-activity-store.ts
- apps/it-counts/hooks/use-level-store.ts
- apps/it-counts/__tests__/components/dashboard.test.tsx
- apps/it-counts/__tests__/components/log-activity-button.test.tsx
- apps/it-counts/__tests__/components/log-entry-sheet.test.tsx
- apps/it-counts/__tests__/components/session-start-message.test.tsx
- apps/it-counts/__tests__/hooks/use-activity-store.test.ts
- apps/it-counts/__tests__/hooks/use-level-store.test.ts
- apps/it-counts/README.md
- apps/it-counts/CHANGELOG.md
- apps/it-counts/next-env.d.ts
