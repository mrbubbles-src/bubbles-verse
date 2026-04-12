'use client';

import type EditorJS from '@editorjs/editorjs';
import type { API, OutputData } from '@editorjs/editorjs';

import { useEffect, useMemo, useRef, useState } from 'react';

import { EditorForm } from './editor-form';
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
  const cleanupHasRunOnceRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const editorOutputRef = useRef<() => Promise<OutputData | undefined>>(
    async () => undefined
  );
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
          setEditorReady(true);
          onReadyRef.current?.(editor);
        },
        async onChange(api: API) {
          try {
            const output = await api.saver.save();

            setEditorContent(output as OutputData);
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
    <section className="flex flex-col gap-4">
      <div ref={holderRef} className={className} data-testid="markdown-editor" />
      {readOnly || !draftResolved ? null : renderForm ? (
        // The render prop is the public API for custom forms; invoking it here is intentional.
        // eslint-disable-next-line react-hooks/refs
        renderForm({
          editorOutput,
          editorContent,
          editorReady,
          initialData: normalizedInitialFormData,
          isEditMode,
        })
      ) : (
        <EditorForm
          key={defaultFormKey}
          editorOutput={editorOutput}
          editorContent={editorContent}
          editorReady={editorReady}
          initialData={normalizedInitialFormData}
          isEditMode={isEditMode}
          onSuccess={onSuccess}
        />
      )}
    </section>
  );
}
