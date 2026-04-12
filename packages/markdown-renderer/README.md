# @bubbles/markdown-renderer

Shared MDX building blocks, runtime rendering, and renderer-only CSS for
bubbles-verse apps.

## Current Scope

Stories 2.1 to 2.3 port the default `Markdown*` components, the typed
`defaultComponents` map, the runtime `<MdxRenderer>` component, and the
standalone `renderer.css` stylesheet export.

## Available Imports

```ts
import {
  defaultComponents,
  MdxRenderer,
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

The stylesheet export defines the renderer syntax-highlighting variables and
inline-code treatment without importing any editor toolbar or split-pane CSS.

## Runtime Rendering

```tsx
import { MdxRenderer } from '@bubbles/markdown-renderer';

export function ArticleBody({ content }: { content: string }) {
  return <MdxRenderer content={content} />;
}
```

Override or extend the default MDX registry per render:

```tsx
import { MdxRenderer } from '@bubbles/markdown-renderer';

export function ArticleBody({ content }: { content: string }) {
  return (
    <MdxRenderer
      content={content}
      components={{
        h1: (props) => <h1 className="text-balance text-5xl" {...props} />,
        Callout: ({ children }) => <aside>{children}</aside>,
      }}
    />
  );
}
```

## Next.js MDX Usage

```tsx
import { defaultComponents } from '@bubbles/markdown-renderer';

export function useMDXComponents() {
  return defaultComponents;
}
```
