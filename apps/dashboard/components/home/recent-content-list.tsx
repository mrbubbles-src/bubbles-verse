import Link from 'next/link';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Separator } from '@bubbles/ui/shadcn/separator';

type RecentContentItem = {
  id: string;
  title: string;
  appSlug: string;
  status: 'draft' | 'published';
  updatedAt: string;
};

type RecentContentListProps = {
  emptyState: string;
  items: RecentContentItem[];
  showStatus?: boolean;
};

function formatEntryTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

/**
 * Renders the flat work queue rows for the dashboard home tabs.
 *
 * Each row links straight into the editor so the home stays a working surface,
 * not a passive preview.
 */
export function RecentContentList({
  emptyState,
  items,
  showStatus = false,
}: RecentContentListProps) {
  return (
    <div className="flex flex-col">
      {items.length === 0 ? (
        <p className="py-12 text-base text-muted-foreground">{emptyState}</p>
      ) : (
        items.map((item, index) => (
          <div key={item.id}>
            {index > 0 ? <Separator /> : null}
            <Link
              href={`/vault/entries/${item.id}`}
              className="dashboard-soft-row group flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-lg leading-tight font-semibold tracking-normal text-balance text-foreground sm:text-xl">
                    {item.title}
                  </p>
                  <div className="dashboard-meta flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>
                      {item.appSlug === 'vault' ? 'Coding Vault' : item.appSlug}
                    </span>
                    {showStatus ? (
                      <>
                        <span aria-hidden="true">•</span>
                        <Badge
                          variant={
                            item.status === 'published'
                              ? 'default'
                              : 'secondary'
                          }>
                          {item.status === 'draft'
                            ? 'Entwurf'
                            : 'Veröffentlicht'}
                        </Badge>
                      </>
                    ) : null}
                  </div>
                </div>

                <p className="text-base text-muted-foreground sm:text-right">
                  {formatEntryTimestamp(item.updatedAt)}
                </p>
              </div>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
