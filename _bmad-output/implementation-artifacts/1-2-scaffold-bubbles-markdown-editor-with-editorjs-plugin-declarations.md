---
story_id: "1.2"
story_key: "1-2-scaffold-bubbles-markdown-editor-with-editorjs-plugin-declarations"
epic: "Epic 1 — Package Infrastructure"
status: ready-for-dev
created: 2026-04-12
---

# Story 1.2 — Scaffold `@bubbles/markdown-editor` with EditorJS Plugin Declarations

## User Story

As a developer,
I want `@bubbles/markdown-editor` scaffolded with all 15 EditorJS plugins installed and typed,
So that I have a single, version-pinned source of truth for all editor dependencies.

---

## Context

Companion to Story 1.1. Same scaffold pattern as `@bubbles/markdown-renderer`, but with all 15 EditorJS plugin packages declared as dependencies and custom `.d.ts` type declarations for plugins that lack upstream TypeScript types.

The reference implementation lives in `portal-ref`. All plugins are pinned there — use those exact versions. Upstream plugin types are incomplete or missing; `.d.ts` declaration files ship with this package so consuming apps never touch plugin types.

**Prerequisite:** Story 1.1 must be complete (establishes scaffold conventions).

---

## Acceptance Criteria

```gherkin
Given the monorepo root
When @bubbles/markdown-editor is scaffolded
Then the package exists at packages/markdown-editor/
And package.json follows the same conventions as @bubbles/markdown-renderer
And all 15 EditorJS plugin packages are declared as dependencies with pinned versions
And custom .d.ts declarations exist for all plugins that lack upstream TypeScript types
And no consuming app needs to declare any EditorJS plugin as a direct dependency
And bun run typecheck passes from the monorepo root without errors
```

---

## Implementation Guide

### 1. Directory & File Structure

