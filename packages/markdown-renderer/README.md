# @bubbles/markdown-renderer

Shared MDX building blocks for bubbles-verse apps.

## Current Scope

Story 2.1 ports the default `Markdown*` components and the typed
`defaultComponents` map for MDX rendering.

## Available Imports

```ts
import {
  defaultComponents,
  MarkdownAlerts,
  MarkdownChecklist,
  MarkdownCodeBlock,
  MarkdownEmbed,
  MarkdownImage,
  MarkdownLink,
  MarkdownToggle,
} from '@bubbles/markdown-renderer';
import '@bubbles/markdown-renderer/styles/renderer';
```

## Next.js MDX Usage

```tsx
import { defaultComponents } from '@bubbles/markdown-renderer';

export function useMDXComponents() {
  return defaultComponents;
}
```
