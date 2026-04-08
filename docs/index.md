# Project Documentation Index

> Updated: 2026-04-09 | Scope: Monorepo overview

## Project Overview

- **Name:** bubbles-verse
- **Type:** Monorepo with 9 workspaces (4 apps + 5 packages)
- **Primary Language:** TypeScript
- **Framework Baseline:** Next.js 16.x + React 19
- **Tooling:** Bun workspaces + Turborepo

## Quick Reference

### Apps

- **it-counts** (`apps/it-counts`) - local-first walking XP tracker, Zustand stores, Vitest, PWA
- **portfolio** (`apps/portfolio`) - personal site, i18n, Resend, Turnstile
- **teacherbuddy** (`apps/teacherbuddy`) - classroom tools, reducer/context, localStorage, Vitest
- **the-coding-vault** (`apps/the-coding-vault`) - Drizzle + PostgreSQL + JWT + MDX CMS

### Packages

- **@bubbles/ui** (`packages/ui`) - shared components, styles, fonts, utilities
- **@bubbles/theme** (`packages/theme`) - theme provider, toggle, transitions
- **@bubbles/footer** (`packages/footer`) - shared footer rendering
- **@bubbles/eslint-config** (`packages/eslint-config`) - flat ESLint presets
- **@bubbles/typescript-config** (`packages/typescript-config`) - tsconfig baselines

## Root Documentation

- [Project Overview](./project-overview.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Integration Architecture](./integration-architecture.md)
- [Project Parts Metadata](./project-parts.json)
- [Development Guide](../documentation/README.md)

## Workspace Documentation

- [it-counts README](../apps/it-counts/README.md)
- [it-counts docs index](../apps/it-counts/documentation/README.md)
- [Portfolio README](../apps/portfolio/README.md)
- [TeacherBuddy docs index](../apps/teacherbuddy/documentation/README.md)
- [The Coding Vault README](../apps/the-coding-vault/README.md)
- [UI package README](../packages/ui/README.md)

## Notes

- Root docs describe the repo as a whole.
- App- and package-specific detail should live close to the owning workspace.
