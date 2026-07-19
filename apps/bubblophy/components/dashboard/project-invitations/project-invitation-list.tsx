'use client';

import type {
  BubblophyProjectInvitationManagerSummary,
  BubblophyProjectInvitationState,
} from '@/lib/projects/invitation-snapshot';

import { projectMemberRoleLabels } from '@/lib/projects/role-presentation';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@bubbles/ui/shadcn/alert-dialog';
import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bubbles/ui/shadcn/table';

const invitationStateLabels = {
  pending: 'Offen',
  expired: 'Abgelaufen',
  accepted: 'Angenommen',
  revoked: 'Widerrufen',
} satisfies Record<BubblophyProjectInvitationState, string>;

const invitationStateVariants = {
  pending: 'published',
  expired: 'draft',
  accepted: 'secondary',
  revoked: 'destructive',
} satisfies Record<
  BubblophyProjectInvitationState,
  React.ComponentProps<typeof Badge>['variant']
>;

const invitationDateFormatter = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Berlin',
});

interface ProjectInvitationListProps {
  invitations: BubblophyProjectInvitationManagerSummary[];
  isArchived: boolean;
  isBusy: boolean;
  canReinvite: boolean;
  canRevoke: boolean;
  onReinvite: (invitation: BubblophyProjectInvitationManagerSummary) => void;
  onRevoke: (invitation: BubblophyProjectInvitationManagerSummary) => void;
}

/**
 * Renders the redacted invitation lifecycle table and status-valid actions.
 *
 * @param props Invitation rows, write guards, and manager callbacks.
 * @returns Responsive invitation table or an empty-state message.
 */
export function ProjectInvitationList({
  invitations,
  isArchived,
  isBusy,
  canReinvite,
  canRevoke,
  onReinvite,
  onRevoke,
}: ProjectInvitationListProps) {
  if (invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Für dieses Projekt gibt es noch keine Einladungen.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>E-Mail</TableHead>
            <TableHead>Rolle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Gültig bis</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const isOpen =
              invitation.state === 'pending' || invitation.state === 'expired';

            return (
              <TableRow key={invitation.id}>
                <TableCell className="max-w-[16rem] break-all">
                  {invitation.email}
                </TableCell>
                <TableCell>
                  {projectMemberRoleLabels[invitation.role]}
                </TableCell>
                <TableCell>
                  <Badge variant={invitationStateVariants[invitation.state]}>
                    {invitationStateLabels[invitation.state]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <time dateTime={invitation.expiresAt}>
                    {formatInvitationDate(invitation.expiresAt)}
                  </time>
                </TableCell>
                <TableCell className="text-right">
                  {isOpen && !isArchived ? (
                    <div className="flex justify-end gap-2">
                      {canReinvite ? (
                        <Button
                          aria-label={`Einladung für ${invitation.email} erneuern`}
                          disabled={isBusy}
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => onReinvite(invitation)}>
                          Erneuern
                        </Button>
                      ) : null}
                      {invitation.state === 'pending' && canRevoke ? (
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                aria-label={`Einladung für ${invitation.email} widerrufen`}
                                disabled={isBusy}
                                size="sm"
                                type="button"
                                variant="outline"
                              />
                            }>
                            Widerrufen
                          </AlertDialogTrigger>
                          <AlertDialogContent size="sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Einladung widerrufen?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Der aktuelle Link für {invitation.email} wird
                                sofort ungültig.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                aria-label={`Widerruf für ${invitation.email} bestätigen`}
                                disabled={isBusy}
                                type="button"
                                variant="destructive"
                                onClick={() => onRevoke(invitation)}>
                                Widerruf bestätigen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {isArchived ? 'Archiviert' : 'Abgeschlossen'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** Formats a persisted invitation timestamp in Bubblophy's display timezone. */
function formatInvitationDate(value: string) {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime())
    ? value
    : invitationDateFormatter.format(timestamp);
}
