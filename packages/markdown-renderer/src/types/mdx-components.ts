/**
 * Typed shape of the package-provided MDX component registry.
 *
 * Use this when wiring the exported defaults into an app-level
 * `mdx-components.tsx` file.
 */
export type MarkdownComponents =
  typeof import('../default-components').defaultComponents;
