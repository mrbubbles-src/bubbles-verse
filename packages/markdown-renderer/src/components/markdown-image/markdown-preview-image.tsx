import { getCldImageUrl } from 'next-cloudinary';

import { MarkdownCldImage } from './markdown-cld-image';
import type { MarkdownImageProps } from './markdown-image';

/**
 * Render a client-safe markdown image for live editor previews.
 *
 * Use this variant inside client-side MDX compilation flows where async server
 * components are not supported. It keeps the same content contract as
 * `MarkdownImage` but skips async blur placeholder generation.
 *
 * @param props - Image metadata emitted by the markdown serializer.
 * @returns Figure element with linked image or `null` when no source exists.
 */
export function MarkdownPreviewImage({
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
