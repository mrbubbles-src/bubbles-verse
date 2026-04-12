'use client';

import type { CldImageProps } from 'next-cloudinary';

import { CldImage } from 'next-cloudinary';

/**
 * Forward the reference Cloudinary image component for markdown images.
 *
 * @param props - Cloudinary image props forwarded unchanged.
 * @returns Client image component used by the server wrapper.
 */
export function MarkdownCldImage(props: CldImageProps) {
  return <CldImage {...props} />;
}
