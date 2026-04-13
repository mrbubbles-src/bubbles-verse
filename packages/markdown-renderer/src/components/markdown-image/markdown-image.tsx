import { Buffer } from 'node:buffer';

import { getCldImageUrl } from 'next-cloudinary';

import { MarkdownCldImage } from './markdown-cld-image';

export type MarkdownImageProps = {
  url?: string;
  caption?: string;
  original_filename?: string;
  public_id?: string;
  width?: number;
  height?: number;
};

/**
 * Build a blur placeholder data URL for Cloudinary-backed images.
 *
 * @param publicId - Cloudinary public id used to resolve the preview asset.
 * @returns Blur data URL or `undefined` when unavailable.
 */
async function buildCloudinaryBlurDataUrl(
  publicId: string,
): Promise<string | undefined> {
  const imageUrl = getCldImageUrl({
    src: publicId,
  });
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType =
    response.headers.get('content-type') || 'image/png';

  return `data:${mimeType};base64,${base64}`;
}

/**
 * Render the reference markdown image with Cloudinary and direct-url support.
 *
 * @param props - Image metadata emitted by the serializer.
 * @returns Async figure element with linked image and caption text.
 */
export async function MarkdownImage({
  url,
  caption,
  original_filename,
  public_id,
  width,
  height,
}: MarkdownImageProps) {
  if (!url && !public_id) {
    return null;
  }

  const dataUrl = public_id
    ? await buildCloudinaryBlurDataUrl(public_id)
    : undefined;
  const alt =
    caption && caption !== ''
      ? caption
      : original_filename && original_filename !== ''
        ? original_filename
        : 'Ein beispielhaftes Bild passend zum Thema';
  const imageHref = url || (public_id ? getCldImageUrl({ src: public_id }) : '');

  return (
    <figure className="mx-auto my-8 w-fit">
      <a
        href={imageHref}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-all duration-300 ease-in-out hover:grayscale-25 hover:brightness-90">
        {public_id ? (
          <MarkdownCldImage
            src={url || public_id}
            alt={alt}
            width={width}
            height={height}
            sizes="100vw"
            placeholder={dataUrl ? 'blur' : undefined}
            blurDataURL={dataUrl}
            className="rounded-md shadow-md active:shadow-none"
          />
        ) : (
          <img
            src={url}
            alt={alt}
            width={width}
            height={height}
            className="rounded-md shadow-md active:shadow-none"
          />
        )}
        <span className="sr-only">
          Klicken auf das Bild um es in voller Groesse zu sehen
        </span>
      </a>

      <figcaption className="mt-2 text-center text-sm text-muted-foreground/50">
        {caption || original_filename ? (
          <>
            {caption || original_filename}
            <br />
            Klicken auf das Bild um es in voller Groesse zu sehen
          </>
        ) : (
          <>Klicken auf das Bild um es in voller Groesse zu sehen</>
        )}
      </figcaption>
    </figure>
  );
}
