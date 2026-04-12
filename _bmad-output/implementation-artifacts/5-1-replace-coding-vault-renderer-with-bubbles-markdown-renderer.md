---
story_id: '5.1'
story_key: '5-1-replace-coding-vault-renderer-with-bubbles-markdown-renderer'
epic: 'Epic 5 — Coding Vault Migration'
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

Use `to-be-integrated/` first, otherwise the extracted package behavior and `lms-ref`, as the source of truth for the target renderer behavior.

**Prerequisite:** Epic 2 complete (`@bubbles/markdown-renderer` fully implemented with `<MdxRenderer>` and `renderer.css`).

---

## Mandatory Implementation Contract

- Follow `AGENTS.md` for every implementation decision in this story.
- Port the existing working implementation from the designated reference source as the default path.
- Use `to-be-integrated/` first when the relevant implementation exists there.
- If the relevant implementation is not present in `to-be-integrated/`, use the extracted package behavior plus `lms-ref` as the fallback source of truth for target renderer behavior.
- Do not rewrite, redesign, or replace a working reference implementation with a newly authored one unless this story explicitly documents an approved exception.
- If a reference implementation and this story appear to conflict, preserve the reference behavior and escalate the conflict instead of inventing a new solution.

### Primary Reference Source

`to-be-integrated/`

### Fallback Reference Source

Extracted package behavior plus `lms-ref` for target renderer behavior

### Reference Files / Modules

- Target renderer behavior in `to-be-integrated/` if present
- Equivalent renderer behavior in `lms-ref`
- Current removal sites in `apps/the-coding-vault`

### Allowed Deviations

- package/file placement required by this monorepo
- import path updates
- naming changes explicitly required by package API
- strict typing and lint compliance
- documented acceptance-criteria-driven adjustments only

### Forbidden Deviations

- library swaps not present in the reference implementation
- architectural rewrites
- behavior changes not explicitly required by the story
- replacing working reference logic with newly invented logic
- omitting reference behavior because it seems unnecessary

### Reference Access Rule

If the implementation required by this story cannot be inspected in the `Primary Reference Source`, do not guess and do not invent a replacement implementation.

If the `Fallback Reference Source` is also unavailable, incomplete, or cannot be inspected sufficiently, stop and ask the user how to proceed before making any code changes.

Missing or inaccessible reference sources are a blocker for implementation, not permission to improvise.

### Deviation Approval Rule

If implementation appears to require any deviation from the reference implementation or from the agreed plan, stop before making the change and ask the user for a decision.

Present the deviation clearly using this structure:

- What is different?
- Why is the deviation being considered?
- Why can the reference or current plan not be followed as-is?
- What are the available options?
- What are the consequences or tradeoffs of each option?

Wait for explicit user approval before implementing any deviation.

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
