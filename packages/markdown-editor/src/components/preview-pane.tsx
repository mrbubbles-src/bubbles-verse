'use client';

import type { OutputData } from '@editorjs/editorjs';
import type { ComponentType, RefObject } from 'react';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as runtime from 'react/jsx-runtime';

import { previewComponents } from '@bubbles/markdown-renderer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';
import { evaluate } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';

import { useScrollSync } from '../hooks/use-scroll-sync';
import { serializeToMdx } from '../lib/serialize-to-mdx';

type PreviewPaneProps = {
  editorContent: OutputData | null;
  editorHolderRef: RefObject<HTMLDivElement | null>;
  editorScrollRef: RefObject<HTMLDivElement | null>;
};

const EMPTY_EDITOR_OUTPUT: OutputData = {
  blocks: [],
  time: 0,
  version: '2.31.0',
};

/**
 * Render the live MDX preview alongside the EditorJS authoring pane.
 *
 * The preview uses the shared serializer plus `@bubbles/markdown-renderer`
 * so package consumers get the same runtime pipeline in every app surface.
 *
 * @param props - Current editor state and DOM refs used for scroll sync.
 * @returns Split-pane preview card.
 */
export function PreviewPane({
  editorContent,
  editorHolderRef,
  editorScrollRef,
}: PreviewPaneProps) {
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const effectiveContent = editorContent ?? EMPTY_EDITOR_OUTPUT;
  const blockIds = useMemo(
    () =>
      effectiveContent.blocks
        .map((block) => block.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    [effectiveContent.blocks]
  );
  const mdxContent = useMemo(
    () => serializeToMdx(effectiveContent),
    [effectiveContent]
  );
  const [Compiled, setCompiled] = useState<ComponentType | null>(null);
  const [compileError, setCompileError] = useState<Error | null>(null);
  const [compiledVersion, setCompiledVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function compilePreview(): Promise<void> {
      try {
        const evaluated = await evaluate(mdxContent, {
          ...runtime,
          remarkPlugins: [remarkGfm],
          useMDXComponents: () => previewComponents,
        });

        if (cancelled) {
          return;
        }

        setCompileError(null);
        setCompiled(() => evaluated.default as ComponentType);
        setCompiledVersion((version) => version + 1);
      } catch (value) {
        if (cancelled) {
          return;
        }

        setCompileError(
          value instanceof Error
            ? value
            : new Error('Unknown markdown preview compilation error.')
        );
      }
    }

    void compilePreview();

    return () => {
      cancelled = true;
    };
  }, [mdxContent]);

  useScrollSync({
    editorScrollRef,
    previewScrollRef,
    editorHolderRef,
    blockIds,
    enabled: blockIds.length > 0 && compiledVersion > 0,
    direction: 'bidirectional',
    contentVersion: compiledVersion,
    anchorRatio: 0.35,
  });

  return (
    <Card className="markdown-editor-preview-card min-h-[60dvh]">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
        <CardDescription>
          Rendered from the current EditorJS output through the shared MDX
          pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent
        ref={previewScrollRef}
        className="markdown-editor-preview-scroll max-h-[60dvh] overflow-y-auto overscroll-contain"
        data-testid="markdown-editor-preview">
        <div className="markdown-editor-preview-content">
          {Compiled ? (
            <Compiled />
          ) : compileError ? (
            <section data-state="error" role="status">
              <p>{`Failed to render markdown preview: ${compileError.message}`}</p>
            </section>
          ) : (
            <div
              aria-hidden="true"
              className="mx-auto my-4 h-48 w-full max-w-3xl animate-pulse rounded-md bg-muted"
              data-testid="markdown-editor-preview-loading"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
