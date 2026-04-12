---
story_id: '4.3'
story_key: '4-3-metadata-derivation-and-generateslug'
epic: 'Epic 4 — Content Authoring Editor'
status: ready-for-dev
created: 2026-04-12
---

# Story 4.3 — Metadata Derivation and `generateSlug`

## User Story

As a developer,
I want the editor to auto-derive the title and slug from content, with manual override support,
So that authors don't need to type metadata they've already written in the editor.

---

## Context

When an author types a heading level 1 block, the title field auto-populates. The slug auto-generates from the title. Once an author manually edits the slug, auto-generation stops for that session — the manual value is preserved even if the title changes.

`generateSlug` is also exported as a standalone tree-shakeable utility.

This behavior must be ported from `to-be-integrated/` first, otherwise from `portal-ref`. Do not design a new slug or metadata-derivation algorithm unless the user explicitly approves a deviation.

**Prerequisite:** Stories 4.1 and 4.2 complete.

---

## Mandatory Implementation Contract

- Follow `AGENTS.md` for every implementation decision in this story.
- Port the existing working implementation from the designated reference source as the default path.
- Use `to-be-integrated/` first when the relevant implementation exists there.
- If the relevant implementation is not present in `to-be-integrated/`, use `portal-ref`.
- Do not rewrite, redesign, or replace a working reference implementation with a newly authored one unless this story explicitly documents an approved exception.
- If a reference implementation and this story appear to conflict, preserve the reference behavior and escalate the conflict instead of inventing a new solution.

### Primary Reference Source

`to-be-integrated/`

### Fallback Reference Source

`portal-ref`

### Reference Files / Modules

- Metadata and slug behavior in `to-be-integrated/` if present
- Equivalent metadata and slug behavior in `portal-ref`
- Export wiring in `packages/markdown-editor`

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
Given an editor with a heading level-1 block
When the block content changes
Then the title field is automatically updated to the H1 text

Given a title that was auto-derived from the H1
When the title changes
Then the slug field is automatically updated via generateSlug(title)

Given a slug that has been manually edited by the author
When the title or H1 changes afterward
Then the slug is no longer auto-updated — the manual value is preserved

Given import { generateSlug } from '@bubbles/markdown-editor'
When called with any string
Then it returns a URL-safe slug
And unit tests cover special characters, unicode, empty string, and German umlauts
```

---

## Implementation Guide

### 1. Reference-First Extraction

Inspect `to-be-integrated/` first and port the exact title-derivation and slug behavior.

If the implementation is not available there, inspect `portal-ref` and port the behavior from there.

Do not invent a new slug algorithm, normalization rule set, or manual-override flow. Preserve the edge cases and output shape of the reference implementation unless the user explicitly approves a deviation.

### 2. `generateSlug()` Utility

```ts
// src/utils/generate-slug.ts

/**
 * Converts a string to a URL-safe slug.
 * Handles unicode, German umlauts, and special characters.
 * Returns empty string for empty input.
 *
 * @example
 * generateSlug('Hello, World!')      // 'hello-world'
 * generateSlug('Über TypeScript')    // 'uber-typescript'
 * generateSlug('React & Next.js')    // 'react-and-nextjs'
 */
export function generateSlug(text: string): string {
  return text
    .normalize('NFD') // decompose unicode (ü → u + combining)
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritics
    .replace(
      /[äöüÄÖÜ]/g,
      (char) =>
        ({
          // handle remaining German umlauts
          ä: 'ae',
          ö: 'oe',
          ü: 'ue',
          Ä: 'ae',
          Ö: 'oe',
          Ü: 'ue',
        })[char] ?? char
    )
    .replace(/ß/g, 'ss') // eszett
    .toLowerCase()
    .replace(/&/g, 'and') // & → and
    .replace(/[^a-z0-9\s-]/g, '') // strip non-alphanumeric except spaces and hyphens
    .trim()
    .replace(/[\s]+/g, '-') // spaces → hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // strip leading/trailing hyphens
}
```

Treat the code above as the expected kind of utility shape, not as permission to replace the reference implementation with a newly invented one. The reference implementation remains the source of truth.

### 3. `getHeaderLevelOneTitle()` Utility

```ts
// src/utils/get-header-title.ts

