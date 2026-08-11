# Routes

## Route map

| Route | Type | Notes |
| ----- | ---- | ----- |
| `/` | main dashboard | shows XP hero, level state, messages, and log CTA |
| `/history` | client page | groups entries by week then by day |
| `/about` | server page | explains the product, XP tiers, and progression |
| `/level-up` | client page | requires `isEligible`; redirects home when not eligible |
| `/log` | server page | fallback route that points users back to the dashboard flow |
| `/api/og` | route handler | dynamic OG image for metadata sharing |

## Navigation

- The root layout renders a persistent header, bottom navigation, footer, and log sheet.
- The center log action is not a route change; it opens `LogEntrySheet` through `useUiStore`.
- The About route is linked from the header action, not from the bottom nav.

## Route-specific behavior

### `/`

Primary product surface. Composes:

- `SessionStartMessage`
- `XpHero`
- `LevelUpIndicator`
- `LevelRequirements`

### `/history`

- client component
- groups entries by Monday-anchored week
- computes weekly XP from aggregated daily minutes

### `/about`

- reads `XP_TIERS` and `LEVEL_DEFINITIONS`
- acts as the human-readable rules page

### `/level-up`

- guarded by `useLevelStore().isEligible`
- on success, `triggerLevelUp()` resets progress for the next level window

### `/log`

Exists as a friendly fallback only. The real logging flow lives in the dashboard sheet.
