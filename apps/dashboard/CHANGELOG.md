# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added shared dashboard auth cookie configuration so Supabase sessions can be
  scoped to a parent domain like `.mrbubbles.test` or `.mrbubbles-src.dev`.

### Changed

- Aligned the app's Next.js, React, and type package versions with the shared
  workspace packages to reduce monorepo version drift.
- Replaced the `create-next-app` placeholder metadata and landing page copy with
  dashboard-specific scaffold content.
- Documented the dashboard environment variables needed for Supabase auth and
  database access.

### Documentation

- Rewrote the app README so it documents the monorepo workflow, current scaffold
  state, and local quality checks.
- Added an app-local changelog for future dashboard-specific changes.
