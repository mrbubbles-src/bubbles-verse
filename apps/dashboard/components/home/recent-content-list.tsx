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
  variant?: 'compact' | 'table';
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
  variant = 'compact',
}: RecentContentListProps) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-base text-muted-foreground">{emptyState}</p>
    );
  }

  if (variant === 'table') {
    return (
      <div className="flex flex-col">
        {items.map((item, index) => (
          <div key={item.id}>
            {index > 0 ? <Separator /> : null}
            <Link
              href={`/vault/entries/${item.id}`}
              className="dashboard-content-table-row group">
              <div className="flex min-w-0 items-center gap-3">
                <span className="size-5 shrink-0 rounded-md bg-primary/20" />
                <span className="truncate text-base font-medium text-foreground">
                  {item.title}
                </span>
              </div>
              <span className="dashboard-meta">
                {item.appSlug === 'vault' ? 'Eintrag' : item.appSlug}
              </span>
              <span className="dashboard-meta">
                {showStatus
                  ? item.status === 'draft'
                    ? 'Entwurf'
                    : 'Veröffentlicht'
                  : 'Aktiv'}
              </span>
              <span className="dashboard-meta sm:text-right">
                {formatEntryTimestamp(item.updatedAt)}
              </span>
            </Link>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
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
                          item.status === 'published' ? 'default' : 'secondary'
                        }>
                        {item.status === 'draft' ? 'Entwurf' : 'Veröffentlicht'}
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
      ))}
    </div>
  );
}
