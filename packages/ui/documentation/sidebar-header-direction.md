# `BubblesSidebarLayout` header direction

## Status

Implemented. This note now records the direction that shipped after the first
TeacherBuddy rollout.

## Why this note exists

`TeacherBuddy` was the first real consumer of `BubblesSidebarLayout`, so some
header behavior was shaped by concrete app needs:

- page descriptions
- page-info actions
- timer controls
- mobile-specific header utility placement

That was acceptable for the first rollout, but future apps will not all need
the same top-bar structure. The shared package should keep the strong default
sidebar behavior while making header-specific extras injectable instead of
hard-coded.

## What should stay package-default

These behaviors are considered good global defaults for the shared layout:

- sticky inset header
- persistent sidebar trigger
- breadcrumb rendering
- theme-toggle-friendly header layout
- sidebar collapse behavior
- icon-only collapsed navigation without text bleed
- centered logo behavior in expanded/collapsed sidebar states

These create a consistent repo-wide shell and should not need app-specific
re-implementation.

## What should not become hard-coded package behavior

These are app-specific concerns and should remain opt-in:

- timer controls
- page-info buttons
- description text
- extra utility actions
- custom mobile-only action clusters
- app-specific toolbar composition

In other words: the package may provide the places where apps inject extra UI,
but not assume those extras always exist.

## Header philosophy

The shared layout should ship a slim default header:

- sidebar trigger
- breadcrumbs
- theme toggle

Everything else should be injected by the consuming app when needed.

This keeps the package opinionated without forcing every app into the exact
TeacherBuddy toolbar shape.

## Recommended API direction

The shipped split is now:

- default shared header structure
- app-owned injected content
- optional style overrides

### Preferred behavioral model

- `BubblesSidebarLayout` owns the shell
- apps inject a header node when they need one
- `BubblesAppHeader` provides the shared sticky trigger/breadcrumb rhythm
- apps pass optional extras into `BubblesAppHeader`
- mobile-only extras stay injectable without changing package internals

## Styling override direction

The shared layout should gradually expose focused `className` override hooks so
small app-specific fixes do not require package edits.

Recommended future hook points:

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

The exact shape can change, but the idea should stay the same:

- provide a few meaningful override points
- avoid dozens of tiny one-off props
- always merge with `cn(defaults, className)`
- place custom classes last so consumer overrides win

## Practical guidance for future apps

### App with only the default top bar

Should be able to inject a small `BubblesAppHeader` that renders:

- trigger
- breadcrumbs
- theme toggle

with no additional configuration beyond the sidebar data and breadcrumb data.

### App with TeacherBuddy-style extras

Should be able to inject:

- subtitle text
- subtitle action
- timer controls
- mobile top-row utility actions

without changing package code.

### App with different extras

Should be able to inject unrelated controls, for example:

- search
- environment switcher
- workspace selector
- notifications
- account actions

again without touching package internals.

## Current risk assessment

The sidebar itself is in a good reusable state.

The sidebar is now in a good reusable state and the header split is much
cleaner. Future apps can reuse the same shell while injecting only the
specific top-bar affordances they need.

## Short version

- sidebar behavior: safe to standardize globally
- header base: safe to standardize globally through `BubblesAppHeader`
- header extras: inject per app
- fine visual tuning: prefer `className` override hooks over package edits
