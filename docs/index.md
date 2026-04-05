# Project Documentation Index

> Generated: 2026-04-05 | Scan Level: Exhaustive | Mode: Initial Scan

## Project Overview

- **Name:** bubbles-verse
- **Type:** Monorepo with 6 parts (3 web apps + 3 library packages)
- **Primary Language:** TypeScript 5.9.3
- **Framework:** Next.js 16.1.6 (App Router)
- **Architecture:** Bun Workspaces + Turborepo
- **Runtime:** Node.js >=22, Bun 1.3.11

## Quick Reference

### portfolio (`apps/portfolio`)
- **Type:** Web (Next.js 16)
- **Tech:** i18n (DE/EN), Resend email, Cloudflare Turnstile, react-pdf
- **State:** Server actions + minimal client state
- **Entry:** `app/[lang]/layout.tsx`

### teacherbuddy (`apps/teacherbuddy`)
- **Type:** Web (Next.js 16)
- **Tech:** React Context + useReducer, localStorage, Vitest
- **State:** Central store (`context/app-store.tsx`) + localStorage sync
- **Entry:** `app/layout.tsx`

### the-coding-vault (`apps/the-coding-vault`)
- **Type:** Web (Next.js 16)
- **Tech:** PostgreSQL, Drizzle ORM, JWT (jose), Editor.js, MDX, Cloudinary
- **State:** Server-side DB + JWT cookies
- **Entry:** `app/(vault)/layout.tsx`, `app/(admin)/layout.tsx`

### @bubbles/ui (`packages/ui`)
- **Type:** Library
- **Tech:** 26 shadcn components (Base UI + Tailwind v4 + CVA)
- **Exports:** `./shadcn/*`, `./lib/*`, `./hooks/*`, `./globals.css`

### @bubbles/eslint-config (`packages/eslint-config`)
- **Type:** Library
- **Exports:** `./base`, `./next-js`, `./react-internal`

### @bubbles/typescript-config (`packages/typescript-config`)
- **Type:** Library
- **Profiles:** `base.json`, `nextjs.json`, `react-library.json`

## Generated Documentation

### Overview & Structure
- [Project Overview](./project-overview.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Integration Architecture](./integration-architecture.md)
- [Development Guide](./development-guide.md)
- [Project Parts Metadata](./project-parts.json)

### Architecture (per part)
- [Architecture - Portfolio](./architecture-portfolio.md)
- [Architecture - TeacherBuddy](./architecture-teacherbuddy.md)
- [Architecture - The Coding Vault](./architecture-the-coding-vault.md)
- [Architecture - @bubbles/ui](./architecture-ui.md)
- [Architecture - @bubbles/eslint-config](./architecture-eslint-config.md)
- [Architecture - @bubbles/typescript-config](./architecture-typescript-config.md)

### Component Inventories
- [Components - Portfolio](./component-inventory-portfolio.md)
- [Components - TeacherBuddy](./component-inventory-teacherbuddy.md)
- [Components - The Coding Vault](./component-inventory-the-coding-vault.md)
- [Components - @bubbles/ui](./component-inventory-ui.md)

### API Contracts
- [API - Portfolio](./api-contracts-portfolio.md)
- [API - The Coding Vault](./api-contracts-the-coding-vault.md)

### Data Models
- [Data Models - The Coding Vault + TeacherBuddy](./data-models-the-coding-vault.md)

## Existing Documentation

### Root
- [README.md](../README.md) - Monorepo overview, setup, daily commands
- [AGENTS.md](../AGENTS.md) - AI/human coding standards
- [CHANGELOG.md](../CHANGELOG.md) - Cross-cutting releases

### Monorepo Docs (`documentation/`)
- [Documentation Index](../documentation/README.md)
- [Architecture](../documentation/architecture.md) - Workspaces, dependencies, build graph
- [Tooling](../documentation/tooling.md) - Bun, Turbo, Prettier, ESLint, TypeScript
- [Onboarding](../documentation/onboarding.md) - First-time setup
- [Troubleshooting](../documentation/troubleshooting.md) - Common issues

### Portfolio (`apps/portfolio/`)
- [README](../apps/portfolio/README.md)
- [Overview](../apps/portfolio/documentation/overview.md)

### TeacherBuddy (`apps/teacherbuddy/`)
- [README](../apps/teacherbuddy/README.md)
- [Documentation Index](../apps/teacherbuddy/documentation/README.md)
- [Getting Started](../apps/teacherbuddy/documentation/getting-started.md)
- [Structure](../apps/teacherbuddy/documentation/structure.md)
- [Components](../apps/teacherbuddy/documentation/components.md)
- [State & Storage](../apps/teacherbuddy/documentation/state-and-storage.md)
- [Hooks](../apps/teacherbuddy/documentation/hooks.md)
- [Routes](../apps/teacherbuddy/documentation/routes.md)
- [Testing](../apps/teacherbuddy/documentation/testing.md)
- [Conventions](../apps/teacherbuddy/documentation/conventions.md)
- [Dependencies](../apps/teacherbuddy/documentation/dependencies.md)
- [Metadata & SEO](../apps/teacherbuddy/documentation/metadata-and-seo.md)

### The Coding Vault (`apps/the-coding-vault/`)
- [README](../apps/the-coding-vault/README.md)
- [Overview](../apps/the-coding-vault/documentation/overview.md)

### Packages
- [UI README](../packages/ui/README.md) | [Overview](../packages/ui/documentation/overview.md)
- [ESLint Config README](../packages/eslint-config/README.md) | [Consuming](../packages/eslint-config/documentation/consuming.md)
- [TypeScript Config README](../packages/typescript-config/README.md) | [Profiles](../packages/typescript-config/documentation/profiles.md)

## Getting Started

1. Read this index to understand the documentation structure
2. For new features on a specific app, start with its architecture doc
3. For UI components, check `component-inventory-ui.md` first, then app-specific inventories
4. For full-stack features on The Coding Vault, reference both `architecture-the-coding-vault.md` and `data-models-the-coding-vault.md`
5. For cross-cutting changes, read `integration-architecture.md`

### Brownfield PRD Command
When ready to plan new features, run the PRD workflow and provide this index as input:
```
docs/index.md
```
