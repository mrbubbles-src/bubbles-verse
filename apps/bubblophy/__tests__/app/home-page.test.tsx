import type {
  createBubblophyAgentTokenAction,
  createBubblophyIssueAction,
  createBubblophyIssuePlanAction,
  createBubblophyProjectAction,
  createBubblophyProjectInvitationAction,
  readBubblophyProjectInvitationManagerSnapshotAction,
  reinviteBubblophyProjectInvitationAction,
  revokeBubblophyProjectInvitationAction,
  transitionBubblophyProjectArchiveAction,
  updateBubblophyAgentTokenLifecycleAction,
  updateBubblophyIssueContentAction,
  updateBubblophyIssuePriorityAction,
  updateBubblophyIssueStatusAction,
  updateBubblophyProjectContentAction,
} from '@/app/actions';
import type { BubblophyDashboardSnapshotInput } from '@/lib/dashboard/data';
import type { DashboardSnapshot } from '@/lib/dashboard/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireBubblophySessionMock = vi.fn();
const getBubblophyDashboardSnapshotMock = vi.fn();
const syncBubblophyUserProfileMock = vi.fn();
const BubblophyDashboardMock = vi.fn(
  (props: {
    snapshot: DashboardSnapshot;
    createIssueAction?: typeof createBubblophyIssueAction;
    updateIssueContentAction?: typeof updateBubblophyIssueContentAction;
    createIssuePlanAction?: typeof createBubblophyIssuePlanAction;
    updateIssueStatusAction?: typeof updateBubblophyIssueStatusAction;
    updateIssuePriorityAction?: typeof updateBubblophyIssuePriorityAction;
    createProjectAction?: typeof createBubblophyProjectAction;
    updateProjectContentAction?: typeof updateBubblophyProjectContentAction;
    transitionProjectArchiveAction?: typeof transitionBubblophyProjectArchiveAction;
    readProjectInvitationsAction?: typeof readBubblophyProjectInvitationManagerSnapshotAction;
    createProjectInvitationAction?: typeof createBubblophyProjectInvitationAction;
    reinviteProjectInvitationAction?: typeof reinviteBubblophyProjectInvitationAction;
    revokeProjectInvitationAction?: typeof revokeBubblophyProjectInvitationAction;
    createAgentTokenAction?: typeof createBubblophyAgentTokenAction;
    updateAgentTokenLifecycleAction?: typeof updateBubblophyAgentTokenLifecycleAction;
  }) => <div data-testid="dashboard">{props.snapshot.projects[0]?.name}</div>
);

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();

  return {
    ...actual,
    connection: vi.fn(async () => undefined),
  };
});

vi.mock('@/lib/auth/session', () => ({
  requireBubblophySession: (options: { nextPath?: string }) =>
    requireBubblophySessionMock(options),
}));

vi.mock('@/lib/dashboard/data', () => ({
  getBubblophyDashboardSnapshot: (input: BubblophyDashboardSnapshotInput) =>
    getBubblophyDashboardSnapshotMock(input),
}));

vi.mock('@/lib/profiles/database-write', () => ({
  syncBubblophyUserProfile: (input: {
    user: object;
    normalizedEmail: string;
  }) => syncBubblophyUserProfileMock(input),
}));

vi.mock('@/components/dashboard/bubblophy-dashboard', () => ({
  BubblophyDashboard: (props: {
    snapshot: DashboardSnapshot;
    createIssueAction?: typeof createBubblophyIssueAction;
    updateIssueContentAction?: typeof updateBubblophyIssueContentAction;
    createIssuePlanAction?: typeof createBubblophyIssuePlanAction;
    updateIssueStatusAction?: typeof updateBubblophyIssueStatusAction;
    updateIssuePriorityAction?: typeof updateBubblophyIssuePriorityAction;
    createProjectAction?: typeof createBubblophyProjectAction;
    updateProjectContentAction?: typeof updateBubblophyProjectContentAction;
    transitionProjectArchiveAction?: typeof transitionBubblophyProjectArchiveAction;
    readProjectInvitationsAction?: typeof readBubblophyProjectInvitationManagerSnapshotAction;
    createProjectInvitationAction?: typeof createBubblophyProjectInvitationAction;
    reinviteProjectInvitationAction?: typeof reinviteBubblophyProjectInvitationAction;
    revokeProjectInvitationAction?: typeof revokeBubblophyProjectInvitationAction;
    createAgentTokenAction?: typeof createBubblophyAgentTokenAction;
    updateAgentTokenLifecycleAction?: typeof updateBubblophyAgentTokenLifecycleAction;
  }) => BubblophyDashboardMock(props),
}));

