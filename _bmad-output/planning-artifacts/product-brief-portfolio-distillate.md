---
title: "Product Brief Distillate: Portfolio"
type: llm-distillate
source: "product-brief-portfolio.md"
created: "2026-04-05"
purpose: "Token-efficient context for downstream PRD/design work"
---

# Product Brief Distillate: Portfolio

## Rejected Ideas & Explicit Exclusions

- **No PDF CV download** — personal data (address etc.) should not be freely downloadable. CV content is readable on-site only. A "generate PDF for personal use" feature is a future Dashboard tool, not Portfolio scope.
- **No dedicated project detail pages (initially)** — projects link externally (repo + live site). Internal detail pages are a future enhancement.
- **No blog** — potential future addition, explicitly out of scope for this redesign.
- **No "hire me" / client acquisition CTAs** — portfolio is a presence, not a sales funnel. No service pages, no pricing, no case studies framed as sales material.
- **No changes to server-first architecture** — technical foundation stays. Design and content layer only.
- **No parallel JSON file maintenance** — current DE/EN i18n model via JSON files is being replaced entirely. Do not propose solutions that require maintaining two sets of files.
- **No company website crossover** — portfolio is personal brand, distinct from the co-founded programming education company's public website. Do not blend the two.

## Current Architecture (to preserve)

- Next.js App Router, server-first, minimal client state
- i18n: 2 locales (DE/EN) via @formatjs/intl-localematcher, generateStaticParams for both, middleware redirect on Accept-Language
- Contact form: Resend SMTP (owner notification + auto-reply), Cloudflare Turnstile CAPTCHA with server-side validation
- CSP headers: script/frame restrictions, HSTS 2-year preload, X-Frame-Options SAMEORIGIN
- Dynamic OG image generation (/api/og, 1200×630)
- next-themes for dark/light toggle
- Currently: react-pdf for CV viewer — to be replaced (PDF replaced by on-site content)
- Currently: JSON files for i18n content — to be replaced by DB + dynamic translation

## Visual Direction

- **Color palette:** Catppuccin — already established in the bubbles-verse ecosystem via @bubbles/ui. Specific flavor (Mocha/Macchiato/Latte) to be decided during design phase.
- **Card usage:** Deliberate reduction. Cards are okay but overused in current design. Use only where they add clarity, not as default layout unit.
- **Aesthetic:** Modern, fresh, confident. Not corporate, not flashy, not minimalist-for-minimalism's-sake.
- **No specific visual reference exists yet** — design exploration needed. Owner has no fixed reference portfolio in mind.
- **Mobile-first** — designed for mobile before desktop.
- **Dark/light mode** — supported via next-themes (already in place).

## Content Strategy

### DB-backed (via bubbles-verse Dashboard)
- Portfolio projects: title, description, tags, links (repo, live), status, featured, sort order
- Tech stack: name, category, proficiency, icon, sort order
- CV entries: type (work/education), title, org, dates, description, sort order
- Navigation items: label, href/target, type, visible flag, sort order
- Social links (optional): platform, url, visible flag

### Code-managed (stays static)
- "Über mich" section — rarely changes, not worth DB overhead

### i18n approach
- Owner writes content in **German**
- English version auto-translated — mechanism TBD (AI-assisted on save in Dashboard, on-demand action, or at request time)
- This is an open architectural decision affecting both Dashboard schema design and Portfolio rendering
- Key constraint: translation must be maintainable without editing files or pushing code

## Dynamic Navigation as Ecosystem Hub

- Navigation is DB-driven via Dashboard — owner decides what appears without code changes
- Standard sections (Über mich, Stack, Projekte, Kontakt, CV) always present
- **Select projects and live apps** (e.g., Coding Vault, TeacherBuddy, future apps) can be pinned to nav
- Goal: someone finding the portfolio can reach "important" projects immediately — no scrolling through project lists
- New apps appear in nav when owner marks them ready in Dashboard
- Technical note: nav must be fetched at runtime (SSR or ISR with short revalidation) to avoid requiring a redeploy for nav changes

## Owner Context (informs tone & positioning)

- Co-founded a programming education company (Bildungsinstitut, teaching programming)
- Company is getting AZAV carrier accreditation — receives participants from Agentur für Arbeit
- **Not actively job hunting** — self-employed, doesn't want to send CVs anymore
- **Not actively selling freelance services** — company has its own public website for that
- Positioning: "the work speaks for itself" — passive discovery, not active outreach
- Contact form is available for anyone with a reason to reach out, not a sales funnel
- Portfolio should reflect current reality: developer who ships products and runs a company, not a job seeker

## Sections Detail

| Section | Content Source | Notes |
|---------|---------------|-------|
| Über mich | Code (static) | Rarely changes, stays in code |
| Stack | DB via Dashboard | Categories + proficiency levels |
| Projekte | DB via Dashboard | External links (repo + live), select ones in nav |
| Navigation | DB via Dashboard | Ecosystem hub — links to other apps |
| Kontakt | Static form | Resend + Turnstile, no changes needed |
| CV | DB via Dashboard | On-site only, no download |

## Dependencies & Sequencing

- **Dashboard Phase 1 is a prerequisite for full DB migration** — Portfolio redesign can begin visually with code-managed content, migrate to DB when Dashboard is ready
- **Catppuccin tokens in @bubbles/ui** — color setup is a monorepo-level task, not Portfolio-specific. Must happen once and propagate to all apps.
- **@bubbles/editor NOT needed for Portfolio** — Portfolio has no rich text editing requirements at this stage. No EditorJS dependency.

## Open Questions

- **Catppuccin flavor:** Mocha (darkest), Macchiato (medium dark), Frappé (medium), or Latte (light)? Affects how dark/light mode tokens are set up in @bubbles/ui.
- **i18n translation mechanism:** API call on Dashboard save? On-demand "translate" action? At request time via middleware? Affects schema design and caching strategy.
- **Nav rendering strategy:** SSR vs. ISR with what revalidation period? Needs decision to validate "no redeploy for nav changes" claim.
- **CV on-site design:** How is the CV presented? Timeline view? Table? Accordion per section? No reference exists yet.
- **Project cards alternative:** If cards are reduced, what replaces them? List view? Editorial grid? Needs design exploration.

## Scope Signals

- **Visual redesign is the primary motivation** — content strategy improvements (DB, i18n) are valuable but the driver is "this needs to look good"
- **Keep structure:** Same sections, not adding many new ones. Execution quality over scope expansion.
- **Contact form stays** — no changes to functionality, just design
- **Tests come when actively working on the app** — not a blocking concern for the redesign kickoff
