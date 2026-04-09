# Testing

## Overview

`it-counts` uses Vitest with jsdom and React Testing Library. The suite covers pure business rules, Zustand stores, component behavior, PWA behavior, and a basic accessibility audit.

## Configuration

Key files:

- [`../vitest.config.ts`](../vitest.config.ts)
- [`../vitest.setup.ts`](../vitest.setup.ts)

Current setup:

- environment: `jsdom`
- globals: enabled
- setup: `@testing-library/jest-dom/vitest`
- coverage include: `lib/**`

## Test areas

| Area | Examples |
| ---- | -------- |
| `lib/` | dates, XP tiers, level rules, messages, storage validation, level-window XP sum |
| `hooks/` | activity, level, settings, and UI stores |
| `components/` | dashboard, log sheet, session-start messaging, bottom nav, level-up flow |
| `pwa/` | manifest, service worker registration, service worker caching logic |
| `accessibility/` | app-level a11y audit |

Current app test file count: **21**

## Run commands

```bash
cd apps/it-counts
bun run test
bun run test:run
bun run test:coverage
bun run test:ui
```

## Notes

- `vitest.setup.ts` clears `localStorage` after each test.
- The suite relies heavily on business-rule testing because XP and level progression are data-sensitive.
- PWA tests exist specifically to catch stale-cache regressions.
