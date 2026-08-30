'use client';

import type {
  TransitionBubblophyAgentRunActionInput,
  TransitionBubblophyAgentRunActionResult,
} from '@/app/actions';
import type { DashboardNotificationCursor } from '@/lib/dashboard/notification-query';
import type {
  DashboardNotificationPageItem,
  DashboardNotificationRunState,
  ReadDashboardNotificationPageResult,
} from '@/lib/dashboard/notifications';
import type { AgentRunSummary, DashboardSnapshot } from '@/lib/dashboard/types';

import { Alert01Icon, HugeiconsIcon } from '@bubbles/ui/lib/hugeicons';
import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';

import { RunDecisionControls } from '@/components/dashboard/run-decision-controls';

const notificationLabels = {
  requested: 'Freigabe offen',
  needs_review: 'Review nötig',
  failed: 'Run fehlgeschlagen',
} satisfies Record<DashboardNotificationRunState, string>;

const notificationDescriptions = {
  requested: 'Wartet auf eine menschliche Entscheidung.',
  needs_review: 'Das Agent-Ergebnis muss im Issue geprüft werden.',
  failed: 'Prüfe den Issue-Kontext und entscheide über den nächsten Schritt.',
} satisfies Record<DashboardNotificationRunState, string>;

const notificationVariants = {
  requested: 'outline',
  needs_review: 'secondary',
  failed: 'destructive',
} as const satisfies Record<
  DashboardNotificationRunState,
  'outline' | 'secondary' | 'destructive'
>;

/**
 * Renders the live, membership-scoped queue of actionable run notifications.
 *
 * @param props Current page, read state, actions, and URL paging callbacks.
 * @returns Compact notification card for the dashboard control column.
 */
export function NotificationFeed({
  dataSource,
  notifications,
  status,
  cursor,
  nextAfter,
  transitionAgentRunAction,
  onAgentRunTransitioned,
  onIssueSelect,
  onFirstPage,
  onNextPage,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  notifications: DashboardNotificationPageItem[];
  status: ReadDashboardNotificationPageResult['status'] | 'loading' | null;
  cursor: DashboardNotificationCursor | null;
  nextAfter: DashboardNotificationCursor | null;
  transitionAgentRunAction?: (
    input: TransitionBubblophyAgentRunActionInput
  ) => Promise<TransitionBubblophyAgentRunActionResult>;
  onAgentRunTransitioned: (run: AgentRunSummary) => void;
  onIssueSelect: (issueKey: string) => void;
  onFirstPage: () => void;
  onNextPage: (after: DashboardNotificationCursor) => void;
}) {
  const isDatabaseSource =
    dataSource === 'database' || dataSource === 'empty_database';
  const hasLoadError =
    status === 'database_unavailable' ||
    status === 'invalid' ||
    status === 'not_found';

  return (
    <Card id="notifications" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon
            aria-hidden
            icon={Alert01Icon}
            strokeWidth={2}
            className="size-4"
          />
          Benachrichtigungen
        </CardTitle>
        <CardDescription>
          Offene Run-Freigaben, nötige Ergebnisreviews und fehlgeschlagene Runs.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!isDatabaseSource ? (
          <p className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Sample/Fallback zeigt keine operativen Benachrichtigungen.
          </p>
        ) : null}
        {status === 'loading' ? (
          <p role="status" className="text-sm text-muted-foreground">
            Benachrichtigungen werden geladen.
          </p>
        ) : null}
        {hasLoadError ? (
          <p role="alert" className="text-sm text-muted-foreground">
            Benachrichtigungen konnten nicht geladen werden. Lade die Seite
            erneut.
          </p>
        ) : null}
        {isDatabaseSource &&
        (status === 'success' || dataSource === 'empty_database') &&
        notifications.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Keine offenen Run-Hinweise in diesem Ausschnitt.
          </p>
        ) : null}
        {status === 'success' ? (
          <ol className="flex flex-col gap-3">
            {notifications.map((notification) => (
              <li
                key={notification.runId}
                className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{notification.issueKey}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.projectName} · {notification.agentLabel}
                    </p>
                  </div>
                  <Badge variant={notificationVariants[notification.state]}>
                    {notificationLabels[notification.state]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {notificationDescriptions[notification.state]}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <time
                    dateTime={notification.updatedAt}
                    title={notification.updatedAt}
                    className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatNotificationTime(notification.updatedAt)}
                  </time>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onIssueSelect(notification.issueKey)}>
                    Issue öffnen
                  </Button>
                </div>
                {notification.state === 'requested' &&
                notification.canManage &&
                transitionAgentRunAction ? (
                  <RunDecisionControls
                    runId={notification.runId}
                    transitionAgentRunAction={transitionAgentRunAction}
                    onAgentRunTransitioned={onAgentRunTransitioned}
                  />
                ) : null}
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
              Erste Seite
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
              Weiter
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Formats one ISO timestamp without locale-dependent hydration output. */
function formatNotificationTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);

  return match ? `${match[3]}.${match[2]}. ${match[4]}:${match[5]}` : value;
}
