# Story 3.2: OverXP Display & Pace Indicator

Status: ready-for-dev

## Story

As a user,
I want to see how far beyond 100 XP I've gone and a pace indicator,
so that I understand my current intensity without it creating pressure.

## Acceptance Criteria

1. **Given** the user's total XP in the current level exceeds 100
   **When** the dashboard renders
   **Then** an `OverXpIndicator` displays the OverXP value (e.g. "+12 XP over")
   **And** a `StatusBadge` shows the pace label: "On track" (0 OverXP), "Slightly over" (1–19 OverXP), "Well over" (20+ OverXP)
   **And** the pace label uses both text and color — never color alone

2. **Given** the user has 0 OverXP (hasn't reached 100 yet)
   **When** the dashboard renders
   **Then** neither the OverXpIndicator nor StatusBadge are shown — the section is hidden

3. **Given** the status is "Slightly over" or "Well over"
   **When** displayed
   **Then** the tone of the label is neutral/informational — no warning language, no exclamation marks

## Tasks / Subtasks

- [ ] Task 1: Add the OverXP UI components
  - [ ] Create `OverXpIndicator`
  - [ ] Create `StatusBadge`
- [ ] Task 2: Wire the section to current-level state
  - [ ] Show the section only when `overXp > 0`
  - [ ] Map pace labels from `getOverXpPace()` to neutral UI copy
- [ ] Task 3: Add thresholds and rendering tests
  - [ ] Cover hidden state, slightly-over, and well-over outputs

## Dev Notes

### Implementation Focus

- This section is informational, not corrective. Treat it as neutral context for the current level.
- Reuse the domain values from `lib/levels.ts`; keep component copy thin and declarative.
- Prefer semantic tokens first, with direct Catppuccin tokens only where the UX spec explicitly allows it.

### Guardrails

- No exclamation marks, alerts, or destructive styling for OverXP.
- Hide the section entirely until OverXP exists.
- Keep meaning available in text, not color alone.

### Project Structure Notes

- Likely touch: `apps/it-counts/components/dashboard/over-xp-indicator.tsx`, `apps/it-counts/components/dashboard/status-badge.tsx`, `apps/it-counts/app/page.tsx`, `apps/it-counts/__tests__/components/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Level Progression]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotions to Avoid]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color-only information]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Custom Components (wrap shadcn, styled in own files)]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
