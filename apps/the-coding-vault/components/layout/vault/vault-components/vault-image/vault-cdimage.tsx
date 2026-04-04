'use client';

import { CldImage as CldImageDefault, CldImageProps } from 'next-cloudinary';

const VaultCldImage = (props: CldImageProps) => {
  return <CldImageDefault {...props} />;
};

export default VaultCldImage;
