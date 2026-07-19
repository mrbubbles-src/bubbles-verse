'use client';

import type {
  CreateBubblophyProjectInvitationActionInput,
  CreateBubblophyProjectInvitationActionResult,
  ReadBubblophyProjectInvitationManagerSnapshotActionResult,
  ReinviteBubblophyProjectInvitationActionInput,
  ReinviteBubblophyProjectInvitationActionResult,
  RevokeBubblophyProjectInvitationActionInput,
  RevokeBubblophyProjectInvitationActionResult,
} from '@/app/actions';
import type { ProjectSummary } from '@/lib/dashboard/types';
import type {
  BubblophyProjectInvitationManagerSnapshot,
  BubblophyProjectInvitationManagerSummary,
} from '@/lib/projects/invitation-snapshot';

import { useEffect, useState, useTransition } from 'react';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import { Input } from '@bubbles/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';

import {
  invitationRoleLabels,
  ProjectInvitationList,
} from '@/components/dashboard/project-invitations/project-invitation-list';
import {
  getInvitationMutationErrorMessage,
  getInvitationReadErrorMessage,
  shouldRefreshAfterMutationFailure,
} from '@/components/dashboard/project-invitations/project-invitation-manager-feedback';

type InvitationManagerProject = Pick<
  ProjectSummary,
  'key' | 'isArchived' | 'currentUserRole'
>;

export interface ProjectInvitationManagerProps {
  project: InvitationManagerProject;
  readInvitationsAction?: (input: {
    projectKey: string;
  }) => Promise<ReadBubblophyProjectInvitationManagerSnapshotActionResult>;
  createInvitationAction?: (
    input: CreateBubblophyProjectInvitationActionInput
  ) => Promise<CreateBubblophyProjectInvitationActionResult>;
  reinviteInvitationAction?: (
    input: ReinviteBubblophyProjectInvitationActionInput
  ) => Promise<ReinviteBubblophyProjectInvitationActionResult>;
  revokeInvitationAction?: (
    input: RevokeBubblophyProjectInvitationActionInput
  ) => Promise<RevokeBubblophyProjectInvitationActionResult>;
}

interface OneTimeInvitationLink {
  invitationId: string;
  email: string;
  url: string;
}

const invitationRoles = [
  'maintainer',
  'member',
  'viewer',
] satisfies CreateBubblophyProjectInvitationActionInput['role'][];

/**
 * Renders manager-only project invitation creation and lifecycle controls.
 *
 * @param props Selected project and server-authorized invitation actions.
 * @returns Email invitation form, one-time link, and redacted manager list.
 */
