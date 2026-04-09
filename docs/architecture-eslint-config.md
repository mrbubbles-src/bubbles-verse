# Architecture: @bubbles/eslint-config

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Executive Summary

Shared ESLint flat config presets for the monorepo. Provides 3 profiles: base (all projects), next-js (Next.js apps), react-internal (internal React packages).

## Exports

| Export | File | Consumers |
|--------|------|-----------|
| `./base` | base.js | Foundation for all configs |
| `./next-js` | next.js | it-counts, portfolio, teacherbuddy, the-coding-vault |
| `./react-internal` | react-internal.js | @bubbles/ui, @bubbles/theme, @bubbles/footer |

## Config Presets

### base.js
- **Extends:** JS recommended, Prettier, TypeScript recommended
- **Plugins:** eslint-plugin-only-warn, eslint-plugin-turbo
- **Rules:** `turbo/no-undeclared-env-vars: warn`
- **Ignores:** `dist/`, `.next/`, `.turbo/`, `coverage/`
- **Used by:** All other presets (transitively)

### next.js (nextJsConfig)
- **Extends:** base.js, Next.js recommended + core-web-vitals, react-hooks
- **Rules:** React scope not required (new JSX transform), no prop-types
- **Used by:** All 4 Next.js apps

### react-internal.js
- **Extends:** base.js, React plugin, react-hooks
- **Rules:** React scope not required, no prop-types
- **Used by:** internal React packages (`@bubbles/ui`, `@bubbles/theme`, `@bubbles/footer`)

## Dependencies

- `@eslint/js`, `eslint-config-prettier`, `eslint-plugin-only-warn`
- `@typescript-eslint/eslint-plugin` + `parser`
- `@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
- `eslint-plugin-turbo`, `globals`, `typescript-eslint`
