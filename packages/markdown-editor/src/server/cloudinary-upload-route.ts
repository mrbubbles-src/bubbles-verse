import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

import type { MarkdownEditorImageUploadResponse } from '../types/editor';

type CloudinaryUploadAuthorize = (
  request: Request
) => Response | void | Promise<Response | void>;

export type CreateCloudinaryUploadRouteOptions = {
  authorize?: CloudinaryUploadAuthorize;
  folder: string;
};

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
};

/**
 * Read the repo-standard Cloudinary env vars for server-side uploads.
 *
 * @returns Cloudinary config values expected by the shared upload route.
 * @throws When one or more required env vars are missing.
 */
function resolveCloudinaryConfig() {
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
 * Extract a stable filename override from the uploaded file name.
 *
 * @param file - Uploaded image file from the route request.
 * @returns Filename stem without the extension when available.
 */
function resolveFilenameOverride(file: File): string | undefined {
  const stem = file.name.replace(/\.[^.]+$/, '').trim();
  return stem.length > 0 ? stem : undefined;
}

/**
 * Check whether a `formData.get()` value behaves like an uploaded file.
 *
 * Different runtimes may provide different concrete `File` implementations, so
 * the shared route validates the capability shape instead of relying on a
 * single `instanceof` check.
 *
 * @param value - Raw form-data entry returned from the request.
 * @returns True when the value exposes the file methods needed for upload.
 */
function isUploadFile(value: FormDataEntryValue | null): value is UploadFileShape {
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
 * Normalize Cloudinary or runtime errors into a user-facing message.
 *
 * @param error - Unknown runtime error thrown during upload.
 * @returns Stable status/message pair for the route response.
 */
function resolveErrorResponse(error: unknown): {
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
 * Create a Next-compatible POST handler for EditorJS image uploads.
 *
 * Apps keep ownership of the concrete route path and optional auth policy,
 * while the package standardizes env resolution, Cloudinary upload handling,
 * and the EditorJS image-tool response shape.
 *
 * @param options - Folder target plus optional authorization short-circuit.
 * @returns Async POST handler that can be exported from a Next route file.
 */
export function createCloudinaryUploadRoute(
  options: CreateCloudinaryUploadRouteOptions
): (request: Request) => Promise<Response> {
  return async function POST(request: Request): Promise<Response> {
    const authorizationResponse = await options.authorize?.(request);

    if (authorizationResponse instanceof Response) {
      return authorizationResponse;
    }

    try {
      const formData = await request.formData();
      const image = formData.get('image');

      if (!isUploadFile(image)) {
        return Response.json(
          {
            message: 'No file uploaded.',
            success: 0,
          },
          { status: 400 }
        );
      }

      const { apiKey, apiSecret, cloudName } = resolveCloudinaryConfig();
      const imageBytes = new Uint8Array(await image.arrayBuffer());

      cloudinary.config({
        api_key: apiKey,
        api_secret: apiSecret,
        cloud_name: cloudName,
      });

      const uploadResult = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                filename_override: resolveFilenameOverride(image),
                folder: options.folder,
              },
              (error, result) => {
                if (error || !result) {
                  reject(error ?? new Error('Cloudinary upload failed.'));
                  return;
                }

                resolve(result);
              }
            )
            .end(imageBytes);
        }
      );

      const responseBody: MarkdownEditorImageUploadResponse = {
        file: {
          height: uploadResult.height,
          original_filename: uploadResult.original_filename,
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
          width: uploadResult.width,
        },
        success: 1,
      };

      return Response.json(responseBody);
    } catch (error) {
      const { message, status } = resolveErrorResponse(error);

      return Response.json(
        {
          message,
          success: 0,
        },
        { status }
      );
    }
  };
}
