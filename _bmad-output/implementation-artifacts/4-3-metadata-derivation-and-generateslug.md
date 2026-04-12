---
story_id: "4.3"
story_key: "4-3-metadata-derivation-and-generateslug"
epic: "Epic 4 — Content Authoring Editor"
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

**Prerequisite:** Stories 4.1 and 4.2 complete.

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

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

### 1. `generateSlug()` Utility

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
    .normalize('NFD')                        // decompose unicode (ü → u + combining)
    .replace(/[\u0300-\u036f]/g, '')         // remove combining diacritics
    .replace(/[äöüÄÖÜ]/g, char => ({         // handle remaining German umlauts
      'ä': 'ae', 'ö': 'oe', 'ü': 'ue',
      'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue'
    })[char] ?? char)
    .replace(/ß/g, 'ss')                     // eszett
    .toLowerCase()
    .replace(/&/g, 'and')                    // & → and
    .replace(/[^a-z0-9\s-]/g, '')            // strip non-alphanumeric except spaces and hyphens
    .trim()
    .replace(/[\s]+/g, '-')                  // spaces → hyphens
    .replace(/-+/g, '-')                     // collapse multiple hyphens
    .replace(/^-|-$/g, '');                  // strip leading/trailing hyphens
}
```

### 2. `getHeaderLevelOneTitle()` Utility

```ts
// src/utils/get-header-title.ts
import type { OutputData } from '@editorjs/editorjs';

/**
 * Extracts the text of the first H1 block from EditorJS output.
 * Returns empty string if no H1 is present.
 */
export function getHeaderLevelOneTitle(data: OutputData): string {
  const h1 = data.blocks.find(b => b.type === 'header' && b.data.level === 1);
  return h1 ? (h1.data.text as string) : '';
}
```

### 3. Manual Override Flag — `slugManuallyEdited`

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
  slugManuallyEdited.current = true;  // lock slug from auto-updates
}
```

**Reset on navigation:** `slugManuallyEdited.current` resets on component unmount naturally. No explicit reset needed.

### 4. EditorJS `onChange` → Title Derivation

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
  }
});
```

### 5. Public Exports

```ts
// src/index.ts
export { generateSlug } from './utils/generate-slug';
// getHeaderLevelOneTitle is internal — NOT exported
```

### 6. Unit Tests for `generateSlug`

Add to `packages/markdown-editor/tests/utils/generate-slug.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
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
- **Do not use `slugify` from npm** unless it exactly matches the behavior spec above. The monorepo doesn't add deps for things this simple.

---

## Verification Checklist

- [ ] `generateSlug` exported from `src/index.ts`
- [ ] H1 block changes → title field updates
- [ ] Title change → slug auto-updates (unless manually edited)
- [ ] Manual slug edit → auto-update locked
- [ ] `generateSlug` unit tests cover: special chars, German umlauts, ß, &, empty string, unicode
- [ ] `bun run test` passes

---

## Dev Notes

_To be filled in during implementation._
