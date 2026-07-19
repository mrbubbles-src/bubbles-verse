import type {
  CreateBubblophyProjectInvitationActionResult,
  ReadBubblophyProjectInvitationManagerSnapshotActionResult,
  ReinviteBubblophyProjectInvitationActionResult,
  RevokeBubblophyProjectInvitationActionResult,
} from '@/app/actions';
import type {
  BubblophyProjectInvitationManagerSnapshot,
  BubblophyProjectInvitationManagerSummary,
} from '@/lib/projects/invitation-snapshot';
import type React from 'react';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectInvitationManager } from '@/components/dashboard/project-invitations/project-invitation-manager';

vi.mock('@bubbles/ui/shadcn/badge', () => ({
  Badge: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => {
    const { variant, ...spanProps } = props;
    void variant;
    return <span {...spanProps}>{children}</span>;
  },
}));

vi.mock('@bubbles/ui/shadcn/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: string;
    variant?: string;
  }) => {
    const { size, variant, ...buttonProps } = props;
    void size;
    void variant;
    return <button {...buttonProps}>{children}</button>;
  },
}));

const pendingInvitation = createInvitationSummary({
  id: 'invite_pending',
  email: 'pending@example.test',
  state: 'pending',
});

const managerSnapshot = createManagerSnapshot([pendingInvitation]);

