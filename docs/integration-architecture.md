# Integration Architecture

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Overview

bubbles-verse is a monorepo with a strict **unidirectional dependency flow**: apps depend on packages, never the reverse. All 3 applications share a common design system and tooling foundation.

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                        APPLICATIONS                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  portfolio    │  │ teacherbuddy │  │ the-coding-vault │  │
│  │  (Next.js 16)│  │ (Next.js 16) │  │ (Next.js 16)     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │            │
├─────────┼─────────────────┼────────────────────┼────────────┤
│         │        SHARED PACKAGES               │            │
│         │                 │                    │            │
│         ▼                 ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    @bubbles/ui                        │   │
│  │  Components (shadcn) · Hooks · Styles · Utilities     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │ @bubbles/eslint-config  │  │ @bubbles/typescript-config│  │
│  │ (dev-time only)         │  │ (dev-time only)           │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

### @bubbles/ui → All Apps

| Aspect | Details |
|--------|---------|
| **Protocol** | `workspace:*` in package.json |
| **Import pattern** | Subpath exports: `@bubbles/ui/shadcn/button`, `@bubbles/ui/hooks/use-mobile`, `@bubbles/ui/lib/utils` |
| **Transpilation** | All apps set `transpilePackages: ['@bubbles/ui']` in `next.config.ts` |
| **Styles** | Apps import `@bubbles/ui/globals.css` for Tailwind v4 design tokens |
| **Tree-shaking** | Subpath exports enable per-component imports |

**Components consumed by apps:**

| Component | portfolio | teacherbuddy | the-coding-vault |
|-----------|:---------:|:------------:|:----------------:|
| Button | x | x | x |
| Card | x | x | x |
| Sidebar | - | x | x |
| Sheet | - | x | x |
| Dialog | - | x | x |
| Form | x | - | x |
| Input | x | x | x |
| Select | - | x | - |
| Tabs | - | x | - |
| Tooltip | - | x | x |
| Badge | - | x | - |
| Skeleton | x | x | x |
| Separator | - | x | x |
| NavigationMenu | - | x | - |
| DropdownMenu | - | - | x |
| AlertDialog | - | - | x |
| Avatar | - | - | x |

### @bubbles/eslint-config → All Apps + @bubbles/ui

| Aspect | Details |
|--------|---------|
| **Protocol** | `workspace:*` or `workspace:^` in devDependencies |
| **Config presets** | `base` (shared rules), `next-js` (Next.js apps), `react-internal` (library packages) |
| **Consumed by** | portfolio, teacherbuddy, the-coding-vault use `next-js`; @bubbles/ui uses `react-internal` |

### @bubbles/typescript-config → All Workspaces

| Aspect | Details |
|--------|---------|
| **Protocol** | `workspace:*` in devDependencies |
| **Config profiles** | `base.json`, `nextjs.json` (apps), `react-library.json` (packages) |
| **Root tsconfig** | Extends `@bubbles/typescript-config/base.json` |

## External Service Integration

### Portfolio

| Service | Purpose | Integration |
|---------|---------|-------------|
| Resend | Email delivery | Server action (`app/actions/send-mails.ts`) |
| Cloudflare Turnstile | CAPTCHA verification | React component + server-side validation |
| Vercel | Hosting | Build outputs + env vars |

### The Coding Vault

| Service | Purpose | Integration |
|---------|---------|-------------|
| PostgreSQL | Database | Drizzle ORM (`lib/db.ts` → `drizzle/db/schema.ts`) |
| Cloudinary | Image hosting | Upload API + CDN delivery (`lib/cloudinary.ts`, `next-cloudinary`) |
| Discord | Error reporting | Webhook (`DISCORD_WEBHOOK_URL`) |
| Vercel | Hosting | Build outputs + env vars |

### TeacherBuddy

| Service | Purpose | Integration |
|---------|---------|-------------|
| localStorage | Data persistence | `lib/storage.ts` abstraction layer |
| Vercel | Hosting | Build outputs |

## Data Flow Patterns

### Portfolio: Server-Side Rendering + Server Actions
```
Browser → [lang]/page.tsx → Server Component (static data + i18n)
Browser → ContactForm → Server Action (send-mails.ts) → Resend API
Browser → /api/og → Dynamic OG Image Generation
```

### TeacherBuddy: Client-Side State
```
Browser → App Shell → AppStoreProvider (context/app-store.tsx)
       → useReducer (dispatch actions)
       → localStorage sync (lib/storage.ts)
       → Components read state via useAppStore()
```

### The Coding Vault: Full-Stack with JWT
```
Browser → /api/auth/login → JWT token → Cookie
Browser → (admin)/dashboard → Auth check → DB queries (Drizzle)
Browser → (vault)/vault/[slug] → Server Component → MDX render
Admin → Editor.js → /api/vault/save-entry → PostgreSQL
Admin → Image upload → /api/vault/image-upload → Cloudinary
```

## Shared Patterns Across Apps

1. **Theme management**: All apps use `next-themes` via a `ThemeProvider` in their own `context/theme-provider.tsx`
2. **OG image generation**: All apps have `app/api/og/route.tsx` for dynamic Open Graph images
3. **PostCSS + Tailwind v4**: All apps use `@tailwindcss/postcss` with the shared `globals.css` from `@bubbles/ui`
4. **React Compiler**: Enabled by default (togglable via `NEXT_DISABLE_REACT_COMPILER=1`)
5. **Bun runtime**: All Next.js commands run via `bun --bun next ...`

## Cross-Part Communication

The apps in this monorepo are **independently deployed** and do **not communicate with each other** at runtime. They share code only through the package layer (`@bubbles/ui`, configs). There are no:
- Cross-app API calls
- Shared databases between apps
- Message queues or event buses
- Shared authentication/sessions

Each app is a self-contained deployment unit connected to its own external services.