import type { OutputData } from '@editorjs/editorjs';

/**
 * Extracts the text of the first H1 block from EditorJS output.
 * Returns empty string if no H1 is present.
 */
export function getHeaderLevelOneTitle(data: OutputData): string {
  const h1 = data.blocks.find((b) => b.type === 'header' && b.data.level === 1);
  return h1 ? (h1.data.text as string) : '';
}
```

### 4. Manual Override Flag — `slugManuallyEdited`

In the editor form state, track whether the slug was manually edited:

```ts
const [slug, setSlug] = useState('');
const slugManuallyEdited = useRef(false);

// When title changes (from H1 derivation):
function handleTitleChange(newTitle: string) {
  setTitle(newTitle);
  if (!slugManuallyEdited.current) {
    setSlug(generateSlug(newTitle));
  }
}

// When user manually edits the slug field:
function handleSlugChange(newSlug: string) {
  setSlug(newSlug);
  slugManuallyEdited.current = true; // lock slug from auto-updates
}
```

**Reset on navigation:** `slugManuallyEdited.current` resets on component unmount naturally. No explicit reset needed.

### 5. EditorJS `onChange` → Title Derivation

Wire `getHeaderLevelOneTitle` to EditorJS's `onChange` callback:

```ts
new EditorJS({
  onChange: async (api) => {
    const data = await api.saver.save();
    setEditorOutput(data);

    const derivedTitle = getHeaderLevelOneTitle(data);
    if (derivedTitle) {
      handleTitleChange(derivedTitle);
    }
  },
});
```

### 6. Public Exports

```ts
// src/index.ts
export { generateSlug } from './utils/generate-slug';
// getHeaderLevelOneTitle is internal — NOT exported
```

### 7. Unit Tests for `generateSlug`

Add to `packages/markdown-editor/tests/utils/generate-slug.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { generateSlug } from '../../src/utils/generate-slug';

describe('generateSlug', () => {
  it('basic text → kebab-case', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });
  it('special characters stripped', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
  });
  it('German umlauts transliterated', () => {
    expect(generateSlug('Über TypeScript')).toBe('uber-typescript');
  });
  it('ß → ss', () => {
    expect(generateSlug('Straße')).toBe('strasse');
  });
  it('& → and', () => {
    expect(generateSlug('React & Next.js')).toBe('react-and-nextjs');
  });
  it('empty string → empty string', () => {
    expect(generateSlug('')).toBe('');
  });
  it('multiple spaces → single hyphen', () => {
    expect(generateSlug('hello   world')).toBe('hello-world');
  });
  it('leading/trailing hyphens stripped', () => {
    expect(generateSlug('  hello  ')).toBe('hello');
  });
  it('unicode characters', () => {
    expect(generateSlug('café au lait')).toBe('cafe-au-lait');
  });
});
```

---

## Anti-Patterns to Avoid

- **Do not export `getHeaderLevelOneTitle`.** Internal utility only — it's tightly coupled to EditorJS data shapes.
- **Do not auto-generate slug after manual edit.** Once `slugManuallyEdited.current = true`, only user input changes the slug.
- **Do not swap in a new slug library or a newly designed algorithm** unless the user explicitly approves the deviation.

---

## Verification Checklist

- [ ] `generateSlug` exported from `src/index.ts`
- [ ] H1 block changes → title field updates
- [ ] Title change → slug auto-updates (unless manually edited)
- [ ] Manual slug edit → auto-update locked
- [ ] `generateSlug` unit tests cover: special chars, German umlauts, ß, &, empty string, unicode
- [ ] Metadata derivation and slug behavior match the designated reference implementation
- [ ] `bun run test` passes

---

## Dev Notes

_To be filled in during implementation._
