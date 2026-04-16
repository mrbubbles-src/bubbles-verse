import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCloudinaryUploadRoute } from '../../src/server/cloudinary-upload-route';

const { configMock, uploadStreamMock } = vi.hoisted(() => ({
  configMock: vi.fn(),
  uploadStreamMock: vi.fn(),
}));

vi.mock('cloudinary', () => ({
  v2: {
    config: configMock,
    uploader: {
      upload_stream: uploadStreamMock,
    },
  },
}));

afterEach(() => {
  configMock.mockReset();
  uploadStreamMock.mockReset();
  vi.unstubAllEnvs();
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
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'demo-cloud');
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_API_KEY', 'demo-key');
    vi.stubEnv('CLOUDINARY_API_SECRET', 'demo-secret');

    uploadStreamMock.mockImplementation(
      (
        options: {
          filename_override?: string;
          folder: string;
        },
        callback: (
          error: Error | null,
          result?: {
            height: number;
            original_filename: string;
            public_id: string;
            secure_url: string;
            width: number;
          }
        ) => void
      ) => {
        expect(options).toEqual({
          filename_override: 'diagram',
          folder: 'vault-uploads',
        });

        return {
          end() {
            callback(null, {
              height: 720,
              original_filename: 'diagram',
              public_id: 'vault/diagram',
              secure_url: 'https://cdn.example.com/diagram.png',
              width: 1280,
            });
          },
        };
      }
    );

    const route = createCloudinaryUploadRoute({
      folder: 'vault-uploads',
    });
    const formData = new FormData();
    formData.set(
      'image',
      new File(['image-bytes'], 'diagram.png', { type: 'image/png' })
    );

    const response = await route(createUploadRequest(formData));

    expect(configMock).toHaveBeenCalledWith({
      api_key: 'demo-key',
      api_secret: 'demo-secret',
      cloud_name: 'demo-cloud',
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
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it('returns a 400 response when no image file was provided', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'demo-cloud');
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_API_KEY', 'demo-key');
    vi.stubEnv('CLOUDINARY_API_SECRET', 'demo-secret');

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
});
