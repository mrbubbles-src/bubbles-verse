# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Stopped the custom PWA service worker from serving cached app HTML and `/_next/*` assets cache-first, so normal reloads now pick up the latest design without requiring a hard refresh.
- Added development-side service worker cleanup so stale `it-counts-*` caches and old `/sw.js` registrations are removed automatically outside production.
- Restored the app-local PWA manifest test by aligning it with the static `app/manifest.json` file and adding `start_url: "/"`.

### Added

- Added `/about` page with app concept, XP tier table, level definitions, and progression rules.
- Added `/api/og` dynamic Open Graph image route (1200×630, Catppuccin Mocha background with logo and tagline).
- Added Twitter card and full OpenGraph metadata (images, siteName, locale) to root layout.
- Added retroactive date logging: the log sheet now includes a date picker (defaults to today, past dates allowed, future dates blocked). Entries for past dates auto-sync into level XP.
- Added About link to bottom navigation (4th item with help-circle icon).
- Exported `XP_TIERS` from `lib/xp.ts` and `formatLocalDate`/`parseLocalDate` from `lib/dates.ts` for reuse.

### Changed

- Moved footer with legal links from dashboard to the about page.
- Extended `addDurationEntry` in `use-activity-store` to accept an optional `date` parameter for retroactive logging.

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
- Added `components/shared/store-hydrator.tsx` client component for store hydration on mount.
- Added `__tests__/hooks/use-activity-store.test.ts`, `__tests__/hooks/use-level-store.test.ts`, and `__tests__/hooks/use-ui-store.test.ts`.
- Added `zustand@5.0.12` as runtime dependency.

### Changed

- Replaced the dashboard CTA link with the inline Story 2.2 logging sheet on `app/page.tsx`.
- Extended `hooks/use-activity-store.ts` with generated duration-entry creation and immediate write-through persistence.
- Extended `hooks/use-level-store.ts` with `syncXpFromEntries()` (replacing `addXp`) so level XP matches aggregated daily minutes after each log and on hydration; log confirmation shows today's total daily XP.
- Updated `app/log/page.tsx` to explain that logging now happens from the dashboard instead of showing stale Story 2.2 placeholder copy.
- Wired `StoreHydrator` into `app/layout.tsx` so activity and level stores hydrate from localStorage on mount.
- Imported `app/it-counts.css` from the root layout and kept the shared font variables, shared theme provider, and Next.js 16.2.2 monorepo wiring intact.
- Added the shared `progress` primitive in `packages/ui` and updated the shared shadcn button to include the global `touch-hitbox` utility.

### Fixed

- `parseTimeToMinutes` in `components/logging/log-entry-sheet.tsx` now rejects non-integer hour/minute parts and values outside 0–23 / 0–59 so bogus `HH:MM` strings cannot produce false trip lengths.
- Added `levelStartAt` timestamp-aware XP recomputation so same-day logs from before a level-up are not re-credited after hydration or additional entries.
- Clamped `XpProgressBar` ARIA values to the declared 0-100 range and moved log-sheet daily-minute aggregation to the activity-store selector to avoid duplicated logic.
- Expanded logging/level tests to cover same-day level-up recomputation, tier-crossing confirmation copy, and immutable entry snapshots passed into `syncXpFromEntries`.

### Documentation

- Documented the new duration logging flow, dashboard session message, and fallback `/log` route behavior in the app README.
- Replaced the starter README with app-specific monorepo usage notes and Bun-based quality checks.
- Documented the new date and XP business-logic modules in the app README.
- Documented the new level and motivational-message modules in the app README.
