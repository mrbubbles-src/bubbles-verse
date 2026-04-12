---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
completedAt: '2026-04-07'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# It Counts - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for It Counts, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Activity Logging**
- FR1: User can log an activity entry with either (a) direct walking duration input, or (b) start time + end time + non-walking time — system calculates walking time: `(end_time − start_time) − non_walking_time`
- FR1a: Option (b) validates: end time must be after start time; error shown, submit blocked until corrected
- FR1b: Option (b) validates: non-walking time must not exceed total duration; error shown, submit blocked until corrected
- FR1c: Minimum calculated walking time is 0 minutes — no negative values possible
- FR2: User can log multiple activity entries for the same day
- FR3: System sums all walking time entries for a given day into a daily total
- FR4: System calculates XP from the daily total using the fixed XP tier table

**XP Calculation**
- FR5: System applies the highest qualifying XP tier based on daily total walking time: 5min→1XP, 10min→2XP, 20min→3XP, 30+min→5XP
- FR6: System enforces the XP cap — no XP earned beyond the 30+ minute tier regardless of duration
- FR7: System accumulates XP across all logged days within the current level

**Level Progression**
- FR8: System tracks weeks elapsed since the current level started. Level 1 timer starts on date of first ever logged entry; Level 2+ timer starts on level-up date. Week = Monday–Sunday, device local time.
- FR9: System displays level-up eligibility only when both 100 XP AND 4 full weeks have been reached
- FR10: User can trigger a level-up when both eligibility conditions are met
- FR11: System resets XP to zero and increments level number upon level-up
- FR12: System calculates and displays OverXP (XP earned beyond the 100 threshold within the level)
- FR13: System displays an OverXP pace indicator (on track / slightly over / well over)
- FR14: System displays the requirements and new abilities of both the completed and upcoming level at level-up

**Dashboard & Progress View**
- FR15: User can view current level, XP progress toward 100, and weeks elapsed in the current level
- FR16: User can view the daily XP total for the current day
- FR17: User can view weekly XP total and the 10 XP/week motivational target
- FR18: System never displays negative feedback or penalties for missing the weekly target
- FR19: User can view current level requirements and unlocked abilities

**Motivational Messaging**
- FR20: System displays a short motivational message when the user logs an activity
- FR21: System displays a motivational message at the start of each new week (Monday) — tone always encouraging, never judgmental
- FR22: System displays a motivational message when the weekly XP target (10 XP) is reached
- FR22b: System displays a motivational message once per app session on the dashboard (on first load if none shown yet during that session)
- FR23: MVP messages drawn from a curated hardcoded collection; V2 messages personalised by AI

**Activity History**
- FR24: User can view a chronological list of all past activity entries
- FR25: User can view aggregated daily and weekly XP totals in history
- FR26: Activity history persists across app sessions

**App & Data**
- FR27: App data persists locally via localStorage — no authentication required
- FR28: App is installable as a PWA on iOS and Android
- FR29: App functions offline — entries saved locally with no network dependency

**AI Interaction (V2)**
- FR30: User can configure an AI provider and API key (Anthropic, OpenAI, or compatible)
- FR31: User can submit a natural language activity description for AI parsing
- FR32: AI confirms parsed walking time and calculated XP before logging the entry
- FR33: AI maintains a persistent user profile built from logged sessions and notes
- FR34: AI surfaces personalised tips based on the user profile
- FR35: AI recommends difficulty adjustments at level-up based on OverXP and profile context
- FR36: User can view their AI-maintained profile

**Notifications & Achievements (V2)**
- FR37: User can configure optional recurring activity days for reminder notifications
- FR38: System sends a push notification on configured days if no activity logged by a set time
- FR39: System sends a push notification if AI has recorded a start intent but no end time logged after a configurable duration
- FR40: User can opt in or out of each notification type individually
- FR41: System awards hidden achievements based on usage patterns — not visible to the user in advance
- FR42: User is notified when an achievement is unlocked
- FR43: User can view previously unlocked achievements (but not future ones)

### NonFunctional Requirements

**Performance**
- NFR1: Activity log entry: user action to confirmation < 500ms
- NFR2: Initial app load on mobile (4G): LCP < 2.5s
- NFR3: Dashboard render (all weekly/level data): < 300ms
- NFR4: XP calculation: synchronous, no perceivable delay
- NFR5: Bundle size: lean — no heavy dependencies without justification

**Reliability**
- NFR6: Activity data persists immediately on write — no loss on refresh, tab close, or device restart
- NFR7: No data loss on service worker update or app upgrade
- NFR8: Offline logging functional with no network dependency
- NFR9: Weekly XP reset (Monday) executes correctly regardless of device timezone

**Security**
- NFR10: MVP — no sensitive personal data; localStorage is private by default; no authentication
- NFR11: V2 — user-provided API key stored encrypted via Web Crypto API (AES-GCM); never exposed in source code, logs, or client-side JavaScript

