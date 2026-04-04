'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const CurriculumVitae = dynamic(() => import('./curriculum-vitae'), {
  ssr: false,
});

export default function CurriculumVitaeClient(
  props: ComponentProps<typeof CurriculumVitae>,
) {
  return <CurriculumVitae {...props} />;
}
