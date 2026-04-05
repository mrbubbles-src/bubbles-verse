# Source Tree Analysis

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Repository Structure

```
bubbles-verse/                          # Monorepo root (Bun + Turborepo)
├── apps/                               # 3 Next.js 16 applications
│   ├── portfolio/                      # Developer portfolio site (i18n, Resend, Turnstile)
│   │   ├── app/
│   │   │   ├── [lang]/                 # i18n dynamic route segment
│   │   │   │   ├── layout.tsx          # Root layout with lang param
│   │   │   │   ├── page.tsx            # Homepage
│   │   │   │   ├── loading.tsx         # Suspense fallback
│   │   │   │   ├── not-found.tsx       # 404 page
│   │   │   │   ├── cv/page.tsx         # Curriculum vitae
│   │   │   │   ├── datenschutz/page.tsx # Privacy policy (DE)
│   │   │   │   ├── impressum/page.tsx  # Legal notice (DE)
│   │   │   │   └── [...not-found]/page.tsx # Catch-all 404
│   │   │   ├── actions/
│   │   │   │   └── send-mails.ts       # Server action: email via Resend
│   │   │   ├── api/
│   │   │   │   └── og/route.tsx        # Dynamic OG image generation
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── about/              # About section (about, contact-about)
│   │   │   │   ├── contact/            # Contact form (Turnstile CAPTCHA)
│   │   │   │   ├── curriculum-vitae/   # CV viewer (react-pdf, skeleton)
│   │   │   │   ├── footer/             # Site footer
│   │   │   │   ├── navbar/             # Navigation bar
│   │   │   │   ├── projects/           # Project cards + images
│   │   │   │   └── stack/              # Technology stack grid
│   │   │   ├── ui/                     # Locale switcher, theme toggle
│   │   │   ├── utility/                # Scroll-to-top
│   │   │   └── modailty-hack.tsx       # Modal z-index workaround
│   │   ├── context/
│   │   │   └── theme-provider.tsx      # next-themes provider
│   │   ├── data/
│   │   │   ├── email_replies.ts        # Email template data
│   │   │   ├── projects.ts             # Project portfolio data
│   │   │   └── stack.ts                # Technology stack data
│   │   ├── dictionaries/              # i18n translation files
│   │   ├── lib/
│   │   │   └── utils.ts                # Utility functions
│   │   ├── proxy.ts                    # i18n middleware/detection
│   │   ├── i18n-config.ts              # Locale configuration
│   │   ├── get-digtionary.ts           # Dictionary loader
│   │   ├── next.config.ts              # CSP headers, caching, Turbopack
│   │   ├── eslint.config.mjs
│   │   ├── postcss.config.mjs
│   │   └── next-sitemap.config.js      # Sitemap generation
│   │
│   ├── teacherbuddy/                   # Classroom tools app (localStorage, Vitest)
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── loading.tsx             # Global loading
│   │   │   ├── error.tsx               # Error boundary
│   │   │   ├── not-found.tsx           # 404
│   │   │   ├── api/og/route.tsx        # Dynamic OG image
│   │   │   ├── breakout-rooms/page.tsx # Breakout room generator
│   │   │   ├── generator/page.tsx      # Student name generator
│   │   │   ├── play/page.tsx           # Quiz play mode
│   │   │   ├── projects/page.tsx       # Project management
│   │   │   ├── quizzes/page.tsx        # Quiz editor
│   │   │   ├── students/page.tsx       # Student management
│   │   │   ├── robots.ts              # robots.txt generation
│   │   │   └── sitemap.ts             # Sitemap generation
│   │   ├── components/
│   │   │   ├── app-shell.tsx           # Main app wrapper
│   │   │   ├── app-sidebar.tsx         # Sidebar container
│   │   │   ├── header.tsx              # Page header
│   │   │   ├── footer.tsx              # Page footer
│   │   │   ├── privacy-notice.tsx      # Privacy disclaimer
│   │   │   ├── student-name-generator.tsx # Random name picker
│   │   │   ├── breakout/              # Breakout room components
│   │   │   ├── classes/               # Class selector
│   │   │   ├── dashboard/             # Dashboard cards
│   │   │   ├── generator/             # Generator card
│   │   │   ├── loading/               # Skeleton loaders (5 files)
│   │   │   ├── navigation/            # Sidebar navigation
│   │   │   ├── play/                  # Quiz play + timer cards
│   │   │   ├── projects/              # Project list builder/viewer
│   │   │   ├── quizzes/               # Quiz editor + selector (with tests)
│   │   │   ├── students/              # Student form + table (with tests)
│   │   │   ├── ui/                    # Badge/button variants, select tests
│   │   │   └── utility/               # Page info dialog, theme toggle
│   │   ├── context/
│   │   │   ├── app-store.tsx           # ★ Central state: useReducer + localStorage
│   │   │   └── theme-provider.tsx      # next-themes provider
│   │   ├── hooks/
│   │   │   ├── use-copy-to-clipboard.ts
│   │   │   ├── use-student-generator.ts
│   │   │   ├── use-theme.ts
│   │   │   └── use-timer.ts
│   │   ├── lib/
│   │   │   ├── models.ts              # ★ Data models/types
│   │   │   ├── storage.ts             # localStorage abstraction
│   │   │   ├── classes.ts             # Class management utilities
│   │   │   ├── students.ts            # Student management utilities
│   │   │   ├── type-guards.ts         # Runtime type checking
│   │   │   ├── page-info.tsx          # Page info content
│   │   │   ├── page-meta.ts           # Page metadata helpers
│   │   │   ├── site-url.ts            # URL utilities
│   │   │   ├── view-transition.ts     # View transition API
│   │   │   └── utils.ts               # General utilities
│   │   ├── __tests__/
│   │   │   └── test-utils.tsx          # Test setup/providers
│   │   ├── vitest.config.ts
│   │   ├── vitest.setup.ts
│   │   ├── eslint.config.mjs
│   │   └── postcss.config.mjs
│   │
│   └── the-coding-vault/              # CMS/knowledge base (Drizzle, PostgreSQL, MDX, JWT)
│       ├── app/
│       │   ├── (admin)/                # Route group: admin area
│       │   │   ├── layout.tsx          # Admin layout
│       │   │   ├── admin/login/page.tsx
│       │   │   └── admin/dashboard/
│       │   │       ├── page.tsx         # Admin dashboard
│       │   │       ├── entries/         # CRUD: all, published, unpublished, submit, delete
│       │   │       └── users/           # CRUD: all, create, delete
│       │   ├── (vault)/                # Route group: public vault
│       │   │   ├── layout.tsx          # Vault layout with sidebar
│       │   │   ├── page.tsx            # Vault homepage
│       │   │   ├── loading.tsx
│       │   │   ├── error.tsx
│       │   │   ├── not-found.tsx
│       │   │   └── vault/
│       │   │       ├── page.tsx         # Entry listing
│       │   │       └── [slug]/page.tsx  # Individual entry (MDX render)
│       │   ├── api/
│       │   │   ├── auth/               # ★ Auth API: login, logout, register, user
│       │   │   ├── error/report-error/route.ts # Error reporting
│       │   │   ├── og/route.tsx        # Dynamic OG image
│       │   │   └── vault/              # ★ Vault API: categories, image-upload, save-entry
│       │   └── globals.css
│       ├── components/
│       │   ├── layout/
│       │   │   ├── admin/
│       │   │   │   ├── editor/         # Editor.js integration (form, converter, submit)
│       │   │   │   └── sidebar/        # Admin sidebar
│       │   │   ├── auth/               # Login form
│       │   │   ├── general/            # Navbar, footer
│       │   │   └── vault/
│       │   │       ├── sidebar/        # Vault sidebar (trigger, links, footer)
│       │   │       ├── vault-author/   # Author card, avatar, socials
│       │   │       └── vault-components/ # ★ MDX renderers: alerts, checklist, code, image, embed, toggle, link
│       │   └── ui/
│       │       ├── loading/            # Spinner, entry skeleton
│       │       ├── theme-toggle.tsx
│       │       └── user-logout.tsx
│       ├── context/
│       │   └── theme-provider.tsx
│       ├── drizzle/
│       │   ├── db/
│       │   │   ├── schema.ts           # ★ DB schema: users, entries, categories, etc.
│       │   │   ├── relations.ts        # Drizzle relation definitions
│       │   │   ├── index.ts            # DB client export
│       │   │   └── seed.ts             # Development seed data
│       │   └── migrations/             # SQL migration files
│       ├── hooks/
│       │   └── use-mobile.ts
│       ├── lib/
│       │   ├── auth.ts                 # ★ JWT auth: sign, verify, session management
│       │   ├── cache.ts                # Caching utilities
│       │   ├── cookies.ts              # Cookie management
│       │   ├── db.ts                   # Drizzle client initialization
│       │   ├── error.ts                # Error handling utilities
│       │   ├── icon-map.ts             # Icon mapping for categories
│       │   ├── roles.ts                # Role definitions and permissions
│       │   ├── runtime-fallbacks.ts    # No-DB fallback mode
│       │   └── utils.ts                # General utilities
│       ├── types/
│       │   ├── types.ts                # App-specific types
│       │   └── editorjs-plugins.d.ts   # Editor.js type declarations
│       ├── mdx-components.tsx          # ★ MDX component overrides
│       ├── drizzle.config.ts           # Drizzle Kit configuration
│       ├── proxy.ts                    # Request proxy
│       ├── eslint.config.mjs
│       └── postcss.config.mjs
│
├── packages/                           # 3 shared packages
│   ├── ui/                             # @bubbles/ui — Design system
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── shadcn/            # 25 shadcn components
│   │   │   │       ├── alert-dialog.tsx
│   │   │   │       ├── avatar.tsx
│   │   │   │       ├── badge.tsx
│   │   │   │       ├── button.tsx
│   │   │   │       ├── card.tsx
│   │   │   │       ├── checkbox.tsx
│   │   │   │       ├── collapsible.tsx
│   │   │   │       ├── combobox.tsx
│   │   │   │       ├── dialog.tsx
│   │   │   │       ├── dropdown-menu.tsx
│   │   │   │       ├── field.tsx
│   │   │   │       ├── form.tsx
│   │   │   │       ├── input-group.tsx
│   │   │   │       ├── input.tsx
│   │   │   │       ├── label.tsx
│   │   │   │       ├── navigation-menu.tsx
│   │   │   │       ├── popover.tsx
│   │   │   │       ├── select.tsx
│   │   │   │       ├── separator.tsx
│   │   │   │       ├── sheet.tsx
│   │   │   │       ├── sidebar.tsx
│   │   │   │       ├── skeleton.tsx
│   │   │   │       ├── sonner.tsx
│   │   │   │       ├── tabs.tsx
│   │   │   │       ├── textarea.tsx
│   │   │   │       └── tooltip.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-mobile.ts       # Mobile detection hook
│   │   │   ├── lib/
│   │   │   │   ├── utils.ts            # cn() classname utility
│   │   │   │   ├── hugeicons.ts        # Icon re-exports
│   │   │   │   └── sonner.ts           # Toast configuration
│   │   │   └── styles/
│   │   │       └── globals.css         # ★ Tailwind v4 global styles + CSS variables
│   │   ├── postcss.config.mjs
│   │   └── eslint.config.js
│   │
│   ├── eslint-config/                  # @bubbles/eslint-config
│   │   ├── base.js                     # Base ESLint flat config
│   │   ├── next.js                     # Next.js-specific rules
│   │   ├── react-internal.js           # React library rules
│   │   └── documentation/
│   │       └── consuming.md
│   │
│   └── typescript-config/              # @bubbles/typescript-config
│       ├── base.json                   # Shared base tsconfig
│       ├── nextjs.json                 # Next.js profile
│       ├── react-library.json          # React library profile
│       └── documentation/
│           └── profiles.md
│
├── documentation/                      # Monorepo-wide documentation
│   ├── README.md                       # Documentation index
│   ├── architecture.md                 # Workspace/dependency architecture
│   ├── tooling.md                      # Bun, Turbo, Prettier, ESLint, TS
│   ├── onboarding.md                   # First-time setup
│   └── troubleshooting.md              # Common issues
│
├── package.json                        # Root: workspaces, scripts, devDeps
├── turbo.json                          # Task orchestration + env allowlist
├── tsconfig.json                       # Root: extends @bubbles/typescript-config
├── .prettierrc                         # Prettier: Tailwind + import sort plugins
├── .eslintrc.js                        # Root ESLint
├── .nvmrc                              # Node 24.14.1
├── bun.lock                            # Bun lockfile
├── README.md                           # Monorepo overview
├── CHANGELOG.md                        # Cross-cutting changes
├── AGENTS.md                           # AI/human coding standards
└── CLAUDE.md                           # Claude-specific instructions
```