describe('ProjectInvitationManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn(async () => undefined) },
    });
  });

  it('does not read or render invitation controls for non-managers', () => {
    const readInvitationsAction = vi.fn();

    const { container } = render(
      <ProjectInvitationManager
        project={{
          key: 'BV',
          isArchived: false,
          currentUserRole: 'viewer',
        }}
        readInvitationsAction={readInvitationsAction}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(readInvitationsAction).not.toHaveBeenCalled();
  });

  it('does not present a denied manager snapshot as an empty invitation list', async () => {
    render(
      <ProjectInvitationManager
        project={managerProject}
        readInvitationsAction={createReadInvitationsAction({
          status: 'not_found',
        })}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Einladungen sind für dieses Projekt nicht verfügbar.'
    );
    expect(
      screen.queryByText('Für dieses Projekt gibt es noch keine Einladungen.')
    ).not.toBeInTheDocument();
  });

  it('creates an invitation and keeps its full URL in dismissible local UI state', async () => {
    const refresh =
      createDeferred<ReadBubblophyProjectInvitationManagerSnapshotActionResult>();
    const readInvitationsAction = vi
      .fn<
        () => Promise<ReadBubblophyProjectInvitationManagerSnapshotActionResult>
      >()
      .mockResolvedValueOnce({ status: 'found', snapshot: managerSnapshot })
      .mockReturnValueOnce(refresh.promise);
    const createInvitationAction = vi.fn(async () =>
      createInvitationResult({
        id: 'invite_new',
        email: 'martin@example.test',
        entryPath: `/invite/bubblophy_invite_${'a'.repeat(43)}`,
      })
    );

    render(
      <ProjectInvitationManager
        createInvitationAction={createInvitationAction}
        project={managerProject}
        readInvitationsAction={readInvitationsAction}
      />
    );

    await screen.findByText('pending@example.test');
    fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), {
      target: { value: 'martin@example.test' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Einladung erstellen' })
    );

    await waitFor(() => {
      expect(createInvitationAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        email: 'martin@example.test',
        role: 'member',
      });
    });
    const fullUrl = `http://localhost:3000/invite/bubblophy_invite_${'a'.repeat(43)}`;
    expect(await screen.findByLabelText('Einladungslink')).toHaveValue(fullUrl);
    const clientResult = await createInvitationAction.mock.results[0]?.value;
    expect(clientResult?.invitation).not.toHaveProperty('plaintextToken');

    const copyButton = screen.getByRole('button', { name: 'Link kopieren' });
    const dismissButton = screen.getByRole('button', {
      name: 'Link ausblenden',
    });
    expect(copyButton).toBeEnabled();
    expect(dismissButton).toBeEnabled();

    fireEvent.click(copyButton);
    expect(
      await screen.findByText('Einladungslink wurde kopiert.')
    ).toBeInTheDocument();

    await act(async () => {
      refresh.resolve({ status: 'found', snapshot: managerSnapshot });
      await refresh.promise;
    });

    fireEvent.click(dismissButton);
    await waitFor(() => {
      expect(screen.queryByLabelText('Einladungslink')).not.toBeInTheDocument();
    });
  });

  it('preserves a successful mutation and its link when the list refresh fails', async () => {
    const readInvitationsAction = vi
      .fn<
        () => Promise<ReadBubblophyProjectInvitationManagerSnapshotActionResult>
      >()
      .mockResolvedValueOnce({ status: 'found', snapshot: managerSnapshot })
      .mockRejectedValueOnce(new Error('refresh unavailable'));

    render(
      <ProjectInvitationManager
        createInvitationAction={vi.fn(async () =>
          createInvitationResult({
            id: 'invite_new',
            email: 'martin@example.test',
            entryPath: `/invite/bubblophy_invite_${'b'.repeat(43)}`,
          })
        )}
        project={managerProject}
        readInvitationsAction={readInvitationsAction}
      />
    );

    await screen.findByText('pending@example.test');
    fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), {
      target: { value: 'martin@example.test' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Einladung erstellen' })
    );

    expect(await screen.findByLabelText('Einladungslink')).toBeInTheDocument();
    expect(
      await screen.findByText('Einladung erstellt. Kopiere den Link jetzt.')
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Einladung gespeichert, aber die Liste konnte nicht aktualisiert werden.'
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent(
      'konnte gerade nicht erstellt werden'
    );
    expect(screen.queryByText('pending@example.test')).not.toBeInTheDocument();
  });

  it('offers lifecycle actions only for mutable invitation states', async () => {
    const invitations = [
      pendingInvitation,
      createInvitationSummary({
        id: 'invite_expired',
        email: 'expired@example.test',
        state: 'expired',
      }),
      createInvitationSummary({
        id: 'invite_accepted',
        email: 'accepted@example.test',
        state: 'accepted',
      }),
      createInvitationSummary({
        id: 'invite_revoked',
        email: 'revoked@example.test',
        state: 'revoked',
      }),
    ];

    const reinviteInvitationAction = vi.fn<
      () => Promise<ReinviteBubblophyProjectInvitationActionResult>
    >(async () => ({
      status: 'reinvited',
      invitation: {
        id: 'invite_expired',
        projectKey: 'BV',
        email: 'expired@example.test',
        role: 'member',
        expiresAt: '2026-07-25T10:00:00.000Z',
        updatedAt: '2026-07-18T12:00:00.000Z',
        entryPath: `/invite/bubblophy_invite_${'c'.repeat(43)}`,
      },
    }));

    render(
      <ProjectInvitationManager
        project={managerProject}
        readInvitationsAction={createReadInvitationsAction({
          status: 'found',
          snapshot: createManagerSnapshot(invitations),
        })}
        reinviteInvitationAction={reinviteInvitationAction}
        revokeInvitationAction={vi.fn()}
      />
    );

    const expiredRow = within(
      (await screen.findByText('expired@example.test')).closest('tr') ??
        document.body
    );
    expect(
      expiredRow.getByRole('button', {
        name: 'Einladung für expired@example.test erneuern',
      })
    ).toBeInTheDocument();
    expect(
      expiredRow.queryByRole('button', { name: /widerrufen/i })
    ).not.toBeInTheDocument();

    fireEvent.click(
      expiredRow.getByRole('button', {
        name: 'Einladung für expired@example.test erneuern',
      })
    );
    await waitFor(() => {
      expect(reinviteInvitationAction).toHaveBeenCalledWith({
        invitationId: 'invite_expired',
        expectedUpdatedAt: '2026-07-18T10:00:00.000Z',
      });
    });
    expect(await screen.findByLabelText('Einladungslink')).toHaveValue(
      `http://localhost:3000/invite/bubblophy_invite_${'c'.repeat(43)}`
    );

    for (const email of ['accepted@example.test', 'revoked@example.test']) {
      const row = within(
        (screen.getByText(email).closest('tr') as HTMLElement) ?? document.body
      );
      expect(row.queryByRole('button')).not.toBeInTheDocument();
      expect(row.getByText('Abgeschlossen')).toBeInTheDocument();
    }
  });

  it('confirms revocation and submits the stale-write guard', async () => {
    const revokeInvitationAction = vi.fn<
      () => Promise<RevokeBubblophyProjectInvitationActionResult>
    >(async () => ({
      status: 'revoked',
      invitationId: pendingInvitation.id,
      projectKey: 'BV',
      updatedAt: '2026-07-18T12:00:00.000Z',
    }));

    render(
      <ProjectInvitationManager
        project={managerProject}
        readInvitationsAction={createReadInvitationsAction({
          status: 'found',
          snapshot: managerSnapshot,
        })}
        revokeInvitationAction={revokeInvitationAction}
      />
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Einladung für pending@example.test widerrufen',
      })
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Widerruf für pending@example.test bestätigen',
      })
    );

    await waitFor(() => {
      expect(revokeInvitationAction).toHaveBeenCalledWith({
        invitationId: 'invite_pending',
        expectedUpdatedAt: pendingInvitation.updatedAt,
      });
    });
  });

  it('clears stale manager rows after authorization is denied', async () => {
    const readInvitationsAction = vi
      .fn<
        () => Promise<ReadBubblophyProjectInvitationManagerSnapshotActionResult>
      >()
      .mockResolvedValueOnce({ status: 'found', snapshot: managerSnapshot })
      .mockResolvedValueOnce({ status: 'not_found' });

    render(
      <ProjectInvitationManager
        project={managerProject}
        readInvitationsAction={readInvitationsAction}
        revokeInvitationAction={vi.fn(async () => ({
          status: 'forbidden' as const,
        }))}
      />
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Einladung für pending@example.test widerrufen',
      })
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Widerruf für pending@example.test bestätigen',
      })
    );

    await waitFor(() => {
      expect(
        screen.queryByText('pending@example.test')
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Einladungen sind für dieses Projekt nicht verfügbar.'
    );
    expect(
      screen.queryByRole('button', { name: 'Einladung erstellen' })
    ).not.toBeInTheDocument();
  });

  it('uses the server snapshot as an additional archived write guard', async () => {
    render(
      <ProjectInvitationManager
        createInvitationAction={vi.fn()}
        project={managerProject}
        readInvitationsAction={createReadInvitationsAction({
          status: 'found',
          snapshot: { ...managerSnapshot, isArchived: true },
        })}
        reinviteInvitationAction={vi.fn()}
        revokeInvitationAction={vi.fn()}
      />
    );

    expect(
      await screen.findByText(
        'Archivierte Projekte zeigen Einladungen nur lesend an.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Einladung erstellen' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /erneuern|widerrufen/i })
    ).not.toBeInTheDocument();
  });
});

