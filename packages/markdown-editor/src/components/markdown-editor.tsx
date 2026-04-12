'use client';

import type EditorJS from '@editorjs/editorjs';
import type { API, OutputData } from '@editorjs/editorjs';

import { useEffect, useMemo, useRef } from 'react';

import { normalizeInitialEditorData, shouldSkipInitialCleanup } from '../lib/editor-content';
import {
  buildEditorTools,
  loadEditorToolRegistry,
  resolveDefaultBlock,
  resolvePluginKeys,
} from '../lib/editor-tools';
import type { MarkdownEditorProps } from '../types/editor';

/**
 * Shared EditorJS wrapper for markdown authoring surfaces.
 *
 * Render this client component in apps that need the shared EditorJS setup with
 * the full reference toolset or a subset chosen via `plugins`.
 *
 * @param props - Editor wrapper props and optional tool subset.
 * @returns Holder element used by EditorJS.
 */
export function MarkdownEditor({
  autofocus = true,
  className,
  imageUploader,
  initialData,
  onChange,
  onReady,
  placeholder = 'Schreibe deinen Inhalt hier...',
  plugins,
  readOnly = false,
}: MarkdownEditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const cleanupHasRunOnceRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);

  const activePluginKeys = useMemo(() => resolvePluginKeys(plugins), [plugins]);
  const activePluginSignature = useMemo(
    () => activePluginKeys.join('|'),
    [activePluginKeys]
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    let cancelled = false;

    if (!holderRef.current) {
      return;
    }

    if (editorRef.current) {
      return;
    }

    const initializeEditor = async () => {
      const [{ default: EditorJs }, toolRegistry] = await Promise.all([
        import('@editorjs/editorjs'),
        loadEditorToolRegistry(activePluginKeys),
      ]);

      if (cancelled || !holderRef.current || editorRef.current) {
        return;
      }

      const initialEditorData = normalizeInitialEditorData(initialData);
      const editor = new EditorJs({
        autofocus,
        data: initialEditorData,
        defaultBlock: resolveDefaultBlock(activePluginKeys),
        holder: holderRef.current,
        onReady: () => {
          onReadyRef.current?.(editor);
        },
        async onChange(api: API) {
          try {
            const output = await api.saver.save();

            onChangeRef.current?.(output as OutputData);
          } catch {
            /* Save failures are non-fatal during typing. */
          }
        },
        placeholder,
        readOnly,
        tools: buildEditorTools(activePluginKeys, toolRegistry, imageUploader),
      });

      editorRef.current = editor;
    };

    void initializeEditor();

    return () => {
      cancelled = true;

      if (shouldSkipInitialCleanup(cleanupHasRunOnceRef.current)) {
        cleanupHasRunOnceRef.current = true;
        return;
      }

      const editorInstance = editorRef.current;

      if (!editorInstance?.isReady) {
        editorRef.current = null;
        return;
      }

      void editorInstance.isReady
        .then(() => {
          editorInstance.destroy();

          if (editorRef.current === editorInstance) {
            editorRef.current = null;
          }
        })
        .catch(() => {});
    };
  }, [
    activePluginKeys,
    activePluginSignature,
    autofocus,
    imageUploader,
    initialData,
    placeholder,
    readOnly,
  ]);

  return <div ref={holderRef} className={className} data-testid="markdown-editor" />;
}
