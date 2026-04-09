---
title: "Product Brief Distillate: bubbles-verse"
type: llm-distillate
source: "product-brief-bubbles-verse.md"
created: "2026-04-05"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: bubbles-verse

## Rejected Ideas & Explicit Exclusions

- **No SaaS / monetization** — any revenue-generating product lives in a separate repo, not in bubbles-verse. This is a firm boundary, not a "maybe later."
- **No public template / starter kit** — the repo is public and forkable, but not designed or documented for external adoption. No community-building, no support.
- **No cross-app runtime communication** — apps share build-time packages only. No shared backends, no inter-app APIs. This is an architectural guarantee, not a temporary limitation.
- **No mobile apps** — web-only for the foreseeable future.
- **No premature package extraction** — the explicit rule is: extract only when duplication is proven across 2+ apps with a stable API. Do not propose speculative shared packages.

## Technical Context Per App

### Portfolio (`apps/portfolio`)
- Server-first architecture, minimal client state
- i18n: DE/EN via @formatjs/intl-localematcher, generateStaticParams for both locales, middleware redirect on Accept-Language
- Contact: 2 emails per submission (owner notification + auto-reply) via Resend SMTP
- CAPTCHA: Cloudflare Turnstile with server-side validation
- CV: react-pdf viewer
- CSP headers: script/frame restrictions for Turnstile, HSTS 2-year preload, X-Frame-Options SAMEORIGIN
- Dynamic OG image generation (/api/og, 1200x630)
- **Status:** Live but design severely outdated — full redesign planned

### TeacherBuddy (`apps/teacherbuddy`)
- Client-side app, localStorage persistence, no backend
- State: 65+ properties split across persisted (classes/students/quizzes/projects/breakout) + domain (generator/quiz-play session) + UI (editor state, hydration gate)
- Reducer: 26 action types, cascading deletes, dedup by normalized name, sorted quiz index, active class scoping
- Hooks: useTimer (countdown + localStorage), useStudentGenerator, useCopyToClipboard, useTheme (next-themes)
- Storage keys: prefixed `teacherbuddy:*`, individual quiz storage per ID, timer + favorites persisted, privacy notice flag
- Tests: 10 test files (Vitest 4.0 + React Testing Library) covering state, hooks, components
- **Status:** Functionally complete, design okay-ish, live

### The Coding Vault (`apps/the-coding-vault`)
- Full-stack: PostgreSQL (Drizzle ORM 0.45), JWT auth (jose, HS256, 30-day expiry, httpOnly cookie)
- 3 DB tables: users (role enum: SUPERADMIN/MODERATOR/GUEST, authorInfo JSONB), categories, vaultEntries (cascade delete)
- Auth guards: authGuard() redirect, multiRoleGuard(roles), getCurrentUser()
- Editor.js: 14 block types (Header, List, Code, Quote, Alert, Delimiter, Toggle, Table, Embed, Image, Inline Code, Strikethrough, Annotation, Inline Hotkey)
- MDX custom components: VaultCodeBlock (Shiki one-dark-pro), VaultAlerts, VaultDetailsToggle, VaultEmbed, VaultImage (Cloudinary + blur), VaultLink, VaultChecklist
- 9 default categories: Git, GitHub, Node.js, HTML, CSS, JavaScript, React, Backend, Database (with icon enums and order field)
- Editor.js integration was finalized in a separate project outside this monorepo — still needs to be integrated here
- **Status:** ~70% complete, not yet live

## Shared Package Details

### @bubbles/ui
- 26 shadcn components on Base UI React (not Radix) — Button, Card, Sidebar, Sheet, Dialog, Form, Input, Select, Tabs, Tooltip, Badge, Skeleton, Separator, NavigationMenu, DropdownMenu, AlertDialog, Avatar, and more
- Styled with Tailwind v4 + CVA (type-safe variant composition)
- Subpath exports: `@bubbles/ui/shadcn/*`, `@bubbles/ui/hooks/*`, `@bubbles/ui/lib/utils`, `@bubbles/ui/globals.css`
- All apps transpile via next.config transpilePackages
- **shadcn is copy-model** — upstream updates require manual reconciliation across 26+ components

### @bubbles/eslint-config
- Three presets: base (shared TS + Turbo + Prettier), next-js (for apps), react-internal (for packages)

