# `BubblesSidebarLayout` header direction

## Status

Planning note. This document records the intended direction for the shared
header API after the first TeacherBuddy rollout.

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

The current slots already move in the right direction:

- `description`
- `descriptionAction`
- `headerActions`
- `mobileHeaderActions`

That is acceptable for now, but the long-term direction should be a slightly
cleaner split between:

- default shared header structure
- app-owned injected content
- optional style overrides

### Preferred behavioral model

- `BubblesSidebarLayout` owns the shell and header rhythm
- apps pass in optional header extras
- if an app passes nothing, the header should still look complete and balanced
- mobile-only extras should be injectable without changing package internals

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
  header?: string;
  headerInner?: string;
  headerMeta?: string;
  headerActions?: string;
  content?: string;
};
```

The exact shape can change, but the idea should stay the same:

- provide a few meaningful override points
- avoid dozens of tiny one-off props
- always merge with `cn(defaults, className)`
- place custom classes last so consumer overrides win

## Practical guidance for future apps

### App with only the default top bar

Should be able to render:

- trigger
- breadcrumbs
- theme toggle

with no additional configuration beyond the sidebar data and breadcrumb data.

### App with TeacherBuddy-style extras

Should be able to inject:

- description text
- page-info action
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

The header is usable, but currently still somewhat TeacherBuddy-informed. That
is not a problem while TeacherBuddy is the only consumer. Before a second app
adopts the layout, the header API should be reviewed against that app's needs
instead of assuming TeacherBuddy is the universal pattern.

## Short version

- sidebar behavior: safe to standardize globally
- header base: safe to standardize globally
- header extras: inject per app
- fine visual tuning: prefer `className` override hooks over package edits
