---
title: "Product Brief: bubbles-verse"
status: "complete"
created: "2026-04-05"
updated: "2026-04-05"
inputs:
  - docs/project-overview.md
  - docs/integration-architecture.md
  - docs/development-guide.md
  - docs/architecture-portfolio.md
  - docs/architecture-teacherbuddy.md
  - docs/architecture-the-coding-vault.md
  - docs/source-tree-analysis.md
---

# Product Brief: bubbles-verse

## Executive Summary

bubbles-verse is a personal developer ecosystem — a monorepo that consolidates multiple independently-built web applications and shared packages into a single, cohesive universe. It exists to solve a fundamental frustration every prolific developer faces: rebuilding the same foundations, copying code between projects, and watching designs drift apart across apps that should feel like they belong together.

Built on Next.js 16, React 19, TypeScript 5.9, Tailwind v4, and shadcn/Base UI, bubbles-verse currently houses three applications — a developer portfolio, classroom tools, and a coding knowledge base — unified by a shared design system and tooling layer. The monorepo enables instant design propagation, eliminates config drift, and creates a foundation where new apps can be spun up quickly on proven infrastructure.

This is not a product for sale. It's a personal platform — built for one developer's needs. The repo is public: fork it if it's useful, but don't expect support or documentation aimed at external users.

## The Problem

Every developer who maintains multiple personal projects knows the pain. A concrete example from bubbles-verse: the EditorJS integration for rich content editing was built and finalized in a separate project. When The Coding Vault needed the same capability, it meant wiring it up again from scratch. When a future blog app needs it too — another weekend of setup. Multiply this across color schemes, component libraries, ESLint configs, and TypeScript settings, and the cost compounds.

The result is not just lost time — it's cognitive overhead. Each project becomes its own island with its own quirks, its own setup rituals, and its own maintenance burden. What should feel like a cohesive body of work feels like a scattered collection of disconnected experiments.

Today's solutions — separate repos with copy-paste, npm-published personal packages, or monorepo templates like create-turbo — either don't solve the coherence problem or impose overhead that doesn't justify itself for a personal ecosystem.

## The Solution

bubbles-verse is a Turborepo + Bun workspace monorepo that treats personal projects as a unified ecosystem rather than isolated apps. The architecture enforces a strict unidirectional dependency model: apps consume shared packages, never the reverse. This isn't a soft convention — it's the structural guarantee that prevents circular dependencies, implicit coupling, and shared mutable state. One app can be rewritten or removed without cascading effects on any other.

Each app remains independently deployable while sharing:

- **@bubbles/ui** — A design system with 26+ shadcn components, global styles, hooks, and utilities. One change propagates everywhere.
- **@bubbles/eslint-config** — Shared linting presets (base, Next.js, React library) so code quality is consistent across the board.
- **@bubbles/typescript-config** — Shared compiler profiles eliminating config drift.
- **Future packages** — Reusable logic extracted organically as patterns emerge (e.g., an EditorJS package for rich content editing across apps).

The extraction rule is explicit: extract when the same logic appears in 2+ apps with a stable API. No premature abstractions — packages emerge from proven duplication, not theoretical future use cases.

## Current App Inventory

| App | Purpose | Status | Architecture |
|-----|---------|--------|-------------|
| **Portfolio** | Developer portfolio with i18n (DE/EN), contact form, PDF CV | Live (design outdated) | Server-first, minimal client state |
| **TeacherBuddy** | Classroom tools: student management, quizzes, groupings | Live, functionally complete | Client-side, localStorage persistence |
| **The Coding Vault** | CMS/knowledge base for coding tutorials | In progress (~70%) | Full-stack: PostgreSQL, JWT auth, EditorJS → MDX |

## What Makes This Different