**Accessibility**
- NFR12: All interactive elements keyboard-navigable
- NFR13: Semantic HTML with correct heading hierarchy and ARIA landmarks
- NFR14: Color contrast compliant with WCAG AA (Catppuccin Mocha/Latte already validated)
- NFR15: No information conveyed by color alone (OverXP indicator uses text label + color)

**UX & Animations**
- NFR16: Subtle, purposeful animations reinforce feedback (XP gain, level-up, entry confirmation) — not decorative; never delay feedback
- NFR17: Page transitions via View Transitions API (`circle-in` animation already in `@bubbles/ui/globals.css`)
- NFR18: Theme toggle (light/dark) uses View Transitions for smooth animated switch via `@bubbles/theme`
- NFR19: All animations respect `prefers-reduced-motion`

### Additional Requirements

- ARCH1: **Monorepo prerequisite — `@bubbles/theme` package:** Extract animated theme toggle (next-themes + View Transitions toggle component) from TeacherBuddy into a shared package before building It Counts. It Counts consumes it from day one.
- ARCH2: **`apps/it-counts` monorepo adaptation:** `apps/it-counts` exists (created via `create-next-app`). Still needed: update `package.json` (add `@bubbles/ui`, `@bubbles/theme`, `@bubbles/eslint-config`, `@bubbles/typescript-config` as workspace dependencies, update bun scripts), update `tsconfig.json` and `eslint.config.mjs` to use shared configs, update `next.config.ts` to Next.js 16.2.2, rename `globals.css` → `it-counts.css`.
- ARCH3: **shadcn components:** `components.json` already exists (`bunx shadcn@latest init` done). Still needed: add components via CLI: `bunx shadcn@latest add sheet progress badge button input sonner`
- ARCH4: **`lib/storage.ts` first:** Persistence abstraction must be implemented first — all other modules depend on it. Interface must be Supabase-migration-ready for V3.
- ARCH5: **`lib/xp.ts` as pure functions:** XP calculation must be pure, fully unit-testable, no side effects, no React imports.
- ARCH6: **`lib/dates.ts` central date utilities:** All device-local-time calculations, week boundary logic (Monday–Sunday), level timer logic in one module.
- ARCH7: **`lib/levels.ts` extensible:** Level schema must be extensible for Level 4+ without breaking changes on existing data.
- ARCH8: **`lib/messages.ts` message collection:** Curated hardcoded motivational messages for MVP — 4 contexts (log-confirm, weekly-reset, goal-reached, session-start).
- ARCH9: **Custom Service Worker:** `public/sw.js` with Cache-First strategy for static assets. No third-party PWA package. Register via `useEffect` in `app/layout.tsx`.
- ARCH10: **Zustand write-through pattern:** Every store mutation writes through to `storage.ts` immediately — no deferred flush. Stores hydrate from storage on mount.
- ARCH11: **Vercel deployment:** Deploy `apps/it-counts` as a new Vercel project within the bubbles-verse workspace.
- ARCH12: **Tests in `__tests__/` only:** All tests in dedicated `__tests__/lib/` and `__tests__/components/` directories — never co-located with source files.
- ARCH13: **OKLCH colors everywhere:** All CSS color values must be `oklch(L C H)` — no hex, no RGB, no HSL. Monorepo-wide without exception.

### UX Design Requirements

