# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Added a browser-safe client entry-id fallback so local logging still works in dev browsers that expose `crypto` without `crypto.randomUUID()`.
- Changed Level 1 anchoring to establish once and then freeze, so later retroactive logs before the frozen Level-1 start date no longer add to current-level total XP.
- Replaced the temporary Level-1 backfill marker with a persistent lock flag so legacy Level-1 data is corrected once, then kept stable across later retro-logs and reloads.

## [1.0.1] - 2026-04-09

### Added

- `.vscode/settings.json` with recommended TypeScript settings for the project.

### Fixed

- Stopped `StoreHydrator` from persisting a zero-XP level snapshot on the first mount render before activity entries finish hydrating from storage.
- Kept the dashboard weekly XP widget reactive after refresh by deriving weekly XP directly from `entries` state instead of selecting a non-reactive store getter.
- Re-synced level XP whenever hydrated entries change, ensuring total XP reflects retroactive logs immediately and persists correctly across reloads.
- Made log-save level sync deterministic by syncing from the `addDurationEntry` post-write snapshot, so backdated entries (e.g., yesterday) are always reflected in total level XP immediately.
- Moved the log sheet above mobile soft keyboards (iOS/Android) by tracking `window.visualViewport` and offsetting the bottom sheet while inputs are focused.
- Updated `/api/og` image generation to resolve the logo from the current request origin, fixing OpenGraph previews on custom domains.
- Changed the dashboard week label to render open-ended progress (`Week 5`, `Week 6`, ...) after the 4-week target window, with the same calm green accent used by the “On track” badge.

## [1.0.0] - 2026-04-09

### Documentation

- Rewrote the app README to describe the current product, routes, persistence model, and workspace workflow.
- Added focused app-local docs for structure, routes, state/storage, testing, and PWA behavior.

### Fixed

- Stopped the custom PWA service worker from serving cached app HTML and `/_next/*` assets cache-first, so normal reloads now pick up the latest design without requiring a hard refresh.
- Added development-side service worker cleanup so stale `it-counts-*` caches and old `/sw.js` registrations are removed automatically outside production.
- Restored the app-local PWA manifest test by aligning it with the static `app/manifest.json` file and adding `start_url: "/"`.

### Added

- Added `/about` page with app concept, XP tier table, level definitions, and progression rules.
- Added `/api/og` dynamic Open Graph image route (1200x630, Catppuccin Mocha background with logo and tagline).
- Added Twitter card and full OpenGraph metadata (images, siteName, locale) to root layout.
- Added retroactive date logging: the log sheet now includes a date picker (defaults to today, past dates allowed, future dates blocked). Entries for past dates auto-sync into level XP.
- Added About access from the shared header via `components/global/about-page-button.tsx`.
- Exported `XP_TIERS` from `lib/xp.ts` and `formatLocalDate` / `parseLocalDate` from `lib/dates.ts` for reuse.

### Changed

- Moved product explanation and progression guidance into the dedicated `/about` route.
- Extended `addDurationEntry` in `use-activity-store` to accept an optional `date` parameter for retroactive logging.
- Replaced the dashboard CTA link with the inline logging sheet on `app/page.tsx`.
- Wired `StoreHydrator` into `app/layout.tsx` so activity, level, and settings stores hydrate from `localStorage` on mount.

### Previously added

- Added `sumLevelXpFromEntries` in `lib/xp.ts` and `components/dashboard/xp-progress-bar.tsx` so current-level XP is the sum of daily tier XP across days in the level window.
- Added `getDailyTotalMinutes` / `getDailyXpForDate` on the activity store and `__tests__/lib/sum-level-xp.test.ts` for aggregation guardrails.
- Added `components/logging/log-entry-sheet.tsx` and `components/logging/duration-input.tsx` for the dashboard bottom-sheet logging flow with live XP preview and inline confirmation.
- Added `components/dashboard/session-start-message.tsx` and `components/shared/motivational-message.tsx` for calm session-start and log-confirm messaging.
- Added focused UI coverage in `__tests__/components/log-entry-sheet.test.tsx` and `__tests__/components/session-start-message.test.tsx`.
- Added `types/index.ts` with the persisted `ActivityEntry`, `LevelState`, and `AppSettings` shapes for future feature stories.
- Added `lib/storage.ts` as the app-local localStorage boundary for entries, current level progress, and settings, including safe fallbacks for empty or malformed payloads.
- Added app-local Vitest wiring and the first storage tests under `__tests__/lib/storage.test.ts`.
- Added `lib/dates.ts` with pure device-local date helpers for `YYYY-MM-DD` formatting, Monday week starts, and elapsed level-week calculations.
- Added `lib/xp.ts` with the fixed daily XP tier engine and the 30-minute cap.
- Added focused guardrail coverage in `__tests__/lib/dates.test.ts` and `__tests__/lib/xp.test.ts`.
- Added `lib/levels.ts` with data-driven Level 1-3 definitions plus eligibility, OverXP, and pace helpers.
- Added `lib/messages.ts` with the four MVP motivational message contexts and randomized lookup.
- Added `__tests__/lib/levels.test.ts` and `__tests__/lib/messages.test.ts` to lock in level rules and message coverage.
- Added `documentation/level-design.md` so the level table stays readable outside the implementation.
- Added `hooks/use-activity-store.ts` Zustand store with entries, write-through persistence, and date/week selectors.
- Added `hooks/use-level-store.ts` Zustand store with derived `isEligible`, `triggerLevelUp`, and write-through persistence.
- Added `hooks/use-ui-store.ts` Zustand store for ephemeral session UI state.
- Added `hooks/use-settings-store.ts` for persisted app settings.
- Added `components/shared/store-hydrator.tsx` client component for store hydration on mount.
- Added `__tests__/hooks/use-activity-store.test.ts`, `__tests__/hooks/use-level-store.test.ts`, `__tests__/hooks/use-settings-store.test.ts`, and `__tests__/hooks/use-ui-store.test.ts`.
- Added `zustand@5.0.12` as a runtime dependency.