```
packages/markdown-editor/
├── src/
│   ├── index.ts                # empty placeholder export
│   ├── styles/
│   │   ├── editor.css          # placeholder
│   │   └── preview.css         # placeholder
│   └── types/
│       └── editorjs-plugins.d.ts   # custom declarations for plugins without upstream types
├── eslint.config.mjs
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

### 2. `package.json`

```json
{
  "name": "@bubbles/markdown-editor",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "exports": {
    ".": "./src/index.ts",
    "./styles/editor": "./src/styles/editor.css",
    "./styles/preview": "./src/styles/preview.css"
  },
  "dependencies": {
    "@bubbles/markdown-renderer": "workspace:*",
    "@bubbles/ui": "workspace:*",
    "@calumk/editorjs-codecup": "^2.0.2",
    "@coolbytes/editorjs-delimiter": "^1.2.0",
    "@editorjs/editorjs": "^2.31.0",
    "@editorjs/embed": "^2.7.6",
    "@editorjs/header": "^2.8.9",
    "@editorjs/image": "^2.10.1",
    "@editorjs/inline-code": "^1.5.0",
    "@editorjs/list": "^2.0.5",
    "@editorjs/quote": "^2.7.6",
    "@editorjs/table": "^2.4.3",
    "@sotaproject/strikethrough": "^1.0.4",
    "editorjs-alert": "^1.2.1",
    "editorjs-annotation": "^1.0.0",
    "editorjs-inline-hotkey": "^1.0.0",
    "editorjs-toggle-block": "^2.3.0",
    "react": "^19.2.4"
  },
  "devDependencies": {
    "@bubbles/eslint-config": "workspace:*",
    "@bubbles/typescript-config": "workspace:*",
    "@types/react": "^19.2.10",
    "eslint": "^9.39.2",
    "typescript": "^5.9.3"
  }
}
```

**Pin versions from portal-ref.** If the exact versions above differ from portal-ref, use portal-ref as the source of truth — these are approximate.

**Why `@bubbles/markdown-renderer` as dep?** The editor's live preview component uses `<MdxRenderer>` to render the preview pane. The renderer is the read surface; the editor imports it.

### 3. `tsconfig.json`

Identical to Story 1.1 / `packages/footer/tsconfig.json`:

```json
{
  "extends": "@bubbles/typescript-config/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. `eslint.config.mjs`

```js
import { config } from '@bubbles/eslint-config/react-internal';

/** @type {import("eslint").Linter.Config} */
export default config;
```

### 5. `src/types/editorjs-plugins.d.ts`

Plugins that lack complete upstream TypeScript types need declarations. Create stubs now — Epic 3/4 will expand these as needed during implementation:

```ts
// Type declarations for EditorJS plugins that lack upstream TypeScript types.
// Expand these stubs during implementation (Epics 3 and 4).

declare module '@calumk/editorjs-codecup' {
  const CodeCup: any;
  export = CodeCup;
}

declare module '@coolbytes/editorjs-delimiter' {
  const Delimiter: any;
  export = Delimiter;
}

declare module 'editorjs-alert' {
  const Alert: any;
  export = Alert;
}

declare module 'editorjs-annotation' {
  const Annotation: any;
  export = Annotation;
}

declare module 'editorjs-inline-hotkey' {
  const InlineHotkey: any;
  export = InlineHotkey;
}

declare module 'editorjs-toggle-block' {
  const ToggleBlock: any;
  export = ToggleBlock;
}

declare module '@sotaproject/strikethrough' {
  const Strikethrough: any;
  export = Strikethrough;
}
```

**IMPORTANT:** The `any` stubs above are temporary scaffolding only. Stories in Epic 4 **must** replace every `any` with proper typed interfaces per project TypeScript policy (no `any`). These exist so `typecheck` passes during scaffold; they are not the final types.

### 6. CSS Placeholders

`src/styles/editor.css`:
```css
/* @bubbles/markdown-editor — editor styles
 * Import: import '@bubbles/markdown-editor/styles/editor'
 * Populated in Epic 4 (Story 4.6)
 */
```

`src/styles/preview.css`:
```css
/* @bubbles/markdown-editor — preview pane styles
 * Import: import '@bubbles/markdown-editor/styles/preview'
 * Populated in Epic 4 (Story 4.6)
 */
```

### 7. `src/index.ts`

```ts
// @bubbles/markdown-editor — public API
// Components and utilities are exported here in Epics 3 and 4.
export {};
```

### 8. README.md

```md
# @bubbles/markdown-editor

Rich content editor for bubbles-verse apps. Wraps EditorJS with a live MDX preview,
draft autosave, and a configurable plugin subset.

## Usage

\`\`\`tsx
import { MarkdownEditor } from '@bubbles/markdown-editor';
import '@bubbles/markdown-editor/styles/editor';
import '@bubbles/markdown-editor/styles/preview';

<MarkdownEditor
  imageUploader={uploadFn}
  onSuccess={handleSuccess}
/>
\`\`\`

## API

_Documented in `documentation/` once implementation is complete (Epics 3–4)._
```

### 9. `CHANGELOG.md`

```md
# Changelog — @bubbles/markdown-editor

## 0.0.0 — 2026-04-12

- Initial package scaffold.
```

### 10. Turbo & Bun — No Changes Required

Same reasoning as Story 1.1. Bun workspace auto-discovers `packages/*`. Turbo picks up `lint` and `typecheck` scripts automatically.

---

## Anti-Patterns to Avoid

- **Do NOT add `any` as a permanent type.** The declaration file stubs are temporary — they must be replaced with real interfaces in Epics 3/4.
- **Do NOT declare EditorJS plugins in any consuming app.** All plugin dependencies live here only.
- **Do NOT add a `build` script.** Source exports only, same as other packages.
- **Do NOT import `@bubbles/markdown-editor` inside `@bubbles/markdown-renderer`.** Dependency flows one way: editor → renderer, never the reverse.

---

## Verification Checklist

- [ ] `packages/markdown-editor/package.json` has all 15 plugin deps
- [ ] `tsconfig.json` and `eslint.config.mjs` present and correct
- [ ] `src/types/editorjs-plugins.d.ts` covers all 7 plugins lacking upstream types
- [ ] CSS placeholder files exist for `editor.css` and `preview.css`
- [ ] `README.md` and `CHANGELOG.md` present
- [ ] `bun run typecheck` passes from monorepo root
- [ ] `bun run lint` passes from monorepo root

---

## Dev Notes

_To be filled in by the developer during/after implementation._
