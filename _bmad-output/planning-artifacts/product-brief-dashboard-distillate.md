---
title: "Product Brief Distillate: bubbles-verse Dashboard"
type: llm-distillate
source: "product-brief-dashboard.md"
created: "2026-04-05"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: bubbles-verse Dashboard

## Rejected Ideas & Explicit Exclusions

- **No separate backend service** — Server Actions + Supabase client is the chosen approach. Backend can be extracted later if complexity demands it, but NOT now. Do not propose a standalone API server.
- **No custom JWT auth** — Supabase Auth handles this. The Coding Vault's custom JWT implementation (jose, HS256) is the pattern to avoid repeating.
- **No public-facing surfaces** — Every Dashboard route is protected. No public API, no public admin.
- **No TeacherBuddy management in Dashboard** — TeacherBuddy stays localStorage-first for privacy. An optional "logged-in → use DB" mode for TeacherBuddy is future enhancement, not MVP.
- **No blog / knowledge base management** — Explicitly deferred, future scope only.
- **No multi-tenant SaaS** — Guest contributors are a long-term option (via Supabase RLS), not MVP scope.
- **No plugin system or content modeling UI** — This is not a generic CMS. Screens are purpose-built for real content needs.

## Architecture Decisions

- **Stack:** Next.js App Router, Supabase (auth + PostgreSQL + RLS), Vercel deployment
- **Auth:** Supabase Auth — single authenticated user (owner) at MVP. No custom JWT.
- **DB:** Shared Supabase project — Portfolio and Coding Vault content in one database
- **Permissions:** Supabase Row Level Security (RLS) is the chosen mechanism for future guest contributor access scoping — do not build a custom permissions layer
- **Monorepo placement:** `apps/dashboard` — consumes @bubbles/ui, @bubbles/eslint-config, @bubbles/typescript-config like other apps
- **Logic location:** Next.js Server Actions + Supabase client — no separate API layer
- **Security posture:** Server-side auth checks on all routes, no sensitive logic in public client code

## Phase 1 Content Types (Portfolio-focused)

Each requires full CRUD in the Dashboard UI:

1. **Portfolio Projects**
   - Fields (likely): title, description, tags/technologies, links (repo, live), status (active/archived), featured flag, sort order
   - These replace current JSON-based project data in `apps/portfolio`

2. **CV / Resume Entries**
   - Fields (likely): type (work/education), title, organization, date range, description, sort order
   - Replaces whatever currently drives the CV section

3. **Tech Stack**
   - Fields (likely): name, category, proficiency level, icon/logo, sort order
   - Currently likely hardcoded or JSON

4. **Navigation Items**
   - Fields (likely): label, href/target, type (internal section / external app / external link), visible flag, sort order
   - Key insight: DB-driven nav means adding a new link (e.g., when Coding Vault goes live) requires no code change and no redeploy — just a DB entry
   - Constraint: a brand new app still needs to be deployed first; the Dashboard only manages the link data

5. **Social Links** (optional, low priority)
   - Fields (likely): platform, url, visible flag
   - Rarely changes but editable without code

## Phase 2 Content Types (Coding Vault migration)

- **Vault Entries** — full EditorJS-powered CRUD, publish/draft/archive workflow, linked to category and author
- **Categories** — name, icon, order (9 defaults already exist in Coding Vault DB)
- **Prerequisite:** `@bubbles/editor` package must be extracted and stable before Phase 2 begins. This is a hard blocker — do not design Phase 2 screens without the package existing.
- **Migration scope:** Coding Vault admin is removed from `apps/the-coding-vault` entirely. The Vault app becomes read-only public front-end.

## Content Translation Context (Portfolio-specific)

- Owner writes content in German
- English version is generated dynamically via translation (likely AI-powered)
- Current i18n model (JSON files with DE/EN strings) is being replaced
- Translation workflow is TBD — could be auto-translate on save, on-demand, or via a Dashboard "translate" action
- This is a significant content strategy change that affects DB schema design (need both DE + EN fields, or a translation table)

## TeacherBuddy Optional DB Mode (future, not Dashboard MVP)

- If owner is logged in → sync data to Supabase DB
- If not logged in → localStorage as today
- Privacy rationale: local storage for anonymous users means no data leaves the browser; owner's data can be persisted across devices
- Implementation: would require a Supabase auth check in TeacherBuddy app, not Dashboard-specific logic
- Anyone who forks and wants DB for their own users → that's on them to implement

## Coding Vault Current Admin (to be migrated away)

- Currently co-located in `apps/the-coding-vault`
- JWT auth: HS256, 30-day expiry, httpOnly secure sameSite:lax cookie
- Role enum: SUPERADMIN / MODERATOR / GUEST
- Auth guards: authGuard() redirect, multiRoleGuard(roles), getCurrentUser()
- This entire auth layer gets replaced by Supabase Auth in the Dashboard

## Known Risks & Open Questions

- **DB schema for i18n:** How are DE + EN content stored? Separate columns (title_de, title_en), separate rows with locale flag, or a translations table? Decision needed before schema is built.
- **Supabase free tier:** 500MB DB, 1GB file storage, 50,000 MAU — more than sufficient for personal use. Worth documenting as a known limit.
- **Navigation "no redeploy" claim:** Only valid if the Portfolio app fetches nav items from DB at runtime (SSR or ISR). If nav is statically generated, a rebuild is still needed. Architecture must account for this — likely ISR with short revalidation period or full server-rendering for nav.
- **@bubbles/editor package timeline:** Phase 2 is fully blocked until this exists. The EditorJS integration was finalized in a separate project outside the monorepo and needs to be ported/packaged. Scope is significant: 14 block types, custom MDX serializer, Cloudinary image handling.
- **Guest contributor role system:** RLS policy design needs thought when this becomes relevant. Supabase RLS can scope by user role, but the role assignment flow (how does a guest get access?) is undefined.
- **Dashboard deployment security:** Dashboard on Vercel means the login page is public. Supabase Auth handles brute-force protection, but consider whether additional IP restrictions or Vercel password protection add meaningful security or just friction.

## Scope Signals From User

- **Priority order:** Phase 1 (Portfolio) first, Phase 2 (Coding Vault) second
- **@bubbles/editor** should be built as a standalone package before Dashboard Phase 2 begins — this was stated as a prerequisite the user wants to address first
- **"Everything should work immediately"** — user acknowledged this is aspirational; phased delivery is accepted
- **Backend architecture:** User was genuinely undecided between Next.js API routes, Supabase direct, or separate backend. Settled on Server Actions + Supabase after discussion. This is a resolved decision, not an open one.
- **Private backend repo:** User considered keeping backend logic in a private repo for security. Resolved: not necessary with Server Actions (logic not exposed in public client bundle) + Supabase (credentials in env vars).
- **Blog / knowledge base:** Mentioned as "future music" in context of a new app idea. Not a Dashboard concern now.
