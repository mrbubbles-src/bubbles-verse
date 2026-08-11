# Integration Architecture

> Updated: 2026-04-09

## Overview

`bubbles-verse` uses a simple dependency model:

- apps consume packages
- packages do not consume apps
- apps do not depend on each other at runtime

## Dependency graph

```text
apps/
  it-counts -----------\
  portfolio -----------+--> @bubbles/ui
  teacherbuddy --------+--> @bubbles/theme
  the-coding-vault ----/
  it-counts -----------> @bubbles/footer

all workspaces -------> @bubbles/typescript-config
app/package tooling --> @bubbles/eslint-config
```

## Shared package roles

| Package | Role |
| ------- | ---- |
| `@bubbles/ui` | shared components, styles, fonts, utilities |
| `@bubbles/theme` | theming, theme toggle, transitions |
| `@bubbles/footer` | shared footer rendering surface |
| `@bubbles/eslint-config` | lint presets |
| `@bubbles/typescript-config` | TS compiler baselines |

## App integration patterns

### `it-counts`

- imports shared fonts and styles from `@bubbles/ui`
- uses `@bubbles/theme` in the root layout
- renders the shared `Footer` with app-owned link config
- keeps business data client-side in `localStorage`

### `portfolio`

- server-driven contact integrations
- shared UI consumption

### `teacherbuddy`

- client-driven persistence and testing-heavy feature work
- shared UI and theme consumption

### `the-coding-vault`

- heaviest server integration footprint in the repo
- shared UI on top of DB/auth/content services

## External integrations by app

| App | External services |
| --- | ----------------- |
| `it-counts` | browser storage, installable PWA shell |
| `portfolio` | Resend, Cloudflare Turnstile, Vercel |
| `teacherbuddy` | browser storage, Vercel |
| `the-coding-vault` | PostgreSQL, Cloudinary, Discord, Vercel |
