'use client';

import type EditorJS from '@editorjs/editorjs';
import type { API, OutputData } from '@editorjs/editorjs';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';

import { EditorForm } from './editor-form';
import { PreviewPane } from './preview-pane';
import {
  normalizeInitialEditorData,
  normalizeInitialFormData,
  shouldSkipInitialCleanup,
} from '../lib/editor-content';
import { loadCreateDraft, loadEditDraft } from '../lib/draft-storage';
import {
  buildEditorTools,
  loadEditorToolRegistry,
  resolveDefaultBlock,
  resolvePluginKeys,
} from '../lib/editor-tools';
import { loadEditorJs } from '../lib/load-editorjs';
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
  isEditMode = false,
  onChange,
  onReady,
  onSuccess,
  placeholder = 'Schreibe deinen Inhalt hier...',
  plugins,
  readOnly = false,
  renderForm,
}: MarkdownEditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  const cleanupHasRunOnceRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const editorOutputRef = useRef<() => Promise<OutputData | undefined>>(
    async () => undefined
  );
  const previousBlockCountRef = useRef(0);
  const [resolvedInitialData, setResolvedInitialData] = useState(initialData);
  const [draftResolved, setDraftResolved] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const normalizedInitialEditorData = useMemo(
    () => normalizeInitialEditorData(resolvedInitialData),
    [resolvedInitialData]
  );
  const normalizedInitialFormData = useMemo(
    () => normalizeInitialFormData(resolvedInitialData),
    [resolvedInitialData]
  );
  const defaultFormKey = useMemo(
    () =>
      JSON.stringify({
        blockCount: normalizedInitialEditorData.blocks.length,
        description: normalizedInitialFormData?.description ?? '',
        slug: normalizedInitialFormData?.slug ?? '',
        status: normalizedInitialFormData?.status ?? 'unpublished',
        tags: normalizedInitialFormData?.tags ?? [],
        title: normalizedInitialFormData?.title ?? '',
      }),
    [normalizedInitialEditorData.blocks.length, normalizedInitialFormData]
  );
  const [editorContent, setEditorContent] = useState<OutputData | null>(
    normalizedInitialEditorData
  );

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
    setDraftResolved(false);
    setResolvedInitialData(
      (isEditMode ? loadEditDraft() : loadCreateDraft()) ?? initialData
    );
    setDraftResolved(true);
  }, [initialData, isEditMode]);

  useEffect(() => {
    setEditorContent(normalizedInitialEditorData);
    previousBlockCountRef.current = normalizedInitialEditorData.blocks.length;

    if (!editorRef.current) {
      setEditorReady(false);
    }
  }, [normalizedInitialEditorData]);

  useEffect(() => {
    const editorInstance = editorRef.current;

    if (!editorInstance) {
      return;
    }

    let cancelled = false;

    void editorInstance.isReady
      .then(async () => {
        if (cancelled || editorRef.current !== editorInstance) {
          return;
        }

        await editorInstance.render(normalizedInitialEditorData);

        if (cancelled || editorRef.current !== editorInstance) {
          return;
        }

        setEditorContent(normalizedInitialEditorData);
        setEditorReady(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [normalizedInitialEditorData]);

  useEffect(() => {
    let cancelled = false;

    if (!holderRef.current) {
      return;
    }

    if (editorRef.current) {
      return;
    }

    const initializeEditor = async () => {
      const [EditorJs, toolRegistry] = await Promise.all([
        loadEditorJs(),
        loadEditorToolRegistry(activePluginKeys),
      ]);

      if (cancelled || !holderRef.current || editorRef.current) {
        return;
      }

      const editor = new EditorJs({
        autofocus,
        data: normalizedInitialEditorData,
        defaultBlock: resolveDefaultBlock(activePluginKeys),
        holder: holderRef.current,
        onReady: () => {
          previousBlockCountRef.current = normalizedInitialEditorData.blocks.length;
          setEditorReady(true);
          onReadyRef.current?.(editor);
        },
        async onChange(api: API) {
          try {
            const output = await api.saver.save();

            setEditorContent(output as OutputData);
            onChangeRef.current?.(output as OutputData);

            const currentBlockCount = output.blocks?.length ?? 0;
            if (
              currentBlockCount > previousBlockCountRef.current &&
              editorScrollRef.current
            ) {
              editorScrollRef.current.scrollTop =
                editorScrollRef.current.scrollHeight;
            }

            previousBlockCountRef.current = currentBlockCount;
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
        setEditorReady(false);
        return;
      }

      void editorInstance.isReady
        .then(() => {
          editorInstance.destroy();
          setEditorReady(false);

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
    normalizedInitialEditorData,
    placeholder,
    readOnly,
  ]);

  useEffect(() => {
    editorOutputRef.current = async (): Promise<OutputData | undefined> => {
      if (!editorRef.current || typeof editorRef.current.save !== 'function') {
        return editorContent ?? undefined;
      }

      try {
        return await editorRef.current.save();
      } catch {
        return editorContent ?? undefined;
      }
    };
  }, [editorContent]);

  const editorOutput = async (): Promise<OutputData | undefined> => {
    return editorOutputRef.current();
  };

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="min-h-[60dvh]">
        <CardHeader>
          <CardTitle>Editor</CardTitle>
          <CardDescription>
            Compose content with the shared EditorJS toolset.
          </CardDescription>
        </CardHeader>
        <CardContent
          ref={editorScrollRef}
          className="max-h-[60dvh] overflow-y-auto overscroll-contain"
        >
          <div
            ref={holderRef}
            className={className}
            data-testid="markdown-editor"
          />
        </CardContent>
      </Card>
      <PreviewPane
        editorContent={editorContent}
        editorHolderRef={holderRef}
        editorScrollRef={editorScrollRef}
      />
      {readOnly || !draftResolved ? null : renderForm ? (
        <div className="xl:col-span-2">
          {/* The render prop is the public API for custom forms; invoking it here is intentional. */}
          {/* eslint-disable-next-line react-hooks/refs */}
          {renderForm({
            editorOutput,
            editorContent,
            editorReady,
            initialData: normalizedInitialFormData,
            isEditMode,
          })}
        </div>
      ) : (
        <div className="xl:col-span-2">
          <EditorForm
            key={defaultFormKey}
            editorOutput={editorOutput}
            editorContent={editorContent}
            editorReady={editorReady}
            initialData={normalizedInitialFormData}
            isEditMode={isEditMode}
            onSuccess={onSuccess}
          />
        </div>
      )}
    </section>
  );
}
