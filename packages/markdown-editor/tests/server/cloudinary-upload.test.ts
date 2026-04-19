import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createEditorImageUploadResponse,
  resolveCloudinaryErrorResponse,
  uploadEditorImageToCloudinary,
} from '../../src/server/cloudinary-upload';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('uploadEditorImageToCloudinary', () => {
  it('posts a signed upload request to the Cloudinary Upload API', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'demo-cloud');
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_API_KEY', 'demo-key');
    vi.stubEnv('CLOUDINARY_API_SECRET', 'demo-secret');

    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(_input).toBe(
          'https://api.cloudinary.com/v1_1/demo-cloud/image/upload'
        );
        expect(init?.method).toBe('POST');

        const formData = init?.body as FormData;

        expect(formData.get('api_key')).toBe('demo-key');
        expect(formData.get('folder')).toBe('vault-uploads');
        expect(formData.get('timestamp')).toMatch(/^\d+$/);
        expect(formData.get('signature')).toMatch(/^[a-f0-9]{40}$/);

        const file = formData.get('file');

        expect(file).toBeInstanceOf(File);
        expect((file as File).name).toBe('diagram.png');

        return new Response(
          JSON.stringify({
            height: 720,
            original_filename: 'diagram',
            public_id: 'vault/diagram',
            secure_url: 'https://cdn.example.com/diagram.png',
            width: 1280,
          }),
          { status: 200 }
        );
      }
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      uploadEditorImageToCloudinary(
        new File(['image-bytes'], 'diagram.png', { type: 'image/png' }),
        {
          folder: 'vault-uploads',
        }
      )
    ).resolves.toEqual({
      height: 720,
      original_filename: 'diagram',
      public_id: 'vault/diagram',
      secure_url: 'https://cdn.example.com/diagram.png',
      width: 1280,
    });
  });

  it('throws the Cloudinary error payload when the API rejects the request', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'demo-cloud');
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_API_KEY', 'demo-key');
    vi.stubEnv('CLOUDINARY_API_SECRET', 'demo-secret');

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: {
                http_code: 400,
                message:
                  'Upload preset must be specified when using unsigned upload',
              },
            }),
            { status: 400 }
          )
      )
    );

    await expect(
      uploadEditorImageToCloudinary(
        new File(['image-bytes'], 'diagram.png', { type: 'image/png' }),
        {
          folder: 'vault-uploads',
        }
      )
    ).rejects.toEqual({
      error: {
        http_code: 400,
        message: 'Upload preset must be specified when using unsigned upload',
      },
    });
  });
});

describe('createEditorImageUploadResponse', () => {
  it('maps the Cloudinary payload into the EditorJS response contract', () => {
    expect(
      createEditorImageUploadResponse({
        height: 720,
        original_filename: 'diagram',
        public_id: 'vault/diagram',
        secure_url: 'https://cdn.example.com/diagram.png',
        width: 1280,
      })
    ).toEqual({
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
});

describe('resolveCloudinaryErrorResponse', () => {
  it('prefers the nested Cloudinary error message and status', () => {
    expect(
      resolveCloudinaryErrorResponse({
        error: {
          http_code: 400,
          message: 'Upload preset must be specified when using unsigned upload',
        },
      })
    ).toEqual({
      message: 'Upload preset must be specified when using unsigned upload',
      status: 400,
    });
  });
});
