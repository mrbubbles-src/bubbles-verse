---
title: "Product Brief Distillate: The Coding Vault"
type: llm-distillate
source: "product-brief-coding-vault.md"
created: "2026-04-05"
purpose: "Token-efficient context for downstream PRD/design work"
---

# Product Brief Distillate: The Coding Vault

## Core Identity (Critical — Do Not Lose This)

- **The Coding Vault is the owner's personal MDN** — not a tutorial factory, not a comprehensive reference. A curated knowledge base of topics he finds interesting, recently learned, or will want to look up in two years.
- **"Do I want to be able to look this up quickly?"** is the bar for adding content — not "is this a comprehensive guide?"
- **Visually distinct from the company project** — same underlying architecture (the company's learning platform was built on the Vault's foundation), but the Vault must reflect his personal identity and Catppuccin-based aesthetic. Not the company's brand.
- **The idea predates the company** — this is a personal project that the company borrowed from, not the other way around.

## Rejected Ideas & Explicit Exclusions

- **No flat sidebar list of all entries** — as content grows this becomes unusable. Navigation must be category-based and designed to scale.
- **No comprehensive web dev curriculum** — coverage is curated by personal interest and utility, not completeness.
- **No community features** — no comments, no likes, no reader accounts.
- **No search (initially)** — category browsing is sufficient for MVP. Search is a future enhancement.
- **No multi-author workflow (MVP)** — guest contributors are a future Dashboard concern.
- **No admin UI in the Vault app** — all content management moves to bubbles-verse Dashboard Phase 2. Do not design or build admin screens inside `apps/the-coding-vault`.
- **No company branding** — the Vault is personal. Any design that looks like it was lifted from the company site is wrong.

## Architecture — What Stays

- PostgreSQL as DB (Drizzle ORM 0.45) — migrating to Supabase-hosted instance
- 3 DB tables: users (role enum: SUPERADMIN/MODERATOR/GUEST, authorInfo JSONB), categories, vaultEntries (cascade delete)
- MDX rendering pipeline with custom components:
  - VaultCodeBlock (Shiki, one-dark-pro theme)
  - VaultAlerts, VaultDetailsToggle, VaultEmbed
  - VaultImage (Cloudinary + blur placeholder)
  - VaultLink, VaultChecklist
- Category-based content organization — 9 defaults: Git, GitHub, Node.js, HTML, CSS, JavaScript, React, Backend, Database
- Role-based access (SUPERADMIN/MODERATOR/GUEST) — structure preserved, implementation moves to Supabase RLS

## Architecture — What Changes

- **Auth:** Custom JWT (jose, HS256, 30-day expiry, httpOnly cookie) → Supabase Auth. All existing auth guards (authGuard, multiRoleGuard, getCurrentUser) to be replaced.
- **Admin UI:** Stripped out entirely from the Vault app. Replaced by Dashboard Phase 2.
- **Editor.js integration:** Current Vault implementation replaced by the matured version from the company project, then extracted as `@bubbles/editor` package.

## @bubbles/editor Package — Key Details

- **Source:** Company project's Editor.js implementation (built on top of the Vault's original codebase)
- **Current Vault block types (14):** Header, List, Code, Quote, Alert, Delimiter, Toggle, Table, Embed, Image, Inline Code, Strikethrough, Annotation, Inline Hotkey
- **Company project version** may have additional or refined block types — audit needed during porting
- **Output:** Editor.js JSON → MDX serializer → rendered by custom MDX components
- **Cloudinary integration:** Image block uploads to Cloudinary with blur placeholder generation
- **Architecture mismatch:** Company project has a different tech context — adaptation work required before packaging
- **This package is a hard prerequisite for Dashboard Phase 2** (Vault admin screens in Dashboard)
- **Also unlocks:** Portfolio MDX content, future blog, any other app needing rich text editing

## Content Navigation — Open Design Problem

**This is one of the most important unsolved UX questions for the Vault.**

- Owner explicitly does not want a flat sidebar listing all entries
- Current structure: top-level categories (9 defaults) with entries inside
- Open questions:
  - How to navigate within a category that grows to 20+ entries?
  - Subcategories vs. tags vs. search?
  - Navigation pattern: sidebar, top-level category grid, or something else?
  - How to handle the "I know this is relevant but I haven't looked at it in a while" use case?
- **Decision:** Leave for design-phase exploration — do not pre-decide the pattern. The DB schema already supports categories and sort order; the UX layer needs to be designed.
- Dashboard category management must accommodate whatever navigation structure the UX exploration produces.

## Current Company Project Comparison

| Aspect | Company Project | Coding Vault (target) |
|--------|----------------|----------------------|
| Visual identity | Company branding | Personal (Catppuccin) |
| Audience | Students / AZAV participants | Owner + anyone who finds it |
| Content | Curriculum-driven | Personally curated |
| Architecture | Different tech context | Next.js App Router, Supabase |
| Editor | More mature, feature-complete | Port from company project |
| Admin | Separate/integrated | Moves to bubbles-verse Dashboard |

## Sequencing Dependencies

1. **Supabase setup** (shared with Dashboard) — before auth migration can happen
2. **@bubbles/editor extraction** — before Dashboard Phase 2 (Vault admin screens)
3. **Dashboard Phase 2** — before admin can be fully removed from Vault app
4. **UI audit** — can happen independently, determines scope of visual cleanup

## Open Questions

- **Exact block type delta:** What does the company project's Editor.js version have that the Vault doesn't? Needs audit during porting.
- **Content navigation pattern:** Category grid? Sidebar with collapsible categories? Tags in addition to categories? Undecided — design exploration needed.
- **Category evolution:** Will 9 default categories be enough long-term? Mechanism for adding new categories via Dashboard (already in scope) but taxonomy strategy is undecided.
- **Shiki theme:** one-dark-pro is current — will this stay with the Catppuccin redesign or switch to a Catppuccin Shiki theme?
- **Cloudinary dependency:** Image hosting stays on Cloudinary for now. No migration planned. Worth noting as external service cost.
- **"Bloated" UI diagnosis:** Specific sources of visual/UX bloat are unknown until active design work begins. Could be sidebar weight, navigation density, component heaviness, or all three.

## Scope Signals From Owner

- "I just want to be able to look things up quickly in my own site" — speed of lookup is the primary UX goal
- "Like MDN or W3Schools, but not exactly — topics I find cool, recently learned" — curated personal reference, not comprehensive
- "It's been in the making for a long time — time was always the problem, not the vision" — the concept is proven; execution is the remaining work
- "I'd probably rebuild it a bit cleaner" — not feature overhaul, more architectural cleanup and identity reset
- "The company project has features I can just import" — significant reuse expected, but adaptation is real work
- "The Vault should look like me, not the company" — visual differentiation is a hard requirement
