---
title: "Product Brief: bubbles-verse Dashboard"
status: "complete"
created: "2026-04-05"
updated: "2026-04-05"
inputs:
  - product-brief-bubbles-verse.md
  - docs/project-overview.md
  - docs/architecture-the-coding-vault.md
---

# Product Brief: bubbles-verse Dashboard

## Executive Summary

The bubbles-verse Dashboard is a private, login-protected Next.js application that serves as the central control panel for the entire bubbles-verse ecosystem. It exists because maintaining dynamic content across multiple apps — portfolio projects, CV entries, tech stack, Coding Vault articles — should not require touching JSON files, pushing code, or triggering deploys.

The Dashboard replaces the ad-hoc admin embedded in The Coding Vault and extends that capability to Portfolio content management. It is the backbone that makes the rest of the ecosystem truly low-maintenance: change something once, see it everywhere.

Built as a standalone app inside the monorepo (`apps/dashboard`), backed by Supabase for auth, database, and row-level security. Strictly private — one authenticated user, always.

## The Problem

Today, updating any content in the bubbles-verse ecosystem means touching code. Want to add a new project to the portfolio? Edit a JSON file, push, redeploy. Add a new entry to The Coding Vault? Use a tightly coupled admin UI baked into the app itself. Update your tech stack on the portfolio? More JSON. Change a social link? Find the right file first.

This friction means content rarely gets updated. The portfolio stays stale. The Coding Vault admin is entangled with the content delivery layer, making both harder to change. As more apps join the ecosystem, this problem compounds: every dynamic piece of content becomes its own maintenance burden.

There is no central place to manage the ecosystem — just scattered JSON files, co-located admin screens, and the mental overhead of knowing where to look.

## The Solution

A dedicated, private-by-default Next.js app that acts as the operations hub for bubbles-verse. Authentication via Supabase (no custom JWT logic), content stored in a shared database, served to each front-end app via API or direct DB query.

The Dashboard decouples content management from content delivery. The Portfolio becomes a pure public-facing front-end — it reads from the database, it doesn't own the data. The Coding Vault loses its admin overhead and gains a proper editorial workflow.

**Core capabilities (Phase 1 — Portfolio-first):**
- Portfolio project management — add, edit, archive projects with links, descriptions, tags
- CV / resume management — update work history, education, skills entries
- Tech stack management — add or remove technologies with categories and proficiency levels
- Navigation management — define which apps/projects appear in the Portfolio's top-level navigation (DB-driven, no redeploy required as long as apps are already deployed)
- Social link management — GitHub, LinkedIn, and other profile links (optional, rarely changes but editable)

**Phase 2 — Coding Vault:**
- Vault entry creation and editing via shared `@bubbles/editor` package
- Publish / draft / archive workflow
- Category management
- Long-term: role-based access for guest contributors (Supabase RLS handles permission scoping natively)

## Architecture Approach

- **Stack:** Next.js (App Router), Supabase (auth + PostgreSQL + RLS), deployed to Vercel
- **Auth:** Supabase Auth — no custom JWT, single user (owner) for now
- **DB:** Shared Supabase project — Portfolio and Coding Vault data in one place
- **Security:** Server-side auth checks on all routes, no sensitive logic in public client code
- **Monorepo fit:** `apps/dashboard` consumes `@bubbles/ui`, `@bubbles/eslint-config`, `@bubbles/typescript-config`
- **EditorJS dependency:** `@bubbles/editor` package must be extracted before the Coding Vault admin screen is built — this is a prerequisite, not a nice-to-have
- **Open decision:** Whether to expose a formal backend API layer or use Next.js Server Actions + Supabase client directly. Current lean: Server Actions + Supabase — simpler, stays in monorepo, backend can be extracted later if complexity demands it.

## What Makes This Different

This is not a generic CMS. It is shaped entirely by one developer's real content needs across two (and eventually more) apps. No plugin system, no content modeling UI, no multi-tenant overhead. Every screen solves a specific, proven pain point.

The Supabase choice is deliberate: row-level security handles the future guest contributor model without building a permissions layer from scratch. Auth is robust without a custom implementation.

## Who This Serves

**Only the owner.** There are no external users, no public-facing surfaces, no support burden. Guest contributors (if ever added) would have tightly scoped write access to specific content types only.

## Success Criteria

| Metric | Definition of Done |
|--------|-------------------|
| Portfolio content is DB-backed | Projects, CV, stack, and nav items are managed via Dashboard — no JSON files |
| Zero-code content updates | Adding a new project or CV entry requires no code change and no redeploy |
| Coding Vault admin is migrated | New and existing Vault entries are managed through Dashboard, not the Vault app itself |
| Auth is solid | Only the authenticated owner can access any Dashboard route — no public surfaces |
| Editor package extracted | `@bubbles/editor` exists as a shared package before Vault admin is built |

## Scope

### Phase 1: Portfolio Content Management

- Supabase project setup (auth, DB schema for portfolio content)
- Dashboard app scaffold in monorepo (`apps/dashboard`)
- Portfolio project CRUD
- CV/resume entry CRUD
- Tech stack CRUD
- Navigation management (DB-driven nav items for Portfolio)
- Social links management
- Portfolio app migrated to read from DB instead of JSON files

### Phase 2: Coding Vault Migration

- `@bubbles/editor` package extracted and integrated
- Vault entry CRUD with EditorJS
- Publish / draft / archive workflow
- Category management
- Coding Vault admin removed from `apps/the-coding-vault`

### Out of Scope

- **No public-facing surfaces.** The Dashboard is private, always.
- **No multi-tenant SaaS.** Guest contributors are a future option, not MVP scope.
- **No TeacherBuddy management.** TeacherBuddy stays localStorage-first for privacy reasons. An optional DB mode (if owner is logged in, sync to DB) is a future enhancement, not a Dashboard feature.
- **No backend service.** Logic lives in Server Actions and Supabase — no separate API server.
- **No blog / knowledge base management.** This is future scope, contingent on other app developments.

## Known Constraints

- **`@bubbles/editor` is a prerequisite for Phase 2.** Phase 1 can ship without it, but Phase 2 is blocked until the package exists.
- **Supabase free tier limits** apply for a personal project — sufficient for this use case, worth monitoring if content volume grows.
- **Navigation without redeploy** works only for apps already deployed. Adding a brand new app to the ecosystem still requires a deploy — the Dashboard can manage the nav link data, but a new app needs to exist first.
- **Solo maintainer.** No SLA, personal time only.

## Vision

In 2-3 years, the Dashboard is the single place where bubbles-verse is managed. New apps added to the ecosystem plug into it: their content types are registered, their settings are configurable, their navigation entries are managed. What takes hours today — adding a project, publishing an article, updating the CV — takes minutes. The ecosystem grows and stays fresh without ever touching a JSON file again.