- **Coherence by architecture, not discipline.** Design consistency isn't maintained by remembering to update three repos — it's enforced by a single source of truth. Change a color token in @bubbles/ui, rebuild, and every app reflects it. No manual per-app work.
- **Pragmatic extraction philosophy.** The extraction rule is deliberate: duplicate first, extract only when duplication is proven across 2+ apps with a stable API. This avoids the premature abstraction trap that kills most shared libraries.
- **Zero cross-app runtime coupling.** Apps share build-time packages but never communicate at runtime. This is a deliberate architectural guarantee — one app's failure, rewrite, or removal never cascades to others.
- **Compounding returns.** Every shared package, every design token, every utility built once pays dividends across every current and future app. The more apps in the ecosystem, the more each hour of infrastructure work is worth.

## Who This Serves

**Primary:** The owner — a solo developer who builds and maintains multiple personal web applications and needs them to feel like one cohesive ecosystem.

**Secondary:** Anyone who forks the repo. It's public, it's free to use — but no commercial rebranding, no claiming it as your own product. No active community-building, no support, no external documentation effort.

## Success Criteria

| Metric | Definition of Done |
|--------|-------------------|
| All apps deployed | Every app in the monorepo is live on Vercel and accessible |
| Design coherence | Changing the primary color token in @bubbles/ui reflects in all apps after a single rebuild — no per-app manual changes |
| New app setup time | A new app can be scaffolded and running with shared UI, configs, and styles in under a day |
| Package reuse | At least one new shared package extracted from real duplication (e.g., @bubbles/editor) |
| Config consistency | ESLint, TypeScript, and Prettier configs come exclusively from shared packages — no per-app overrides except where technically required |
| Test coverage | Each app has tests covering core functionality, added incrementally as apps are actively worked on |

## Scope

### Phase 1: Infrastructure Foundation

- **Deploy all apps** to Vercel — establish the deployment pipeline
- **Stabilize the monorepo** — ensure build caching, dependency resolution, and workspace linking work reliably
- **CI basics** — lint, type-check, and build gates per app

### Phase 2: App Work

- **Redesign Portfolio** — modernize the visual design, keep the server-first architecture, add tests
- **Finish The Coding Vault** — complete the EditorJS → MDX pipeline, finalize auth and content flows, add tests
- **TeacherBuddy** — design polish where needed, maintain existing test coverage
- **Extract @bubbles/editor** — when the EditorJS integration is needed in a second app, package it

### Out of Scope

- **No SaaS.** No commercial monetization of any app in this ecosystem. Revenue-generating products live in separate repos.
- **No public template.** bubbles-verse is not a starter kit for others. Fork it, but it's shaped by one developer's real needs, not generalized for broad adoption.
- **No cross-app runtime integration.** Apps remain independent — no shared backends, no inter-app APIs.
- **No mobile apps.** Web-only for the foreseeable future.

## Known Constraints

- **Solo maintainer.** This is a one-person project, built in personal time. There is no SLA, no team, no guaranteed timeline. Scope decisions reflect this reality.
- **Bleeding-edge stack.** Next.js 16, React 19, Tailwind v4, and shadcn/Base UI are recent releases. Documentation gaps, breaking changes, and sparse community answers are expected and accepted as a tradeoff for staying current.
- **shadcn is copy-model.** Component updates from upstream require manual reconciliation across 26+ components. This is a known maintenance cost, managed by periodic audits rather than automatic updates.

## Vision

In 2-3 years, bubbles-verse is a mature personal platform where spinning up a new idea takes hours, not days. The shared package layer is rich enough — design system, editor, auth utilities, common layouts — that a new app starts with UI, styling, configs, and core utilities already in place. Every app in the ecosystem looks and feels like it belongs to the same universe, because it does.

The portfolio showcases not just projects, but an ecosystem. TeacherBuddy runs reliably for its classroom. The Coding Vault is a polished knowledge base. And whatever new ideas emerge along the way slot in effortlessly, standing on the shoulders of everything built before.

The real payoff is compounding: every hour invested in shared infrastructure multiplies across every app, current and future. The more the ecosystem grows, the less each new addition costs.
