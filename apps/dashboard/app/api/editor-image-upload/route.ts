import { NextResponse } from 'next/server';

import {
  createEditorImageUploadResponse,
  isUploadFile,
  resolveCloudinaryErrorResponse,
  uploadEditorImageToCloudinary,
} from '@bubbles/markdown-editor/cloudinary-upload';

/**
 * Accepts editor image uploads and stores them in the dashboard Cloudinary
 * folder configured by the shared markdown-editor helpers.
 *
 * @param request Multipart request from the shared markdown editor image tool.
 * @returns EditorJS-compatible upload response JSON.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const imageFolder = formData.get('imageFolder');

    if (!isUploadFile(image)) {
      return NextResponse.json(
        {
          message: 'Kein gültiges Bild hochgeladen.',
          success: 0,
        },
        { status: 400 }
      );
    }

    if (typeof imageFolder !== 'string' || !imageFolder.trim()) {
      return NextResponse.json(
        {
          message: 'Das Upload-Ziel fehlt.',
          success: 0,
        },
        { status: 400 }
      );
    }

    const uploadResult = await uploadEditorImageToCloudinary(image, {
      folder: imageFolder,
    });

    return NextResponse.json(createEditorImageUploadResponse(uploadResult));
  } catch (error) {
    const { message, status } = resolveCloudinaryErrorResponse(error);

    return NextResponse.json(
      {
        message,
        success: 0,
      },
      { status }
    );
  }
}
