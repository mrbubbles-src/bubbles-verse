# Dashboard Design Spec

**Date:** 2026-04-17
**Status:** Draft for review
**Primary app:** `apps/dashboard`
**Primary V1 domain:** `the-coding-vault`

## Summary

`dashboard` becomes the private, bubbles-verse-wide admin surface for creating
and managing content. V1 focuses on `the-coding-vault`, but the architecture
must already support additional content-receiving apps such as `portfolio` and
future `blog` features without a data model rewrite.

The dashboard is not a generic schema builder. It is an app-centered editorial
back office with a shared content core, shared authentication, and app-specific
content adapters.

## Goals

- Replace Vault's existing admin logic with `dashboard` as the only write
  surface for editorial content.
- Use Supabase Auth and Supabase Postgres as the shared auth/database layer.
- Keep the dashboard private and owner-only in V1.
- Model a reusable content core so future apps can consume the same content
  infrastructure.
- Reuse existing monorepo packages and shared UI primitives instead of creating
  parallel component systems.

## Non-Goals

- No public dashboard registration.
- No guest author login flow in V1.
- No arbitrary custom field system.
- No deeper category tree than two levels for Vault in V1.
- No second admin interface inside `the-coding-vault`.
- No attempt to force product-app user data such as `it-counts` into the same
  editorial schema as content.

## Product Shape

The platform has two distinct data families that must stay separate even if
they share a Supabase project.

### 1. Content domain

Editorial data is created in `dashboard` and consumed by other apps.

Examples:

- Vault entries
- future portfolio projects
- future blog posts
- author profiles used by public-facing apps

### 2. App domain

Product-app data is created by the app itself and belongs to end users.

Examples:

- future `it-counts` synced activity logs
- `it-counts` settings
- future `it-counts` AI integration preferences or BYO-key configuration

These app-domain tables may live in the same Supabase project, but they must be
governed by their own RLS policies and app-specific logic. They are not part of
the editorial content core.

## Information Architecture

### Global routes

- `/login`
  Dashboard-only login entry.
- `/`
  Global home focused on work-in-progress and quick actions.
- `/account`
  Owner profile, account metadata, social links, logout, future profile editing.

### Sidebar structure

The dashboard uses the shared `BubblesSidebar` shell and groups navigation by
app area instead of by abstract CMS concepts.

Primary sections:

- `Dashboard`
- `Coding Vault`
- later `Portfolio`
- later `Blog`

### Dashboard home

The home route is a hybrid global overview. It should feel work-oriented rather
than metric-heavy.

Primary content:

- continue editing
- recent drafts
- recently updated content
- quick actions such as `Neuer Eintrag`
- app entry points
- light status summaries per app

The home should not degenerate into a grid of cards. Use a mixture of list,
section, table, split layout, inline action rows, and selected accent panels.

### Vault routes

- `/vault`
  Vault overview with key actions and recent work.
- `/vault/entries`
  Entry list with filtering and sorting.
- `/vault/entries/new`
  Create a Vault entry with `@bubbles/markdown-editor`.
- `/vault/entries/[id]`
  Edit an existing Vault entry.
- `/vault/categories`
  Manage top-level and subcategories.

Optional later extension:

- `/vault/categories/[id]`
  Category detail and related entries.

## Content Model

The content system uses a shared core plus Vault-specific adapter tables.

### Shared content core

#### `app_modules`

Defines editorial app areas such as `vault`, `portfolio`, and `blog`.

Suggested fields:

- `id`
- `slug`
- `name`
- `description`
- `is_active`
- `created_at`
- `updated_at`

#### `content_items`

The main content record. This is where the actual entry content lives.

Suggested fields:

- `id`
- `app_module_id`
- `content_type`
- `title`
- `slug`
- `description`
- `status`
- `editor_content`
- `serialized_content`
- `author_profile_id`
- `created_by_profile_id`
- `updated_by_profile_id`
- `published_at`
- `created_at`
- `updated_at`

`editor_content` is the source document coming from
`@bubbles/markdown-editor`. `serialized_content` stores the output needed for
reading/rendering consumers.

#### `content_item_tags`

Normalized tags for content items.

Suggested fields:

- `id`
- `content_item_id`
- `tag`
- `created_at`

V1 can fall back to a `text[]` tags field if we need to keep implementation
smaller, but the preferred shape is normalized.

### Vault-specific tables

#### `vault_categories`

Represents a strict two-level tree.

Suggested fields:

- `id`
- `name`
- `slug`
- `description`
- `parent_id`
- `sort_order`
- `created_at`
- `updated_at`

Rules:

- `parent_id = null` means top-level category.
- `parent_id != null` means subcategory.
- The app must prevent nesting deeper than one parent relationship.

#### `vault_entries`

Links a shared content item into the Vault domain.

Suggested fields:

- `content_item_id`
- `primary_category_id`
- `created_at`
- `updated_at`

If Vault-specific metadata grows later, it belongs here or in adjacent
Vault-specific tables, not in `content_items`.

## Author and Profile Model

V1 is owner-only for login, but the data model must already support richer
author profiles for future guest writers.

### `profiles`

Application-side profile data separate from Supabase Auth internals.

Suggested fields:

- `id`
- `auth_user_id`
- `display_name`
- `slug`
- `email`
- `avatar_url`
- `bio`
- `role`
- `created_at`
- `updated_at`

### `profile_social_links`

Normalized author/profile links.

Suggested fields:

