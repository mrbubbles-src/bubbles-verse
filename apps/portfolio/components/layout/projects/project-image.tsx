'use client';
import Image from 'next/image';
import PlaceholderImage from '@/public/screenshots/placeholder.jpg';
import { StaticImageData } from 'next/image';
interface IProjectImage {
  title: string;
  live: string;
  image: StaticImageData;
}

const ProjectImage = ({ live, image, title }: IProjectImage) => {
  return (
    <>
      <a
        href={live}
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-4 overflow-hidden rounded hover:opacity-90 transition shadow-md dark:shadow-popover-foreground/5">
        <Image
          src={image || PlaceholderImage}
          alt={`Screenshot of ${title}`}
          width={1280}
          height={720}
          className="w-full aspect-video object-cover rounded"
          placeholder="blur"
          blurDataURL={
            image
              ? (image as StaticImageData).blurDataURL
              : PlaceholderImage.blurDataURL
          }
        />
      </a>
    </>
  );
};

export default ProjectImage;
