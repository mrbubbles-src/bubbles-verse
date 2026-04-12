# Changelog

All notable changes to The Coding Vault are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Switched public Vault entry pages from `next-mdx-remote-client` to `@bubbles/markdown-renderer` `<MdxRenderer>`, imported the shared `renderer.css`, and removed local Shiki token duplication from `app/globals.css`.
- Refreshed the Next.js toolchain with the official `@next/codemod` upgrade flow and reinstalled `next`, `@next/mdx`, and `eslint-config-next` on the current 16.2.3 line.

### Documentation

- README and `documentation/overview.md` expanded (Drizzle workflow, env, content/auth troubleshooting, renderer-package migration notes).
