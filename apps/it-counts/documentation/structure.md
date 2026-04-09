# Structure

## Overview

`it-counts` is a Next.js App Router app with a server layout and client-driven persistence. The product stays local-first: activity logs, current level state, and lightweight settings all hydrate from browser storage.

## Data flow

1. `app/layout.tsx` renders the shared shell, theme provider, footer, bottom nav, log sheet, and `StoreHydrator`.
2. `components/shared/store-hydrator.tsx` loads activity, level, and settings state from `localStorage`.
3. UI components read Zustand stores directly.
4. Logging writes entries immediately, then level XP is recomputed from the stored activity history.

## Folder structure

```text
it-counts/
├── app/                       # Routes, metadata, manifest, app-local CSS
│   ├── layout.tsx             # Root shell, metadata, ThemeProvider, Footer, BottomNav
│   ├── page.tsx               # Dashboard
│   ├── about/page.tsx         # Product explanation and level rules
│   ├── history/page.tsx       # Week/day grouped history
│   ├── level-up/page.tsx      # Celebration and next-level handoff
│   ├── log/page.tsx           # Legacy fallback route
│   ├── api/og/                # Dynamic OG image
│   └── manifest.json          # PWA manifest
├── components/
│   ├── dashboard/             # Hero, requirements, badges, messages
│   ├── global/                # Header, bottom nav, wrappers, about button
│   ├── history/               # Weekly/day grouping components
│   ├── level-up/              # Confetti and level-up UI
│   ├── logging/               # Log sheet, duration input, time-range helpers
│   └── shared/                # Motivational message, SW registration, store hydration
├── hooks/                     # Zustand stores
├── lib/                       # XP, dates, levels, messages, storage
├── types/                     # App-owned persisted data shapes
├── public/                    # PWA assets and custom service worker
├── __tests__/                 # App-local tests
└── documentation/             # App-local markdown docs
```

## Shared package usage

| Package | Used for |
| ------- | -------- |
| `@bubbles/ui` | shared globals, fonts, buttons, icons, utilities |
| `@bubbles/theme` | `ThemeProvider`, `ThemeToggle`, view-transition helper |
| `@bubbles/footer` | root footer rendering |

## Key files

| File | Purpose |
| ---- | ------- |
| `app/layout.tsx` | root metadata, providers, shell composition |
| `components/shared/store-hydrator.tsx` | client hydration boundary |
| `hooks/use-activity-store.ts` | persisted activity log and day/week selectors |
| `hooks/use-level-store.ts` | current level state and eligibility |
| `hooks/use-settings-store.ts` | persisted settings bag |
| `hooks/use-ui-store.ts` | session-only UI state |
| `lib/storage.ts` | all `localStorage` reads/writes and validation |
| `lib/xp.ts` | XP tier calculation and level-window XP aggregation |
| `lib/levels.ts` | level definitions and over-XP rules |
| `public/sw.js` | custom service worker |
