# Project Overview: bubbles-verse

> Updated: 2026-04-09

## Purpose

Personal monorepo for several Next.js products plus shared frontend infrastructure. The repo combines independently deployable apps with a small internal package layer for UI, theme, footer, linting, and TypeScript baselines.

## Repository Type

Monorepo managed with Bun workspaces and Turborepo.

## Technology Summary

| Category | Technology |
| -------- | ---------- |
| Runtime | Node.js `>=22 <25`, Bun `1.3.11` |
| Framework | Next.js `16.x` |
| UI | React `19`, Tailwind CSS `v4`, shadcn/Base UI |
| State | Zustand, reducer/context, server state depending on app |
| Testing | Vitest in `it-counts` and `teacherbuddy` |
| Deployment | Vercel-friendly workspace apps |

## Applications

### `it-counts`

Walking and movement XP tracker. Local-first. Uses Zustand, `localStorage`, fixed XP tiers, level progression, and a custom service worker for installability/offline resilience.

### `portfolio`

Developer portfolio with locale routing, contact flow, CAPTCHA, and PDF CV rendering.

### `teacherbuddy`

Teacher workflow app with local persistence, route-based tools, and good Vitest coverage.

### `the-coding-vault`

Content-management style app backed by PostgreSQL, Drizzle, JWT sessions, MDX, and Editor.js.

## Shared Packages

### `@bubbles/ui`

Shared visual primitives, globals, hooks, fonts, and utilities.

### `@bubbles/theme`

Shared theming and transition helpers.

### `@bubbles/footer`

Shared footer surface used by app layouts.

### `@bubbles/eslint-config`

Repo-wide lint presets.

### `@bubbles/typescript-config`

Repo-wide TypeScript baselines.

## Architecture Principles

- Apps are deployment units.
- Packages are the reusable layer.
- Cross-app runtime coupling is avoided.
- Documentation should stay close to the code that owns it.

## Current Metrics

| Metric | Value |
| ------ | ----- |
| Workspaces | 9 |
| Apps | 4 |
| Packages | 5 |
| TypeScript source files (`apps/` + `packages/`) | ~303 |
| Test files in app suites | 42 |
