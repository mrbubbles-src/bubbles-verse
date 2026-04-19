import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCloudinaryUploadRoute } from '../../src/server/cloudinary-upload-route';

const {
  createEditorImageUploadResponseMock,
  isUploadFileMock,
  resolveCloudinaryErrorResponseMock,
  uploadEditorImageToCloudinaryMock,
} = vi.hoisted(() => ({
  createEditorImageUploadResponseMock: vi.fn(),
  isUploadFileMock: vi.fn(),
  resolveCloudinaryErrorResponseMock: vi.fn(),
  uploadEditorImageToCloudinaryMock: vi.fn(),
}));

vi.mock('../../src/server/cloudinary-upload', () => ({
  createEditorImageUploadResponse: createEditorImageUploadResponseMock,
  isUploadFile: isUploadFileMock,
  resolveCloudinaryConfig: vi.fn(),
  resolveCloudinaryErrorResponse: resolveCloudinaryErrorResponseMock,
  uploadEditorImageToCloudinary: uploadEditorImageToCloudinaryMock,
}));

afterEach(() => {
  createEditorImageUploadResponseMock.mockReset();
  isUploadFileMock.mockReset();
  resolveCloudinaryErrorResponseMock.mockReset();
  uploadEditorImageToCloudinaryMock.mockReset();
});

/**
 * Build the minimal request shape needed by the shared upload route.
 *
 * @param formData - FormData payload returned by the request stub.
 * @returns Request-shaped object with the route's required API surface.
 */
function createUploadRequest(formData: FormData): Request {
  return {
    formData: async () => formData,
  } as Request;
}

describe('createCloudinaryUploadRoute', () => {
  it('uploads the image and returns the EditorJS image-tool response shape', async () => {
    const file = new File(['image-bytes'], 'diagram.png', {
      type: 'image/png',
    });

    isUploadFileMock.mockReturnValue(true);
    uploadEditorImageToCloudinaryMock.mockResolvedValue({
      height: 720,
      original_filename: 'diagram',
      public_id: 'vault/diagram',
      secure_url: 'https://cdn.example.com/diagram.png',
      width: 1280,
    });
    createEditorImageUploadResponseMock.mockReturnValue({
      file: {
        height: 720,
        original_filename: 'diagram',
        public_id: 'vault/diagram',
        url: 'https://cdn.example.com/diagram.png',
        width: 1280,
      },
      success: 1,
    });

    const route = createCloudinaryUploadRoute({
      folder: 'vault-uploads',
    });
    const formData = new FormData();
    formData.set('image', file);

    const response = await route(createUploadRequest(formData));

    expect(uploadEditorImageToCloudinaryMock).toHaveBeenCalledWith(file, {
      folder: 'vault-uploads',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      file: {
        height: 720,
        original_filename: 'diagram',
        public_id: 'vault/diagram',
        url: 'https://cdn.example.com/diagram.png',
        width: 1280,
      },
      success: 1,
    });
  });

  it('returns the authorization response when the app blocks the upload', async () => {
    const route = createCloudinaryUploadRoute({
      authorize: () =>
        Response.json(
          {
            message: 'Forbidden',
            success: 0,
          },
          { status: 403 }
        ),
      folder: 'vault-uploads',
    });

    const response = await route(createUploadRequest(new FormData()));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: 'Forbidden',
      success: 0,
    });
    expect(uploadEditorImageToCloudinaryMock).not.toHaveBeenCalled();
  });

  it('returns a 400 response when no image file was provided', async () => {
    isUploadFileMock.mockReturnValue(false);

    const route = createCloudinaryUploadRoute({
      folder: 'vault-uploads',
    });

    const response = await route(createUploadRequest(new FormData()));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: 'No file uploaded.',
      success: 0,
    });
  });

  it('maps upload helper errors through the shared error formatter', async () => {
    const file = new File(['image-bytes'], 'diagram.png', {
      type: 'image/png',
    });

    isUploadFileMock.mockReturnValue(true);
    uploadEditorImageToCloudinaryMock.mockRejectedValue({
      error: {
        http_code: 401,
        message: 'Unauthorized',
      },
    });
    resolveCloudinaryErrorResponseMock.mockReturnValue({
      message: 'Unauthorized',
      status: 401,
    });

    const route = createCloudinaryUploadRoute({
      folder: 'vault-uploads',
    });
    const formData = new FormData();
    formData.set('image', file);

    const response = await route(createUploadRequest(formData));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: 'Unauthorized',
      success: 0,
    });
  });
});
