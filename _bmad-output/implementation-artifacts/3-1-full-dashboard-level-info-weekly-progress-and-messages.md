# Story 3.1: Full Dashboard — Level Info, Weekly Progress & Messages

Status: ready-for-dev

## Story

As a user,
I want to see my complete level status on the dashboard (level number, weeks elapsed, weekly XP, requirements),
so that I have a calm, honest overview of where I stand without having to navigate away.

## Acceptance Criteria

1. **Given** the user is on the dashboard
   **When** the page renders
   **Then** the current level number is displayed (with `LevelBadge`)
   **And** weeks elapsed in the current level are shown (e.g. "Week 2 of 4+")
   **And** the `XpProgressBar` shows total XP toward 100 with a gradient in OKLCH (`oklch(0.6 0.15 240)` → `oklch(0.65 0.12 280)`)
   **And** the weekly XP total for the current week (Monday–Sunday) is displayed alongside the "10 XP" motivational target
   **And** the current level's requirements and unlocked abilities are visible (FR19)
   **And** if weekly XP is below 10, no negative feedback, warning, or "you're behind" messaging is shown (FR18)

2. **Given** today is Monday and the user opens the app for the first time this week
   **When** the dashboard loads
   **Then** a `getRandomMessage('weekly-reset')` message appears once — regardless of last week's XP total

3. **Given** the user's weekly XP crosses the 10 XP threshold (on any entry)
   **When** the log confirmation appears
   **Then** a `getRandomMessage('goal-reached')` message is shown in place of the standard log-confirm message
   **And** this goal-reached message triggers only once per week (not on every subsequent entry)

## Tasks / Subtasks

- [ ] Task 1: Expand the dashboard information architecture
  - [ ] Add `LevelBadge`, weekly summary, requirements, and unlocked abilities sections
  - [ ] Apply the OKLCH gradient progress bar with the current total XP label
- [ ] Task 2: Implement weekly message gating
  - [ ] Show `weekly-reset` only once per week on first open
  - [ ] Show `goal-reached` only once per week when crossing the 10 XP threshold
  - [ ] Persist the week markers in storage-backed settings if needed so reloads do not retrigger them
- [ ] Task 3: Add tests for the weekly rules
  - [ ] Cover weekly XP totals, calm under-target rendering, weekly-reset gating, and goal-reached gating

## Dev Notes

### Implementation Focus

- The dashboard should feel calmer as it gets denser: clearer hierarchy, not more chrome.
- Weekly message rules are cross-session product behavior. A purely in-memory UI flag is not enough for "once per week".
- It is acceptable to extend `AppSettings` with optional weekly marker fields if that is the cleanest way to preserve the gating state.

### Guardrails

- No warning language when weekly XP is below 10.
- Keep weekly calculations tied to Monday-Sunday boundaries from `lib/dates.ts`.
- Keep color-only meaning out of the UI; text labels must carry the meaning.

### Project Structure Notes

- Likely touch: `apps/it-counts/app/page.tsx`, `apps/it-counts/components/dashboard/...`, `apps/it-counts/lib/messages.ts`, `apps/it-counts/hooks/...`, `apps/it-counts/types/index.ts`, `apps/it-counts/__tests__/...`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]
- [Source: _bmad-output/planning-artifacts/prd.md#Dashboard & Progress View]
- [Source: _bmad-output/planning-artifacts/prd.md#Motivational Messaging]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Dashboard as calm evidence]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color Token Usage]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