const managerProject = {
  key: 'BV',
  isArchived: false,
  currentUserRole: 'owner',
} as const;

/** Creates one redacted manager snapshot for component tests. */
function createManagerSnapshot(
  invitations: BubblophyProjectInvitationManagerSummary[]
): BubblophyProjectInvitationManagerSnapshot {
  return {
    projectKey: 'BV',
    managerRole: 'owner',
    isArchived: false,
    invitations,
  };
}

/** Creates one invitation row with deterministic lifecycle timestamps. */
function createInvitationSummary(
  input: Pick<
    BubblophyProjectInvitationManagerSummary,
    'id' | 'email' | 'state'
  >
): BubblophyProjectInvitationManagerSummary {
  return {
    ...input,
    role: 'member',
    createdAt: '2026-07-17T10:00:00.000Z',
    expiresAt: '2026-07-24T10:00:00.000Z',
    acceptedAt: input.state === 'accepted' ? '2026-07-18T10:00:00.000Z' : null,
    revokedAt: input.state === 'revoked' ? '2026-07-18T10:00:00.000Z' : null,
    updatedAt: '2026-07-18T10:00:00.000Z',
  };
}

/** Creates the client-safe successful invitation action payload. */
function createInvitationResult(input: {
  id: string;
  email: string;
  entryPath: string;
}): Extract<
  CreateBubblophyProjectInvitationActionResult,
  { status: 'created' }
> {
  return {
    status: 'created',
    invitation: {
      ...input,
      projectKey: 'BV',
      role: 'member',
      expiresAt: '2026-07-24T10:00:00.000Z',
      updatedAt: '2026-07-18T10:00:00.000Z',
    },
  };
}

/** Creates a contract-typed manager snapshot action mock. */
function createReadInvitationsAction(
  result: ReadBubblophyProjectInvitationManagerSnapshotActionResult
) {
  return vi.fn(async () => result);
}

interface DeferredValue<Value> {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
}

/** Creates a manually resolvable promise for pending-refresh tests. */
function createDeferred<Value>(): DeferredValue<Value> {
  let resolvePromise: ((value: Value) => void) | null = null;
  const promise = new Promise<Value>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve(value) {
      if (!resolvePromise) {
        throw new Error('Deferred promise was not initialized.');
      }

      resolvePromise(value);
    },
  };
}
