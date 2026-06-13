# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added the initial Bubblophy Next.js app shell with a project-aware issue and
  agent orchestration dashboard.
- Added the first Drizzle schema for projects, project members, issues, issue
  plans, issue events, agent tokens, and agent runs.
- Added an auth and security plan for Supabase human auth, scoped hashed agent
  tokens, audit events, RLS direction, and human-in-the-loop run approval.
- Added the initial public Supabase auth groundwork for human login, callback,
  logout, host-aware cookie options, and local Bubblophy environment parsing.
- Added schema tests for table naming and allowed agent token scopes.
- Added focused tests for the Bubblophy env helper, auth cookie domain
  handling, login feedback, callback route, and logout route.
- Added a server-only dashboard DTO boundary so the public MVP page no longer
  imports sample data directly.
- Added the first protected Bubblophy dashboard gate with Supabase human
  sessions, safe relative redirects, and a temporary server-only email
  allowlist.
- Added a server-only project/issue repository mapper that converts
  persistence rows into dashboard DTOs without requiring a live database.
- Added a server-only issue draft create contract with injectable tests and a
  Drizzle adapter that writes an issue plus `created` audit event without
  starting agent runs.
- Added the dashboard dialog wiring for database-backed issue creation while
  preserving explicit local-only drafts for sample and fallback data sources.
- Added a server-only project create contract, authenticated server action, and
  minimal dashboard dialog for database-backed project creation.