### @bubbles/typescript-config
- Three profiles: base.json (strict), nextjs.json (apps), react-library.json (packages)

## Infrastructure & Tooling Context

- **Runtime:** Node >=22 (pinned 24.14.1), Bun 1.3.11
- **Build:** Turborepo 2.9.3, dependency-aware caching, .next/cache excluded from outputs
- **turbo.json:** declares 19 env vars for build/dev hash (RESEND_API_KEY, DATABASE_URL, JWT_SECRET, Cloudinary, Discord, VERCEL_*, etc.)
- **Prettier:** single quotes, trailing commas (ES5), 2-space indent, LF; plugins for Tailwind class sort + import sort
- **React Compiler:** enabled by default, togglable via NEXT_DISABLE_REACT_COMPILER=1
- **All apps:** next-themes for light/dark toggle, own theme-provider.tsx wrapper, /api/og for OG images
- **External services:** Resend (email), Cloudflare Turnstile (CAPTCHA), Cloudinary (media), Discord (error reporting)
- **No CI/CD configured yet** — no .github/workflows, no Docker
- **Deployment:** Vercel-ready but not yet deployed

## Competitive Landscape

- **create-turbo (Vercel)** — official Turborepo scaffold, generic template, pnpm-first, not tailored to personal ecosystems
- **t3-oss/create-t3-turbo** — community monorepo starter (Next.js + tRPC + Drizzle), opinionated toward single SaaS app, heavy boilerplate
- **leerob/site** — Lee Robinson's personal site, single app, no monorepo pattern, can't share logic
- **shadcn/ui + monorepo** — common pattern but no official scaffold; Base UI variant is very new with few templates
- **antfu/vitesse** — personal monorepo ecosystem (100+ packages), Vite-based, pnpm, extreme complexity
- **Nx-based setups** — heavier tooling overhead than Turborepo for personal projects, enterprise feel

## Review Findings Worth Preserving

### Skeptic Concerns (validated, should inform PRD)
- **Package versioning strategy** needed — even informal semver for @bubbles/ui to prevent silent breaking changes during refactors
- **"Under a day" for new apps** requires a scaffold/template/checklist to be real, not just aspirational
- **Stack churn risk** — major version upgrades must be applied across all apps simultaneously or shared packages fracture
- **Scope ambition** — redesigning Portfolio + finishing Coding Vault + infrastructure work in 6-12 months is aggressive for a solo maintainer

### Opportunity Signals (could inform future scope)
- **Design token pipeline** — Tailwind v4 enables single source of truth for tokens, but without it design coherence still requires discipline
- **Visual regression testing** — @bubbles/ui refactors can silently break visual consistency; Chromatic or Playwright snapshots would catch this
- **Shared observability** — a lightweight shared error tracking config (e.g., Sentry package) would make runtime coherence match build-time coherence
- **ADRs (Architecture Decision Records)** — capturing decisions inline with code turns the repo into a consultable record
- **Reference implementation positioning** — the Next.js 16 + React 19 + Tailwind v4 + shadcn/Base UI combo in a monorepo is rare enough to attract organic attention

## Open Questions

- **New app idea:** Owner has a new app idea but hasn't specified it yet — should be added to the brief when ready
- **Package versioning:** No policy defined yet for how shared package changes are versioned/communicated across apps
- **App scaffolding:** No template or generator exists yet to validate the "new app in under a day" claim
- **Tailwind v4 cross-package CSS:** Known friction point in the ecosystem — needs investigation for the specific @bubbles/ui setup
- **Editor.js integration path:** The finalized Editor.js work lives in a separate project — migration strategy into the monorepo is undefined
- **Testing strategy:** Tests are coming incrementally per app when actively worked on, but no shared testing utilities or patterns are defined yet

## Scope Signals From User

- **Immediate priority:** Add the new small app (idea exists but unspecified), then redesign Portfolio
- **Pattern:** Work on apps → notice reusable patterns → extract to packages. Organic, not planned.
- **Tests:** Will be added per app when actively working on that app, not as a separate testing initiative
- **Deployment:** All apps to Vercel — this is the baseline "it works" milestone
- **No timeline pressure:** Personal project, no external deadlines, quality over speed
