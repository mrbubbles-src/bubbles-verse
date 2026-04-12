# @bubbles/markdown-renderer

Shared MDX building blocks and runtime rendering for bubbles-verse apps.

## Current Scope

Stories 2.1 and 2.2 port the default `Markdown*` components, the typed
`defaultComponents` map, and the runtime `<MdxRenderer>` component.

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
