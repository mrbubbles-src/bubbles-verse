# Structure

## Overview

TeacherBuddy is a Next.js App Router application. The layout renders a client-driven `AppShell` that provides navigation, header metadata, and global theming. Feature routes use local state stored in `localStorage` and hydrated on the client.

## Data Flow

1. On mount, `context/app-store.tsx` hydrates persisted state via `lib/storage.ts`.
2. Feature components read and update state using `useAppStore()`.
3. Persisted updates are written back to `localStorage` after hydration.

## Client and Server Boundaries

- **Server components**: `components/dashboard/dashboard-cards.tsx`
- **Client components**: Feature views, app shell, theme toggle, Base UI wrappers
- **Hydration skeletons**: Render while `state.ui.isHydrated` is false

## Folder Structure

```text
teacherbuddy/
├── app/                    # Routes, layout, global loading and error UI
│   ├── layout.tsx          # Root layout: metadata (template, OG, Twitter), ld+json schema, ThemeProvider, AppStoreProvider, AppShell, Footer, PrivacyNotice, Toaster
│   ├── page.tsx            # Dashboard
│   ├── api/og/route.tsx    # Open Graph image endpoint (next/og)
│   ├── robots.ts           # robots.txt generation
│   ├── sitemap.ts          # sitemap.xml generation
│   ├── loading.tsx         # Global loading state
│   ├── error.tsx           # Global error boundary
│   ├── students/           # Student management route
│   ├── generator/          # Random student generator route
│   ├── quizzes/            # Quiz builder route
│   ├── play/               # Quiz play route
│   ├── breakout-rooms/     # Breakout groups route
│   └── projects/           # Project lists route
├── components/             # React components
│   ├── ui/                 # Shared UI primitives (Button, Card, Dialog, Sonner/Toaster, etc.)
│   ├── loading/            # Skeletons for hydration states
│   ├── navigation/         # Sidebar and nav components
│   ├── dashboard/          # Dashboard cards (server component)
│   ├── students/           # Student feature components
│   │   └── __tests__/      # Student component tests
│   ├── quizzes/            # Quiz feature components
│   │   └── __tests__/      # Quiz component tests
│   ├── play/               # Quiz play components
│   ├── generator/          # Generator components
│   ├── breakout/           # BreakoutGroupsCard
│   ├── projects/           # ProjectListBuilder, ProjectListView
│   ├── utility/            # PageInfoDialog and utility UI
│   │   └── __tests__/      # PageInfoDialog tests
│   ├── app-shell.tsx       # Root layout shell
│   ├── privacy-notice.tsx  # One-time privacy notice (root layout)
│   └── student-name-generator.tsx
├── context/                # React context providers
│   ├── app-store.tsx       # Global state and reducer
│   ├── theme-provider.tsx  # next-themes wrapper
│   └── __tests__/          # Context tests
├── hooks/                  # Custom React hooks
│   ├── use-timer.ts        # Timer with persistence
│   ├── use-copy-to-clipboard.ts
│   ├── use-mobile.ts       # Viewport detection
│   ├── use-theme.ts        # Theme utilities
│   └── __tests__/          # Hook tests
├── lib/                    # Utilities and helpers
│   ├── models.ts           # TypeScript type definitions
│   ├── storage.ts          # localStorage persistence
│   ├── students.ts         # Student name utilities
│   ├── type-guards.ts      # Runtime type validation
│   ├── utils.ts            # General utilities
│   ├── metadata.ts         # SEO metadata utilities (metadataBase, OG/Twitter, page metadata builder)
│   ├── og-image.tsx        # Shared next/og image renderer
│   ├── page-meta.ts        # Route title/description source of truth
│   ├── page-info.tsx       # Page metadata and in-app help (PAGE_INFOS, getPageInfoByPath)
│   ├── sidebar.ts          # TeacherBuddy sidebar sections and breadcrumb mapping
│   ├── view-transition.ts  # Theme transition helper
│   └── __tests__/          # Utility tests
├── __tests__/              # Global test utilities
│   └── test-utils.tsx      # Custom render with providers
├── documentation/          # Markdown guides (onboarding, state, SEO, …)
├── public/                 # Static assets
│   ├── images/             # App logo and icons (e.g. teacherbuddy-icon-transparent.png for sidebar)
│   └── sounds/             # Timer and alert sounds
├── vitest.config.ts        # Test configuration
└── vitest.setup.ts         # Test setup and mocks
```

## Testing Structure

Tests are colocated with source code in `__tests__/` directories:

| Location                   | Coverage                                |
| -------------------------- | --------------------------------------- |
| `lib/__tests__/`           | Type guards, storage, student utilities |
| `hooks/__tests__/`         | useTimer, useCopyToClipboard            |
| `context/__tests__/`       | App reducer actions                     |
| `components/*/__tests__/`  | Component integration tests             |
| `__tests__/test-utils.tsx` | Shared test utilities                   |

## Styling and Theme

- **Entry:** root layout imports **`@bubbles/ui/globals.css`** — shared Tailwind v4 + design tokens with other monorepo apps. `components.json` points `css` at `packages/ui/src/styles/globals.css` for the shadcn CLI.
- **`app/globals.css`** may still exist locally for legacy or experiments; production styling should align with the package import above.
- Theme (light/dark) uses **`next-themes`** (`ThemeProvider` in root layout).
- Theme switching now comes from `@bubbles/theme`; the app consumes the shared toggle in `components/app-shell.tsx`.

## Key Files

| File                       | Purpose                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/layout.tsx`           | Root layout: metadata (template, OG, Twitter), ld+json WebApplication schema, fonts (Geist), ThemeProvider, AppStoreProvider, AppShell, shared Footer, PrivacyNotice, Toaster (sonner) |
| `context/app-store.tsx`    | Central state: reducer, useAppStore, hydration, persistence effects                                                                                                                    |
| `lib/storage.ts`           | localStorage read/write and validation                                                                                                                                                 |
| `lib/type-guards.ts`       | Runtime type checking for persisted data                                                                                                                                               |
| `lib/models.ts`            | Shared TypeScript types (Student, Quiz, ProjectList, etc.)                                                                                                                             |
| `lib/metadata.ts`          | Shared SEO metadata builders and metadataBase resolution (`buildPageMetadata`, `resolveMetadataBase`)                                                                                  |
| `lib/og-image.tsx`         | Shared Open Graph image renderer used by `app/api/og/route.ts`                                                                                                                         |
| `lib/page-meta.ts`         | Route metadata source (`ROUTE_PAGE_META`, `ROUTE_PAGE_META_BY_PATH`) reused by SEO and UI help                                                                                         |
| `lib/page-info.tsx`        | Page metadata and help (PageInfo, PAGE_INFOS, getPageInfoByPath); drives shared header breadcrumbs/description and PageInfoDialog                                                      |
| `components/app-shell.tsx` | Bridges TeacherBuddy route metadata into the shared sticky sidebar header and main content shell                                                                                       |
| `next.config.ts`           | Next config; React Compiler enabled unless `NEXT_DISABLE_REACT_COMPILER=1`                                                                                                             |
| `vitest.config.ts`         | Vitest + jsdom, path alias `@`, coverage for lib/hooks/context                                                                                                                         |
| `vitest.setup.ts`          | jest-dom, cleanup, localStorage/crypto mocks                                                                                                                                           |
