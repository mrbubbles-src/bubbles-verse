# Story 3.1: Full Dashboard — Level Info, Weekly Progress & Messages

Status: review

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

- [x] Task 1: Expand the dashboard information architecture
  - [x] Add `LevelBadge`, weekly summary, requirements, and unlocked abilities sections
  - [x] Apply the OKLCH gradient progress bar with the current total XP label
- [x] Task 2: Implement weekly message gating
  - [x] Show `weekly-reset` only once per week on first open
  - [x] Show `goal-reached` only once per week when crossing the 10 XP threshold
  - [x] Persist the week markers in storage-backed settings if needed so reloads do not retrigger them
- [x] Task 3: Add tests for the weekly rules
  - [x] Cover weekly XP totals, calm under-target rendering, weekly-reset gating, and goal-reached gating

### Review Findings

- [x] [Review][Patch] Double/inconsistent logging CTA — BottomNav "+" navigates to `/log` page instead of triggering `LogEntrySheet` inline; violates spec "no page change" + "one primary CTA per screen" [`bottom-nav.tsx:28-33`, `page.tsx:233`]
- [x] [Review][Patch] XpHero card chrome — `rounded-2xl border border-border/60 bg-background/60` on section wrapper creates card look; spec: "section-based layout, not card-based" [`xp-hero.tsx:53`]
- [x] [Review][Patch] XP number no typographic contrast — `{xp} / 100 XP` single string at uniform size; spec Direction 1 requires large number + visually secondary "/ 100 XP" [`xp-hero.tsx:59-63`]
- [x] [Review][Patch] LEVEL·WEEK label split + internal dividers — level badge and week info separated by dividers instead of single compact label above XP number; two `border-t` dividers fragment the hero [`xp-hero.tsx:54-56,79-86`]
- [x] [Review][Patch] LevelRequirements card overload — `bg-muted/40 rounded-xl` card below XpHero; spec warns against card overload + unnecessary wrapper elements [`level-requirements.tsx:19`, `page.tsx:231`]

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

claude-sonnet-4-6

### Debug Log References

- `log-entry-sheet.test.tsx` mock updated: added `getWeekStart` to `@/lib/dates` mock, `getWeeklyXp` to activity store's `getState()`, and new `useSettingsStore` mock. Required because `handleSubmit` now calls these at submit time.
- `dashboard.test.tsx` mock updated: added `getDailyTotalMinutes`, `getWeeklyXp` to activity store mock, and added `useSettingsStore` mock for new components.
- Lint: 1 warning (`react-hooks/set-state-in-effect`) in `session-start-message.tsx` — pre-existing pattern in the file (same `setState` inside effect was already there).

### Completion Notes List

- Created `hooks/use-settings-store.ts`: storage-backed Zustand store for `AppSettings`. Used for cross-session weekly message markers.
- Created `components/dashboard/level-badge.tsx`: pill badge showing "Level N".
- Created `components/dashboard/weekly-summary.tsx`: shows "Week N of 4+" and "X XP · Goal: 10 XP" (no warning language when under target).
- Created `components/dashboard/level-requirements.tsx`: reads `LEVEL_DEFINITIONS`, shows requirements + unlocked abilities for current level.
- Updated `xp-progress-bar.tsx`: replaced `bg-primary` with OKLCH gradient `oklch(0.6 0.15 240) → oklch(0.65 0.12 280)`.
- Updated `xp-hero.tsx`: added `LevelBadge` above XP text.
- Updated `page.tsx`: added `WeeklySummary` and `LevelRequirements` sections.
- Updated `store-hydrator.tsx`: added settings store hydration.
- Updated `session-start-message.tsx`: `weekly-reset` takes priority over `session-start` on new week; both gated by session flag so no re-trigger on same-session nav.
- Updated `log-entry-sheet.tsx`: after logging, checks `weeklyXp >= 10 && goalReachedShownForWeek !== weekStart` to show `goal-reached` once per week instead of `log-confirm`.
- Added `getWeeklyXp(weekStart)` to `use-activity-store.ts`.
- All 110 tests pass. TypeCheck clean.

### File List

- `apps/it-counts/hooks/use-settings-store.ts` (new)
- `apps/it-counts/hooks/use-activity-store.ts` (modified — added `getWeeklyXp`)
- `apps/it-counts/components/dashboard/level-badge.tsx` (new)
- `apps/it-counts/components/dashboard/weekly-summary.tsx` (new)
- `apps/it-counts/components/dashboard/level-requirements.tsx` (new)
- `apps/it-counts/components/dashboard/xp-progress-bar.tsx` (modified — OKLCH gradient)
- `apps/it-counts/components/dashboard/xp-hero.tsx` (modified — LevelBadge)
- `apps/it-counts/components/dashboard/session-start-message.tsx` (modified — weekly-reset priority)
- `apps/it-counts/components/logging/log-entry-sheet.tsx` (modified — goal-reached gate)
- `apps/it-counts/components/shared/store-hydrator.tsx` (modified — settings hydration)
- `apps/it-counts/app/page.tsx` (modified — WeeklySummary + LevelRequirements)
- `apps/it-counts/__tests__/hooks/use-settings-store.test.ts` (new)
- `apps/it-counts/__tests__/components/dashboard/level-badge.test.tsx` (new)
- `apps/it-counts/__tests__/components/dashboard/weekly-summary.test.tsx` (new)
- `apps/it-counts/__tests__/components/dashboard/level-requirements.test.tsx` (new)
- `apps/it-counts/__tests__/components/session-start-message.test.tsx` (modified)
- `apps/it-counts/__tests__/components/log-entry-sheet.test.tsx` (modified — updated mocks)
- `apps/it-counts/__tests__/components/dashboard.test.tsx` (modified — updated mocks)

## Change Log

- 2026-04-08: Implemented full dashboard with LevelBadge, WeeklySummary, LevelRequirements, OKLCH gradient progress bar, weekly-reset + goal-reached message gating (storage-backed via useSettingsStore). 110 tests pass.
