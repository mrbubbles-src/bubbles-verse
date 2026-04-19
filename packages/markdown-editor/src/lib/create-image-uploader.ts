import type {
  MarkdownEditorImageUploader,
  MarkdownEditorImageUploadResponse,
} from '../types/editor';

export type CreateEditorImageUploaderOptions = {
  endpoint: string;
  imageFolder: string;
  folderFieldName?: string;
};

const MIME_TYPE_FILE_EXTENSIONS: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

/**
 * Build a stable filename for blob-based uploads.
 *
 * EditorJS documents `uploadByFile()` around `File` objects, but clipboard or
 * drag-and-drop flows may still hand us a plain `Blob`. Converting those blobs
 * into real `File` instances keeps the multipart payload close to the
 * reference integrations and avoids browser/runtime differences around
 * nameless blob uploads.
 *
 * @param file - Raw upload value received from the image tool.
 * @returns Normalized `File` instance with a deterministic filename.
 */
function normalizeUploadFile(file: Blob | File): File {
  if (file instanceof File) {
    return file;
  }

  const extension = MIME_TYPE_FILE_EXTENSIONS[file.type];
  const filename = extension ? `upload.${extension}` : 'upload';

  return new File([file], filename, {
    type: file.type,
  });
}

/**
 * Create a small EditorJS-compatible image uploader for app-local routes.
 *
 * Apps keep ownership of the actual Next.js route while the package
 * standardizes the client-side `FormData` upload contract.
 *
 * @param options - Upload endpoint and the folder key sent with the file.
 * @returns Image uploader callback for the shared markdown editor.
 */
export function createEditorImageUploader(
  options: CreateEditorImageUploaderOptions
): MarkdownEditorImageUploader {
  const folderFieldName = options.folderFieldName ?? 'imageFolder';

  return async function uploadImage(
    file: Blob | File
  ): Promise<MarkdownEditorImageUploadResponse> {
    const normalizedFile = normalizeUploadFile(file);
    const formData = new FormData();
    formData.append('image', normalizedFile, normalizedFile.name);
    formData.append(folderFieldName, options.imageFolder);

    if (process.env.NODE_ENV !== 'production') {
      console.info('Editor image upload request', {
        endpoint: options.endpoint,
        folderFieldName,
        imageFolder: options.imageFolder,
        name: normalizedFile.name,
        size: normalizedFile.size,
        type: normalizedFile.type,
      });
    }

    const response = await fetch(options.endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      throw new Error(body?.message ?? 'Bild-Upload fehlgeschlagen.');
    }

    return (await response.json()) as MarkdownEditorImageUploadResponse;
  };
}
