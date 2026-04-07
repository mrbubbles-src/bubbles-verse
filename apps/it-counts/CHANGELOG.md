# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added `types/index.ts` with the persisted `ActivityEntry`, `LevelState`, and `AppSettings` shapes for future feature stories.
- Added `lib/storage.ts` as the app-local localStorage boundary for entries, current level progress, and settings, including safe fallbacks for empty or malformed payloads.
- Added app-local Vitest wiring and the first storage tests under `__tests__/lib/storage.test.ts`.

### Changed

- Imported `app/it-counts.css` from the root layout and kept the shared font variables, shared theme provider, and Next.js 16.2.2 monorepo wiring intact.
- Added the shared `progress` primitive in `packages/ui` and updated the shared shadcn button to include the global `touch-hitbox` utility.

### Documentation

- Replaced the starter README with app-specific monorepo usage notes and Bun-based quality checks.
