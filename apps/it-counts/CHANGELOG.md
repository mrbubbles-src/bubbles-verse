# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

### Changed

- Imported `app/it-counts.css` from the root layout and kept the shared font variables, shared theme provider, and Next.js 16.2.2 monorepo wiring intact.
- Added the shared `progress` primitive in `packages/ui` and updated the shared shadcn button to include the global `touch-hitbox` utility.

### Documentation

- Replaced the starter README with app-specific monorepo usage notes and Bun-based quality checks.
- Documented the new date and XP business-logic modules in the app README.
- Documented the new level and motivational-message modules in the app README.