- UX-DR1: Extract shared fonts to `@bubbles/ui/src/fonts.ts` — Montserrat (`--font-heading`, headings), Poppins 400/500/600 (`--font-body`, body), Fira Code (`--font-code`, code) — each with system font fallbacks. Export configured `next/font` objects for all apps to consume.
- UX-DR2: Add typography defaults to `@bubbles/ui/globals.css` — h1–h6 sizes using `var(--font-heading)`, body line-height using `var(--font-body)`, code blocks using `var(--font-code)`. Defined once, applies everywhere.
- UX-DR3: Apply `touch-hitbox` class globally to shadcn `Button` component (only change to shadcn file — all buttons must meet 44px touch target standard).
- UX-DR4: Implement `LogEntrySheet` — wraps shadcn `Sheet`. Bottom sheet over dashboard content, handle indicator, duration input auto-focused on open.
- UX-DR5: Implement `DurationInput` — wraps shadcn `Input`. Minutes field, auto-focus, XP live preview updates as user types.
- UX-DR6: Implement `TimeRangeInput` — wraps shadcn `Input` ×3. Start time / end time / non-walking time. Inline validation per FR1a and FR1b.
- UX-DR7: Implement `XpProgressBar` — wraps shadcn `Progress`. Gradient (`var(--ctp-blue)` → `var(--ctp-lavender)`), 6px height, rounded, "+68 / 100 XP" label.
- UX-DR8: Implement `StatusBadge` — wraps shadcn `Badge`. Three states: "On track" / "Slightly over" / "Well over". Text + color (not color alone per NFR15).
- UX-DR9: Implement `LogActivityButton` — wraps shadcn `Button`. Primary log CTA, variant="default", one per screen max.
- UX-DR10: Implement `MotivationalMessage` — no shadcn base. Text-only. Used for log confirmation inline in Sheet + dashboard session message.
- UX-DR11: Implement `OverXpIndicator` — wraps `Badge`. Displays OverXP value + pace label on dashboard.
- UX-DR12: Implement `DailyGroup` — no shadcn base. Day-level grouping with all entries + daily XP total in history view.
- UX-DR13: Implement `WeeklyGroup` — no shadcn base. Week-level grouping with daily groups + weekly XP total in history view.
- UX-DR14: Implement `LevelBadge` — wraps shadcn `Badge`. Level number display, reused on dashboard, history, and level-up page.
- UX-DR15: Implement Typography Hero dashboard layout — large XP number as primary visual anchor (Montserrat 800, 64–80px mobile, `var(--ctp-text)`), level context and week info secondary.
- UX-DR16: Implement bottom navigation — 3 items max: Dashboard · + (log) · History.
- UX-DR17: Implement level-up eligibility CTA — conditional `Button` on dashboard, visible only when FR9 conditions met. Calm, no banner, no auto-redirect. Text: "Level X ready — Level Up →"
- UX-DR18: Implement `/level-up` page — brief confetti burst (short, non-looping), Level 1 summary, OverXP display, Level 2 requirements, "Start Level 2" CTA, "Back to dashboard" button.
- UX-DR19: Implement inline log confirmation within Sheet — shows "+X XP · That counted." + motivational message before sheet auto-closes. Not a Sonner toast. Identical UI for 1 XP and 5 XP.
- UX-DR20: Implement empty state components — "Nothing logged yet today." (neutral, no sad face) for history; brief friendly explanation for first-time history.
- UX-DR21: Implement dual-mode input toggle — duration as default (auto-focused), subtle text link "Use start / end time instead" reveals `TimeRangeInput`. Never tabs or segmented control.
- UX-DR22: Implement `XpProgressBar` gradient in OKLCH — `oklch(0.6 0.15 240)` → `oklch(0.65 0.12 280)` (approximating blue→lavender in Catppuccin Mocha). No hex, no RGB.

### FR Coverage Map

FR1: Epic 2 — Activity logging, duration input
FR1a: Epic 2 — End time validation
FR1b: Epic 2 — Non-walking time validation
FR1c: Epic 2 — Minimum 0-minute walking time
FR2: Epic 2 — Multiple entries per day
FR3: Epic 2 — Daily total calculation
FR4: Epic 2 — XP calculation from daily total
FR5: Epic 2 — XP tier table application
FR6: Epic 2 — XP cap enforcement
FR7: Epic 2 — XP accumulation within level
FR8: Epic 3 — Week tracking, level timer rules
FR9: Epic 3 — Level-up eligibility (100 XP + 4 weeks)
FR10: Epic 3 — User-triggered level-up
FR11: Epic 3 — XP reset on level-up
FR12: Epic 3 — OverXP calculation and display
FR13: Epic 3 — OverXP pace indicator
FR14: Epic 3 — Level requirements display at level-up
FR15: Epic 3 — Current level, XP progress, weeks elapsed
FR16: Epic 2 — Daily XP total on dashboard
FR17: Epic 3 — Weekly XP total + 10 XP motivational target
FR18: Epic 3 — No negative feedback for missing weekly target
FR19: Epic 3 — Current level requirements and abilities
FR20: Epic 2 — Motivational message on log confirmation
FR21: Epic 3 — Motivational message on new week (Monday)
FR22: Epic 3 — Motivational message when 10 XP/week reached
FR22b: Epic 2 — Session dashboard motivational message
FR23: Epic 3 — Hardcoded message collection (MVP)
FR24: Epic 4 — Chronological activity history list
FR25: Epic 4 — Aggregated daily and weekly XP in history
FR26: Epic 4 — History persistence across sessions
FR27: Epic 2 — localStorage persistence, no auth
FR28: Epic 5 — PWA installable on iOS/Android
FR29: Epic 5 — Offline logging, no network dependency

## Epic List

### Epic 1: Foundation — App Runs with Correct Monorepo Setup
The app boots locally with the full shared design system (`@bubbles/ui`, Catppuccin, fonts, theme toggle). All business logic modules (`lib/`) are implemented and unit-tested. Monorepo tooling, shadcn, and Zustand stores are wired up correctly. Development of user-facing features can begin.
**Requirements covered:** ARCH1–ARCH13, UX-DR1, UX-DR2, UX-DR3, types/index.ts

