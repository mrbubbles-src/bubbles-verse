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

## XP model

- XP is calculated per day, not per raw entry.
- Multiple entries on the same date are aggregated first.
- Daily tiers are fixed in [`../lib/xp.ts`](../lib/xp.ts).
- Current-level XP is recomputed from the activity history inside the current level window.

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

This keeps the persisted `levelState.xp` aligned with the real activity log.
