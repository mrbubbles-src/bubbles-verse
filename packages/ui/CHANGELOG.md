# Changelog

All notable changes to `@bubbles/ui` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Shared `FormDialog` and `StagedConfirmDialog` components for reusable
  create/edit and staged destructive modal flows across apps.
- Shared `Pagination` component plus `getPaginationItems()` helper for classic
  paged lists with compact chips and optional page-size selection.

### Changed

- `@bubbles/ui` README now documents the shared dialog shells and pagination
  entrypoint alongside the existing shell components.
- Raised the shared desktop typography baseline for primary controls, menus,
  dialogs, cards, and sidebar navigation from extra-small defaults to a more
  readable `text-sm`/`text-base` scale.
- Raised shared `Badge` chips from the old micro-label sizing so dashboard
  status and taxonomy labels no longer read noticeably smaller than the
  surrounding UI.
- Raised shared `Badge` chips one more step to a clearer `text-sm` size so
  status labels stay readable even after the dashboard content width opened up.
- Tuned shared `Badge` chips back down one step and switched them to
  `font-semibold` so they stay readable without visually overpowering nearby
  body text.
- Sidebar actions can now cancel their follow-up navigation, which lets apps
  gate destructive sidebar actions behind a confirmation step.

## [1.1.0] - 2026-04-17

### Added

- Package README, `documentation/`, and this changelog.
- Shared `@bubbles/ui/fonts` export for Montserrat, Poppins, and Fira Code via `next/font/google`.
- Added `documentation/sidebar-v1-spec.md` to capture the agreed v1 shared sidebar layout contract before implementation.
- Added `documentation/sidebar-header-direction.md` to capture the intended split between global header defaults, injected app-specific header content, and future `className` override hooks.
- Shared `BubblesSidebarLayout`, `BubblesBreadcrumbs`, and typed sidebar helpers for reusable inset app shells.
- `@bubbles/ui` Vitest setup covering the shared sidebar layout behavior.

### Changed

- Richer README and `documentation/overview.md` (layering, conventions, anti-patterns).
- `globals.css` typography defaults now read shared heading, body, and code font variables.
- `SelectContent` defaults back to popper-style content-fit positioning; opt
  into trigger alignment with `alignItemWithTrigger={true}`.
- Sidebar-specific shared components now live under
  `src/components/bubbles-sidebar/` instead of being scattered directly in the
  top-level components folder.
- `BubblesSidebarLayout` is now a cleaner shell-only API: consumer apps inject
  their own top bar through `header` instead of passing TeacherBuddy-shaped
  header props directly into the layout.
- Added shared `BubblesAppHeader` plus exported `BubblesAppHeaderProps`,
  `BubblesAppHeaderClassNames`, and `BubblesSidebarLayoutClassNames` so apps
  can compose header-specific extras and targeted style overrides without
  editing the package.
- `BubblesSidebarLayout` now provides a sticky shared header with optional description and action slots, larger sidebar typography, and more generous brand sizing.
- The shared sidebar header now keeps page-help actions beside supporting copy, separates utility actions more clearly, and avoids awkward desktop wrapping.
- The shared header now anchors breadcrumb content directly beside the sidebar trigger and supports clearer utility grouping with vertical separators.
- Shared shell alignment is polished further: centered sidebar branding, vertically centered trigger/meta layout, and tighter utility control grouping.
- Collapsed sidebar navigation now hides top-level labels completely instead of letting truncated text peek through icon mode.
- Shared header utility separators can now be nudged cleanly into visual alignment with neighboring controls.
- `BubblesSidebarLayout` now supports a dedicated `mobileHeaderActions` slot so mobile top-row utilities can sit beside breadcrumbs while lower mobile actions stay centered.
- Inset shells now clip their sticky header/content to the same rounded corners top and bottom, so the shared package keeps consistent corner radii across apps.

### Fixed

- Fixed shared right-side `SheetContent` classes so desktop sheets render and animate correctly again instead of only the mobile bottom-sheet path working reliably.
- Relaxed the shared sidebar header subtitle clamp so longer app descriptions stay readable instead of collapsing into a single aggressively truncated line.
