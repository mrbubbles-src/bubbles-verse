'use client';

import type { DashboardIssueReviewCursor } from '@/lib/dashboard/issue-review-notification-query';
import type {
  DashboardIssueReviewPageItem,
  ReadDashboardIssueReviewPageResult,
} from '@/lib/dashboard/issue-review-notifications';
import type { DashboardSnapshot } from '@/lib/dashboard/types';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';

/**
 * Renders the independently paginated live queue of issues in review.
 *
 * @param props Current review page, load state, and URL paging callbacks.
 * @returns Issue-review subsection for the dashboard notification card.
 */
export function IssueReviewFeedSection({
  dataSource,
  reviews,
  status,
  cursor,
  nextAfter,
  onIssueSelect,
  onFirstPage,
  onNextPage,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  reviews: DashboardIssueReviewPageItem[];
  status: ReadDashboardIssueReviewPageResult['status'] | 'loading' | null;
  cursor: DashboardIssueReviewCursor | null;
  nextAfter: DashboardIssueReviewCursor | null;
  onIssueSelect: (issueKey: string) => void;
  onFirstPage: () => void;
  onNextPage: (after: DashboardIssueReviewCursor) => void;
}) {
  const isDatabaseSource =
    dataSource === 'database' || dataSource === 'empty_database';
  const hasLoadError =
    status === 'database_unavailable' ||
    status === 'invalid' ||
    status === 'not_found';

  return (
    <section
      aria-labelledby="issue-review-notifications"
      className="grid gap-3 border-t border-border pt-4">
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="issue-review-notifications" className="text-sm font-medium">
            Issue-Reviews
          </h3>
          <Badge variant="secondary">Issue-Status</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Eigenständige Issues im Status Review, unabhängig von Agent-Runs.
        </p>
      </div>

      {!isDatabaseSource ? (
        <p className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          Sample/Fallback zeigt keine operativen Issue-Reviews.
        </p>
      ) : null}
      {status === 'loading' ? (
        <p role="status" className="text-sm text-muted-foreground">
          Issue-Reviews werden geladen.
        </p>
      ) : null}
      {hasLoadError ? (
        <p role="alert" className="text-sm text-muted-foreground">
          Issue-Reviews konnten nicht geladen werden. Lade die Seite erneut.
        </p>
      ) : null}
      {isDatabaseSource &&
      (status === 'success' || dataSource === 'empty_database') &&
      reviews.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          Keine Issues im Review in diesem Ausschnitt.
        </p>
      ) : null}
      {status === 'success' ? (
        <ol className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li
              key={review.issueKey}
              className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
              <div className="min-w-0">
                <p className="font-medium">{review.issueKey}</p>
                <p className="truncate text-sm">{review.title}</p>
                <p className="text-xs text-muted-foreground">
                  {review.projectName}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <time
                  dateTime={review.updatedAt}
                  title={review.updatedAt}
                  className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatReviewTime(review.updatedAt)}
                </time>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onIssueSelect(review.issueKey)}>
                  Issue öffnen
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {isDatabaseSource && status === 'success' ? (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!cursor}
            onClick={onFirstPage}>
            Erste Review-Seite
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!nextAfter}
            onClick={() => {
              if (nextAfter) {
                onNextPage(nextAfter);
              }
            }}>
            Weitere Reviews
          </Button>
        </div>
      ) : null}
    </section>
  );
}

/** Formats one ISO timestamp without locale-dependent hydration output. */
function formatReviewTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);

  return match ? `${match[3]}.${match[2]}. ${match[4]}:${match[5]}` : value;
}
