'use client';

import type { DashboardAccessEntry } from '@/lib/account/dashboard-access.shared';

import {
  formatDashboardAccessRoleLabel,
  summarizeDashboardAccessEntries,
} from '@/lib/account/dashboard-access.shared';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@bubbles/ui/shadcn/tooltip';

import { DashboardAccessDialog } from '@/components/account/dashboard-access-dialog';
import { DashboardAccessRevokeDialog } from '@/components/account/dashboard-access-revoke-dialog';

type DashboardAccessManagementProps = {
  accessEntries: DashboardAccessEntry[];
  currentIdentity: {
    githubUsername: string;
    email: string;
  };
};

/**
 * Formats a dashboard access timestamp for the management table.
 *
 * @param value Serialized timestamp from the DB row.
 * @returns A German medium date string for the current row.
 */
function formatAccessDate(value: DashboardAccessEntry['createdAt']) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

/**
 * Renders the owner-facing access management table with create/edit/revoke flows.
 *
 * @param props Current allowlist rows and the signed-in owner identity.
 * @returns The flat table-based access management experience for `/account`.
 */
export function DashboardAccessManagement({
  accessEntries,
  currentIdentity,
}: DashboardAccessManagementProps) {
  const summary = summarizeDashboardAccessEntries(accessEntries);

  return (
    <TooltipProvider delay={120}>
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Zugangsverwaltung
            </h1>
            <p className="text-sm text-muted-foreground">
              {summary.total} Zugänge · {summary.active} aktiv ·{' '}
              {summary.owners} Owner
            </p>
          </div>

          <DashboardAccessDialog mode="create" />
        </header>

        <div className="overflow-x-auto border-y border-border/50">
          <table className="min-w-[70rem] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                <th className="border-b border-border/50 px-3 py-3 font-semibold">
                  GitHub-Name
                </th>
                <th className="border-b border-border/50 px-3 py-3 font-semibold">
                  E-Mail
                </th>
                <th className="border-b border-border/50 px-3 py-3 font-semibold">
                  Rolle
                </th>
                <th className="border-b border-border/50 px-3 py-3 font-semibold">
                  Notiz
                </th>
                <th className="border-b border-border/50 px-3 py-3 font-semibold">
                  Hinzugefügt
                </th>
                <th className="border-b border-border/50 px-3 py-3 font-semibold">
                  Status
                </th>
                <th className="border-b border-border/50 px-3 py-3 text-right font-semibold">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {accessEntries.map((entry) => {
                const isCurrentOwner =
                  entry.githubUsername === currentIdentity.githubUsername &&
                  entry.email === currentIdentity.email;

                return (
                  <tr key={`${entry.githubUsername}:${entry.email}`}>
                    <td className="border-b border-border/40 px-3 py-4 align-top">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-medium">
                          @{entry.githubUsername}
                        </span>
                        {isCurrentOwner ? (
                          <Badge variant="secondary">Du</Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-border/40 px-3 py-4 align-top text-muted-foreground">
                      <span className="block max-w-[18rem] truncate">
                        {entry.email}
                      </span>
                    </td>
                    <td className="border-b border-border/40 px-3 py-4 align-top">
                      {formatDashboardAccessRoleLabel(entry.userRole)}
                    </td>
                    <td className="border-b border-border/40 px-3 py-4 align-top text-muted-foreground">
                      {entry.note ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                className="block max-w-[16rem] truncate text-left underline decoration-border underline-offset-4"
                              />
                            }>
                            {entry.note}
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64 text-pretty">
                            {entry.note}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="border-b border-border/40 px-3 py-4 align-top text-muted-foreground">
                      {formatAccessDate(entry.createdAt)}
                    </td>
                    <td className="border-b border-border/40 px-3 py-4 align-top">
                      <Badge
                        variant={
                          entry.dashboardAccess ? 'secondary' : 'outline'
                        }>
                        {entry.dashboardAccess ? 'Aktiv' : 'Gesperrt'}
                      </Badge>
                    </td>
                    <td className="border-b border-border/40 px-3 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        {isCurrentOwner ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled
                              title="Deinen eigenen Owner-Zugang kannst du hier nicht ändern.">
                              Bearbeiten
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled
                              title="Deinen eigenen Owner-Zugang kannst du hier nicht entziehen.">
                              Zugang entziehen
                            </Button>
                          </>
                        ) : (
                          <>
                            <DashboardAccessDialog mode="edit" entry={entry} />
                            <DashboardAccessRevokeDialog entry={entry} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </TooltipProvider>
  );
}
