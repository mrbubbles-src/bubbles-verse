# Story 5.1: PWA Manifest, App Icons & Basic SEO

Status: ready-for-dev

## Story

As a user,
I want to install It Counts to my homescreen and have it look like a native app,
so that logging is one tap away without opening a browser.

## Acceptance Criteria

1. **Given** the app is served over HTTPS
   **When** the user opens it in iOS Safari or Android Chrome
   **Then** the browser offers an "Add to Homescreen" prompt (Android) or the share menu shows "Add to Homescreen" (iOS)
   **And** the installed app launches standalone (no browser chrome)
   **And** the app icon (192×192 and 512×512) appears on the homescreen

2. **Given** `public/manifest.json` is linked in `app/layout.tsx`
   **When** the manifest is validated
   **Then** it contains: `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color` in a valid OKLCH-derived hex value (manifest requires hex), `icons` array with 192px and 512px entries

3. **Given** a user shares or bookmarks any page
   **When** the link is previewed in a messenger or search result
   **Then** each page has a `<title>`, `<meta name="description">`, and Open Graph `og:title` / `og:description` tags
   **And** HTML uses semantic elements throughout (`<main>`, `<nav>`, `<header>`, correct heading hierarchy)

## Tasks / Subtasks

- [ ] Task 1: Add the installability metadata
  - [ ] Add a manifest plus 192px and 512px icons
  - [ ] Ensure the app launches standalone on supported devices
- [ ] Task 2: Add SEO and semantic metadata
  - [ ] Add page-level title, description, and OG metadata
  - [ ] Audit semantic landmarks and heading hierarchy in the app shell
- [ ] Task 3: Document and verify the PWA shape
  - [ ] Record the chosen manifest/icon approach in app-local docs or changelog
  - [ ] Verify installability manually on iOS and Android paths

## Dev Notes

### Implementation Focus

- Verified Next.js 16 docs prefer `app/manifest.ts` or `app/manifest.json` in the app root as the special metadata file. If there is no strong reason to keep a `public/manifest.json`, prefer the app-root metadata convention and note the divergence from the epic wording.
- `theme_color` in the manifest must be hex even though app CSS stays OKLCH-only.
- Reuse app-level metadata APIs instead of hardcoding repeated `<head>` tags.

### Guardrails

- Keep icons and manifest paths stable for installability.
- Do not leak raw hex colors into app CSS just because the manifest requires them.
- SEO here is basic quality metadata, not marketing overreach.

### Project Structure Notes

- Likely touch: `apps/it-counts/app/manifest.ts` or `apps/it-counts/app/manifest.json`, `apps/it-counts/app/layout.tsx`, `apps/it-counts/app/page.tsx`, `apps/it-counts/public/...`, `apps/it-counts/CHANGELOG.md`

### Latest Tech Verification

- Next.js local docs confirm the manifest special file belongs in the root of `app/`.
- Next.js local docs confirm PWA installability relies on manifest plus icons, while push can be added later without changing the manifest pattern.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]
- [Source: _bmad-output/planning-artifacts/prd.md#PWA Requirements]
- [Source: apps/it-counts/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md]
- [Source: apps/it-counts/node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md]
- [Source: apps/it-counts/node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
