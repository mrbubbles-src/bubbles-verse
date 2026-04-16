# `BubblesSidebarLayout` v1 specification

## Status

Implemented. This document now records the v1 contract that shipped in the monorepo.

## Goal

Create one opinionated shared sidebar layout in `@bubbles/ui` that follows the interaction model and overall composition of the official shadcn block `@shadcn/sidebar-08`, while staying reusable across apps in this monorepo.

The desired consumer experience is intentionally simple:

```tsx
<BubblesSidebarLayout
  sidebarData={sidebarData}
  user={user}
  breadcrumbs={breadcrumbs}>
  {children}
</BubblesSidebarLayout>
```

The package owns the sidebar layout, header rhythm, active-route handling, mobile behavior, and optional authenticated footer menu. Consumer apps prepare data and render their page content as `children`.

## Why this lives in `@bubbles/ui`

- The sidebar is a UI concern, not a single-app feature.
- The repo already centralizes shadcn primitives in `@bubbles/ui/shadcn/*`.
- Apps that do not use the layout can simply avoid importing it.
- Keeping the higher-level composition in `@bubbles/ui/components/*` preserves one visual system and one maintenance point.

## Design constraints

- Must use the official shadcn CLI as the source of truth for the `sidebar-08` starting point.
- Must build on existing `@bubbles/ui/shadcn/*` primitives rather than duplicating them in a new package.
- Must preserve the current shadcn sidebar behavior for mobile, collapsing, and cookie-backed open state.
- Must be opinionated.
- Must be strongly typed.
- Must be Next.js-first. `next/link`, `next/image`, and `usePathname()` are allowed in this composition.
- Must support arbitrary app content inside the inset shell.
- Must support optional authenticated footer UI for the owner-facing dashboard use case.

## Non-goals for v1

- No internal data fetching.
- No `zustand` or shared store inside `@bubbles/ui`.
- No automatic breadcrumb derivation from URL segments.
- No generic headless navigation framework.
- No multiple built-in sidebar templates.
- No non-Next.js compatibility layer.
- No action-only menu items without navigation targets.

## Public API

### Main component

`BubblesSidebarLayout` is the main high-level export.

Responsibilities:

- render `SidebarProvider`
- render the inset sidebar shell
- render the sidebar brand area
- render recursive navigation sections
- render the shared header row
- render optional breadcrumbs
- render optional authenticated user footer menu
- keep the top header sticky by default so the trigger stays available while scrolling
- support optional supporting copy below the breadcrumb row
- support optional right-aligned header actions for app-owned controls
- render `children` in the main inset content area

### Proposed props

```ts
type BubblesSidebarLayoutProps = {
  sidebarData: BubblesSidebarData;
  breadcrumbs?: BubblesBreadcrumb[];
  user?: BubblesSidebarUser;
  description?: React.ReactNode;
  descriptionAction?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};
```

### Data model

```ts
type BubblesSidebarData = {
  brand: BubblesSidebarBrand;
  sections: BubblesSidebarSection[];
};

type BubblesSidebarBrand = {
  href: string;
  compactLogo: {
    src: string;
    alt: string;
  };
  fullLogo: {
    src: string;
    alt: string;
  };
};

type BubblesSidebarSection = {
  id: string;
  title: string;
  items: BubblesSidebarItem[];
};

type BubblesSidebarItem = {
  id: string;
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  match?: 'exact' | 'prefix';
  children?: BubblesSidebarItem[];
};

type BubblesSidebarUser = {
  name: string;
  email: string;
  avatarSrc?: string;
  dashboardHref: string;
  settingsHref: string;
  logoutHref: string;
};

type BubblesBreadcrumb = {
  label: string;
  href?: string;
};
```

## Behavior contract

### Layout structure

- Sidebar variant: `inset`
- Sidebar collapsible mode: `icon`
- Header is always rendered inside `SidebarInset`
- `children` render below the header inside the inset content area

### Header behavior

- Header is sticky by default
- Header always has the same height and spacing rhythm
- If `breadcrumbs` exist:
  - render trigger
  - render separator
  - render breadcrumbs
- If `breadcrumbs` do not exist:
  - render trigger
  - keep the same header height
  - do not render breadcrumbs
- If `description` exists:
  - render it beneath the breadcrumb row
- If `descriptionAction` exists:
  - render it next to the supporting copy
- If `headerActions` exist:
  - render them in the right-aligned action area
- App-owned controls such as theme toggles and timers may plug into the shared header through `headerActions`.

### Branding behavior

- Expanded sidebar shows the full logo asset
- Collapsed sidebar shows the compact icon-only logo asset
- Brand area links to the app homepage via `brand.href`

### Navigation behavior

