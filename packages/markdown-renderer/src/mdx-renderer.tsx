'use client';

import type { ComponentType } from 'react';

import { useEffect, useState } from 'react';
import * as runtime from 'react/jsx-runtime';

import { evaluate } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';

import { previewComponents } from './default-components';
import type { MdxRendererComponents } from './types/mdx-components';

type EvaluatedMdxComponent = ComponentType<Record<string, never>>;
type MdxRendererState =
  | {
      status: 'idle';
    }
  | {
      status: 'error';
      content: string;
      components: MdxRendererComponents | undefined;
      error: Error;
    }
  | {
      status: 'ready';
      content: string;
      components: MdxRendererComponents | undefined;
      Compiled: EvaluatedMdxComponent;
    };

export type MdxRendererProps = {
  content: string;
  components?: MdxRendererComponents;
};

/**
 * Compile stored MDX at runtime with the extracted reference pipeline.
 *
 * Use this when MDX already exists as a string and should render with the
 * package defaults, while still allowing local overrides or custom tags.
 *
 * @param props - MDX source plus optional component overrides and extensions.
 * @returns Rendered MDX output, a local error state, or `null` while compiling.
 */
export function MdxRenderer({ content, components }: MdxRendererProps) {
  const [state, setState] = useState<MdxRendererState>({
    status: 'idle',
  });

  useEffect(() => {
    let cancelled = false;

    async function compileContent() {
      try {
        const mergedComponents = components
          ? { ...previewComponents, ...components }
          : previewComponents;
        const evaluated = await evaluate(content, {
          ...runtime,
          remarkPlugins: [remarkGfm],
          useMDXComponents: () => mergedComponents,
        });

        if (cancelled) {
          return;
        }

        setState({
          status: 'ready',
          content,
          components,
          Compiled: evaluated.default as EvaluatedMdxComponent,
        });
      } catch (value) {
        if (cancelled) {
          return;
        }

        setState({
          status: 'error',
          content,
          components,
          error:
            value instanceof Error
              ? value
              : new Error('Unknown MDX compilation error.'),
        });
      }
    }

    void compileContent();

    return () => {
      cancelled = true;
    };
  }, [components, content]);

  if (
    state.status === 'error' &&
    state.content === content &&
    state.components === components
  ) {
    return (
      <section data-state="error" role="status">
        <p>{`Failed to render markdown: ${state.error.message}`}</p>
      </section>
    );
  }

  if (
    state.status !== 'ready' ||
    state.content !== content ||
    state.components !== components
  ) {
    return null;
  }

  return <state.Compiled />;
}
