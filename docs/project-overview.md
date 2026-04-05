# Project Overview: bubbles-verse

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Purpose

Personal monorepo containing 3 Next.js applications and 3 shared packages. Each app serves a different purpose — developer portfolio, classroom tools, and a coding knowledge base — but all share a common design system, tooling, and deployment patterns.

## Repository Type

**Monorepo** managed with Bun workspaces and Turborepo.

## Technology Stack Summary

| Category | Technology |
|----------|-----------|
| Runtime | Node.js >=22 (pinned 24.14.1), Bun 1.3.11 |
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5.9.3 (strict mode) |
| UI | React 19.2.4, Tailwind CSS v4, shadcn (Base UI) |
| Build | Turborepo 2.9.3 |
| Linting | ESLint 9 (flat config), Prettier 3.8+ |
| Testing | Vitest 4.0 (TeacherBuddy only) |
| Deployment | Vercel-ready (no CI/CD configured) |

## Applications

### Portfolio (`apps/portfolio`)
Developer portfolio with i18n (DE/EN), email contact (Resend), CAPTCHA (Turnstile), and PDF CV viewer. Server-first architecture with minimal client state.

### TeacherBuddy (`apps/teacherbuddy`)
Classroom tools: student management, random picker, quiz builder/player, project groupings, breakout rooms. Client-side app with localStorage persistence — no backend.

### The Coding Vault (`apps/the-coding-vault`)
CMS/knowledge base for coding tutorials. Full-stack with PostgreSQL (Drizzle ORM), JWT auth, Editor.js content editor, MDX rendering, and Cloudinary media.

## Shared Packages

### @bubbles/ui (`packages/ui`)
Design system with 26 shadcn components built on Base UI React, styled with Tailwind CSS v4 and CVA. Includes hooks, utilities, and global styles.

### @bubbles/eslint-config (`packages/eslint-config`)
ESLint flat config presets: base, next-js, react-internal.

### @bubbles/typescript-config (`packages/typescript-config`)
Shared TypeScript compiler profiles: base, nextjs, react-library.

## Architecture

- **Dependency direction:** Apps → Packages (never reverse)
- **No cross-app communication** at runtime
- **Each app independently deployable** with its own external services
- **Shared design tokens** via `@bubbles/ui/globals.css`

## Key Metrics

| Metric | Value |
|--------|-------|
| Total source files (.ts/.tsx) | ~142 |
| Test files | 10 (TeacherBuddy) |
| Shared UI components | 26 |
| API endpoints | 10 (across all apps) |
| Database tables | 3 (The Coding Vault) |
| i18n locales | 2 (Portfolio: DE/EN) |
