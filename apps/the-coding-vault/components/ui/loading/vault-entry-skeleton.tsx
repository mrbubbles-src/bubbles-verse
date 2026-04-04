import { Skeleton } from '@bubbles/ui/shadcn/skeleton';

const VaultEntrySkeleton = () => {
  return (
    <article className="w-full space-y-6 p-2">
      {/* Autor */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Divider */}
      <Skeleton className="bg-muted h-0.5" />

      {/* Titel */}
      <Skeleton className="h-10 w-2/3 rounded-md" />

      {/* Einleitung */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="mb-6 h-4 w-2/3" />
      </div>

      {/* Lernziele */}
      <Skeleton className="mb-2 h-6 w-1/4" />
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="bg-muted h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-[260px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="bg-muted h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-[220px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="bg-muted h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-[280px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="bg-muted h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Hinweisbox */}
      <Skeleton className="mb-8 h-16 w-full rounded-md" />

      {/* Inhaltsteil */}
      <Skeleton className="mb-2 h-6 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="mb-6 h-4 w-2/3" />
      </div>

      {/* Codeblock */}
      <Skeleton className="mb-2 h-6 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mb-6 h-4 w-2/3" />
      </div>
      <Skeleton className="mb-8 h-32 w-full rounded" />

      {/* Footer */}
      <Skeleton className="mb-2 h-6 w-1/4" />
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="bg-muted h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-[260px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="bg-muted h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-[220px]" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
    </article>
  );
};

export default VaultEntrySkeleton;