## File Statistics

| Part | .ts/.tsx Files | Test Files | Config Files |
|------|---------------|------------|--------------|
| portfolio | 22 | 0 | 6 |
| teacherbuddy | 40 | 10 | 5 |
| the-coding-vault | 48 | 0 | 5 |
| @bubbles/ui | 29 | 0 | 3 |
| @bubbles/eslint-config | 3 | 0 | 0 |
| @bubbles/typescript-config | 0 | 0 | 3 |
| **Total** | **142** | **10** | **22** |

## Critical Folders

| Folder | Purpose | Part |
|--------|---------|------|
| `apps/portfolio/app/[lang]/` | i18n-routed pages | portfolio |
| `apps/portfolio/app/actions/` | Server actions (email) | portfolio |
| `apps/teacherbuddy/context/` | Central state management | teacherbuddy |
| `apps/teacherbuddy/lib/models.ts` | Data model definitions | teacherbuddy |
| `apps/teacherbuddy/lib/storage.ts` | localStorage abstraction | teacherbuddy |
| `apps/the-coding-vault/app/api/` | REST API endpoints | the-coding-vault |
| `apps/the-coding-vault/drizzle/db/` | Database schema + relations | the-coding-vault |
| `apps/the-coding-vault/lib/auth.ts` | JWT authentication | the-coding-vault |
| `apps/the-coding-vault/mdx-components.tsx` | MDX rendering pipeline | the-coding-vault |
| `packages/ui/src/components/shadcn/` | Shared UI component library | @bubbles/ui |
| `packages/ui/src/styles/globals.css` | Design tokens + Tailwind config | @bubbles/ui |

