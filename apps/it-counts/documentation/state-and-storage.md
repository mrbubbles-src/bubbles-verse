# State and storage

## Overview

`it-counts` uses four Zustand stores. Three persist through `localStorage`; one is session-only UI state.

## Store map

| Store | Persistence | Responsibility |
| ----- | ----------- | -------------- |
| `useActivityStore` | yes | activity entries, day/week selectors, duration logging |
| `useLevelStore` | yes | current level state, eligibility, level-up |
| `useSettingsStore` | yes | lightweight app settings and flags |
| `useUiStore` | no | log sheet open state, session-start message state |

## Storage keys

| Key | Shape |
| --- | ----- |
| `it-counts:entries` | `ActivityEntry[]` |
| `it-counts:current-level` | `LevelState \| null` |
| `it-counts:settings` | `AppSettings` |

All storage reads and writes go through [`../lib/storage.ts`](../lib/storage.ts). Invalid payloads fall back to safe defaults.

## Data types

### `ActivityEntry`

- `id`
- `date` (`YYYY-MM-DD`, device-local grouping)
- `durationMin`
- `loggedAt` (ISO timestamp for stable ordering)

### `LevelState`

- `level`
- `startDate`
- `levelStartAt`
- `xp`
- `overXp`

### app settings flags

- `levelOneStartDateLocked` marks the Level-1 anchor as established and frozen for this browser profile.

## XP model

- XP is calculated per day, not per raw entry.
- Multiple entries on the same date are aggregated first.
- Daily tiers are fixed in [`../lib/xp.ts`](../lib/xp.ts).
- The log sheet rejects invalid, empty, or future dates before writing.
- As a second line of defense, the activity store normalizes invalid non-UI date inputs to today instead of persisting malformed entries.
- Level-1 anchor establishment ignores malformed persisted date candidates defensively.
- Current-level XP is recomputed from the activity history inside the current level window.
- Level 1 establishes its start once from the first known Level-1 anchor, then stays frozen.
- Level 2+ starts at the explicit level-up event.

That recomputation matters because:

- retroactive logging can change an older day's total
- same-day logs from before a level-up must not be re-credited
- hydration should rebuild level XP from the source of truth instead of trusting stale snapshots

## Hydration flow

`StoreHydrator` runs on mount and does three things:

1. load entries
2. load current level
3. load settings

Then it recomputes current-level XP whenever the activity `entries` array changes, but only after skipping the pre-hydration default `[]` render.
Additionally, the log submit path syncs from the exact post-write `entries` snapshot returned by `addDurationEntry`, preventing stale reads when users log retroactive dates.
On hydration, existing unlocked Level-1 data with entries is backfilled once and then locked. Fresh Level 1 remains unlocked until the first real log establishes the frozen anchor date.
The entry-id helper also keeps a final non-crypto fallback for older environments, and that branch is covered by tests.

This keeps the persisted `levelState.xp` aligned with the real activity log.
