---
story_id: '3.2'
story_key: '3-2-serializer-security-patterns'
epic: 'Epic 3 — EditorJS → MDX Serializer'
status: ready-for-dev
created: 2026-04-12
---

# Story 3.2 — Serializer Security Patterns

## User Story

As a developer,
I want the serializer to enforce security boundaries on user-authored content,
So that no JSX injection, invalid shortcodes, or malformed props reach the MDX output.

---

## Context

The serializer outputs MDX that is compiled at runtime by `@mdx-js/mdx`'s `evaluate()`. Without sanitization, a malicious user could:

- Inject JSX via brace expressions (`{process.env.SECRET}`)
- Insert arbitrary MDX components via shortcode syntax
- Pass malformed prop strings that bypass JSON parsing

These security functions are part of `src/serializer/security.ts` in `@bubbles/markdown-editor`. They must be applied by the block handlers in Story 3.1 — implement together or immediately after.

**Prerequisite:** Story 3.1 in progress or complete (security functions are used by block handlers).

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref` or `to-be-integrated`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

## Acceptance Criteria

```gherkin
Given user-authored text containing {, }, or MDX-like expressions
When serializeToMdx() processes the content
Then escapeMdxBraces() is applied to all user text before serialization

Given a paragraph containing [[ComponentName]] or <ComponentName /> shortcode syntax
When the serializer processes it
Then only names in DEFAULT_ALLOWED_MDX_COMPONENTS are rendered as MDX components
And apps can extend via allowedComponents — merged as a superset, never reduced

Given a shortcode with JSON props [[Component {"key":"value"}]]
When the serializer processes it
Then props are JSON-parsed and re-serialized before insertion
And malformed JSON props result in plain text output, never raw string insertion

Given block content containing <br> tags
When serialization completes
Then all <br> occurrences are replaced with <br /> for MDX compatibility
```

---

## Implementation Guide

### 1. File Location

`packages/markdown-editor/src/serializer/security.ts`

### 2. `escapeMdxBraces()`

Prevent JSX expression injection from user text. Replace `{` and `}` with their HTML entity equivalents:

```ts
/**
 * Escapes MDX brace expressions in user-authored content.
 * Prevents JSX injection: {expression} → &#123;expression&#125;
 * Apply to ALL user text content before including in MDX output.
 */
export function escapeMdxBraces(text: string): string {
  return text.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
}
```

**Apply this to every user text field** — paragraph text, header text, quote content, alert message, list items, table cells, toggle summary, etc. No exception.

### 3. `DEFAULT_ALLOWED_MDX_COMPONENTS`

The allowlist of component names that are valid as inline shortcodes in MDX output:

```ts
/**
 * Default set of MDX component names allowed as inline shortcodes in serialized output.
 * Apps can extend this via the allowedComponents prop — they can never reduce it.
 */
export const DEFAULT_ALLOWED_MDX_COMPONENTS = new Set<string>([
  'MarkdownAlerts',
  'MarkdownCodeBlock',
  'MarkdownChecklist',
  'MarkdownImage',
  'MarkdownEmbed',
  'MarkdownToggle',
  'MarkdownLink',
]);
```

This list mirrors the `defaultComponents` map from `@bubbles/markdown-renderer`. Apps add their own custom component names via `allowedComponents` prop.

### 4. Allowlist Enforcement Helper

```ts
/**
 * Returns the merged allowlist from DEFAULT_ALLOWED_MDX_COMPONENTS plus any app-provided extensions.
 * Apps can only extend — never reduce — the default set.
 */
export function getMergedAllowlist(extensions?: string[]): Set<string> {
  return new Set([...DEFAULT_ALLOWED_MDX_COMPONENTS, ...(extensions ?? [])]);
}
```

### 5. `tryParseInlineComponent()`

Parses shortcode syntax and validates against the allowlist:

```ts
interface ParsedShortcode {
  componentName: string;
  props: Record<string, unknown>;
}

/**
 * Parses [[ComponentName {"key":"value"}]] or <ComponentName /> shortcode syntax.
 * Returns null if the component is not in the allowlist or props JSON is malformed.
 * On null, the caller renders the shortcode as plain text instead.
 */
export function tryParseInlineComponent(
  raw: string,
  allowlist: Set<string>
): ParsedShortcode | null {
  // Pattern: [[ComponentName]] or [[ComponentName {"key":"value"}]]
  const match =
    raw.match(/^\[\[(\w+)(?:\s+(.+))?\]\]$/) ?? raw.match(/^<(\w+)\s*\/>$/);

  if (!match) return null;

  const componentName = match[1];
  if (!allowlist.has(componentName)) return null; // blocked — not in allowlist

  const propsString = match[2];
  if (propsString) {
    try {
      const props = JSON.parse(propsString) as Record<string, unknown>;
      return { componentName, props };
    } catch {
      return null; // malformed JSON → plain text, never raw string
    }
  }

  return { componentName, props: {} };
}
```

### 6. `<br>` → `<br />` Sanitization Pass

Applied as a post-processing pass at the end of `serializeToMdx()`, after all block handlers run:

```ts
/**
 * Sanitizes HTML artifacts in serialized MDX for JSX compatibility.
 * Currently handles: <br> → <br />
 */
export function sanitizeMdxOutput(mdx: string): string {
  return mdx.replace(/<br>/gi, '<br />');
}
```

Call `sanitizeMdxOutput(output)` as the final step in `serializeToMdx()`.

### 7. Integration with Block Handlers

The security functions must be applied in `block-handlers.ts`:

- `escapeMdxBraces(text)` — on every user text field before including in output
- `tryParseInlineComponent(raw, allowlist)` — when processing paragraph content for shortcodes
- `sanitizeMdxOutput(output)` — final pass in `serializeToMdx()`

---

## Anti-Patterns to Avoid

- **Never insert raw user text into MDX output without `escapeMdxBraces`.** No exception.
- **Never allow a component name outside the merged allowlist** to appear as a JSX element in MDX output.
- **Never insert raw shortcode prop strings** without JSON.parse validation. Malformed → plain text.
- **Do not allow the default allowlist to be reduced.** `getMergedAllowlist` always starts from `DEFAULT_ALLOWED_MDX_COMPONENTS` — the consumer can only add.

---

## Verification Checklist

- [ ] `escapeMdxBraces` applied to all user text in every block handler
- [ ] `DEFAULT_ALLOWED_MDX_COMPONENTS` exported from `src/index.ts`
- [ ] `tryParseInlineComponent` returns `null` for blocked names and malformed JSON
- [ ] `sanitizeMdxOutput` called as final step in `serializeToMdx`
- [ ] `bun run typecheck` passes (no `any`)

---

## Dev Notes

_To be filled in during implementation._