### Epic 2: Activity Logging & XP
Users can log a movement (duration or start/end/non-walking time), see XP calculated live, receive an inline confirmation, and view their daily XP on the dashboard. All data persists in localStorage.
**FRs covered:** FR1, FR1a, FR1b, FR1c, FR2, FR3, FR4, FR5, FR6, FR7, FR16, FR20, FR22b, FR27
**UX-DRs covered:** UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR9, UX-DR10, UX-DR15, UX-DR16, UX-DR19, UX-DR21

### Epic 3: Level System & Full Dashboard
Users can see their complete level status (XP progress toward 100, weeks elapsed, OverXP pace), trigger a level-up when eligible (4 weeks + 100 XP), and experience the level transition with brief confetti. Weekly XP tracking and motivational messages appear at the right moments.
**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR17, FR18, FR19, FR21, FR22, FR23
**UX-DRs covered:** UX-DR8, UX-DR11, UX-DR14, UX-DR17, UX-DR18, UX-DR22

### Epic 4: Activity History
Users can view a full chronological history of all logged activities, grouped by day and week, with aggregated XP totals and empty states.
**FRs covered:** FR24, FR25, FR26
**UX-DRs covered:** UX-DR12, UX-DR13, UX-DR20

### Epic 5: PWA & Production
The app is installable on iOS and Android homescreen, works offline with a custom service worker, loads fast on mobile, and is deployed to Vercel. Full performance, accessibility, and animation audit completed.
**FRs covered:** FR28, FR29
**NFRs covered:** NFR1–NFR19
**ARCH covered:** ARCH9, ARCH11

## Epic 1: Foundation — App Runs with Correct Monorepo Setup

The app boots locally with the full shared design system (`@bubbles/ui`, Catppuccin, fonts, theme toggle). All business logic modules (`lib/`) are implemented and unit-tested. Monorepo tooling, shadcn, and Zustand stores are wired up correctly. Development of user-facing features can begin.

### Story 1.1: Extract `@bubbles/theme` Package

As a developer,
I want the theme toggle (next-themes + View Transitions animation) extracted into `packages/theme`,
So that It Counts and all future apps can consume a consistent animated theme toggle from day one.

**Acceptance Criteria:**

**Given** TeacherBuddy has a working animated theme toggle with View Transitions
**When** `packages/theme` is created
**Then** it exports `ThemeProvider` (wraps next-themes) and `ThemeToggle` component
**And** TeacherBuddy is updated to import from `@bubbles/theme` instead of its local implementation
**And** `bun run build` passes monorepo-wide without errors

---

### Story 1.2: Add Shared Fonts & Typography to `@bubbles/ui`

As a developer,
I want Montserrat, Poppins, and Fira Code configured in `@bubbles/ui/src/fonts.ts`,
So that all apps import pre-configured font objects and get consistent typography without per-app font setup.

**Acceptance Criteria:**

**Given** `packages/ui/src/fonts.ts` does not yet export configured fonts
**When** the file is created
**Then** it exports `montserrat` (`--font-heading`), `poppins` 400/500/600 (`--font-body`), `firaCode` (`--font-code`), each with system font fallbacks
**And** `@bubbles/ui/globals.css` defines h1–h6 sizes via `var(--font-heading)` and body/code defaults via `var(--font-body)` / `var(--font-code)`
**And** all color values added to `globals.css` are in `oklch(L C H)` format only

---

### Story 1.3: Adapt `apps/it-counts` to Monorepo Conventions

As a developer,
I want `apps/it-counts` fully integrated into the bubbles-verse monorepo,
So that it uses shared configs, shared packages, and the correct Next.js version.

**Acceptance Criteria:**

**Given** `apps/it-counts` has a `create-next-app` scaffold with `components.json` already present
**When** monorepo adaptation is complete
**Then** `package.json` lists `@bubbles/ui`, `@bubbles/theme`, `@bubbles/eslint-config`, `@bubbles/typescript-config` as workspace dependencies
**And** `tsconfig.json` extends `@bubbles/typescript-config`, `eslint.config.mjs` extends `@bubbles/eslint-config`
**And** `next.config.ts` targets Next.js 16.2.2
**And** `globals.css` is renamed to `it-counts.css` (placed in `app/`)
**And** `app/layout.tsx` imports fonts from `@bubbles/ui/fonts`, applies CSS variable classes to `<html>`, and wraps children in `@bubbles/theme` ThemeProvider
**And** shadcn components are added via CLI: `bunx shadcn@latest add sheet progress badge button input sonner`
**And** `touch-hitbox` class is added globally to the shadcn `Button` component (only change to that file)
**And** `bun run dev` starts without errors

---

### Story 1.4: Core Types & Persistence Abstraction

As a developer,
I want `types/index.ts` and `lib/storage.ts` implemented,
So that all data types are defined and localStorage access goes through a single, migration-ready interface.

**Acceptance Criteria:**

