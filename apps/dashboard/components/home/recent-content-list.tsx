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
  title: string;
  emptyState: string;
  items: RecentContentItem[];
};

function formatEntryTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

/**
 * Renders a lightweight vertical list for recent dashboard content activity.
 *
 * Keep the presentation editorial and compact so the dashboard home can show
 * work-in-progress without turning every section into another card grid.
 */
export function RecentContentList({
  title,
  emptyState,
  items,
}: RecentContentListProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 p-5 shadow-sm shadow-black/5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyState}</p>
      ) : (
        <div className="flex flex-col">
          {items.map((item, index) => (
            <div key={item.id}>
              {index > 0 ? <Separator className="my-4" /> : null}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={item.status === 'draft' ? 'default' : 'secondary'}>
                    {item.status === 'draft' ? 'Entwurf' : 'Veröffentlicht'}
                  </Badge>
                  <span className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                    {item.appSlug}
                  </span>
                </div>
                <p className="text-base font-medium text-foreground">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  Zuletzt bearbeitet am {formatEntryTimestamp(item.updatedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
