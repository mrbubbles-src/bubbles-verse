'use client';

import type { OutputData } from '@editorjs/editorjs';
import type { ChangeEvent, DragEvent } from 'react';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  AlertCircleIcon,
  Cancel01Icon,
  File01Icon,
  FileDownIcon,
  HugeiconsIcon,
  Upload01Icon,
} from '@bubbles/ui/lib/hugeicons';
import { Button } from '@bubbles/ui/shadcn/button';
import { CardContent, CardHeader, CardTitle } from '@bubbles/ui/shadcn/card';
import { Separator } from '@bubbles/ui/shadcn/separator';

import type { ConversionResult } from '../lib/convert-markdown-to-editor-js';
import { convertMarkdownToEditorJs } from '../lib/convert-markdown-to-editor-js';

type ImportMarkdownModalProps = {
  hasExistingContent: boolean;
  onImport: (data: OutputData) => void;
};

export type ImportMarkdownModalHandle = {
  openWithFile: (file: File) => void;
};

const MAX_FILE_SIZE_BYTES = 1024 * 1024;
const VALID_EXTENSIONS = ['.md', '.mdx', '.markdown'];

/**
 * Validate the selected import file before conversion starts.
 *
 * @param file - Markdown file selected by the author.
 * @returns Error text when invalid, otherwise `null`.
 */
function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File size exceeds 1MB limit. Selected file: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
  }

  const hasValidExtension = VALID_EXTENSIONS.some((extension) => {
    return file.name.toLowerCase().endsWith(extension);
  });

  if (!hasValidExtension) {
    return 'Please select a valid Markdown file (.md, .mdx, .markdown)';
  }

  return null;
}

/**
 * Portal-ref style modal for replacing the current editor content from a
 * Markdown file import.
 *
 * The trigger surface supports both click-to-open and drag-and-drop. Once a
 * file is selected, the modal previews block counts and follow-up warnings
 * before the replacement is confirmed.
 *
 * @param props - Existing-content flag plus import callback.
 * @param ref - Imperative handle used by the trigger drop zone.
 * @returns Import trigger plus modal dialog.
 */
export const ImportMarkdownModal = forwardRef<
  ImportMarkdownModalHandle,
  ImportMarkdownModalProps
