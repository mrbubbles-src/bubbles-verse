'use client';

import type { OutputData } from '@editorjs/editorjs';
import type { RefObject } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';
import { MdxRenderer } from '@bubbles/markdown-renderer';
import { useMemo, useRef } from 'react';

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

  useScrollSync({
    editorScrollRef,
    previewScrollRef,
    editorHolderRef,
    blockIds,
    enabled: blockIds.length > 0,
    direction: 'bidirectional',
    contentVersion: mdxContent,
    anchorRatio: 0.35,
  });

  return (
    <Card className="min-h-[60dvh]">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
        <CardDescription>
          Rendered from the current EditorJS output through the shared MDX
          pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent
        ref={previewScrollRef}
        className="max-h-[60dvh] overflow-y-auto overscroll-contain"
        data-testid="markdown-editor-preview"
      >
        <div className="markdown-editor-preview-content">
          <MdxRenderer content={mdxContent} />
        </div>
      </CardContent>
    </Card>
  );
}