**Given** the app requires `ActivityEntry`, `LevelState`, and `AppSettings` types
**When** `types/index.ts` and `lib/storage.ts` are created
**Then** `types/index.ts` exports all three types with correct field names, TypeScript types, and JSDoc comments
**And** `lib/storage.ts` exports typed read/write functions for keys `it-counts:entries`, `it-counts:current-level`, `it-counts:settings`
**And** no other file accesses `localStorage` directly
**And** `lib/storage.ts` contains no React imports
**And** `__tests__/lib/storage.test.ts` covers: read on empty storage, write + read round-trip, graceful handling of malformed data

---

### Story 1.5: Date Utilities & XP Engine

As a developer,
I want `lib/dates.ts` and `lib/xp.ts` as pure, fully-tested functions,
So that all date/time and XP calculations are centralized, correct, and independently verifiable.

**Acceptance Criteria:**

**Given** the app uses device local time for all date logic
**When** `lib/dates.ts` is created
**Then** it exports: `getTodayString(): string` (YYYY-MM-DD, device local), `getWeekStart(date: string): string` (Monday of that week), `getWeeksElapsedInLevel(levelStartDate: string, today: string): number`, `isSameDay(a: string, b: string): boolean`
**And** `__tests__/lib/dates.test.ts` covers Sunday→Monday week boundary, week 0 vs week 1 edge cases

**Given** the XP tier table (5min→1XP, 10min→2XP, 20min→3XP, 30+min→5XP)
**When** `lib/xp.ts` is created
**Then** it exports `calculateDailyXp(totalMinutes: number): number` applying the highest qualifying tier with cap enforced
**And** `__tests__/lib/xp.test.ts` covers: 0 min = 0 XP, 4 min = 0 XP, 5 min = 1 XP, 9 min = 1 XP, 10 min = 2 XP, 20 min = 3 XP, 30 min = 5 XP, 60 min = 5 XP (cap)
**And** both modules contain no React imports

---

### Story 1.6: Level System & Motivational Messages

As a developer,
I want `lib/levels.ts` and `lib/messages.ts` implemented,
So that level progression rules and hardcoded messages are centralized and independently testable.

**Acceptance Criteria:**

**Given** the level system requires week tracking and XP thresholds
**When** `lib/levels.ts` is created
**Then** it exports: level definitions for Levels 1–3 (requirements, unlocked abilities), `isLevelUpEligible(xp: number, weeksElapsed: number): boolean`, `calculateOverXp(xp: number): number`, `getOverXpPace(overXp: number): 'on-track' | 'slightly-over' | 'well-over'`
**And** level definitions are structured extensibly (Level 4+ can be added without schema changes)
**And** `__tests__/lib/levels.test.ts` covers: 27 days = not eligible (4-week gate), 99 XP = not eligible, 100 XP + 28 days = eligible; OverXP thresholds: 0 = on-track, 1–19 = slightly-over, 20+ = well-over

**Given** messages are needed in 4 contexts
**When** `lib/messages.ts` is created
**Then** it exports `getRandomMessage(context: 'log-confirm' | 'weekly-reset' | 'goal-reached' | 'session-start'): string` with ≥5 messages per context
**And** no message is judgmental, comparative, or implies the entry was insufficient

---

### Story 1.7: Zustand Stores Scaffolding

As a developer,
I want the three Zustand stores scaffolded and wired to `lib/storage.ts`,
So that all app state has a single source of truth that persists correctly and components can start consuming data.

**Acceptance Criteria:**

**Given** three domain stores are needed
**When** `hooks/use-activity-store.ts` is created
**Then** it exposes: `entries: ActivityEntry[]`, `addEntry(entry): void` (write-through to storage immediately), `loadFromStorage(): void`, `getDailyEntries(date: string): ActivityEntry[]`, `getWeeklyEntries(weekStart: string): ActivityEntry[]`

**When** `hooks/use-level-store.ts` is created
**Then** it exposes: `levelState: LevelState`, `loadFromStorage(): void`, `triggerLevelUp(): void` (resets XP to 0, increments level, sets new startDate to today, write-through), `isEligible: boolean` (derived from xp + weeksElapsed)

**When** `hooks/use-ui-store.ts` is created
**Then** it exposes: `sessionMessageShown: boolean`, `setSessionMessageShown(): void`

**And** `app/layout.tsx` calls `loadFromStorage()` for both activity and level stores on mount
**And** every store mutation writes through to `lib/storage.ts` immediately — no deferred flush
**And** no store file contains React component imports

---

## Epic 2: Activity Logging & XP

Users can log a movement (duration or start/end/non-walking time), see XP calculated live, receive an inline confirmation, and view their daily XP on the dashboard. All data persists in localStorage.

### Story 2.1: Dashboard Shell with Typography Hero Layout

As a user,
I want to open the app and see my XP prominently displayed with a clear "Log Activity" button,
So that I can immediately orient myself and start logging without searching.

**Acceptance Criteria:**

