---
story_id: '2.2'
story_key: '2-2-mdxrenderer-component'
epic: 'Epic 2 — MDX Renderer & Default Components'
status: ready-for-dev
created: 2026-04-12
---

# Story 2.2 — `<MdxRenderer>` Component

## User Story

As a developer,
I want a `<MdxRenderer>` component that compiles and renders stored MDX at runtime,
So that I can display rich content with a single import and no editor dependency.

---

## Context

`<MdxRenderer>` is the primary public component of `@bubbles/markdown-renderer`. It takes a stored MDX string, compiles it at runtime using `@mdx-js/mdx`'s `evaluate()` function, and renders the result with the default `Markdown*` components pre-wired.

The reference implementation (`lms-ref`) uses `next-mdx-remote-client` — this package replaces that with direct `@mdx-js/mdx` usage for fewer dependencies and more control. The compilation approach is `evaluate()` (runtime, not build-time).

**Prerequisite:** Story 2.1 (default components) complete.

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref` or `to-be-integrated` or `/apps/the-coding-vault`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

## Acceptance Criteria

```gherkin
Given a stored MDX string and <MdxRenderer> imported from @bubbles/markdown-renderer
When I render <MdxRenderer content={mdxString} />
Then the MDX is compiled at runtime using @mdx-js/mdx with remark-gfm
And all default Markdown* components are available automatically without manual registration
And a developer can override or extend individual components via the components prop map
And compilation errors are caught and surfaced as an error state — never thrown to the React error boundary
And @bubbles/markdown-renderer has zero dependency on @bubbles/markdown-editor
```

---

## Implementation Guide

### 1. Props Interface

```ts
import type { ComponentType } from 'react';

interface MdxRendererProps {
  /** Stored MDX string to compile and render. */
  content: string;
  /**
   * Override or extend default Markdown* components.
   * Keys must match the component names used in MDX output.
   * Default components are always available; this prop extends/overrides them.
   */
  components?: Record<string, ComponentType<Record<string, unknown>>>;
}
```

### 2. Runtime MDX Compilation with `evaluate()`

```ts
import * as runtime from 'react/jsx-runtime';

import { evaluate } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';

import { defaultComponents } from './components';

async function compileMdx(
  content: string,
  components?: MdxRendererProps['components']
) {
  const { default: Content } = await evaluate(content, {
    ...runtime,
    remarkPlugins: [remarkGfm],
  });

  const mergedComponents = {
    ...defaultComponents,
    ...components, // consumer overrides take precedence
  };

  return { Content, mergedComponents };
}
```

### 3. Error Handling — Never Throw

Wrap `evaluate()` in try/catch. On error, render a graceful error state — do not rethrow to the React error boundary (NFR2):

```ts
'use client'; // MdxRenderer needs client-side rendering for dynamic compilation

const [result, setResult] = useState<{ Content: ComponentType; components: Record<string, ComponentType> } | null>(null);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  compileMdx(content, components)
    .then(setResult)
    .catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'MDX compilation failed');
    });
}, [content, components]);

if (error) {
  return (
    <div role="alert" className="...">
      <p>Failed to render content.</p>
      {process.env.NODE_ENV === 'development' && <pre>{error}</pre>}
    </div>
  );
}
```

### 4. Client vs Server Component

`evaluate()` from `@mdx-js/mdx` is async and works in both RSC and client components. However, for dynamic content that changes post-hydration, a client component with `useEffect` is simpler and avoids streaming complexity. Use `'use client'` directive.

For static pages (Vault entry), the parent Server Component can pre-fetch and pass the MDX string; `<MdxRenderer>` handles the runtime compilation client-side.

### 5. Dependencies to Add to `packages/markdown-renderer/package.json`

```json
"@mdx-js/mdx": "^3.1.0",
"remark-gfm": "^4.0.1",
"unified": "^11.0.5"
```

Verify exact versions from `lms-ref`. `unified` may not need to be a direct dependency if `@mdx-js/mdx` brings it transitively — check after install.

### 6. File Location

`packages/markdown-renderer/src/mdx-renderer.tsx`

Export from `src/index.ts` as part of the public API.

---

## Anti-Patterns to Avoid

- **Never rethrow compilation errors** to the React error boundary — always catch and render error state.
- **Never import from `@bubbles/markdown-editor`.** The renderer has zero editor dependency (FR26, NFR validation).
- **Do not use `compileMDX` from `next-mdx-remote-client`.** Use `evaluate()` from `@mdx-js/mdx` directly — fewer deps, more control.
- **Do not hardcode the defaultComponents map inline** in this file — import from `./components` to keep them tree-shakeable.

---

## Verification Checklist

- [ ] `<MdxRenderer content={...} />` renders MDX without manual component registration
- [ ] `components` prop correctly overrides individual components while keeping defaults
- [ ] Compilation error renders error state, does not throw
- [ ] No import from `@bubbles/markdown-editor` anywhere in `packages/markdown-renderer`
- [ ] `remark-gfm` applied (tables, strikethrough, task lists render correctly)
- [ ] `bun run typecheck` passes

---

## Dev Notes

_To be filled in during implementation._