>(function ImportMarkdownModal({ hasExistingContent, onImport }, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const resetState = (): void => {
    setSelectedFile(null);
    setConversionResult(null);
    setError(null);
    setShowConfirmation(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openModal = (): void => {
    dialogRef.current?.showModal();
  };

  const closeModal = (): void => {
    dialogRef.current?.close();
    resetState();
  };

  /**
   * Validate and convert a selected Markdown file.
   *
   * @param file - File selected from the file picker or drop zone.
   * @returns Promise that settles after conversion state is updated.
   */
  const processFile = useCallback(async (file: File): Promise<void> => {
    setError(null);
    setConversionResult(null);
    setShowConfirmation(false);

    const validationError = validateFile(file);
    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      setConversionResult(convertMarkdownToEditorJs(text));
    } catch (conversionError) {
      setError(
        `Failed to parse markdown: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`
      );
    }
  }, []);

  /**
   * Open the modal with an already dropped file.
   *
   * @param file - Markdown file dropped onto the trigger surface.
   * @returns Promise that settles after the file has been processed.
   */
  const openWithFile = useCallback(
    async (file: File): Promise<void> => {
      openModal();
      await processFile(file);
    },
    [processFile]
  );

  useImperativeHandle(ref, () => ({
    openWithFile,
  }));

  useEffect(() => {
    dialogRef.current?.setAttribute('closedby', 'any');
  }, []);

  const isMarkdownFile = useCallback((file: File): boolean => {
    return VALID_EXTENSIONS.some((extension) => {
      return file.name.toLowerCase().endsWith(extension);
    });
  }, []);

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    await processFile(file);
  };

  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      const file = event.dataTransfer.files[0];
      if (file && isMarkdownFile(file)) {
        void openWithFile(file);
      }
    },
    [isMarkdownFile, openWithFile]
  );

  const handleImportClick = (): void => {
    if (hasExistingContent && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    if (!conversionResult) {
      return;
    }

    onImport(conversionResult.data);
    closeModal();
  };

  return (
    <>
      <div className="markdown-editor-import-controls">
        <div
          className={`markdown-editor-import-trigger${isDragging ? 'markdown-editor-import-trigger--dragging' : ''}`}
          onClick={openModal}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          title="Markdown-Datei hierher ziehen oder klicken">
          <HugeiconsIcon
            aria-hidden
            className="size-4"
            icon={FileDownIcon}
            strokeWidth={2}
          />
          <span className="hidden sm:inline">.md .mdx .markdown</span>
        </div>

        <Button
          aria-label="Markdown importieren"
          className="markdown-editor-import-button"
          onClick={openModal}
          title="Markdown importieren"
          type="button"
          variant="ghost">
          <HugeiconsIcon aria-hidden icon={Upload01Icon} strokeWidth={2} />
        </Button>
      </div>

      <dialog ref={dialogRef} className="markdown-editor-import-dialog">
        <div className="markdown-editor-import-panel">
          <CardHeader className="relative">
            <Button
              aria-label="Importdialog schließen"
              className="absolute top-2 right-2"
              onClick={closeModal}
              type="button"
              variant="ghost">
              <HugeiconsIcon aria-hidden icon={Cancel01Icon} strokeWidth={2} />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon
                aria-hidden
                className="size-5"
                icon={Upload01Icon}
                strokeWidth={2}
              />
              Markdown importieren
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label
                className="block text-sm font-medium"
                htmlFor="markdown-file">
                Markdown-Datei auswählen
              </label>
              <input
                ref={fileInputRef}
                accept=".md,.mdx,.markdown"
                className="markdown-editor-import-file-input"
                id="markdown-file"
                onChange={handleFileChange}
                type="file"
              />
              <p className="text-xs text-muted-foreground">
                Unterstützte Formate: .md, .mdx, .markdown (max. 1MB)
              </p>
            </div>

            {error ? (
              <div className="markdown-editor-import-callout markdown-editor-import-callout--error">
                <HugeiconsIcon
                  aria-hidden
                  className="size-4 shrink-0"
                  icon={AlertCircleIcon}
                  strokeWidth={2}
                />
                <span>{error}</span>
              </div>
            ) : null}

            {selectedFile && conversionResult ? (
              <>
                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      aria-hidden
                      className="size-4"
                      icon={File01Icon}
                      strokeWidth={2}
                    />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="markdown-editor-import-stat">
                      <span className="text-muted-foreground">Blöcke: </span>
                      <span className="font-semibold">
                        {conversionResult.stats.totalBlocks}
                      </span>
                    </div>
                    {conversionResult.stats.imagePlaceholders > 0 ? (
                      <div className="markdown-editor-import-stat markdown-editor-import-stat--warning">
                        <span>Bilder: </span>
                        <span className="font-semibold">
                          {conversionResult.stats.imagePlaceholders}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {conversionResult.warnings.length > 0 ? (
                    <div className="space-y-2">
                      <p className="flex items-center gap-1 text-xs font-medium text-[var(--markdown-editor-warning)]">
                        <HugeiconsIcon
                          aria-hidden
                          className="size-4"
                          icon={AlertCircleIcon}
                          strokeWidth={2}
                        />
                        Hinweise ({conversionResult.warnings.length})
                      </p>
                      <ul className="markdown-editor-import-warning-list">
                        {conversionResult.warnings.map((warning) => (
                          <li
                            key={`${selectedFile.name}-${warning}`}
                            className="flex items-start gap-1">
                            <span aria-hidden>•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {showConfirmation ? (
                    <div className="markdown-editor-import-callout markdown-editor-import-callout--error">
                      <div>
                        <p className="font-medium">
                          Bestehender Inhalt wird ersetzt!
                        </p>
                        <p>
                          Der aktuelle Editor-Inhalt wird durch den importierten
                          Markdown-Inhalt überschrieben. Diese Aktion kann nicht
                          rückgängig gemacht werden.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button onClick={closeModal} type="button" variant="outline">
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleImportClick}
                    type="button"
                    variant={showConfirmation ? 'destructive' : 'default'}>
                    {showConfirmation ? 'Trotzdem importieren' : 'Importieren'}
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </div>
      </dialog>
    </>
  );
});
