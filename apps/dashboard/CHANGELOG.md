# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added shared dashboard auth cookie configuration so Supabase sessions can be
  scoped to a parent domain like `.mrbubbles.test` or `.mrbubbles-src.dev`.
- Added the first protected dashboard shell with shared sidebar, header, footer,
  and placeholder account/Vault routes.
- Added the first dashboard home view with quick actions, recent content
  sections, and app summaries.
- Added an optimistic dashboard `proxy.ts` and shared session-cookie helpers for
  faster auth redirects.
- Added login feedback for failed OAuth returns plus a one-time success toast
  after a real sign-in round-trip.
- Added a dedicated `/auth/callback` route so Supabase PKCE logins can exchange
  the auth code for a cookie-backed dashboard session before redirecting home.

### Changed

- Aligned the app's Next.js, React, and type package versions with the shared
  workspace packages to reduce monorepo version drift.
- Replaced the `create-next-app` placeholder metadata and landing page copy with
  dashboard-specific scaffold content.
- Documented the dashboard environment variables needed for Supabase auth and
  database access.
- Replaced the temporary root placeholder route with the authenticated
  dashboard home route inside the `(dashboard)` route group.
- Fixed the login bootstrap so client-side `NEXT_PUBLIC_*` variables are read
  from explicit public env keys instead of the full `process.env` object.
- Reset the login pending state when GitHub OAuth cannot be started, so the
  button no longer gets stuck on `Weiterleitung...`.
- Non-allowlisted GitHub sessions are now redirected through server logout so
  rejected users do not keep a live dashboard session cookie after OAuth.
- Updated the server-side owner fallback so GitHub users from Supabase can be
  recognized through `user_metadata` when `identities` is empty.

### Documentation

- Rewrote the app README so it documents the monorepo workflow, current scaffold
  state, and local quality checks.
- Added an app-local changelog for future dashboard-specific changes.
