# Changelog

All notable changes to `@bubbles/ui` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Package README, `documentation/`, and this changelog.
- Shared `@bubbles/ui/fonts` export for Montserrat, Poppins, and Fira Code via `next/font/google`.
- Added `documentation/sidebar-v1-spec.md` to capture the agreed v1 shared sidebar layout contract before implementation.

### Changed

- Richer README and `documentation/overview.md` (layering, conventions, anti-patterns).
- `globals.css` typography defaults now read shared heading, body, and code font variables.
- `SelectContent` defaults back to popper-style content-fit positioning; opt
  into trigger alignment with `alignItemWithTrigger={true}`.
