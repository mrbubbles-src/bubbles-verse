import {
  createEditorImageUploadResponse,
  isUploadFile,
  resolveCloudinaryErrorResponse,
  uploadEditorImageToCloudinary,
} from './cloudinary-upload';

export {
  createEditorImageUploadResponse,
  isUploadFile,
  resolveCloudinaryConfig,
  resolveCloudinaryErrorResponse as resolveErrorResponse,
  uploadEditorImageToCloudinary as uploadCloudinaryImage,
} from './cloudinary-upload';

type CloudinaryUploadAuthorize = (
  request: Request
) => Response | void | Promise<Response | void>;

export type CreateCloudinaryUploadRouteOptions = {
  authorize?: CloudinaryUploadAuthorize;
  folder: string;
};

/**
 * Backwards-compatible thin route wrapper around the shared Cloudinary helper.
 *
 * Prefer app-local route handlers plus `uploadEditorImageToCloudinary(...)`
 * for new integrations. This wrapper stays available for existing callers.
 *
 * @param options - Fixed upload folder plus optional authorization hook.
 * @returns Async POST handler for Next App Router route files.
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

      const uploadResult = await uploadEditorImageToCloudinary(image, {
        folder: options.folder,
      });

      return Response.json(createEditorImageUploadResponse(uploadResult));
    } catch (error) {
      const { message, status } = resolveCloudinaryErrorResponse(error);

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
