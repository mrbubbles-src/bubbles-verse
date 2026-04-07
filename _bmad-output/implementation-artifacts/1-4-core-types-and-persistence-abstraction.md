# Story 1.4: Core Types & Persistence Abstraction

Status: done

## Story

As a developer,
I want `types/index.ts` and `lib/storage.ts` implemented,
so that all data types are defined and localStorage access goes through a single, migration-ready interface.

## Acceptance Criteria

1. **Given** the app requires `ActivityEntry`, `LevelState`, and `AppSettings` types
   **When** `types/index.ts` and `lib/storage.ts` are created
   **Then** `types/index.ts` exports all three types with correct field names, TypeScript types, and JSDoc comments
   **And** `lib/storage.ts` exports typed read/write functions for keys `it-counts:entries`, `it-counts:current-level`, `it-counts:settings`
   **And** no other file accesses `localStorage` directly
   **And** `lib/storage.ts` contains no React imports
   **And** `__tests__/lib/storage.test.ts` covers: read on empty storage, write + read round-trip, graceful handling of malformed data

## Tasks / Subtasks

- [x] Task 1: Add the app-local type and test scaffold
  - [x] Create `apps/it-counts/types/index.ts` with `type` exports and concise JSDoc comments
  - [x] If `apps/it-counts` still lacks Vitest wiring, add `vitest.config.ts`, `vitest.setup.ts`, and `test` scripts using `apps/teacherbuddy` as the baseline
- [x] Task 2: Implement the storage boundary
  - [x] Create `apps/it-counts/lib/storage.ts` as the only localStorage access point
  - [x] Export typed readers/writers for entries, current level, and settings with safe defaults on empty or malformed data
- [x] Task 3: Lock the boundary down with tests
  - [x] Add `apps/it-counts/__tests__/lib/storage.test.ts`
  - [x] Audit the app for direct `localStorage` usage and keep all future callers behind `lib/storage.ts`

## Dev Notes

### Implementation Focus

- Use the architecture schema exactly: `ActivityEntry` with `id`, `date`, `durationMin`, `loggedAt`; `LevelState` with `level`, `startDate`, `xp`, `overXp`; `AppSettings` as the storage-backed settings shape.
- Keep `lib/storage.ts` framework-agnostic: no React imports, no hook usage, no UI strings.
- Add concise JSDoc comments to every exported type and function per repo policy.

### Guardrails

- Use `type`, not `interface`.
- Use `YYYY-MM-DD` strings for date keys and ISO 8601 only for `loggedAt`.
- `apps/it-counts` currently has no test harness; add the smallest app-local Vitest setup needed instead of inventing a new pattern.

### Project Structure Notes

- Likely touch: `apps/it-counts/types/index.ts`, `apps/it-counts/lib/storage.ts`, `apps/it-counts/__tests__/lib/storage.test.ts`, `apps/it-counts/vitest.config.ts`, `apps/it-counts/vitest.setup.ts`, `apps/it-counts/package.json`
- Story 1.3 already aligned the app with the monorepo. Do not revisit shared theme, shared fonts, or shadcn setup here.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: apps/teacherbuddy/vitest.config.ts]
- [Source: apps/teacherbuddy/vitest.setup.ts]
- [Source: _bmad-output/implementation-artifacts/1-3-adapt-apps-it-counts-to-monorepo-conventions.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `rg -n "localStorage|sessionStorage|crypto\\.randomUUID|ActivityEntry|LevelState|AppSettings" apps/it-counts -g '!node_modules'` — confirmed no pre-existing direct storage access in the app
- `bun install` — linked newly added app-local Vitest dependencies and refreshed `bun.lock`
- `bun run test:run` in `apps/it-counts` — passes (`3` tests)
- `bun run typecheck` in `apps/it-counts` — passes
- `bun run lint .` in `apps/it-counts` — passes
- `bun run build` in `apps/it-counts` — passes on Next.js `16.2.2`

### Completion Notes List

- Added `ActivityEntry`, `LevelState`, and `AppSettings` in `apps/it-counts/types/index.ts` with concise export-level JSDoc comments
- Added `apps/it-counts/lib/storage.ts` as the single localStorage boundary with typed readers and writers for entries, current level, and settings plus safe fallbacks for empty and malformed payloads
- Added the first app-local Vitest scaffold and storage coverage for empty storage, round-trip persistence, and malformed data recovery
- Updated the app-local README and changelog so the new persistence layer and test workflow are documented close to the code

### File List

- `_bmad-output/implementation-artifacts/1-4-core-types-and-persistence-abstraction.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/it-counts/__tests__/lib/storage.test.ts`
- `apps/it-counts/CHANGELOG.md`
- `apps/it-counts/README.md`
- `apps/it-counts/lib/storage.ts`
- `apps/it-counts/package.json`
- `apps/it-counts/types/index.ts`
- `apps/it-counts/vitest.config.ts`
- `apps/it-counts/vitest.setup.ts`
- `bun.lock`
