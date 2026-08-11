# `BubblesSidebarLayout` v1 specification

## Status

Implemented. This document records the current shipped contract.

## Goal

Provide one opinionated shared sidebar shell in `@bubbles/ui` that follows the
interaction model of the official shadcn `@shadcn/sidebar-08` block while
keeping app-specific header behavior injectable.

## High-level split

### `BubblesSidebarLayout`

Owns:

- `SidebarProvider`
- inset shell
- centered brand block
- recursive section/item navigation
- icon-only collapsed behavior
- optional authenticated footer menu
- `SidebarInset`
- optional injected `header`

Does not own:

- page subtitle text
- page help actions
- timers
- theme toggles
- app-specific toolbar composition

### `BubblesAppHeader`

Owns the shared sticky top-bar rhythm:

- sidebar trigger
- left separator
- breadcrumbs
- optional subtitle row
- optional subtitle action
- optional mobile top actions
- optional action area

Apps decide what gets injected into those slots.

## Public API

### Layout

```ts
type BubblesSidebarLayoutProps = {
  sidebarData: BubblesSidebarData;
  user?: BubblesSidebarUser;
  defaultOpen?: boolean;
  header?: React.ReactNode;
  children: React.ReactNode;
  classNames?: BubblesSidebarLayoutClassNames;
};
```

### Header

```ts
type BubblesAppHeaderProps = {
  breadcrumbs?: BubblesBreadcrumb[];
  subtitle?: React.ReactNode;
  subtitleAction?: React.ReactNode;
  mobileTopActions?: React.ReactNode;
  actions?: React.ReactNode;
  classNames?: BubblesAppHeaderClassNames;
};
```

### Shared layout class hooks

```ts
type BubblesSidebarLayoutClassNames = {
  root?: string;
  sidebar?: string;
  sidebarHeader?: string;
  sidebarContent?: string;
  sidebarFooter?: string;
  sidebarInset?: string;
  content?: string;
};
```

### Shared header class hooks

```ts
type BubblesAppHeaderClassNames = {
  root?: string;
  inner?: string;
  leading?: string;
  triggerGroup?: string;
  meta?: string;
  breadcrumbs?: string;
  subtitleRow?: string;
  subtitle?: string;
  subtitleAction?: string;
  mobileTopActions?: string;
  actions?: string;
};
```

## Shared data model

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
  icon?: IconSvgElement;
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

### Sidebar shell

- variant: `inset`
- collapsible mode: `icon`
- mobile behavior continues to come from the shared shadcn sidebar primitive
- collapsed top-level navigation hides labels completely
- expanded sidebar shows `fullLogo`
- collapsed sidebar shows `compactLogo`

### Navigation

- navigation is section-based via `sections[]`
- items may nest recursively through `children[]`
- any item with children behaves like a collapsible group
- parents auto-open when a descendant matches the current pathname
- active-route state uses `usePathname()`
- `match: 'prefix'` is supported for deeper route trees

### Header

- `BubblesSidebarLayout` only renders whatever header node the app injects
- `BubblesAppHeader` is the shared default for that header node
- if an app does not inject a header, the layout renders no top bar
- `mobileTopActions` render in the top row on mobile only
- `actions` render on desktop in the top row and on mobile in a centered lower row

### Footer

- footer menu is only rendered when `user` exists
- v1 entries are:
  - `Dashboard`
  - `Accounteinstellungen`
  - `Logout`
- all footer actions remain `href`-based

## File layout

```text
packages/ui/src/components/
  bubbles-sidebar/
    bubbles-app-header.tsx
    bubbles-breadcrumbs.tsx
    bubbles-sidebar-layout.tsx
    bubbles-sidebar-nav.tsx
    bubbles-sidebar-user-menu.tsx

packages/ui/src/lib/
  bubbles-sidebar.ts
```

## Public exports

- `./components/bubbles-app-header`
- `./components/bubbles-sidebar-layout`
- `./components/bubbles-breadcrumbs`
- `./lib/bubbles-sidebar`

## TeacherBuddy usage pattern

TeacherBuddy is the first real consumer and now uses:

```tsx
<BubblesSidebarLayout
  sidebarData={teacherBuddySidebarData}
  header={
    <BubblesAppHeader
      breadcrumbs={breadcrumbs}
      subtitle={meta.description}
      subtitleAction={<PageInfoDialog ... />}
      mobileTopActions={<ThemeToggleCluster />}
      actions={<TimerAndThemeCluster />}
    />
  }>
  {children}
</BubblesSidebarLayout>
```

That pattern is intentional: the shell stays global, while route-specific and
app-specific header behavior stays injected.
