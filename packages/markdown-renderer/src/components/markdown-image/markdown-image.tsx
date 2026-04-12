import { Buffer } from 'node:buffer';

import { getCldImageUrl } from 'next-cloudinary';

import { MarkdownCldImage } from './markdown-cld-image';

export type MarkdownImageProps = {
  url: string;
  caption: string;
  original_filename: string;
  public_id: string;
  width: number;
  height: number;
};

/**
 * Render the reference Cloudinary-backed markdown image with blur placeholder
 * and full-size link behavior.
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
  const imageUrl = getCldImageUrl({
    src: public_id,
  });
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const dataUrl = `data:${response.type};base64,${base64}`;
  const alt =
    caption !== ''
      ? caption
      : original_filename !== ''
        ? original_filename
        : 'Ein beispielhaftes Bild passend zum Thema';

  return (
    <figure className="mx-auto my-8 w-fit">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-all duration-300 ease-in-out hover:grayscale-25 hover:brightness-90">
        <MarkdownCldImage
          src={url}
          alt={alt}
          width={width}
          height={height}
          sizes="100vw"
          placeholder="blur"
          blurDataURL={dataUrl}
          className="rounded-md shadow-md active:shadow-none"
        />
        <span className="sr-only">
          Klicken auf das Bild um es in voller Groesse zu sehen
        </span>
      </a>

      <figcaption className="mt-2 text-center text-sm text-muted-foreground/50">
        {caption !== '' || original_filename !== '' ? (
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
