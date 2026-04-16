# Changelog

All notable cross-repo changes belong here. App- or package-only changes belong in that workspace's own `CHANGELOG.md`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.1] - 2026-04-17

### Changed

- Updated active BMAD implementation stories to require `AGENTS.md` compliance and to prefer clean reuse of working code from `portal-ref` and `lms-ref` when relevant.
- Added a root `bun run test` Turbo entrypoint and aligned serializer test docs
  around the new monorepo test flow.
- Added a repo-level remediation plan for the shared markdown packages, covering
  the editor preview regression, `FormBeispiel` removal, and follow-up renderer
  hardening work.
- Added a repo-root working manifest for the shared markdown packages so future
  implementation decisions keep the agreed reference-parity and
  package-reusability constraints intact.
- Tightened the repo-root markdown packages manifest with explicit
  feature-complete areas, remaining follow-up work, and a rule to verify
  markdown-package changes against references, repo standards, and official
  documentation.
- Updated the markdown-packages manifest to record completed Phase-1 work and
  refocus the remaining roadmap on real app integration, slug standardization,
  and later repo-alignment follow-up.
- Updated the markdown-packages manifest again after Phase 2, recording the
  first real markdown-package integration pass, package-default metadata form
  usage, and the first Cloudinary route verification.

### Removed

## [1.0.0] - 2026-04-09

### Added

- Added `it-counts`, `@bubbles/theme`, and `@bubbles/footer` to the root architecture, onboarding, tooling, and generated repo-overview docs.
- Initial package scaffold for `@bubbles/eslint-config`, `@bubbles/typescript-config`, `@bubbles/ui`, `@bubbles/theme`, and `@bubbles/footer`.
- Initial package scaffold for `@bubbles/markdown-editor`, `@bubbles/markdown-renderer`, and `the-coding-vault`.

### Changed

- Refreshed the root monorepo documentation to reflect the current 4-app / 5-package workspace graph.
