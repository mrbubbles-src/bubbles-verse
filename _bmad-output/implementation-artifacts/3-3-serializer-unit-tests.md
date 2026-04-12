---
story_id: '3.3'
story_key: '3-3-serializer-unit-tests'
epic: 'Epic 3 — EditorJS → MDX Serializer'
status: ready-for-dev
created: 2026-04-12
---

# Story 3.3 — Serializer Unit Tests

## User Story

As a developer,
I want comprehensive Vitest unit tests for the serializer,
So that I can refactor or extend it with confidence.

---

## Context

The serializer is pure logic — no React, no DOM, no async — which makes it straightforward to unit test. The test suite must cover all 15 block type handlers, security functions, and edge cases. These tests are the safety net for future serializer changes.

**Prerequisite:** Stories 3.1 and 3.2 complete (serializer implemented).

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

- Serializer test coverage patterns in `to-be-integrated/` if present
- Equivalent serializer behavior in `portal-ref`
- Current serializer implementation in `packages/markdown-editor/src/serializer`

### Allowed Deviations

- test file placement required by this monorepo
- import path updates
- strict typing and lint compliance
- documented acceptance-criteria-driven adjustments only

### Forbidden Deviations

- inventing test expectations that intentionally diverge from reference behavior
- architectural rewrites
- behavior changes not explicitly required by the story
- omitting reference edge cases because they seem unnecessary

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
Given the Vitest test suite in packages/markdown-editor/tests/
When all serializer tests run
Then each of the 15 block type handlers has at least one test for expected MDX output
And escapeMdxBraces() has tests for nested braces, JSX-like content, and empty strings
And tryParseInlineComponent has tests for: valid shortcode, blocked component name,
    malformed JSON props, JSX-style <Name /> syntax, no-props shortcode
And toggle with nested children has a recursive serialization test
And <br> → <br /> sanitization has a dedicated test
And all tests pass with bun run test from the monorepo root
```

---

## Implementation Guide

### 1. File Location

```
packages/markdown-editor/tests/
└── serializer/
    ├── serialize-to-mdx.test.ts       # block type handlers + integration
    ├── security.test.ts               # escapeMdxBraces, tryParseInlineComponent, sanitize
    └── fixtures/
        └── blocks.ts                  # reusable EditorJS block fixtures
```

**Tests live in a separate `tests/` directory**, not alongside source files. This is the monorepo convention (per AGENTS.md: "Keep test files in their own directory").

### 2. Vitest Setup

Add `vitest` as a dev dependency in `packages/markdown-editor/package.json`:

```json
"devDependencies": {
  "vitest": "^3.0.0",
  "@vitest/coverage-v8": "^3.0.0"
}
```

Add test script:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### 3. Block Handler Tests — Template

```ts
// serialize-to-mdx.test.ts

import { describe, expect, it } from 'vitest';

import { serializeToMdx } from '../../src/serializer';

describe('serializeToMdx — block handlers', () => {
  it('paragraph → wrapped plain text', () => {
    const result = serializeToMdx({
      blocks: [
        { id: 'abc123', type: 'paragraph', data: { text: 'Hello world' } },
      ],
    });
    expect(result).toContain('data-block-id="abc123"');
    expect(result).toContain('Hello world');
  });

  it('header level 2 → ## heading', () => {
    const result = serializeToMdx({
      blocks: [
        { id: 'h1', type: 'header', data: { text: 'My Title', level: 2 } },
      ],
    });
    expect(result).toContain('## My Title');
  });

  it('unordered list → - items', () => {
    /* ... */
  });
  it('ordered list → 1. items', () => {
    /* ... */
  });
  it('checklist → - [ ] / - [x] items', () => {
    /* ... */
  });
  it('code block → fenced code with language', () => {
    /* ... */
  });
  it('quote → > blockquote with caption', () => {
    /* ... */
  });
  it('alert → <MarkdownAlerts type="...">', () => {
    /* ... */
  });
  it('delimiter → ---', () => {
    /* ... */
  });
  it('embed → <MarkdownEmbed url="...">', () => {
    /* ... */
  });
  it('image → <MarkdownImage src="..." alt="...">', () => {
    /* ... */
  });
  it('table with headings → valid GFM table with header separator', () => {
    /* ... */
  });
  it('table without headings → valid GFM table', () => {
    /* ... */
  });

  it('toggle with nested children → recursive MDX output', () => {
    const result = serializeToMdx({
      blocks: [
        {
          id: 'toggle1',
          type: 'toggle',
          data: {
            text: 'Show details',
            items: [
              {
                id: 'child1',
                type: 'paragraph',
                data: { text: 'Nested paragraph' },
              },
            ],
          },
        },
      ],
    });
    expect(result).toContain('<MarkdownToggle summary="Show details">');
    expect(result).toContain('Nested paragraph');
  });

  it('all blocks get data-block-id wrapper', () => {
    const result = serializeToMdx({
      blocks: [
        { id: 'p1', type: 'paragraph', data: { text: 'test' } },
        { id: 'd1', type: 'delimiter', data: {} },
      ],
    });
    expect(result).toContain('data-block-id="p1"');
    expect(result).toContain('data-block-id="d1"');
  });
});
```

### 4. Security Tests

```ts
// security.test.ts

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ALLOWED_MDX_COMPONENTS,
  escapeMdxBraces,
  sanitizeMdxOutput,
  tryParseInlineComponent,
} from '../../src/serializer/security';

