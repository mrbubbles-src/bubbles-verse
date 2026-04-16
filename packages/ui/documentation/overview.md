# `@bubbles/ui` — design system notes

## Purpose

This package is the **only** supported way to share visual language between apps. Centralizing components and `globals.css` avoids three slightly different button implementations and keeps accessibility fixes in one place.

## Layering

1. **`globals.css`** — Tailwind v4 layers, CSS variables, and global base styles. Every Next app that should look “on brand” imports this in its root layout **once**. It also owns the shared typography baseline for headings, body copy, and code blocks.
2. **`shadcn/*`** — Small, composable controls. Prefer these inside feature components rather than duplicating raw HTML + classes in apps.
3. **`components/*`** — Larger pieces that are still domain-agnostic (e.g. a shell might stay in an app if it encodes routing).
4. **`lib/*` / `hooks/*`** — Pure helpers and React hooks with **no** imports from `apps/`.

## Shared fonts

Use `@bubbles/ui/fonts` to import the package-owned `next/font/google` definitions for Montserrat, Poppins, and Fira Code.
Apply their `.variable` classes on the app root element so `globals.css` can resolve `--font-heading`, `--font-body`, and `--font-code`.

## Conventions for new work

- **Client vs server:** Mark client components with `"use client"` only at the boundary that needs browser APIs. Keep server-capable subtrees free of the directive when possible.
- **Styling:** Use `cva` + `tailwind-merge` patterns already present in shadcn-style files; avoid inline style objects except for dynamic values that Tailwind cannot express cleanly.
- **Icons:** Prefer **Hugeicons** exports already used in sibling files for visual consistency.
- **Forms:** `react-hook-form` + **Zod** are dependencies of the package — align validation patterns with existing shadcn form examples in this repo.

## Integrating in a new app

1. Add `"@bubbles/ui": "workspace:*"` and install from root.
2. In `app/layout.tsx` (or equivalent): `import '@bubbles/ui/globals.css'`.
3. If the app should use the shared typography system, also import `@bubbles/ui/fonts` and add the exported `.variable` classes to `<html>`.
4. Align **PostCSS** with `@bubbles/ui/postcss.config` if you want identical Tailwind processing (many Next apps already mirror the same plugins).
5. Point ESLint at `@bubbles/eslint-config/react-internal` and TS at `react-library.json` **or** merge paths from the app’s Next `tsconfig` (follow an existing app’s `tsconfig.json`).

## Quality gate

Before merging UI changes:

```bash
cd packages/ui
bun run lint && bun run typecheck
```

Consumer apps should still pass their own `bun run lint` / `bun run typecheck` — export surface changes can break importers.

## Shared shells

- Sidebar layout work should stay in `components/*`, not in `shadcn/*`, when it composes existing primitives into one opinionated app shell.
- `BubblesSidebarLayout` is the shared inset shell for apps that want the repo-standard sidebar behavior.
- The shared shell header is sticky by default so the trigger and navigation context stay visible while scrolling.
- The header supports optional supporting copy and optional right-aligned action content in addition to breadcrumbs.
- `BubblesBreadcrumbs` and `lib/bubbles-sidebar` expose the shared breadcrumb and data contract pieces without requiring the full shell.
- The v1 contract and rationale live in [sidebar-v1-spec.md](sidebar-v1-spec.md).

## Anti-patterns

- Importing **`next/image`** or **`Link`** with app-specific `href` shapes inside generic UI unless the component is intentionally a Next.js-only shared app shell such as `BubblesSidebarLayout`.
- Embedding **environment-specific URLs** or **feature flags** — pass them as props from the app.
- Copy-pasting a component into an app “just once” — if a second app needs it, promote it here with a sensible export.
