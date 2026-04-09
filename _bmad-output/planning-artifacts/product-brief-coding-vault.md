---
title: "Product Brief: The Coding Vault"
status: "complete"
created: "2026-04-05"
updated: "2026-04-05"
inputs:
  - product-brief-bubbles-verse.md
  - product-brief-dashboard.md
  - docs/architecture-the-coding-vault.md
  - docs/data-models-the-coding-vault.md
  - docs/api-contracts-the-coding-vault.md
  - docs/component-inventory-the-coding-vault.md
---

# Product Brief: The Coding Vault

## Executive Summary

The Coding Vault is a personal technical reference — the owner's own version of MDN. Not a comprehensive spec, not a tutorial factory for every topic in web development. A curated knowledge base of things he finds interesting, recently learned, or knows he'll need to look up again in two years. The kind of place where you go to remind yourself how `useReducer` works, what the options are for a specific CSS pattern, or how you solved that one tricky thing last year — in your own words, with your own examples.

It has been conceptually in the making for a long time. The core is already functional: PostgreSQL-backed content, Editor.js-powered authoring, MDX rendering with custom components. The problem was never vision — it was always time. The company project the owner co-founded actually built on the same foundation, proving the concept. But the Vault is personal — it should reflect his identity and aesthetic, not the company's brand.

The next phase is about doing it right: migrating the admin to the bubbles-verse Dashboard, porting a more mature Editor.js integration from the company project, and cleaning up a UI that has accumulated some bloat. The content delivery layer stays. The authoring layer moves out. The identity becomes distinctly his.

## The Problem

The Coding Vault works. But it carries the weight of how it was built: the admin UI is embedded in the same app as the public front-end, making both harder to evolve independently. The editor integration was the best available at the time, but a more feature-complete version has since been built and proven in a company project. The UI feels like it has too much going on — though pinpointing exactly what "too much" means will require a design audit once active work begins.

None of these are critical failures. They're the accumulated cost of building something iteratively over time without a dedicated phase to step back and clean it up. That phase is now.

## The Solution

A focused consolidation: port in the better Editor.js implementation, extract it as a shared `@bubbles/editor` package, remove the admin layer and replace it with Dashboard integration, and run a UI audit to identify and resolve the bloat.

**What changes:**
- Admin UI removed from the Vault app entirely — content management moves to bubbles-verse Dashboard (Phase 2)
- Editor.js integration replaced with the matured version from the company project, then extracted as `@bubbles/editor`
- UI audit: identify what's causing the "bloated" feeling — likely a combination of sidebar weight, navigation density, and component heaviness — and simplify
- Auth layer migrated from custom JWT (jose, HS256) to Supabase Auth (aligned with Dashboard)

**What stays:**
- PostgreSQL as the database (Drizzle ORM)
- MDX rendering pipeline with custom components (VaultCodeBlock/Shiki, VaultAlerts, VaultDetailsToggle, VaultEmbed, VaultImage, VaultLink, VaultChecklist)
- Category-based content organization (9 default categories: Git, GitHub, Node.js, HTML, CSS, JavaScript, React, Backend, Database)
- Role-based access model (SUPERADMIN / MODERATOR / GUEST) — structure preserved, implementation migrates to Supabase RLS

## The @bubbles/editor Package

The most significant deliverable of this work is not Coding Vault-specific: it's the `@bubbles/editor` package. The Editor.js integration in the company project is more complete than what currently exists in the Vault — additional block types, refined serialization, better MDX output. Porting and packaging this as a shared monorepo package makes it available to any future app that needs rich content editing (Portfolio MDX content, a future blog, etc.).

This is a prerequisite for Dashboard Phase 2. It should be done before building the Vault admin screens in the Dashboard.

**Current block types (Vault):** Header, List, Code, Quote, Alert, Delimiter, Toggle, Table, Embed, Image, Inline Code, Strikethrough, Annotation, Inline Hotkey — 14 total. The company project version may add or refine some of these.

## What Makes This Different

The Coding Vault is not a generic blogging platform or a CMS trying to serve every use case. It is a structured technical knowledge base — content is organized by technology category, formatted for developer consumption (code blocks, inline hotkeys, toggleable sections), and authored by someone who actually uses the content. The Editor.js → MDX pipeline is the right architecture for this: a visual editor for authoring, structured output for rendering.

