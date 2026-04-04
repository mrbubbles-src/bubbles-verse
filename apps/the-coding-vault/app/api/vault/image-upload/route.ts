import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('image') as File;

  if (!file) {
    return NextResponse.json(
      { success: 0, message: 'No file uploaded' },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'vault-uploads',
            filename_override: file.name.split('.')[0],
          },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    },
  );
  const {
    secure_url,
    display_name,
    public_id,
    original_filename,
    width,
    height,
  } = uploadResult;

  return NextResponse.json({
    success: 1,
    file: {
      url: secure_url,
      original_filename: original_filename,
      display_name: display_name,
      public_id: public_id,
      width: width,
      height: height,
    },
  } satisfies {
    success: 1;
    file: {
      url: string;
      original_filename: string;
      display_name: string;
      public_id: string;
      width: number;
      height: number;
    };
  });
}
