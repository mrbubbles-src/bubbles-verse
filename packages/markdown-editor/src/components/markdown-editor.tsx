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
import { cn } from '@bubbles/ui/lib/utils';

import { EditorForm } from './editor-form';
import {
  ImportMarkdownModal,
  type ImportMarkdownModalHandle,
} from './import-markdown-modal';
import { PreviewPane } from './preview-pane';
import {
  normalizeInitialEditorData,
  normalizeInitialFormData,
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
  slugStrategy,
  slugStrategyContext,
}: MarkdownEditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement | null>(null);
  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  const importModalRef = useRef<ImportMarkdownModalHandle>(null);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const editorTeardownRef = useRef<Promise<void>>(Promise.resolve());
  const appliedInitialDataRef = useRef<OutputData | null>(null);
  const initialEditorDataRef = useRef<OutputData | null>(null);
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
  const [editorContent, setEditorContent] = useState<OutputData | null>(
    normalizedInitialEditorData
  );

  const activePluginKeys = useMemo(() => resolvePluginKeys(plugins), [plugins]);
  const activePluginSignature = useMemo(
    () => activePluginKeys.join('|'),
    [activePluginKeys]
  );

  /**
   * Queue teardown of the current EditorJS instance before a re-init.
   *
   * @param editorInstance - Live EditorJS instance scheduled for destruction.
   */
  const destroyEditorInstance = (editorInstance: EditorJS | null): void => {
    if (!editorInstance) {
      setEditorReady(false);
      return;
    }

    if (editorRef.current === editorInstance) {
      editorRef.current = null;
    }

    appliedInitialDataRef.current = null;
    setEditorReady(false);

    editorTeardownRef.current = Promise.resolve(editorInstance.isReady)
      .then(() => {
        editorInstance.destroy();
      })
      .catch(() => {});
  };

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
    initialEditorDataRef.current = normalizedInitialEditorData;

    if (!editorRef.current) {
      setEditorReady(false);
    }
  }, [normalizedInitialEditorData]);

  useEffect(() => {
    const editorInstance = editorRef.current;

    if (!editorInstance) {
      return;
    }

    if (appliedInitialDataRef.current === normalizedInitialEditorData) {
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

        appliedInitialDataRef.current = normalizedInitialEditorData;
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
      await editorTeardownRef.current;

      if (cancelled) {
        return;
      }

      const [EditorJs, toolRegistry] = await Promise.all([
        loadEditorJs(),
        loadEditorToolRegistry(activePluginKeys),
      ]);

      if (cancelled || !holderRef.current || editorRef.current) {
        return;
      }

      const initialEditorData = initialEditorDataRef.current ?? {
        blocks: [],
        time: Date.now(),
        version: '2.31.0',
      };
      appliedInitialDataRef.current = initialEditorData;

      const editor = new EditorJs({
        autofocus,
        data: initialEditorData,
        defaultBlock: resolveDefaultBlock(activePluginKeys),
        holder: holderRef.current,
        onReady: () => {
          previousBlockCountRef.current = initialEditorData.blocks.length;
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
      destroyEditorInstance(editorRef.current);
    };
  }, [
    activePluginKeys,
    activePluginSignature,
    autofocus,
    imageUploader,
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

  /**
   * Replace the live EditorJS document with converted Markdown blocks.
   *
   * The import modal feeds converted `OutputData` back into the editor so the
   * portal reference flow can replace content without reloading the component.
   *
   * @param data - Imported EditorJS output produced by the Markdown converter.
   * @returns Promise that settles once the editor content has been replaced.
   */
  const handleMarkdownImport = async (data: OutputData): Promise<void> => {
    if (!editorRef.current) {
      return;
    }

    try {
      await editorRef.current.isReady;
      await editorRef.current.blocks.render(data);
      setEditorContent(data);
      previousBlockCountRef.current = data.blocks?.length ?? 0;
    } catch {
      /* Import failures should leave the current editor content untouched. */
    }
  };

  const hasExistingContent = (editorContent?.blocks?.length ?? 0) > 0;

  return (
    <section className="markdown-editor-shell grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="markdown-editor-pane min-h-[60dvh]">
        <CardHeader className="markdown-editor-pane__header relative">
          <ImportMarkdownModal
            ref={importModalRef}
            hasExistingContent={hasExistingContent}
            onImport={handleMarkdownImport}
          />
          <CardTitle>Editor</CardTitle>
          <CardDescription>
            Compose content with the shared EditorJS toolset.
          </CardDescription>
        </CardHeader>
        <CardContent
          ref={editorScrollRef}
          className="markdown-editor-pane__content max-h-[60dvh] overflow-y-auto overscroll-contain"
        >
          <div
            ref={holderRef}
            className={cn('markdown-editor-holder', className)}
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
            editorOutput={editorOutput}
            editorContent={editorContent}
            editorReady={editorReady}
            initialData={normalizedInitialFormData}
            isEditMode={isEditMode}
            onSuccess={onSuccess}
            slugStrategy={slugStrategy}
            slugStrategyContext={slugStrategyContext}
          />
        </div>
      )}
    </section>
  );
}
