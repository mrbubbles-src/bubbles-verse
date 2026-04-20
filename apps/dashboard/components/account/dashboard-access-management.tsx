'use client';

import type { DashboardAccessEntry } from '@/lib/account/dashboard-access.shared';

import {
  formatDashboardAccessRoleLabel,
  summarizeDashboardAccessEntries,
} from '@/lib/account/dashboard-access.shared';

import {
  ManagementTable,
  ManagementTableBody,
  ManagementTableCell,
  ManagementTableHead,
  ManagementTableHeader,
  ManagementTableHeaderRow,
  ManagementTableRow,
} from '@bubbles/ui/components/management-table';
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
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Zugangsverwaltung
            </h1>
            <p className="text-base text-muted-foreground">
              {summary.total} Zugänge · {summary.active} aktiv ·{' '}
              {summary.owners} Owner
            </p>
          </div>

          <DashboardAccessDialog mode="create" />
        </header>

        <ManagementTable className="min-w-280 border-separate border-spacing-0">
          <ManagementTableHeader>
            <ManagementTableHeaderRow>
              <ManagementTableHead>GitHub-Name</ManagementTableHead>
              <ManagementTableHead>E-Mail</ManagementTableHead>
              <ManagementTableHead>Rolle</ManagementTableHead>
              <ManagementTableHead>Notiz</ManagementTableHead>
              <ManagementTableHead>Hinzugefügt</ManagementTableHead>
              <ManagementTableHead>Status</ManagementTableHead>
              <ManagementTableHead className="text-right">
                Aktionen
              </ManagementTableHead>
            </ManagementTableHeaderRow>
          </ManagementTableHeader>
          <ManagementTableBody>
            {accessEntries.map((entry) => {
              const isCurrentOwner =
                entry.githubUsername === currentIdentity.githubUsername &&
                entry.email === currentIdentity.email;

              return (
                <ManagementTableRow
                  key={`${entry.githubUsername}:${entry.email}`}>
                  <ManagementTableCell>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-medium">
                        @{entry.githubUsername}
                      </span>
                      {isCurrentOwner ? (
                        <Badge variant="secondary">Du</Badge>
                      ) : null}
                    </div>
                  </ManagementTableCell>
                  <ManagementTableCell className="text-muted-foreground">
                    <span className="block max-w-[18rem] truncate">
                      {entry.email}
                    </span>
                  </ManagementTableCell>
                  <ManagementTableCell>
                    {formatDashboardAccessRoleLabel(entry.userRole)}
                  </ManagementTableCell>
                  <ManagementTableCell className="text-muted-foreground">
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
                  </ManagementTableCell>
                  <ManagementTableCell className="text-muted-foreground">
                    {formatAccessDate(entry.createdAt)}
                  </ManagementTableCell>
                  <ManagementTableCell>
                    <Badge
                      variant={entry.dashboardAccess ? 'secondary' : 'outline'}>
                      {entry.dashboardAccess ? 'Aktiv' : 'Gesperrt'}
                    </Badge>
                  </ManagementTableCell>
                  <ManagementTableCell>
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
                  </ManagementTableCell>
                </ManagementTableRow>
              );
            })}
          </ManagementTableBody>
        </ManagementTable>
      </section>
    </TooltipProvider>
  );
}