## Entry Points

| App | Entry Point | Description |
|-----|-------------|-------------|
| portfolio | `app/[lang]/layout.tsx` | i18n root layout |
| portfolio | `app/[lang]/page.tsx` | Homepage |
| portfolio | `proxy.ts` | i18n middleware/detection |
| teacherbuddy | `app/layout.tsx` | Root layout |
| teacherbuddy | `app/page.tsx` | Dashboard |
| the-coding-vault | `app/(vault)/layout.tsx` | Public vault layout |
| the-coding-vault | `app/(admin)/layout.tsx` | Admin layout |
| the-coding-vault | `app/api/auth/login/route.ts` | Auth entry |

## Integration Points

| From | To | Type | Details |
|------|----|------|---------|
| All 3 apps | `@bubbles/ui` | Package import | Shared components, styles, hooks |
| All 3 apps | `@bubbles/eslint-config` | Dev config | ESLint presets |
| All 3 apps | `@bubbles/typescript-config` | Dev config | TypeScript configurations |
| `@bubbles/ui` | Tailwind v4 | Styling | Design tokens via CSS variables |
| the-coding-vault | PostgreSQL | Database | Drizzle ORM, connection via `lib/db.ts` |
| portfolio | Resend | External API | Email sending |
| portfolio | Cloudflare Turnstile | External API | CAPTCHA verification |
| the-coding-vault | Cloudinary | External API | Image upload/management |
