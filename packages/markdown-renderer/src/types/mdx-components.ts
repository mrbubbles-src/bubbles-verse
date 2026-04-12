import type { ElementType } from 'react';

/**
 * Typed shape of the package-provided MDX component registry.
 *
 * Use this when wiring the exported defaults into an app-level
 * `mdx-components.tsx` file.
 */
export type MarkdownComponents =
  typeof import('../default-components').defaultComponents;

/**
 * Component override and extension map accepted by `MdxRenderer`.
 *
 * Use this to replace default HTML mappings such as `h1`, or to register
 * custom MDX tags for a single renderer instance.
 */
export type MdxRendererComponents = Record<string, ElementType>;
