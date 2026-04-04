'use client';

import { ICategories } from '@/types/types';
import dynamic from 'next/dynamic';

const Editor = dynamic<{
  authorId: string;
  maxOrder: number;
  categories: ICategories[];
}>(() => import('@/components/layout/admin/editor/editor'), {
  ssr: false,
  loading: () => <p>Lade Editor...</p>,
});

export default function SubmitEntryClient({
  authorId,
  maxOrder,
  categories,
}: {
  authorId: string;
  maxOrder: number;
  categories: ICategories[];
}) {
  return (
    <div>
      <h1>SubmitEntryPage</h1>
      <Editor
        authorId={authorId || 'unknown'}
        maxOrder={maxOrder}
        categories={categories}
      />
    </div>
  );
}
