---
title: "Product Brief: Portfolio"
status: "complete"
created: "2026-04-05"
updated: "2026-04-05"
inputs:
  - product-brief-bubbles-verse.md
  - product-brief-dashboard.md
  - docs/architecture-portfolio.md
  - docs/component-inventory-portfolio.md
---

# Product Brief: Portfolio

## Executive Summary

The Portfolio is the personal web presence of a developer and educator who co-founded a programming education company. It is the first thing people find when they search his name — and it should reflect that: confident, considered, and letting the work speak for itself. No pitches, no "hire me" energy. Just a clear picture of who he is, what he builds, and how to reach him if there's a reason to.

The current portfolio exists because something had to — built quickly with AI assistance, never properly designed. It does the job minimally. The redesign is a chance to build something genuinely representative: a modern, visually distinctive web presence built on Catppuccin colors, a lighter card-free aesthetic, and content managed through the bubbles-verse Dashboard rather than scattered JSON files.

## The Problem

The portfolio was built in days as a placeholder. It shows — the design is basic, the card-heavy layout feels dated, and updating any content means editing JSON files and pushing code. The CV is a downloadable PDF that includes a home address, which is uncomfortable to have freely accessible. The i18n model (maintaining parallel DE/EN JSON files) creates double the maintenance work for every content change.

More fundamentally, the portfolio doesn't reflect who the owner actually is right now: a developer who has shipped multiple real products, co-founded a company, and is no longer in the business of sending out CVs. It presents him as a job seeker. He isn't one.

## The Solution

A complete redesign — same structural sections, significantly better design and content strategy.

**Visual direction:**
- Catppuccin color palette (Mocha or Macchiato — already established in the ecosystem)
- Deliberately less card-heavy — cards used where they add clarity, not as a default layout unit
- Modern, fresh, confident — not corporate, not flashy, not minimalist-for-minimalism's-sake
- Mobile-first, dark/light mode support (already via next-themes)
- Design exploration needed — no fixed reference, visual direction to be established during design phase

**Content strategy:**
- All dynamic content managed via bubbles-verse Dashboard, stored in Supabase DB
- Owner writes in German, content auto-translated to English (translation approach TBD — likely AI-assisted on save or on-demand via Dashboard action)
- "Über mich" section stays in code — rarely changes, doesn't need DB management
- CV content visible on-site, no PDF download — content is readable there, personal data stays off easily-scraped downloads

**Sections (unchanged structure, improved execution):**
- **Über mich** — who he is, background, current focus (code-managed)
- **Stack** — technologies, managed via Dashboard
- **Projekte** — portfolio projects with links, managed via Dashboard
- **Kontakt** — contact form (Resend + Cloudflare Turnstile), stays as-is
- **Curriculum Vitae** — work history and education readable on-site; no download button

**Dynamic navigation as ecosystem hub:**
The portfolio navigation is the entry point to the entire bubbles-verse ecosystem. Beyond the standard page sections, select projects and live apps (e.g., The Coding Vault, TeacherBuddy) can be pinned directly into the nav — managed via the Dashboard, no code change required. Someone who finds the portfolio can reach the "important" projects immediately without scrolling through everything. As new apps go live, they appear in the nav when the owner decides they're ready. Everything stands on its own but is discoverable from one place.

## What Makes This Different

This is not a template, not a theme, not a "developer portfolio starter." It is a personal web presence shaped by one person's actual situation: a developer who builds things, runs a company, and isn't looking for a job. The design uses the Catppuccin palette — an aesthetic choice already embedded in the ecosystem — giving it a distinct, recognizable visual identity rather than the generic dark/light toggle most dev portfolios default to.

Technically: fully server-rendered, DB-backed, i18n-enabled (DE/EN), part of a shared design ecosystem. Content changes require no code, no deploy.

## Who This Serves

**Primary — the people who find him:** Potential collaborators, curious developers, anyone who Googled his name. The goal is a strong first impression that conveys competence and taste. The contact form is there for anyone with a reason to reach out.

**Secondary — the owner:** Content updates should take minutes, not an afternoon. The portfolio should be a source of quiet pride, not an embarrassing placeholder to apologize for.

## Success Criteria

| Metric | Definition of Done |
|--------|-------------------|
| Design is intentional | The portfolio looks like it was designed, not assembled — Catppuccin palette applied, card usage reduced and purposeful |
| Content is DB-backed | Projects, stack, CV, and nav items are managed via Dashboard — no JSON file edits |
| i18n is maintainable | Owner writes in German; English version is generated without maintaining a parallel JSON file |
| CV is on-site only | No downloadable PDF of personal data; CV content is readable on the page |
| Mobile-first | Designed and tested on mobile before desktop |
| Loads fast | Server-rendered, no unnecessary client JS |

## Scope

### In Scope

- **Full visual redesign** — layout, typography, color application (Catppuccin), component design
- **DB migration** — all dynamic content (projects, stack, CV entries, nav links) moved from JSON to Supabase via Dashboard
- **i18n overhaul** — replace parallel JSON file model with DB-stored German content + dynamic English translation
- **CV page redesign** — show content on-site, remove PDF download
- **Navigation DB-backing** — nav items (including links to other bubbles-verse apps) pulled from DB
- **Keep contact form** — Resend + Cloudflare Turnstile, no changes to functionality
- **Tests** — added when actively working on the app

### Out of Scope

- **No PDF CV generation** — viewing on-site is sufficient. A "generate PDF for personal use" tool is a future Dashboard feature, not Portfolio scope.
- **No dedicated project detail pages (initially)** — projects link externally (repo, live site). Dedicated pages are a future enhancement if needed.
- **No blog** — potential future addition, not this redesign's scope.
- **No active client acquisition** — the portfolio is a presence, not a sales funnel. No case studies, no "hire me" CTAs, no pricing or service pages.
- **No changes to server-first architecture** — the technical foundation stays; only the design and content layer changes.

## Known Constraints

- **Dashboard dependency:** Dynamic content requires the bubbles-verse Dashboard (Phase 1) to be built first, or at least in parallel. Portfolio redesign can begin with static/code-managed content and migrate to DB when Dashboard is ready.
- **Catppuccin + Tailwind v4:** Color token setup in @bubbles/ui using Catppuccin palette needs to be done once and shared across all apps — not Portfolio-specific work but a prerequisite for consistent color application.
- **i18n translation approach:** The mechanism for auto-translating German → English content is TBD. This is an architectural decision (API call on save? on request? cached?) that affects both Dashboard and Portfolio.
- **AZAV / company context:** The owner co-founded a programming education company. The portfolio is his personal presence — distinct from the company's public website. The portfolio should not blur into a company page.

## Vision

The portfolio becomes something the owner is genuinely proud to share — not because he has to, but because it represents him well. It's the hub of his personal web presence: a place where his work is visible, his identity is clear, and reaching him is easy. As the bubbles-verse ecosystem grows, the portfolio's navigation evolves with it — new apps appear, new projects are added — all without touching code. The work updates itself.
