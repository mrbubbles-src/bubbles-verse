import { afterEach, describe, expect, it, vi } from 'vitest';

import { createEditorImageUploader } from '../../src/lib/create-image-uploader';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createEditorImageUploader', () => {
  it('posts the file plus imageFolder to the configured endpoint', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const formData = init?.body as FormData;

      expect(init?.method).toBe('POST');
      expect(formData.get('imageFolder')).toBe('docs/editor-standard');
      expect(formData.get('image')).toBeInstanceOf(File);

      return new Response(
        JSON.stringify({
          file: {
            url: 'https://cdn.example.com/image.png',
          },
          success: 1,
        }),
        { status: 200 }
      );
    });

    vi.stubGlobal('fetch', fetchMock);

    const uploadImage = createEditorImageUploader({
      endpoint: '/api/image-upload',
      imageFolder: 'docs/editor-standard',
    });

    await expect(
      uploadImage(new File(['image'], 'diagram.png', { type: 'image/png' }))
    ).resolves.toEqual({
      file: {
        url: 'https://cdn.example.com/image.png',
      },
      success: 1,
    });
  });

  it('surfaces the route error message when the upload fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            message: 'Ungültiger Bildordner.',
            success: 0,
          }),
          { status: 400 }
        )
      )
    );

    const uploadImage = createEditorImageUploader({
      endpoint: '/api/image-upload',
      imageFolder: 'invalid-folder',
    });

    await expect(
      uploadImage(new File(['image'], 'diagram.png', { type: 'image/png' }))
    ).rejects.toThrow('Ungültiger Bildordner.');
  });

  it('normalizes blob uploads into named files before posting them', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const formData = init?.body as FormData;
      const image = formData.get('image');

      expect(image).toBeInstanceOf(File);
      expect((image as File).name).toBe('upload.png');
      expect((image as File).type).toBe('image/png');

      return new Response(
        JSON.stringify({
          file: {
            url: 'https://cdn.example.com/blob.png',
          },
          success: 1,
        }),
        { status: 200 }
      );
    });

    vi.stubGlobal('fetch', fetchMock);

    const uploadImage = createEditorImageUploader({
      endpoint: '/api/image-upload',
      imageFolder: 'docs/editor-standard',
    });

    await expect(uploadImage(new Blob(['image'], { type: 'image/png' }))).resolves
      .toEqual({
        file: {
          url: 'https://cdn.example.com/blob.png',
        },
        success: 1,
      });
  });
});