- Navigation is section-based via `sections[]`
- Sections may be absent or empty
- Each section renders a section title plus recursive items
- Items may be nested to arbitrary depth via `children`
- Any item with `children` behaves like a collapsible group
- Any item without `children` behaves like a navigable leaf

### Active route behavior

- Active route resolution uses `usePathname()`
- Leaf items default to `match: 'exact'`
- Parent items become active and expanded when any descendant is active
- Item-level `match` can override matching behavior
- `prefix` matching is available for routes that should stay active deeper in the tree

### Authenticated footer behavior

- If `user` is undefined, the footer user menu is not rendered
- If `user` exists, the footer renders an avatar/name/email trigger
- The footer dropdown includes exactly these entries in v1:
  - `Dashboard`
  - `Accounteinstellungen`
  - `Logout`
- All footer actions use `href`s in v1, including logout

### Mobile behavior

- Inherit the existing mobile sheet behavior from the shadcn sidebar primitive
- Do not introduce a second mobile navigation system

## Reusable sub-exports

The layout is the main consumer API, but a few smaller exports should stay reusable for apps that want pieces without the full layout.

Candidate sub-exports:

- `BubblesBreadcrumbs`
- sidebar types from a dedicated `lib` file
- possibly one or two sidebar-specific internal components if their reuse becomes real during implementation

v1 should avoid exporting every private implementation detail up front.

## Proposed file layout

```text
packages/ui/src/components/
  bubbles-sidebar-layout.tsx
  bubbles-sidebar-header.tsx
  bubbles-sidebar-nav.tsx
  bubbles-sidebar-user-menu.tsx
  bubbles-breadcrumbs.tsx

packages/ui/src/lib/
  bubbles-sidebar.ts
```

Expected export additions in `packages/ui/package.json`:

- `./components/bubbles-sidebar-layout`
- `./components/bubbles-breadcrumbs`
- `./lib/bubbles-sidebar`

Additional exports may be added only if implementation reveals a real reuse need.

## shadcn CLI workflow

Implementation must use the official shadcn CLI rather than manually copying docs code.

Planned workflow:

1. Inspect current `packages/ui` shadcn state with `bunx --bun shadcn@latest info --json`.
2. Inspect official docs and registry metadata for `sidebar` and `@shadcn/sidebar-08`.
3. Run `bunx --bun shadcn@latest add @shadcn/sidebar-08 --dry-run`.
4. Inspect overwrite candidates with `--diff`, especially:
   - `src/components/shadcn/button.tsx`
   - `src/components/shadcn/sheet.tsx`
   - `src/components/shadcn/sidebar.tsx`
   - `src/hooks/use-mobile.ts`
5. Do not blindly overwrite existing primitives.
6. Add only the necessary official block files, then adapt them to the existing `@bubbles/ui` aliases, Hugeicons usage, and export surface.
7. Refactor the block output into the agreed shared component architecture.

## TeacherBuddy integration target

`apps/teacherbuddy` is the first integration target and validation surface because it already has:

- an inset sidebar shell
- route-aware navigation
- a shared header
- an app logo
- an existing `usePathname()`-driven active state

Current files likely to be replaced or simplified during the integration spike:

- `apps/teacherbuddy/components/app-shell.tsx`
- `apps/teacherbuddy/components/navigation/sidebar-nav.tsx`
- former page-local header wiring now collapsed into the shared sticky header slots

The shared layout now absorbs the sticky header frame and breadcrumb baseline, while TeacherBuddy injects app-specific controls such as the timer and theme toggle through the shared header action slots.

## Testing strategy

### Package-level

- render test for the base layout
- recursive navigation rendering test
- active route matching test
- parent auto-expand on active descendant test
- auth footer hidden when `user` is missing
- auth footer visible when `user` is present
- breadcrumb rendering test
- no-breadcrumb header fallback test

### Integration-level

- wire the layout into `apps/teacherbuddy`
- verify visual parity against the current shell
- verify desktop collapse behavior
- verify mobile sheet behavior
- verify route highlighting

### Browser validation

After implementation, run the app locally and verify the result in the browser from this workspace. `apps/teacherbuddy` is the primary manual QA target.

## Documentation updates required during implementation

When the feature is implemented, update at least:

- `packages/ui/README.md`
- `packages/ui/CHANGELOG.md`
- `packages/ui/documentation/overview.md`
- relevant `apps/teacherbuddy` docs and changelog entries

## Open follow-up topics after v1

- Should the shared header eventually support page titles and descriptions?
- Should non-link action items be supported in the nav tree?
- Should more sidebar templates be added alongside the `sidebar-08`-style layout?
- Should logo handling support static imports in addition to plain `src` strings?
