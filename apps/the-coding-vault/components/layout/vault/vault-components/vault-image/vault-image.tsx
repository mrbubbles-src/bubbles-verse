import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';
import VaultCldImage from './vault-cdimage';
import { getCldImageUrl } from 'next-cloudinary';

const VaultImage = async ({
  url,
  caption,
  original_filename,
  public_id,
  width,
  height,
}: {
  url: string;
  caption: string;
  original_filename: string;
  public_id: string;
  width: number;
  height: number;
}) => {
  const imageUrl = getCldImageUrl({
    src: public_id,
  });
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${response.type};base64,${base64}`;

  return (
    <figure className="text-center">
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-300 ease-in-out">
              <VaultCldImage
                src={url}
                alt={caption || original_filename}
                width={width}
                height={height}
                sizes="100vw"
                placeholder="blur"
                blurDataURL={dataUrl}
                className="z-[1002] rounded-md shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:brightness-75 active:shadow-none"
              />
            </a>
          }
        />
        <TooltipContent className="TooltipContent z-[1001] max-w-[20rem] font-bold text-pretty md:max-w-full">
          {`'${caption || original_filename}' - Klicken um das Bild in voller Größe zu sehen`}
        </TooltipContent>
      </Tooltip>
      {caption && (
        <figcaption className="mt-1 text-sm text-gray-600">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default VaultImage;