**Given** the user opens the app for the first time (no entries yet)
**When** the dashboard page renders
**Then** a large XP number (Montserrat 800, 64–80px) is the dominant visual element, showing "0 / 100 XP"
**And** a "Log Activity" primary button is visible and tappable
**And** a bottom navigation shows 3 items: Dashboard, + (log), History
**And** the `@bubbles/theme` ThemeToggle is accessible (e.g. in a header or nav)
**And** the layout is single-column on mobile, centered `max-w-md` on desktop
**And** all touch targets use the `touch-hitbox` utility class

---

### Story 2.2: Duration-Based Activity Logging

As a user,
I want to log a movement by entering a duration in minutes,
So that I can record my activity in under 30 seconds and see the XP immediately.

**Acceptance Criteria:**

**Given** the user taps "Log Activity" on the dashboard
**When** the bottom sheet opens
**Then** the `DurationInput` field is auto-focused and ready for input
**And** as the user types a duration, the XP tier previews live (e.g. "= 5 XP" appears once ≥30 min entered)
**And** tapping "Log it" creates a new `ActivityEntry` with `crypto.randomUUID()` id, today's date, the entered duration, and current ISO timestamp
**And** the entry is written to `it-counts:entries` in localStorage immediately
**And** inline confirmation appears within the sheet: "+X XP · That counted." followed by a `getRandomMessage('log-confirm')` message
**And** the sheet closes after confirmation; the dashboard XP display updates to reflect the new entry
**And** on first load of the session (no previous session message shown), a `getRandomMessage('session-start')` message appears on the dashboard

---

### Story 2.3: Start/End Time Logging Mode

As a user,
I want to log activity using start time, end time, and non-walking time,
So that I can accurately capture trips where I know the times rather than the total duration.

**Acceptance Criteria:**

**Given** the log sheet is open showing the duration input
**When** the user taps "Use start / end time instead"
**Then** the `TimeRangeInput` is revealed with three fields: start time, end time, non-walking minutes
**And** tapping "Use duration instead" returns to the `DurationInput` (toggle is reversible)

**Given** the user fills in start and end time
**When** end time is before or equal to start time
**Then** an inline error appears below the affected field; the submit button is disabled

**Given** the user fills in non-walking time
**When** non-walking time exceeds the total (end − start) duration
**Then** an inline error appears; the submit button is disabled

**Given** all fields are valid
**When** the user submits
**Then** walking time is calculated as `(end − start) − non_walking_time`, minimum 0 minutes
**And** the entry is logged identically to Story 2.2 (same store action, same confirmation, same localStorage write)

---

### Story 2.4: Multiple Entries & Daily XP Aggregation

As a user,
I want multiple entries on the same day to sum into my daily total,
So that fragmented outings are treated the same as a single long one.

**Acceptance Criteria:**

**Given** the user has already logged one or more entries today
**When** they log an additional entry
**Then** the store calculates the new daily total across all entries for today's date
**And** `calculateDailyXp(dailyTotalMinutes)` is applied to the daily total (not per-entry)
**And** the XP on the dashboard reflects the daily XP for today (not a running sum of per-entry XP)

**Given** a daily total crosses an XP tier threshold on the third entry (e.g. 10+5+15 = 30 min → 5 XP, previously 3 XP)
**When** the confirmation appears
**Then** it shows the XP for today's total (e.g. "+5 XP today · That counted.")

**Given** XP is accumulated across multiple days within the level
**When** the user views the dashboard
**Then** the large XP number reflects total XP accumulated across all logged days in the current level
**And** the `XpProgressBar` fills proportionally toward 100 XP

---

## Epic 3: Level System & Full Dashboard

Users can see their complete level status (XP progress toward 100, weeks elapsed, OverXP pace), trigger a level-up when eligible (4 weeks + 100 XP), and experience the level transition with brief confetti. Weekly XP tracking and motivational messages appear at the right moments.

### Story 3.1: Full Dashboard — Level Info, Weekly Progress & Messages

As a user,
I want to see my complete level status on the dashboard (level number, weeks elapsed, weekly XP, requirements),
So that I have a calm, honest overview of where I stand without having to navigate away.

**Acceptance Criteria:**

**Given** the user is on the dashboard
**When** the page renders
**Then** the current level number is displayed (with `LevelBadge`)
**And** weeks elapsed in the current level are shown (e.g. "Week 2 of 4+")
**And** the `XpProgressBar` shows total XP toward 100 with a gradient in OKLCH (`oklch(0.6 0.15 240)` → `oklch(0.65 0.12 280)`)
**And** the weekly XP total for the current week (Monday–Sunday) is displayed alongside the "10 XP" motivational target
**And** the current level's requirements and unlocked abilities are visible (FR19)
**And** if weekly XP is below 10, no negative feedback, warning, or "you're behind" messaging is shown (FR18)

**Given** today is Monday and the user opens the app for the first time this week
**When** the dashboard loads
**Then** a `getRandomMessage('weekly-reset')` message appears once — regardless of last week's XP total

