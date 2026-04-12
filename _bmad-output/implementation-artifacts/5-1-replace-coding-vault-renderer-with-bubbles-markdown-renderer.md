---
story_id: "5.1"
story_key: "5-1-replace-coding-vault-renderer-with-bubbles-markdown-renderer"
epic: "Epic 5 — Coding Vault Migration"
status: ready-for-dev
created: 2026-04-12
---

# Story 5.1 — Replace Coding Vault Renderer with `@bubbles/markdown-renderer`

## User Story

As a developer,
I want The Coding Vault's public entry pages to use `<MdxRenderer>` from `@bubbles/markdown-renderer`,
So that the Vault has zero duplicated renderer code and automatically benefits from package improvements.

---

## Context

`apps/the-coding-vault` currently has its own embedded MDX rendering setup using `next-mdx-remote-client` and inline Shiki configuration. This story removes all of that and replaces it with `<MdxRenderer>` from `@bubbles/markdown-renderer`.

The `--sh-*` Shiki CSS variable definitions currently live in `apps/the-coding-vault/app/globals.css`. After Story 2.3, those definitions exist in `renderer.css`. This story removes the duplicates from `globals.css` and imports `renderer.css` in the Vault's layout.

**The Vault becomes a read-only consumer** — no editor code, no Shiki config, no MDX compilation setup.

**Prerequisite:** Epic 2 complete (`@bubbles/markdown-renderer` fully implemented with `<MdxRenderer>` and `renderer.css`).

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

## Acceptance Criteria

```gherkin
Given apps/the-coding-vault after the migration
When a visitor opens a Vault entry page
Then the entry content is rendered via <MdxRenderer> from @bubbles/markdown-renderer
And the embedded MDX rendering code previously in apps/the-coding-vault is removed
And --sh-* and --code-bg are removed from apps/the-coding-vault/app/globals.css
And import '@bubbles/markdown-renderer/styles/renderer' is added to the Vault's layout
And the Vault app declares @bubbles/markdown-renderer as a workspace:* dependency
And the Vault builds and renders entries correctly with no visual regression
```

---

## Implementation Guide

### 1. Check What to Remove in The Coding Vault

Before starting, scan these areas in `apps/the-coding-vault`:

```bash
# Find current MDX rendering setup
# Look for: next-mdx-remote-client, @mdx-js/mdx, compileMDX, evaluate, etc.
apps/the-coding-vault/
├── app/(vault)/vault/[slug]/page.tsx    # main entry render page
├── app/(vault)/vault/[slug]/           # related files
├── components/                          # any renderer components
└── app/globals.css                      # Shiki CSS vars to remove
```

Check architecture doc `docs/architecture-the-coding-vault.md` for the exact current setup: `next-mdx-remote-client + remark-gfm` (version 2.1.7) is the current renderer.

### 2. Add `@bubbles/markdown-renderer` Dependency

In `apps/the-coding-vault/package.json`:

```json
"dependencies": {
  "@bubbles/markdown-renderer": "workspace:*"
}
```

Run `bun install` from the monorepo root after adding.

### 3. Add `renderer.css` Import to Vault Layout

In `apps/the-coding-vault/app/layout.tsx` (or the relevant layout file):

```tsx
import '@bubbles/markdown-renderer/styles/renderer';
```

Add alongside existing `@bubbles/ui/globals.css` import.

### 4. Replace Entry Page Rendering

Find the Vault entry page that currently renders MDX. Replace the compilation/rendering code:

**Before (approximately):**
```tsx
import { compileMDX } from 'next-mdx-remote-client';

const { content } = await compileMDX({ source: entry.mdxContent, ... });
return <div>{content}</div>;
```

**After:**
```tsx
import { MdxRenderer } from '@bubbles/markdown-renderer';

return <MdxRenderer content={entry.mdxContent} />;
```

The Vault may have custom MDX components (app-specific). Pass them via the `components` prop:

```tsx
// Vault-specific custom components (if any)
const vaultComponents = {
  // e.g. FormBeispiel, custom components used in existing vault entries
};

return <MdxRenderer content={entry.mdxContent} components={vaultComponents} />;
```

### 5. Remove `--sh-*` Variables from `globals.css`

In `apps/the-coding-vault/app/globals.css`, find and remove the Shiki CSS variable block. It looks something like:

```css
/* REMOVE THIS ENTIRE BLOCK: */
:root {
  --sh-keyword: ...;
  --sh-string: ...;
  --sh-comment: ...;
  /* ... other --sh-* vars ... */
  --code-bg: ...;
}
.dark {
  --sh-keyword: ...;
  /* ... */
}
```

These are now provided by `renderer.css`. Verify after removal that syntax highlighting still works.

### 6. Remove `next-mdx-remote-client` Dependency

If `next-mdx-remote-client` is no longer used anywhere in the Vault after this migration:

1. Remove it from `apps/the-coding-vault/package.json`
2. Run `bun install` to update lockfile

Check for any other usages before removing — do not remove if still used elsewhere.

### 7. Visual Regression Check

After the migration:
- Open a Vault entry page in the browser
- Verify: text renders, code blocks are syntax-highlighted, alerts show correctly, toggles collapse/expand
- Check light and dark mode
- Check that no hydration errors appear in the console

The rendering result should be **visually identical** to the pre-migration state. `<MdxRenderer>` uses the same MDX + Shiki pipeline; the only difference is where the code lives.

---

## Anti-Patterns to Avoid

- **Do not remove `--sh-*` vars before `renderer.css` is imported** — it will break syntax highlighting.
- **Do not remove `next-mdx-remote-client` if other parts of the Vault still use it** — check all usages first.
- **Do not add editor code to the Vault** — it is a read-only consumer after this migration.

---

## Verification Checklist

- [ ] `@bubbles/markdown-renderer` in `apps/the-coding-vault/package.json` as `workspace:*`
- [ ] `renderer.css` imported in Vault layout
- [ ] Entry pages use `<MdxRenderer>` — old MDX compilation code removed
- [ ] `--sh-*` and `--code-bg` removed from `apps/the-coding-vault/app/globals.css`
- [ ] `next-mdx-remote-client` removed if no longer used
- [ ] Vault entry pages render correctly in browser (light + dark mode)
- [ ] No TypeScript errors (`bun run typecheck`)
- [ ] No console errors on entry page load

---

## Dev Notes

_To be filled in during implementation._