- `id`
- `profile_id`
- `platform`
- `url`
- `label`
- `sort_order`
- `created_at`

Supported V1 platforms:

- `website`
- `github`
- `linkedin`
- `twitter`

This replaces the looser JSON-style author social payload from the current Vault
setup with a more queryable and extensible model.

## Authentication and Access

### Supabase shape

Use Supabase Auth as the authentication layer and Supabase Postgres as the
database. Dashboard login is private and applies to all dashboard routes.

### V1 access model

- no public registration for dashboard
- no email/password signup flow for strangers
- GitHub OAuth is acceptable if restricted by allowlist
- only explicitly allowed identities may enter
- V1 dashboard role surface is effectively `owner` only

Recommended direction:

- disable general dashboard signup
- allow only GitHub login
- reject unknown users during creation/admission with an allowlist-backed auth
  gate
- create or link a `profiles` row for the admitted owner

### Route protection

All dashboard routes except `/login` require a valid authenticated owner
session.

### Sidebar user menu

The shared sidebar footer should show the current user identity and expose:

- `Dashboard`
- `Account`
- `Logout`

This same pattern can later be reused in other sidebar-based apps, but it must
not create a second admin system outside `dashboard`.

## Future Extension for End-User Apps

The same Supabase project may later serve apps such as `it-counts`, but those
must be treated as a different domain.

### Important distinction

`it-counts` users are end users of a product app. They are not dashboard admins.

Implications:

- they may exist in the same Supabase Auth project
- they must not gain dashboard access by virtue of existing
- RLS and app membership must separate them from dashboard/editorial access

### Recommended future tables

Examples only, not part of V1:

- `app_memberships`
- `it_counts_profiles`
- `it_counts_entries`
- `it_counts_settings`
- `it_counts_ai_integrations`

Potential `it-counts` AI settings may include user-supplied provider keys. Those
must stay app-specific, server-mediated, and outside the editorial content
domain.

## UI and Component Rules

The dashboard must follow the monorepo's existing package boundaries and shared
UI conventions.

### Required shared packages

Prefer existing packages before creating app-local equivalents:

- `@bubbles/ui`
- `@bubbles/theme`
- `@bubbles/footer`
- shared sidebar building blocks from `@bubbles/ui`
- `@bubbles/markdown-editor`

### shadcn usage rule

The repo's shadcn components in `@bubbles/ui` are base primitives. They are not
the place for app-specific customization unless the change is clearly global and
reusable across the monorepo.

Rule order:

1. Check whether the repo already has a suitable shared component or shadcn base.
2. If yes, build an app-specific composed component on top of it.
3. If no, check whether the official shadcn registry already provides the needed
   component.
4. If yes, install it via the official shadcn CLI.
5. If the CLI wants to overwrite existing files, choose the non-overwrite path.
6. Do not hand-copy or reimplement shadcn components from docs.

### Layout and visual direction

- mobile-first
- use the shared sidebar shell
- avoid wrapper-heavy layouts
- avoid card-on-card-on-card design
- favor lists, tables, inline action bars, sections, split panels, and sparse
  card usage
- preserve the monorepo's shared look and theming rather than inventing a new
  design system inside `dashboard`

## Vault Editorial Workflows

### Category workflow

- create top-level category
- create subcategory under a top-level category
- optionally create entries directly against a top-level category
- optionally create entries against a subcategory

### Entry workflow

- start from dashboard home or Vault area
- create a new entry with `@bubbles/markdown-editor`
- fill shared metadata
- assign Vault category
- save as draft or publish
- revisit and continue from recent work surfaces

### Read-side behavior

`the-coding-vault` becomes a read-only consumer of shared content tables for
published content and public author data.

## Query and Read Model

The dashboard writes editorial data. Receiving apps read from the same tables
through their app-specific queries.

Examples:

- `vault` queries published `content_items` joined with `vault_entries`,
  `vault_categories`, and `profiles`
- future `portfolio` reads content items filtered by its own module and content
  type
- future `blog` does the same with its own adapter data

This keeps a single source of truth for editorial content.

## Testing Strategy

V1 should include tests for the boundaries that matter most.

### Data and model

- schema tests for shared content relationships
- schema tests for Vault category depth constraints
- query tests for dashboard home and Vault list retrieval
- tests for author/profile joins

### Auth and route protection

- unauthenticated users are redirected from protected routes
- non-allowed identities cannot access dashboard
- owner can access dashboard surfaces

### UI

- dashboard home actions and recent-work rendering
- Vault entry list behavior
- category creation flow
- entry creation and editing flow around `@bubbles/markdown-editor`

## Risks and Guardrails

### Risk: over-generalizing V1

Guardrail:

- build a shared content core, but keep the first real adapter focused on Vault

### Risk: mixing editorial and product-app data

Guardrail:

- separate content-domain tables from app-domain tables even when sharing
  Supabase

### Risk: recreating a second design system

Guardrail:

- enforce `@bubbles/*` reuse and shadcn-CLI-first component sourcing

### Risk: dashboard becomes visually repetitive

Guardrail:

- prefer structural variety over card stacks

## V1 Deliverable Definition

V1 is complete when:

- dashboard login is private and owner-only
- dashboard home shows actionable recent work and quick entry points
- Vault category management supports exactly two levels
- Vault entries can be created and edited in `dashboard`
- Vault public reading uses the shared DB instead of Vault-local admin writes
- author profiles and social links are stored in the new shared model
- the implementation relies on shared monorepo packages and shared UI bases