describe('escapeMdxBraces', () => {
  it('escapes single brace pair', () => {
    expect(escapeMdxBraces('{value}')).toBe('&#123;value&#125;');
  });
  it('escapes nested braces', () => {
    expect(escapeMdxBraces('{{nested}}')).toBe(
      '&#123;&#123;nested&#125;&#125;'
    );
  });
  it('escapes JSX-like expression', () => {
    expect(escapeMdxBraces('{process.env.SECRET}')).toBe(
      '&#123;process.env.SECRET&#125;'
    );
  });
  it('returns empty string unchanged', () => {
    expect(escapeMdxBraces('')).toBe('');
  });
  it('leaves text without braces unchanged', () => {
    expect(escapeMdxBraces('hello world')).toBe('hello world');
  });
});

describe('tryParseInlineComponent', () => {
  const allowlist = DEFAULT_ALLOWED_MDX_COMPONENTS;

  it('parses valid shortcode without props', () => {
    const result = tryParseInlineComponent('[[MarkdownAlerts]]', allowlist);
    expect(result).toEqual({ componentName: 'MarkdownAlerts', props: {} });
  });
  it('parses valid shortcode with JSON props', () => {
    const result = tryParseInlineComponent(
      '[[MarkdownAlerts {"type":"info"}]]',
      allowlist
    );
    expect(result).toEqual({
      componentName: 'MarkdownAlerts',
      props: { type: 'info' },
    });
  });
  it('parses JSX-style <Name /> syntax', () => {
    const result = tryParseInlineComponent('<MarkdownEmbed />', allowlist);
    expect(result).not.toBeNull();
    expect(result?.componentName).toBe('MarkdownEmbed');
  });
  it('returns null for blocked component name', () => {
    expect(
      tryParseInlineComponent('[[DangerousComponent]]', allowlist)
    ).toBeNull();
  });
  it('returns null for malformed JSON props', () => {
    expect(
      tryParseInlineComponent('[[MarkdownAlerts {bad json}]]', allowlist)
    ).toBeNull();
  });
  it('app-extended allowlist allows custom component', () => {
    const extended = new Set([...allowlist, 'MyAppComponent']);
    expect(
      tryParseInlineComponent('[[MyAppComponent]]', extended)
    ).not.toBeNull();
  });
});

describe('sanitizeMdxOutput', () => {
  it('replaces <br> with <br />', () => {
    expect(sanitizeMdxOutput('line1<br>line2')).toBe('line1<br />line2');
  });
  it('handles multiple <br> occurrences', () => {
    expect(sanitizeMdxOutput('<br><br>')).toBe('<br /><br />');
  });
  it('is case-insensitive', () => {
    expect(sanitizeMdxOutput('<BR>')).toBe('<br />');
  });
});
```

### 5. Run Command

Tests must pass with:

```
bun run test
```

from inside `packages/markdown-editor/` or:

```
bun run test --filter @bubbles/markdown-editor
```

from the monorepo root.

---

## Anti-Patterns to Avoid

- **Do not put test files in `src/`.** Tests live in `packages/markdown-editor/tests/` per AGENTS.md.
- **Do not test implementation details.** Test the public API (`serializeToMdx`, security exports) via input/output assertions.
- **Do not mock `serializeToMdx` in its own tests** — test the real function with real block data.

---

## Verification Checklist

- [ ] `tests/serializer/` directory exists in `packages/markdown-editor/`
- [ ] All 15 block types covered by at least one test
- [ ] `escapeMdxBraces` tests: nested braces, JSX expression, empty string, plain text
- [ ] `tryParseInlineComponent` tests: valid, blocked, malformed JSON, JSX syntax, extended allowlist
- [ ] Toggle recursive test passing
- [ ] `<br>` sanitization test passing
- [ ] `bun run test` passes from monorepo root

---

## Dev Notes

_To be filled in during implementation._
