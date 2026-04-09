# It Counts

`it-counts` is a local-first walking and movement XP tracker. Users log minutes, earn daily XP tiers, and progress through level windows without streak pressure.

## Stack

- Next.js 16 App Router
- React 19
- Zustand for app state
- `localStorage` for persisted business state
- Vitest + React Testing Library
- PWA manifest + custom service worker

## Routes

| Route | Purpose |
| ----- | ------- |
| `/` | Dashboard with hero, level state, CTA, and inline logging flow |
| `/history` | Logged entries grouped by week and day |
| `/about` | Product explanation, XP tiers, level rules |
| `/level-up` | Celebration and next-level handoff |
| `/log` | Legacy fallback that points back to dashboard logging |
| `/api/og` | Dynamic Open Graph image |

## Run locally

From the monorepo root:

```bash
bun install
bunx turbo dev --filter=it-counts
```

From the app folder:

```bash
cd apps/it-counts
bun run dev
```

The checked-in `dev` script binds to `http://itcounts.mrbubbles.test:3003`.

## Quality checks

```bash
cd apps/it-counts
bun run lint
bun run typecheck
bun run test:run
bun run build
```

## Shared packages

- `@bubbles/ui` - globals, fonts, shadcn-style primitives, utilities
- `@bubbles/theme` - theme provider, toggle, transitions
- `@bubbles/footer` - shared footer rendering
- `@bubbles/eslint-config` - shared lint config
- `@bubbles/typescript-config` - shared TS baseline

## Persistence model

- activity entries live under `it-counts:entries`
- current level lives under `it-counts:current-level`
- app settings live under `it-counts:settings`
- session-only UI state stays in memory and resets on reload
- the first level-XP recompute waits for hydrated entries, so returning users do not briefly persist a zero-XP snapshot on mount
- after each log write, level XP is re-synced from the post-write entries snapshot so retroactive date logs update total level XP immediately

## Environment

No required server secrets. `NEXT_PUBLIC_SITE_URL` is optional and only affects metadata base URLs.

## Documentation

- [documentation/README.md](documentation/README.md)
- [documentation/structure.md](documentation/structure.md)
- [documentation/routes.md](documentation/routes.md)
- [documentation/state-and-storage.md](documentation/state-and-storage.md)
- [documentation/testing.md](documentation/testing.md)
- [documentation/pwa.md](documentation/pwa.md)
- [documentation/level-design.md](documentation/level-design.md)