**Given** the user's weekly XP crosses the 10 XP threshold (on any entry)
**When** the log confirmation appears
**Then** a `getRandomMessage('goal-reached')` message is shown in place of the standard log-confirm message
**And** this goal-reached message triggers only once per week (not on every subsequent entry)

---

### Story 3.2: OverXP Display & Pace Indicator

As a user,
I want to see how far beyond 100 XP I've gone and a pace indicator,
So that I understand my current intensity without it creating pressure.

**Acceptance Criteria:**

**Given** the user's total XP in the current level exceeds 100
**When** the dashboard renders
**Then** an `OverXpIndicator` displays the OverXP value (e.g. "+12 XP over")
**And** a `StatusBadge` shows the pace label: "On track" (0 OverXP), "Slightly over" (1–19 OverXP), "Well over" (20+ OverXP)
**And** the pace label uses both text and color — never color alone

**Given** the user has 0 OverXP (hasn't reached 100 yet)
**When** the dashboard renders
**Then** neither the OverXpIndicator nor StatusBadge are shown — the section is hidden

**Given** the status is "Slightly over" or "Well over"
**When** displayed
**Then** the tone of the label is neutral/informational — no warning language, no exclamation marks

---

### Story 3.3: Level-Up Eligibility CTA

As a user,
I want a calm button to appear on the dashboard when I'm eligible to level up,
So that I know I can level up without being pressured or auto-redirected.

**Acceptance Criteria:**

**Given** the user has accumulated ≥100 XP AND ≥4 full weeks have elapsed in the current level
**When** the dashboard renders
**Then** a `Button` CTA appears with text "Level [N+1] ready — Level Up →"
**And** the button is calm (not flashing, not pulsing, no urgency animation)
**And** tapping the button navigates to `/level-up` via View Transitions

**Given** either condition is not yet met (XP < 100 OR weeks < 4)
**When** the dashboard renders
**Then** the level-up CTA is not shown — no placeholder, no countdown, no hint

**Given** the user is eligible and opens the app
**When** navigating to the dashboard
**Then** no toast, no banner, no automatic redirect occurs — the CTA button is the only indicator

---

### Story 3.4: Level Transition & `/level-up` Page

As a user,
I want a dedicated level-up page with brief confetti and a clear summary,
So that reaching a new level feels genuinely earned before returning to calm.

**Acceptance Criteria:**

**Given** the user navigates to `/level-up` (only accessible when eligible)
**When** the page loads
**Then** a brief confetti burst plays (short, non-looping, respects `prefers-reduced-motion`)
**And** a summary of the completed level is shown: total XP earned, OverXP, pace indicator
**And** the upcoming level's requirements and newly unlocked abilities are displayed (FR14)
**And** a primary "Start Level [N+1]" button is visible

**Given** the user taps "Start Level [N+1]"
**When** the action executes
**Then** `triggerLevelUp()` is called on the level store: XP resets to 0, level increments by 1, `startDate` set to today
**And** the updated `LevelState` is written to `it-counts:current-level` in localStorage immediately
**And** the user is navigated back to the dashboard via View Transitions
**And** the dashboard reflects the new level and 0 / 100 XP

**Given** the user navigates directly to `/level-up` when NOT eligible
**When** the page loads
**Then** they are redirected to the dashboard — no level-up can be triggered without meeting both conditions

---

## Epic 4: Activity History

Users can view a full chronological history of all logged activities, grouped by day and week, with aggregated XP totals and empty states.

### Story 4.1: Activity History Page — Chronological Daily View

As a user,
I want to see all my past activity entries grouped by day,
So that I can look back at my movement history and see daily totals at a glance.

**Acceptance Criteria:**

**Given** the user navigates to `/history`
**When** there are no entries in localStorage
**Then** a neutral empty state is shown: "Nothing logged yet. Your history will appear here."
**And** no sad face, no pressure to log, no call-to-action

**Given** the user has logged one or more entries
**When** the history page renders
**Then** entries are grouped into `DailyGroup` components, one per calendar day, in reverse-chronological order (most recent first)
**And** each `DailyGroup` shows the date, a list of individual entries (duration in minutes, time logged), and the daily total (e.g. "30 min total · 5 XP")
**And** individual entries within a day are shown in chronological order (earliest first)
**And** there is no edit or delete action on any entry — entries are permanent

**Given** the user has logged entries across multiple sessions
**When** the history page renders
**Then** all entries appear correctly (FR26 — data persists from localStorage via the activity store)

---

### Story 4.2: Weekly Grouping & Aggregated XP Totals

As a user,
I want my daily entries grouped by week with a weekly XP total,
So that I can see my consistency across weeks at a glance.

**Acceptance Criteria:**

**Given** the user has entries spanning multiple weeks
**When** the history page renders
**Then** `DailyGroup` components are wrapped in `WeeklyGroup` components, one per Monday–Sunday week
**And** each `WeeklyGroup` shows the week range (e.g. "Apr 7 – Apr 13") and the total XP for that week
**And** weeks are displayed in reverse-chronological order (most recent week first)
**And** days with no entries are not shown — only days that have at least one entry appear

**Given** the current week has entries
**When** the history page renders
**Then** the current (incomplete) week appears at the top with its partial XP total

**Given** no entries exist yet (first open)
**When** the history page renders
**Then** the empty state from Story 4.1 is shown — no week headers, no empty week containers

---

## Epic 5: PWA & Production

The app is installable on iOS and Android homescreen, works offline with a custom service worker, loads fast on mobile, and is deployed to Vercel. Full performance, accessibility, and animation audit completed.

### Story 5.1: PWA Manifest, App Icons & Basic SEO

As a user,
I want to install It Counts to my homescreen and have it look like a native app,
So that logging is one tap away without opening a browser.

**Acceptance Criteria:**

**Given** the app is served over HTTPS
**When** the user opens it in iOS Safari or Android Chrome
**Then** the browser offers an "Add to Homescreen" prompt (Android) or the share menu shows "Add to Homescreen" (iOS)
**And** the installed app launches standalone (no browser chrome)
**And** the app icon (192×192 and 512×512) appears on the homescreen

**Given** `public/manifest.json` is linked in `app/layout.tsx`
**When** the manifest is validated
**Then** it contains: `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color` in a valid OKLCH-derived hex value (manifest requires hex), `icons` array with 192px and 512px entries

**Given** a user shares or bookmarks any page
**When** the link is previewed in a messenger or search result
**Then** each page has a `<title>`, `<meta name="description">`, and Open Graph `og:title` / `og:description` tags
**And** HTML uses semantic elements throughout (`<main>`, `<nav>`, `<header>`, correct heading hierarchy)

---

### Story 5.2: Custom Service Worker & Offline Support

As a user,
I want the app to work even when I have no internet connection,
So that I can always log an activity immediately after returning from an outing.

**Acceptance Criteria:**

**Given** `public/sw.js` is registered via `useEffect` in `app/layout.tsx`
**When** the app is loaded for the first time online
**Then** the service worker installs and caches all static assets (JS, CSS, icons, manifest)

**Given** the user has visited the app before and then goes offline
**When** they open the app without network access
**Then** the app loads from the service worker cache (Cache-First strategy)
**And** the user can log an activity — the entry is saved to localStorage with no network required

**Given** the service worker is updated (new app version deployed)
**When** the new SW activates
**Then** no existing localStorage data is lost
**And** the app continues functioning correctly with the updated assets

**Given** the user attempts any action while offline (logging, viewing dashboard, viewing history)
**When** the action is performed
**Then** it succeeds — no "you're offline" error, no blocked interaction (all operations are localStorage-based)

---

### Story 5.3: Performance, Accessibility & Animation Audit

As a user,
I want the app to load fast, be keyboard-navigable, and respect my motion preferences,
So that it works well for everyone on any device or capability.

**Acceptance Criteria:**

**Given** the app is deployed to Vercel
**When** measured on mobile (simulated 4G, Lighthouse or WebPageTest)
**Then** LCP < 2.5s and the dashboard renders its full data in < 300ms

**Given** all interactive elements across all pages
**When** tested keyboard-only (Tab, Enter, Space, Escape)
**Then** all buttons, links, inputs, and sheet open/close are fully operable without a pointer
**And** focus indicators are visible at all times

**Given** all pages and components
**When** audited with a screen reader (VoiceOver on iOS) and browser DevTools accessibility panel
**Then** ARIA landmarks are correct (`<main>`, `<nav>`), heading hierarchy is consistent, and no information is conveyed by color alone

**Given** a device with `prefers-reduced-motion: reduce` enabled
**When** the user interacts with the app (logging, level-up, page navigation)
**Then** all animations are suppressed or replaced with instant transitions — no motion occurs
**And** all feedback (confirmations, XP updates) still appears immediately without animation

**Given** any animation in the app (confetti, XP bar fill, sheet slide-in, View Transitions)
**When** the animation plays under normal conditions
**Then** user feedback is never delayed by an animation — the data updates instantly, animations run alongside

---

### Story 5.4: Vercel Deployment

As a developer,
I want `apps/it-counts` deployed as a live Vercel project,
So that the app is accessible from any device and the core loop can be used in real life.

**Acceptance Criteria:**

**Given** a new Vercel project is created for `apps/it-counts` within the bubbles-verse workspace
**When** the main branch is pushed
**Then** Turborepo's build pipeline runs successfully and the app is deployed
**And** the deployed app is accessible via a Vercel URL
**And** the PWA manifest and service worker are served correctly over HTTPS (required for installability and SW registration)
**And** no server-side environment variables are required (MVP is entirely client-side)
**And** preview deployments are enabled for the `new-app-idea` branch (or equivalent feature branch)
