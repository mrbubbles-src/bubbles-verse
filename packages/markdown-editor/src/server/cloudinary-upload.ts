import { createHash } from 'node:crypto';

import type { MarkdownEditorImageUploadResponse } from '../types/editor';

type CloudinaryErrorShape = {
  error?: {
    http_code?: number;
    message?: string;
  };
  http_code?: number;
  message?: string;
};

type UploadFileShape = File & {
  arrayBuffer: () => Promise<ArrayBuffer>;
  name: string;
  type: string;
};

export type CloudinaryUploadApiResponse = {
  height: number;
  original_filename: string;
  public_id: string;
  secure_url: string;
  width: number;
};

export type UploadEditorImageToCloudinaryOptions = {
  folder: string;
};

/**
 * Read the repo-standard Cloudinary env vars for server-side uploads.
 *
 * @returns Normalized Cloudinary config for signed uploads.
 * @throws When one or more required env vars are missing.
 */
export function resolveCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Missing Cloudinary configuration. Expected NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  return {
    apiKey,
    apiSecret,
    cloudName,
  };
}

/**
 * Check whether a `formData.get()` value behaves like an uploaded file.
 *
 * @param value - Raw form-data entry returned from the request.
 * @returns True when the value exposes the file methods needed for upload.
 */
export function isUploadFile(
  value: FormDataEntryValue | null
): value is UploadFileShape {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    typeof value.arrayBuffer === 'function' &&
    'name' in value &&
    typeof value.name === 'string'
  );
}

/**
 * Normalize Cloudinary or runtime errors into a stable status/message pair.
 *
 * @param error - Unknown runtime error thrown during upload.
 * @returns User-facing message plus HTTP status.
 */
export function resolveCloudinaryErrorResponse(error: unknown): {
  message: string;
  status: number;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const cloudinaryError = error as CloudinaryErrorShape;
    const nestedMessage = cloudinaryError.error?.message?.trim();
    const directMessage = cloudinaryError.message?.trim();
    const status =
      cloudinaryError.error?.http_code ?? cloudinaryError.http_code ?? 500;

    if (nestedMessage || directMessage) {
      return {
        message: nestedMessage ?? directMessage ?? 'Cloudinary upload failed.',
        status,
      };
    }
  }

  return {
    message: 'Cloudinary upload failed.',
    status: 500,
  };
}

/**
 * Format a Cloudinary upload result for the EditorJS image tool contract.
 *
 * @param uploadResult - Successful Cloudinary upload payload.
 * @returns EditorJS image-tool response body.
 */
export function createEditorImageUploadResponse(
  uploadResult: CloudinaryUploadApiResponse
): MarkdownEditorImageUploadResponse {
  return {
    file: {
      height: uploadResult.height,
      original_filename: uploadResult.original_filename,
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      width: uploadResult.width,
    },
    success: 1,
  };
}

/**
 * Build the Cloudinary signature string from sorted upload params.
 *
 * Cloudinary expects signed API params as `key=value` pairs sorted
 * alphabetically, joined with `&`, and suffixed with the API secret before the
 * SHA-1 hash is generated.
 *
 * @param params - Signed upload params excluding `file`, `api_key`, and `signature`.
 * @param apiSecret - Server-only Cloudinary API secret.
 * @returns Hex-encoded Cloudinary request signature.
 */
function createCloudinarySignature(
  params: Record<string, string>,
  apiSecret: string
): string {
  const signatureBase = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1')
    .update(`${signatureBase}${apiSecret}`)
    .digest('hex');
}

/**
 * Check whether the Cloudinary success payload contains the fields the editor
 * renderer persists and later reuses.
 *
 * @param value - Parsed JSON payload returned by Cloudinary.
 * @returns True when the payload looks like a successful image upload.
 */
function isCloudinaryUploadApiResponse(
  value: unknown
): value is CloudinaryUploadApiResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.height === 'number' &&
    typeof record.original_filename === 'string' &&
    typeof record.public_id === 'string' &&
    typeof record.secure_url === 'string' &&
    typeof record.width === 'number'
  );
}

/**
 * Upload an image file to Cloudinary through the signed Upload API.
 *
 * The Cloudinary Node SDK stream path intermittently misclassifies some files
 * as unsigned when the app runs under Bun. Using the documented signed REST
 * upload flow keeps the request portable across Bun and Node while preserving
 * the same server-side trust boundary.
 *
 * @param file - Browser file entry from a multipart request.
 * @param options - Concrete Cloudinary target folder.
 * @returns Successful Cloudinary upload payload.
 */
export async function uploadEditorImageToCloudinary(
  file: UploadFileShape,
  options: UploadEditorImageToCloudinaryOptions
): Promise<CloudinaryUploadApiResponse> {
  const { apiKey, apiSecret, cloudName } = resolveCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams = {
    folder: options.folder,
    timestamp,
  };
  const signature = createCloudinarySignature(signedParams, apiSecret);
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('api_key', apiKey);
  formData.append('folder', options.folder);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });
  const responseBody = (await response.json()) as
    | CloudinaryErrorShape
    | CloudinaryUploadApiResponse;

  if (!response.ok) {
    throw responseBody;
  }

  if (!isCloudinaryUploadApiResponse(responseBody)) {
    throw new Error('Cloudinary upload response shape is invalid.');
  }

  return responseBody;
}
