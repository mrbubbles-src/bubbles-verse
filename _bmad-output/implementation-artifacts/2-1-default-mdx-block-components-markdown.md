---
story_id: "2.1"
story_key: "2-1-default-mdx-block-components-markdown"
epic: "Epic 2 — MDX Renderer & Default Components"
status: ready-for-dev
created: 2026-04-12
---

# Story 2.1 — Default MDX Block Components (`Markdown*`)

## User Story

As a developer,
I want a complete set of default `Markdown*` components exported from `@bubbles/markdown-renderer`,
So that stored MDX renders correctly without writing any custom components.

---

## Context

These components are the visual output of EditorJS blocks after serialization. They live in `@bubbles/markdown-renderer` and have zero dependency on `@bubbles/markdown-editor`. Each component corresponds to one or more block types from the serializer.

The reference implementation exists in `lms-ref` — components are named `Modules*` there. Rename everything to `Markdown*` during extraction.

**Prerequisite:** Story 1.1 (renderer scaffold) complete.

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

## Acceptance Criteria

```gherkin
Given @bubbles/markdown-renderer is installed
When I import the default components
Then MarkdownAlerts, MarkdownCodeBlock, MarkdownChecklist, MarkdownImage,
     MarkdownEmbed, MarkdownToggle, MarkdownLink are all exported individually
     and as a combined defaultComponents map
And MarkdownCodeBlock renders syntax-highlighted code using Shiki CSS Variables Mode
    with Catppuccin Latte (light) and Catppuccin Mocha (dark) themes
And MarkdownAlerts supports info, success, warning, danger types
And MarkdownToggle is a collapsible section (details/summary pattern)
And all components are fully typed with no any
```

---

## Implementation Guide

### 1. File Structure in `packages/markdown-renderer/src/`

```
src/
├── components/
│   ├── markdown-alerts.tsx
│   ├── markdown-checklist.tsx
│   ├── markdown-code-block.tsx
│   ├── markdown-embed.tsx
│   ├── markdown-image.tsx
│   ├── markdown-link.tsx
│   ├── markdown-toggle.tsx
│   └── index.ts               # re-exports all + defaultComponents map
├── index.ts                   # public API
└── styles/
    └── renderer.css           # filled in Story 2.3
```

### 2. Component Props — Full Type Signatures (no `any`)

```ts
// markdown-alerts.tsx
type AlertType = 'info' | 'success' | 'warning' | 'danger';
interface MarkdownAlertsProps {
  type?: AlertType;
  children: React.ReactNode;
}

// markdown-code-block.tsx
interface MarkdownCodeBlockProps {
  children: string;
  className?: string;  // MDX passes language as className="language-ts"
}

// markdown-checklist.tsx
interface MarkdownChecklistProps {
  items: Array<{ text: string; checked: boolean }>;
}

// markdown-image.tsx
interface MarkdownImageProps {
  src: string;
  alt?: string;
  caption?: string;
}

// markdown-embed.tsx
interface MarkdownEmbedProps {
  url: string;
  caption?: string;
}

// markdown-toggle.tsx
interface MarkdownToggleProps {
  summary: string;
  children: React.ReactNode;
}

// markdown-link.tsx
interface MarkdownLinkProps {
  href: string;
  children: React.ReactNode;
}
```

**No `any`.** TypeScript strict mode is active — all props fully typed.

### 3. `MarkdownCodeBlock` — Shiki CSS Variables Mode

This is the most complex component. Use Shiki's CSS Variables Mode so that token colors are driven by CSS custom properties (enabling dark mode via `.dark` class). Theme: Catppuccin Latte (light) and Catppuccin Mocha (dark).

```ts
import { codeToHtml } from 'shiki';

// Extract language from MDX className prop: "language-typescript" → "typescript"
function extractLanguage(className?: string): string {
  return className?.replace('language-', '') ?? 'text';
}

// Render server-side or use useEffect for client rendering
// Use CSS Variables Mode: theme = 'css-variables'
const html = await codeToHtml(code, {
  lang: extractLanguage(className),
  theme: 'css-variables',
});
```

The `--sh-*` CSS variable definitions live in `renderer.css` (Story 2.3) — this component does NOT define them inline.

**Note:** `codeToHtml` is async. If used in a React Server Component context that's fine. For client-side, consider `codeToHtml` with `useEffect` or a server-side rendering approach. Prefer server rendering for performance (NFR3).

### 4. `defaultComponents` Map

Export a combined map for use as the `components` prop default in `<MdxRenderer>`:

```ts
// src/components/index.ts
export { MarkdownAlerts } from './markdown-alerts';
export { MarkdownCodeBlock } from './markdown-code-block';
export { MarkdownChecklist } from './markdown-checklist';
export { MarkdownImage } from './markdown-image';
export { MarkdownEmbed } from './markdown-embed';
export { MarkdownToggle } from './markdown-toggle';
export { MarkdownLink } from './markdown-link';

export const defaultComponents = {
  MarkdownAlerts,
  MarkdownCodeBlock,
  MarkdownChecklist,
  MarkdownImage,
  MarkdownEmbed,
  MarkdownToggle,
  MarkdownLink,
};
```

### 5. `src/index.ts` — Public Exports

```ts
// @bubbles/markdown-renderer — public API
export {
  MarkdownAlerts,
  MarkdownCodeBlock,
  MarkdownChecklist,
  MarkdownImage,
  MarkdownEmbed,
  MarkdownToggle,
  MarkdownLink,
  defaultComponents,
} from './components';
export { MdxRenderer } from './mdx-renderer';  // added in Story 2.2

// Re-export prop types for consumer use
export type { /* all prop interfaces */ } from './components';
```

### 6. Dependencies to Add to `packages/markdown-renderer/package.json`

```json
"dependencies": {
  "@bubbles/ui": "workspace:*",
  "react": "^19.2.4",
  "shiki": "^3.19.0"
}
```

`@mdx-js/mdx`, `remark-gfm`, `unified` are added in Story 2.2.

### 7. Icons

- Use HugeIcons (`@hugeicons/react`) for any icons in components (alert icons, toggle chevron, etc.)
- Do NOT use Lucide (`lucide-react`) — not in the monorepo standard
- `@fortawesome/free-brands-svg-icons` only for brand logos (YouTube in embed, GitHub, etc.)
- Non-brand Font Awesome → replace with HugeIcons equivalent

---

## Anti-Patterns to Avoid

- **No `any` types — anywhere.** All props must be fully typed.
- **No hardcoded colors.** All styles via `@bubbles/ui/globals.css` CSS custom properties.
- **No `lucide-react` import.** HugeIcons only.
- **No editor imports.** These components must work with zero dependency on `@bubbles/markdown-editor`.
- **Do not define `--sh-*` variables inside component files.** They belong in `renderer.css` (Story 2.3).

---

## Verification Checklist

- [ ] All 7 `Markdown*` components exist and are exported from `src/index.ts`
- [ ] `defaultComponents` map exported
- [ ] All components fully typed (no `any` in props or return types)
- [ ] `MarkdownCodeBlock` uses Shiki CSS Variables Mode
- [ ] `MarkdownAlerts` handles all 4 alert types
- [ ] `MarkdownToggle` uses `<details>`/`<summary>` or equivalent collapsible pattern
- [ ] `bun run typecheck` passes

---

## Dev Notes

_To be filled in during implementation._
