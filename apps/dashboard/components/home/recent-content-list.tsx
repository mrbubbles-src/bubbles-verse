import Link from 'next/link';

import {
  File01Icon,
  Folder01Icon,
  HugeiconsIcon,
  Notebook01Icon,
} from '@bubbles/ui/lib/hugeicons';
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
 * Formats table timestamps without forcing awkward line breaks.
 *
 * @param timestamp ISO timestamp from the recent content item.
 * @returns Compact German date and time label for dashboard tables.
 */
function formatTableTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/**
 * Resolves the content type label currently known by the dashboard model.
 *
 * @param item Recent content item with app context.
 * @returns Human-readable content type label.
 */
function getRecentContentTypeLabel(item: RecentContentItem) {
  return item.appSlug === 'vault' ? 'Eintrag' : 'Inhalt';
}

/**
 * Resolves the app label for a recent content row.
 *
 * @param item Recent content item with app context.
 * @returns Human-readable app label for the dashboard table.
 */
function getRecentContentAppLabel(item: RecentContentItem) {
  return item.appSlug === 'vault' ? 'Coding Vault' : item.appSlug;
}

/**
 * Picks a content icon from the row's known app and type context.
 *
 * @param item Recent content item with app context.
 * @returns Hugeicons glyph for the row leading icon.
 */
function getRecentContentIcon(item: RecentContentItem) {
  if (item.appSlug === 'vault') {
    return File01Icon;
  }

  if (item.appSlug.includes('portfolio')) {
    return Folder01Icon;
  }

  return Notebook01Icon;
}

/**
 * Resolves token-based status styling for dashboard content rows.
 *
 * @param status Shared content status from the row model.
 * @returns Badge label and Catppuccin token classes for the current status.
 */
function getRecentStatusMeta(status: RecentContentItem['status']) {
  if (status === 'draft') {
    return {
      label: 'Entwurf',
      className:
        'border-chart-3/35 bg-chart-3/15 text-chart-3 hover:bg-chart-3/20',
    };
  }

  return {
    label: 'Veröffentlicht',
    className:
      'border-chart-2/35 bg-chart-2/15 text-chart-2 hover:bg-chart-2/20',
  };
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
          <RecentContentTableRow
            key={item.id}
            item={item}
            showSeparator={index > 0}
            showStatus={showStatus}
          />
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
            className="dashboard-soft-row dashboard-work-row group">
            <span className="dashboard-content-icon">
              <HugeiconsIcon
                icon={getRecentContentIcon(item)}
                strokeWidth={2}
              />
            </span>
            <div className="dashboard-work-content min-w-0">
              <span className="block truncate text-lg leading-tight font-semibold tracking-normal text-foreground sm:text-xl">
                {item.title}
              </span>
              <span className="dashboard-work-meta mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <span className="dashboard-meta dashboard-work-app">
                  {getRecentContentAppLabel(item)}
                </span>
                <span className="dashboard-meta dashboard-work-date whitespace-nowrap tabular-nums">
                  {formatEntryTimestamp(item.updatedAt)}
                </span>
                {showStatus ? (
                  <Badge
                    variant="outline"
                    className={getRecentStatusMeta(item.status).className}>
                    {getRecentStatusMeta(item.status).label}
                  </Badge>
                ) : null}
              </span>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

/**
 * Renders a recent content table row that compacts metadata below desktop size.
 *
 * @param props Row data, separator state, and status display flag.
 * @returns Responsive table-like dashboard row.
 */
function RecentContentTableRow({
  item,
  showSeparator,
  showStatus,
}: {
  item: RecentContentItem;
  showSeparator: boolean;
  showStatus: boolean;
}) {
  const statusMeta = getRecentStatusMeta(item.status);
  const appLabel = getRecentContentAppLabel(item);
  const typeLabel = getRecentContentTypeLabel(item);
  const updatedAt = formatTableTimestamp(item.updatedAt);

  return (
    <div>
      {showSeparator ? <Separator /> : null}
      <Link
        href={`/vault/entries/${item.id}`}
        className="dashboard-content-table-row group">
        <div className="flex min-w-0 items-center gap-3">
          <span className="dashboard-content-icon">
            <HugeiconsIcon icon={getRecentContentIcon(item)} strokeWidth={2} />
          </span>
          <span className="truncate text-base font-medium text-foreground">
            {item.title}
          </span>
        </div>

        <span className="dashboard-meta dashboard-table-desktop-cell">
          {appLabel}
        </span>
        <span className="dashboard-meta dashboard-table-desktop-cell">
          {typeLabel}
        </span>
        {showStatus ? (
          <Badge
            variant="outline"
            className={`dashboard-table-desktop-badge ${statusMeta.className}`}>
            {statusMeta.label}
          </Badge>
        ) : (
          <span className="dashboard-meta dashboard-table-desktop-cell">
            Aktiv
          </span>
        )}
        <span className="dashboard-meta dashboard-table-desktop-cell text-right whitespace-nowrap tabular-nums">
          {updatedAt}
        </span>

        <div className="dashboard-table-compact-meta flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="dashboard-meta">{appLabel}</span>
          <span className="dashboard-meta">{typeLabel}</span>
          {showStatus ? (
            <Badge variant="outline" className={statusMeta.className}>
              {statusMeta.label}
            </Badge>
          ) : (
            <span className="dashboard-meta">Aktiv</span>
          )}
          <span className="dashboard-meta whitespace-nowrap tabular-nums">
            {updatedAt}
          </span>
        </div>
      </Link>
    </div>
  );
}