The `@bubbles/editor` extraction turns a project-specific implementation into an ecosystem asset — one of the clearest examples of the bubbles-verse "extract when duplication is proven" philosophy in action.

## Who This Serves

**Primary — the owner:** A personal technical reference. Topics he finds interesting, recently learned, or knows he'll need again. The bar for adding something is "do I want to be able to look this up quickly?" — not "is this a comprehensive guide?"

**Secondary — students, colleagues, and developers who find it:** The content is public and structured well enough to be useful to others. A student asking about useReducer, a colleague wanting a quick reference, someone who Googled a topic and landed here. No account needed to read. No community features, no comments, no social layer.

**Explicitly not:** A replacement for MDN, a comprehensive web development curriculum, or a content platform for others to contribute to (at least not now).

## Success Criteria

| Metric | Definition of Done |
|--------|-------------------|
| Admin is out | No admin UI in `apps/the-coding-vault` — all content management via Dashboard |
| Editor package extracted | `@bubbles/editor` exists as a shared package, used by both Dashboard and Vault |
| Auth migrated | Custom JWT replaced by Supabase Auth, consistent with Dashboard |
| UI is cleaner | A design audit has been done; identified bloat has been removed |
| Content pipeline works | New entries created in Dashboard appear in Vault correctly rendered |
| Tests added | Core rendering and data-fetching paths covered |

## Scope

### In Scope

- **Admin removal** — strip out all admin-facing UI, routes, and auth guards from the Vault app
- **@bubbles/editor extraction** — port Editor.js integration from company project, refine, package as shared module
- **Auth migration** — replace jose/JWT implementation with Supabase Auth
- **UI audit and cleanup** — identify sources of visual/UX bloat and simplify; specific changes determined during active work
- **Dashboard integration** — Vault reads content from shared Supabase DB populated via Dashboard
- **Tests** — added when actively working on the app

### Out of Scope

- **No community features** — no comments, no likes, no user accounts for readers
- **No search (initially)** — search is a future enhancement; category browsing is sufficient for MVP
- **No content migration complexity** — existing content in the current DB is the starting point; no complex transformation needed
- **No multi-author workflow (initially)** — guest contributor roles are a Dashboard concern, not Vault-specific

## Content Navigation — Open Design Problem

One of the key UX challenges for the Vault is navigation that scales. A flat sidebar listing every entry is not the answer — as the content grows, that becomes unusable. The 9 default categories (Git, GitHub, Node.js, HTML, CSS, JavaScript, React, Backend, Database) provide a first-level structure, but several questions remain open:

- How does navigation work within a category that grows to 20+ entries?
- Are subcategories needed, or is good search enough?
- Does the category-first navigation live in a sidebar, a top-level grid, or something else entirely?
- How do you surface "I haven't looked at this in a while but it's relevant" — or is that out of scope?

This is explicitly a design-first problem. The architecture already supports categories and ordering; what's missing is the UX pattern for browsing and discovery at scale. This should be explored during the UI audit phase, not pre-decided now. The Dashboard side (category management) should accommodate whatever structure the UX exploration lands on.

## Known Constraints

- **Company project architecture differs** — the Editor.js integration to be ported was built in a different tech context. Adaptation work is needed before it can be packaged. Scope is real but manageable.
- **UI audit scope is undefined** — "bloated" is a feeling, not a spec. The audit and the resulting changes will be scoped during active work, not upfront.
- **Dashboard Phase 2 dependency** — the Vault cannot fully lose its admin until the Dashboard's Vault management screens are built. These can be developed in parallel, but the admin removal is blocked until Dashboard is ready.
- **DB migration** — moving from the current PostgreSQL setup (Drizzle ORM) to a Supabase-hosted DB requires a migration plan. Schema stays the same; hosting changes.

## Vision

The Coding Vault becomes the owner's go-to technical reference — a site he actually uses himself, not just maintains. Topics accumulate over time, each one written once and available forever: a growing personal compendium of things worth knowing. Students and developers who find it get a well-structured, human-written alternative to dry documentation.

The `@bubbles/editor` package it produces becomes a foundation that any bubbles-verse app can build on. Content is managed effortlessly via the Dashboard, published to the Vault, and rendered with the same quality components that made the original architecture worth keeping.

Visually: distinctly personal — Catppuccin palette, his aesthetic, not the company's brand. The company project shares the architecture, but the Vault is unmistakably his.
