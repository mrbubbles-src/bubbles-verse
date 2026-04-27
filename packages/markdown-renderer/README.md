# @bubbles/markdown-renderer

Shared MDX building blocks, runtime rendering, and renderer-only CSS for
bubbles-verse apps.

The package now prefers explicit safety and reference parity for:

- markdown images backed by Cloudinary or direct `url` fallbacks
- external links limited to safe protocols
- editor preview integration that can reuse the shared default component map
- code blocks highlighted with the repo-standard Catppuccin light/dark themes

## Current Scope

Stories 2.1 to 2.3 port the default `Markdown*` components, the typed
`defaultComponents` map, the runtime `<MdxRenderer>` component, and the
standalone `renderer.css` stylesheet export.

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
  MdxRenderer,
  previewComponents,
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

`MarkdownImage` supports both Cloudinary-backed payloads (`public_id`) and
plain external image URLs. `MarkdownLink` keeps internal/hash behavior from the
references, but only renders external anchors for safe schemes such as
`https:`, `mailto:`, and `tel:`. `MarkdownCodeBlock` renders through Shiki with
`catppuccin-latte` in light mode and `catppuccin-mocha` in dark mode so the
syntax palette matches the rest of the repo. Its copy action uses the button
itself as the tooltip trigger. Highlighted blocks render one numbered row per
code line, show the detected language in a compact header, and can display an
optional `filename` such as `app/layout.tsx`. Markdown links, alerts, toggles,
and copy actions use the shared Hugeicons exports from `@bubbles/ui`.
Nested markdown lists add extra inline spacing per level so bullets, ordered
markers, and inline-code chips remain readable in dense technical content.
`MarkdownToggle` is backed by the shared Base UI collapsible wrapper and styles
its open state from Base UI `data-open` attributes. Its panel height transitions
from Base UI's `--collapsible-panel-height` CSS variable so closed toggles do
not leave invisible layout space behind.

`MdxRenderer` is a client component. It therefore compiles with the
client-safe `previewComponents` registry by default, so saved MDX strings can
render markdown images without tripping async server-component errors in client
runtime paths such as previews or interactive app shells.

For client-only MDX compilation flows such as the shared editor live preview,
use `previewComponents`. It mirrors the default registry but swaps the async
server-side `MarkdownImage` path for a synchronous preview-safe image component.

Override or extend the default MDX registry per render:

```tsx
import { MdxRenderer } from '@bubbles/markdown-renderer';

export function ArticleBody({ content }: { content: string }) {
  return (
    <MdxRenderer
      content={content}
      components={{
        h1: (props) => <h1 className="text-5xl text-balance" {...props} />,
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