describe('Bubblophy home page', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    getBubblophyDashboardSnapshotMock.mockReset();
    syncBubblophyUserProfileMock.mockReset();
    syncBubblophyUserProfileMock.mockResolvedValue(undefined);
    BubblophyDashboardMock.mockClear();
  });

  it('requires a human Bubblophy session before loading the dashboard DTO', async () => {
    const snapshot = {
      meta: {
        dataSource: 'database',
        label: 'Datenbankdaten',
        description: 'Read-only Testdaten.',
      },
      currentUser: {
        authUserId: 'user_owner',
      },
      projects: [
        {
          id: 'project',
          name: 'Allowed Project',
          key: 'AP',
          description: 'Persistiertes Testprojekt.',
          isArchived: false,
          health: 'stabil',
          openIssues: 1,
          readyIssues: 1,
          blockedIssues: 0,
          memberCount: 1,
          agentTokenCount: 0,
        },
      ],
      issues: [],
      projectMembers: [],
      agentTokens: [],
      agentRuns: [],
      activity: [],
    } satisfies DashboardSnapshot;

    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_owner',
      email: 'owner@example.test',
      user: {},
    });
    getBubblophyDashboardSnapshotMock.mockResolvedValue(snapshot);

    const { ProtectedBubblophyDashboard } = await import('@/app/page');
    const element = await ProtectedBubblophyDashboard();

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(syncBubblophyUserProfileMock).toHaveBeenCalledWith({
      normalizedEmail: 'owner@example.test',
      user: {},
    });
    expect(getBubblophyDashboardSnapshotMock).toHaveBeenCalledWith({
      session: {
        authUserId: 'user_owner',
        email: 'owner@example.test',
        user: {},
      },
    });
    expect(element.props.snapshot).toBe(snapshot);
    expect(element.props.createIssueAction).toEqual(expect.any(Function));
    expect(element.props.updateIssueContentAction).toEqual(
      expect.any(Function)
    );
    expect(element.props.createIssuePlanAction).toEqual(expect.any(Function));
    expect(element.props.updateIssueStatusAction).toEqual(expect.any(Function));
    expect(element.props.updateIssuePriorityAction).toEqual(
      expect.any(Function)
    );
    expect(element.props.createProjectAction).toEqual(expect.any(Function));
    expect(element.props.updateProjectContentAction).toEqual(
      expect.any(Function)
    );
    expect(element.props.transitionProjectArchiveAction).toEqual(
      expect.any(Function)
    );
    expect(element.props.readProjectInvitationsAction).toEqual(
      expect.any(Function)
    );
    expect(element.props.createProjectInvitationAction).toEqual(
      expect.any(Function)
    );
    expect(element.props.reinviteProjectInvitationAction).toEqual(
      expect.any(Function)
    );
    expect(element.props.revokeProjectInvitationAction).toEqual(
      expect.any(Function)
    );
    expect(element.props.createAgentTokenAction).toEqual(expect.any(Function));
    expect(element.props.updateAgentTokenLifecycleAction).toEqual(
      expect.any(Function)
    );
  });

  it('does not load dashboard data when the session gate redirects', async () => {
    requireBubblophySessionMock.mockRejectedValue(
      new Error('NEXT_REDIRECT:/login?next=%2F')
    );

    const { ProtectedBubblophyDashboard } = await import('@/app/page');

    await expect(ProtectedBubblophyDashboard()).rejects.toThrow(
      'NEXT_REDIRECT:/login?next=%2F'
    );
    expect(getBubblophyDashboardSnapshotMock).not.toHaveBeenCalled();
    expect(syncBubblophyUserProfileMock).not.toHaveBeenCalled();
  });

  it('keeps display-profile failures outside the dashboard access gate', async () => {
    const session = {
      authUserId: 'user_owner',
      email: 'owner@example.test',
      user: {},
    };
    const snapshot = {
      meta: {
        dataSource: 'database',
        label: 'Datenbankdaten',
        description: 'Read-only Testdaten.',
      },
      currentUser: { authUserId: 'user_owner' },
      projects: [],
      issues: [],
      projectMembers: [],
      agentTokens: [],
      agentRuns: [],
      activity: [],
    } satisfies DashboardSnapshot;

    requireBubblophySessionMock.mockResolvedValue(session);
    syncBubblophyUserProfileMock.mockRejectedValue(
      new Error('profile table unavailable')
    );
    getBubblophyDashboardSnapshotMock.mockResolvedValue(snapshot);

    const { ProtectedBubblophyDashboard } = await import('@/app/page');
    const element = await ProtectedBubblophyDashboard();

    expect(getBubblophyDashboardSnapshotMock).toHaveBeenCalledWith({ session });
    expect(element.props.snapshot).toBe(snapshot);
  });
});