export function ProjectInvitationManager({
  project,
  readInvitationsAction,
  createInvitationAction,
  reinviteInvitationAction,
  revokeInvitationAction,
}: ProjectInvitationManagerProps) {
  const [snapshot, setSnapshot] =
    useState<BubblophyProjectInvitationManagerSnapshot | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] =
    useState<CreateBubblophyProjectInvitationActionInput['role']>('member');
  const [oneTimeLink, setOneTimeLink] = useState<OneTimeInvitationLink | null>(
    null
  );
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle'
  );
  const [isLoading, setIsLoading] = useState(Boolean(readInvitationsAction));
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isManager =
    project.currentUserRole === 'owner' ||
    project.currentUserRole === 'maintainer';
  const invitations = snapshot?.invitations ?? [];
  const isArchived = project.isArchived || snapshot?.isArchived === true;
  const isBusy = isLoading || isPending;
  const hasAuthorizedSnapshot = snapshot !== null;

  useEffect(() => {
    if (!isManager || !readInvitationsAction) {
      return;
    }

    let isActive = true;

    void readInvitationsAction({ projectKey: project.key })
      .then((result) => {
        if (!isActive) {
          return;
        }

        if (result.status === 'found') {
          setSnapshot(result.snapshot);
          setActionError(null);
          return;
        }

        setSnapshot(null);
        setActionError(getInvitationReadErrorMessage(result));
      })
      .catch(() => {
        if (isActive) {
          setSnapshot(null);
          setActionError('Einladungen konnten gerade nicht geladen werden.');
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isManager, project.key, readInvitationsAction]);

  if (!isManager) {
    return null;
  }

  /** Refreshes the redacted list without turning a saved mutation into failure. */
  async function refreshInvitations(refreshFailureMessage: string) {
    if (!readInvitationsAction) {
      setSnapshot(null);
      return;
    }

    try {
      const result = await readInvitationsAction({ projectKey: project.key });

      if (result.status === 'found') {
        setSnapshot(result.snapshot);
        return;
      }

      setSnapshot(null);
      setActionError(getInvitationReadErrorMessage(result));
    } catch {
      setSnapshot(null);
      setActionError(refreshFailureMessage);
    }
  }

  /** Creates an invitation and keeps its full link only in local UI state. */
  function handleCreateInvitation() {
    if (
      !createInvitationAction ||
      !hasAuthorizedSnapshot ||
      isArchived ||
      isBusy
    ) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setCopyStatus('idle');
    startTransition(async () => {
      try {
        const result = await createInvitationAction({
          projectKey: project.key,
          email,
          role,
        });

        if (result.status !== 'created') {
          setActionError(getInvitationMutationErrorMessage(result));
          if (shouldRefreshAfterMutationFailure(result)) {
            await refreshInvitations(
              'Die Einladungsliste konnte gerade nicht aktualisiert werden.'
            );
          }
          return;
        }

        setOneTimeLink({
          invitationId: result.invitation.id,
          email: result.invitation.email,
          url: buildAbsoluteInvitationUrl(result.invitation.entryPath),
        });
        setEmail('');
        setActionMessage('Einladung erstellt. Kopiere den Link jetzt.');
        await refreshInvitations(
          'Einladung gespeichert, aber die Liste konnte nicht aktualisiert werden.'
        );
      } catch {
        setActionError('Die Einladung konnte gerade nicht erstellt werden.');
      }
    });
  }

  /** Rotates one open invitation and reveals only its new one-time link. */
  function handleReinvite(
    invitation: BubblophyProjectInvitationManagerSummary
  ) {
    if (
      !reinviteInvitationAction ||
      !hasAuthorizedSnapshot ||
      isArchived ||
      isBusy
    ) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setCopyStatus('idle');
    startTransition(async () => {
      try {
        const result = await reinviteInvitationAction({
          invitationId: invitation.id,
          expectedUpdatedAt: invitation.updatedAt,
        });

        if (result.status !== 'reinvited') {
          setActionError(getInvitationMutationErrorMessage(result));
          if (shouldRefreshAfterMutationFailure(result)) {
            await refreshInvitations(
              'Die Einladungsliste konnte gerade nicht aktualisiert werden.'
            );
          }
          return;
        }

        setOneTimeLink({
          invitationId: result.invitation.id,
          email: result.invitation.email,
          url: buildAbsoluteInvitationUrl(result.invitation.entryPath),
        });
        setActionMessage(
          'Einladung erneuert. Der vorherige Link ist ungültig.'
        );
        await refreshInvitations(
          'Einladung gespeichert, aber die Liste konnte nicht aktualisiert werden.'
        );
      } catch {
        setActionError('Die Einladung konnte gerade nicht erneuert werden.');
      }
    });
  }

  /** Revokes an open invitation after the surrounding confirmation dialog. */
  function handleRevoke(invitation: BubblophyProjectInvitationManagerSummary) {
    if (
      !revokeInvitationAction ||
      !hasAuthorizedSnapshot ||
      isArchived ||
      isBusy
    ) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    startTransition(async () => {
      try {
        const result = await revokeInvitationAction({
          invitationId: invitation.id,
          expectedUpdatedAt: invitation.updatedAt,
        });

        if (result.status !== 'revoked') {
          setActionError(getInvitationMutationErrorMessage(result));
          if (shouldRefreshAfterMutationFailure(result)) {
            await refreshInvitations(
              'Die Einladungsliste konnte gerade nicht aktualisiert werden.'
            );
          }
          return;
        }

        if (oneTimeLink?.invitationId === invitation.id) {
          setOneTimeLink(null);
        }
        setActionMessage('Einladung widerrufen.');
        await refreshInvitations(
          'Einladung gespeichert, aber die Liste konnte nicht aktualisiert werden.'
        );
      } catch {
        setActionError('Die Einladung konnte gerade nicht widerrufen werden.');
      }
    });
  }

  /** Copies the currently visible one-time invitation URL. */
  function handleCopyInvitationLink() {
    if (!oneTimeLink || !navigator.clipboard) {
      setCopyStatus('failed');
      return;
    }

    void navigator.clipboard
      .writeText(oneTimeLink.url)
      .then(() => setCopyStatus('copied'))
      .catch(() => setCopyStatus('failed'));
  }

  return (
    <div className="grid gap-3 rounded-md border border-dashed border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h4 className="text-sm font-medium">Einladungen</h4>
          <p className="text-xs text-muted-foreground">
            {isArchived
              ? 'Archivierte Projekte zeigen Einladungen nur lesend an.'
              : 'Lade Personen per E-Mail ein. Der Link wird nur direkt nach Erstellen oder Erneuern angezeigt.'}
          </p>
        </div>
        {snapshot ? (
          <Badge variant="outline">{invitations.length} sichtbar</Badge>
        ) : null}
      </div>

      {!isArchived && hasAuthorizedSnapshot && createInvitationAction ? (
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <label className="grid gap-1 text-xs font-medium">
            E-Mail-Adresse
            <Input
              autoComplete="email"
              disabled={isBusy}
              inputMode="email"
              placeholder="name@beispiel.de"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Rolle
            <Select
              disabled={isBusy}
              value={role}
              onValueChange={(value) => {
                if (value && invitationRoles.includes(value)) {
                  setRole(value);
                }
              }}>
              <SelectTrigger className="h-9 w-full" aria-label="Rolle">
                <SelectValue>{invitationRoleLabels[role]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {invitationRoles.map((invitationRole) => (
                  <SelectItem key={invitationRole} value={invitationRole}>
                    {invitationRoleLabels[invitationRole]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Button
            className="self-end"
            disabled={isBusy || email.trim().length === 0}
            size="sm"
            type="button"
            onClick={handleCreateInvitation}>
            Einladung erstellen
          </Button>
        </div>
      ) : null}

      {oneTimeLink ? (
        <div
          aria-label="Einmaliger Einladungslink"
          className="grid gap-2 rounded-md bg-muted/50 p-3">
          <div className="grid gap-1">
            <p className="text-sm font-medium">Link jetzt kopieren</p>
            <p className="text-xs text-muted-foreground">
              Für {oneTimeLink.email}. Nach Verlassen dieser Ansicht zeigt
              Bubblophy den Link nicht erneut an.
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <Input
              aria-label="Einladungslink"
              className="font-mono text-xs"
              readOnly
              value={oneTimeLink.url}
            />
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={handleCopyInvitationLink}>
              Link kopieren
            </Button>
            <Button
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => {
                setOneTimeLink(null);
                setCopyStatus('idle');
              }}>
              Link ausblenden
            </Button>
          </div>
          {copyStatus === 'copied' ? (
            <p className="text-xs text-muted-foreground" role="status">
              Einladungslink wurde kopiert.
            </p>
          ) : null}
          {copyStatus === 'failed' ? (
            <p className="text-xs text-muted-foreground" role="status">
              Automatisches Kopieren ist nicht verfügbar. Kopiere den sichtbaren
              Link manuell.
            </p>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Einladungen werden geladen …
        </p>
      ) : snapshot ? (
        <ProjectInvitationList
          canReinvite={Boolean(reinviteInvitationAction)}
          canRevoke={Boolean(revokeInvitationAction)}
          invitations={invitations}
          isArchived={isArchived}
          isBusy={isBusy}
          onReinvite={handleReinvite}
          onRevoke={handleRevoke}
        />
      ) : null}

      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}
      {actionMessage ? (
        <p className="text-sm text-muted-foreground" role="status">
          {actionMessage}
        </p>
      ) : null}
    </div>
  );
}

/** Builds a same-origin absolute URL from the server-provided entry path. */
function buildAbsoluteInvitationUrl(entryPath: string) {
  return new URL(entryPath, window.location.origin).toString();
}
