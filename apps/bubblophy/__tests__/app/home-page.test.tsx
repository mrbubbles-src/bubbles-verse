import type {
  createBubblophyAgentTokenAction,
  createBubblophyIssueAction,
  createBubblophyIssuePlanAction,
  createBubblophyProjectAction,
  createBubblophyProjectInvitationAction,
  readBubblophyIssueAssigneeOptionsAction,
  readBubblophyProjectInvitationManagerSnapshotAction,
  reinviteBubblophyProjectInvitationAction,
  revokeBubblophyProjectInvitationAction,
  transitionBubblophyProjectArchiveAction,
  updateBubblophyAgentTokenLifecycleAction,
  updateBubblophyIssueAssigneeAction,
  updateBubblophyIssueContentAction,
  updateBubblophyIssuePriorityAction,
  updateBubblophyIssueStatusAction,
  updateBubblophyProjectContentAction,
} from '@/app/actions';
import type { ReadDashboardActivityPageResult } from '@/lib/dashboard/activity';
import type { DashboardActivityPageRequestState } from '@/lib/dashboard/activity-query';
import type { DashboardAgentTokenPageRequestState } from '@/lib/dashboard/agent-token-query';
import type { ReadDashboardAgentTokenPageResult } from '@/lib/dashboard/agent-tokens';
import type { DashboardAllIssuePageRequestState } from '@/lib/dashboard/all-issue-query';
import type { ReadDashboardAllIssuePageResult } from '@/lib/dashboard/all-issues';
import type { BubblophyDashboardSnapshotInput } from '@/lib/dashboard/data';
import type { DashboardIssueReviewPageRequestState } from '@/lib/dashboard/issue-review-notification-query';
import type { ReadDashboardIssueReviewPageResult } from '@/lib/dashboard/issue-review-notifications';
import type {
  ReadDashboardIssueDetailResult,
  ReadDashboardIssuePageResult,
} from '@/lib/dashboard/issues';
import type { DashboardMemberPageRequestState } from '@/lib/dashboard/member-query';
import type { ReadDashboardMemberPageResult } from '@/lib/dashboard/members';
import type { DashboardNotificationPageRequestState } from '@/lib/dashboard/notification-query';
import type { ReadDashboardNotificationPageResult } from '@/lib/dashboard/notifications';
import type { DashboardRunPageRequestState } from '@/lib/dashboard/run-query';
import type { ReadDashboardRunPageResult } from '@/lib/dashboard/runs';
import type { DashboardSnapshot } from '@/lib/dashboard/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireBubblophySessionMock = vi.fn();
const getBubblophyDashboardSnapshotMock = vi.fn();
const syncBubblophyUserProfileMock = vi.fn();
const readDashboardIssuePageMock = vi.fn();
const readDashboardAllIssuePageMock = vi.fn();
const readDashboardIssueDetailMock = vi.fn();
const readDashboardRunPageMock = vi.fn();
const readDashboardMemberPageMock = vi.fn();
const readDashboardActivityPageMock = vi.fn();
const readDashboardAgentTokenPageMock = vi.fn();
const readDashboardNotificationPageMock = vi.fn();
const readDashboardIssueReviewPageMock = vi.fn();
const BubblophyDashboardMock = vi.fn(
  (props: {
    snapshot: DashboardSnapshot;
    allIssuePageRequest?: DashboardAllIssuePageRequestState | null;
    allIssuePageResult?: ReadDashboardAllIssuePageResult | null;
    issuePageResult?: ReadDashboardIssuePageResult | null;
    issueDetailResult?: ReadDashboardIssueDetailResult | null;
    runPageResult?: ReadDashboardRunPageResult | null;
    runPageRequest?: DashboardRunPageRequestState | null;
    memberPageRequest?: DashboardMemberPageRequestState | null;
    memberPageResult?: ReadDashboardMemberPageResult | null;
    activityPageRequest?: DashboardActivityPageRequestState | null;
    activityPageResult?: ReadDashboardActivityPageResult | null;
    agentTokenPageRequest?: DashboardAgentTokenPageRequestState | null;
    agentTokenPageResult?: ReadDashboardAgentTokenPageResult | null;
    notificationPageRequest?: DashboardNotificationPageRequestState | null;
    notificationPageResult?: ReadDashboardNotificationPageResult | null;
    issueReviewPageRequest?: DashboardIssueReviewPageRequestState | null;
    issueReviewPageResult?: ReadDashboardIssueReviewPageResult | null;
    createIssueAction?: typeof createBubblophyIssueAction;
    updateIssueContentAction?: typeof updateBubblophyIssueContentAction;
    updateIssueAssigneeAction?: typeof updateBubblophyIssueAssigneeAction;
    readIssueAssigneeOptionsAction?: typeof readBubblophyIssueAssigneeOptionsAction;
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

const homeSession = {
  authUserId: 'user_owner',
  email: 'owner@example.test',
  user: {},
};

const homeDatabaseSnapshot = {
  meta: {
    dataSource: 'database',
    label: 'Datenbankdaten',
    description: 'Persistierte Testdaten.',
  },
  currentUser: { authUserId: 'user_owner' },
  projects: [
    {
      id: 'project',
      name: 'Allowed Project',
      key: 'AP',
      isArchived: false,
      health: 'stabil',
      openIssues: 30,
      readyIssues: 2,
      blockedIssues: 0,
      memberCount: 1,
      agentTokenCount: 0,
    },
  ],
  projectMembers: [],
  agentRuns: [],
  activity: [],
} satisfies DashboardSnapshot;

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

vi.mock('@/lib/dashboard/all-issues', () => ({
  readDashboardAllIssuePage: (
    authUserId: string,
    input: Record<string, string | number | object | undefined>
  ) => readDashboardAllIssuePageMock(authUserId, input),
}));

vi.mock('@/lib/dashboard/issues', () => ({
  readDashboardIssuePage: (
    authUserId: string,
    input: Record<string, string | number | undefined>
  ) => readDashboardIssuePageMock(authUserId, input),
  readDashboardIssueDetail: (authUserId: string, input: { issueKey: string }) =>
    readDashboardIssueDetailMock(authUserId, input),
}));

vi.mock('@/lib/dashboard/runs', () => ({
  readDashboardRunPage: (
    authUserId: string,
    input: {
      projectKey: string;
      after?: { updatedAt: string; id: string };
    }
  ) => readDashboardRunPageMock(authUserId, input),
}));

vi.mock('@/lib/dashboard/members', () => ({
  readDashboardMemberPage: (
    authUserId: string,
    input: {
      projectKey: string;
      after?: { createdAt: string; authUserId: string };
    }
  ) => readDashboardMemberPageMock(authUserId, input),
}));

vi.mock('@/lib/dashboard/activity', () => ({
  readDashboardActivityPage: (
    authUserId: string,
    input: {
      projectKey?: string;
      kind?: string;
      after?: { occurredAt: string; source: string; eventId: string };
    }
  ) => readDashboardActivityPageMock(authUserId, input),
}));

vi.mock('@/lib/dashboard/agent-tokens', () => ({
  readDashboardAgentTokenPage: (
    authUserId: string,
    input: {
      projectKey?: string;
      after?: {
        projectKey: string;
        normalizedLabel: string;
        tokenId: string;
      };
    }
  ) => readDashboardAgentTokenPageMock(authUserId, input),
}));

vi.mock('@/lib/dashboard/notifications', () => ({
  readDashboardNotificationPage: (
    authUserId: string,
    input: {
      projectKey?: string;
      after?: { updatedAt: string; runId: string };
    }
  ) => readDashboardNotificationPageMock(authUserId, input),
}));

vi.mock('@/lib/dashboard/issue-review-notifications', () => ({
  readDashboardIssueReviewPage: (
    authUserId: string,
    input: {
      projectKey?: string;
      after?: {
        updatedAt: string;
        projectKey: string;
        issueNumber: number;
      };
    }
  ) => readDashboardIssueReviewPageMock(authUserId, input),
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
    allIssuePageRequest?: DashboardAllIssuePageRequestState | null;
    allIssuePageResult?: ReadDashboardAllIssuePageResult | null;
    issuePageResult?: ReadDashboardIssuePageResult | null;
    issueDetailResult?: ReadDashboardIssueDetailResult | null;
    runPageResult?: ReadDashboardRunPageResult | null;
    runPageRequest?: DashboardRunPageRequestState | null;
    memberPageRequest?: DashboardMemberPageRequestState | null;
    memberPageResult?: ReadDashboardMemberPageResult | null;
    activityPageRequest?: DashboardActivityPageRequestState | null;
    activityPageResult?: ReadDashboardActivityPageResult | null;
    agentTokenPageRequest?: DashboardAgentTokenPageRequestState | null;
    agentTokenPageResult?: ReadDashboardAgentTokenPageResult | null;
    notificationPageRequest?: DashboardNotificationPageRequestState | null;
    notificationPageResult?: ReadDashboardNotificationPageResult | null;
    issueReviewPageRequest?: DashboardIssueReviewPageRequestState | null;
    issueReviewPageResult?: ReadDashboardIssueReviewPageResult | null;
    createIssueAction?: typeof createBubblophyIssueAction;
    updateIssueContentAction?: typeof updateBubblophyIssueContentAction;
    updateIssueAssigneeAction?: typeof updateBubblophyIssueAssigneeAction;
    readIssueAssigneeOptionsAction?: typeof readBubblophyIssueAssigneeOptionsAction;
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
    readDashboardIssuePageMock.mockReset();
    readDashboardIssuePageMock.mockResolvedValue({ status: 'not_found' });
    readDashboardAllIssuePageMock.mockReset();
    readDashboardAllIssuePageMock.mockResolvedValue({
      status: 'success',
      sort: 'newest',
      filters: { query: null, status: null, priority: null },
      items: [],
      nextAfter: null,
    } satisfies ReadDashboardAllIssuePageResult);
    readDashboardIssueDetailMock.mockReset();
    readDashboardIssueDetailMock.mockResolvedValue({ status: 'not_found' });
    readDashboardRunPageMock.mockReset();
    readDashboardRunPageMock.mockResolvedValue({
      status: 'success',
      project: {
        key: 'AP',
        name: 'Allowed Project',
        isArchived: false,
        currentUserRole: 'owner',
      },
      items: [],
      nextAfter: null,
    });
    readDashboardMemberPageMock.mockReset();
    readDashboardMemberPageMock.mockResolvedValue({
      status: 'success',
      project: {
        key: 'AP',
        name: 'Allowed Project',
        isArchived: false,
        currentUserRole: 'owner',
      },
      items: [],
      nextAfter: null,
    } satisfies ReadDashboardMemberPageResult);
    readDashboardActivityPageMock.mockReset();
    readDashboardActivityPageMock.mockResolvedValue({
      status: 'success',
      filters: { projectKey: null, kind: null },
      items: [],
      nextAfter: null,
    } satisfies ReadDashboardActivityPageResult);
    readDashboardAgentTokenPageMock.mockReset();
    readDashboardAgentTokenPageMock.mockResolvedValue({
      status: 'success',
      project: null,
      query: null,
      items: [],
      nextAfter: null,
    } satisfies ReadDashboardAgentTokenPageResult);
    readDashboardNotificationPageMock.mockReset();
    readDashboardNotificationPageMock.mockResolvedValue({
      status: 'success',
      project: null,
      items: [],
      nextAfter: null,
    } satisfies ReadDashboardNotificationPageResult);
    readDashboardIssueReviewPageMock.mockReset();
    readDashboardIssueReviewPageMock.mockResolvedValue({
      status: 'success',
      project: null,
      items: [],
      nextAfter: null,
    } satisfies ReadDashboardIssueReviewPageResult);
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
      projectMembers: [],
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
      projectMembers: [],
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

  it('loads a filtered project page and direct detail from URL state', async () => {
    const pageResult = {
      status: 'success',
      project: {
        key: 'AP',
        name: 'Allowed Project',
        isArchived: false,
        currentUserRole: 'owner',
      },
      sort: 'oldest',
      filters: { query: 'OAuth', status: 'ready', priority: 'high' },
      items: [],
      nextAfterIssueNumber: null,
    } satisfies ReadDashboardIssuePageResult;
    const detailResult = {
      status: 'not_found',
    } satisfies ReadDashboardIssueDetailResult;

    requireBubblophySessionMock.mockResolvedValue(homeSession);
    getBubblophyDashboardSnapshotMock.mockResolvedValue(homeDatabaseSnapshot);
    readDashboardIssuePageMock.mockResolvedValue(pageResult);
    readDashboardIssueDetailMock.mockResolvedValue(detailResult);
    readDashboardAgentTokenPageMock.mockResolvedValue({
      status: 'success',
      project: {
        key: 'AP',
        name: 'Allowed Project',
        isArchived: false,
        currentUserRole: 'owner',
      },
      query: 'Codex',
      items: [],
      nextAfter: null,
    } satisfies ReadDashboardAgentTokenPageResult);

    const { ProtectedBubblophyDashboard } = await import('@/app/page');
    const element = await ProtectedBubblophyDashboard({
      searchParams: Promise.resolve({
        project: ' ap ',
        issue: 'ap-99',
        q: ' OAuth ',
        status: 'ready',
        priority: 'high',
        sort: 'oldest',
        after: '42',
        runAfterAt: '2026-07-19T12:00:00.000Z',
        runAfterId: 'run-20',
        memberAfterAt: '2026-07-01T09:00:00.000Z',
        memberAfterAuthUserId: 'user-20',
        activityKind: 'issue',
        activityAfterAt: '2026-07-19T11:00:00.000Z',
        activityAfterSource: 'issue',
        activityAfterId: 'event-20',
        tokenQ: ' Codex ',
        tokenAfterProject: ' ap ',
        tokenAfterLabel: ' Codex 20 ',
        tokenAfterId: ' token-20 ',
        notificationAfterAt: '2026-07-19T10:00:00.000Z',
        notificationAfterId: 'run-notification-20',
        issueReviewAfterAt: '2026-07-19T09:00:00.000Z',
        issueReviewAfterProject: ' ap ',
        issueReviewAfterIssue: '17',
      }),
    });

    expect(readDashboardIssuePageMock).toHaveBeenCalledWith('user_owner', {
      projectKey: 'AP',
      sort: 'oldest',
      afterIssueNumber: 42,
      query: 'OAuth',
      status: 'ready',
      priority: 'high',
    });
    expect(readDashboardIssueDetailMock).toHaveBeenCalledWith('user_owner', {
      issueKey: 'AP-99',
    });
    expect(readDashboardRunPageMock).toHaveBeenCalledWith('user_owner', {
      projectKey: 'AP',
      after: {
        updatedAt: '2026-07-19T12:00:00.000Z',
        id: 'run-20',
      },
    });
    expect(readDashboardMemberPageMock).toHaveBeenCalledWith('user_owner', {
      projectKey: 'AP',
      after: {
        createdAt: '2026-07-01T09:00:00.000Z',
        authUserId: 'user-20',
      },
    });
    expect(readDashboardActivityPageMock).toHaveBeenCalledWith('user_owner', {
      projectKey: 'AP',
      kind: 'issue',
      after: {
        occurredAt: '2026-07-19T11:00:00.000Z',
        source: 'issue',
        eventId: 'event-20',
      },
    });
    expect(readDashboardAgentTokenPageMock).toHaveBeenCalledWith('user_owner', {
      projectKey: 'AP',
      query: 'Codex',
      after: {
        projectKey: 'AP',
        normalizedLabel: 'codex 20',
        tokenId: 'token-20',
      },
    });
    expect(readDashboardNotificationPageMock).toHaveBeenCalledWith(
      'user_owner',
      {
        projectKey: 'AP',
        after: {
          updatedAt: '2026-07-19T10:00:00.000Z',
          runId: 'run-notification-20',
        },
      }
    );
    expect(readDashboardIssueReviewPageMock).toHaveBeenCalledWith(
      'user_owner',
      {
        projectKey: 'AP',
        after: {
          updatedAt: '2026-07-19T09:00:00.000Z',
          projectKey: 'AP',
          issueNumber: 17,
        },
      }
    );
    expect(element.props.issuePageResult).toBe(pageResult);
    expect(element.props.issueDetailResult).toBe(detailResult);
    expect(element.props.issuePageRequest).toEqual({
      projectKey: 'AP',
      sort: 'oldest',
      afterIssueNumber: 42,
      filters: { query: 'OAuth', status: 'ready', priority: 'high' },
    });
    expect(element.props.runPageRequest).toEqual({
      projectKey: 'AP',
      after: {
        updatedAt: '2026-07-19T12:00:00.000Z',
        id: 'run-20',
      },
    });
    expect(element.props.memberPageRequest).toEqual({
      projectKey: 'AP',
      after: {
        createdAt: '2026-07-01T09:00:00.000Z',
        authUserId: 'user-20',
      },
    });
    expect(element.props.agentTokenPageRequest).toEqual({
      projectKey: 'AP',
      query: 'Codex',
      after: {
        projectKey: 'AP',
        normalizedLabel: 'codex 20',
        tokenId: 'token-20',
      },
    });
    expect(element.props.activityPageRequest).toEqual({
      projectKey: 'AP',
      kind: 'issue',
      after: {
        occurredAt: '2026-07-19T11:00:00.000Z',
        source: 'issue',
        eventId: 'event-20',
      },
    });
    expect(element.props.notificationPageRequest).toEqual({
      projectKey: 'AP',
      after: {
        updatedAt: '2026-07-19T10:00:00.000Z',
        runId: 'run-notification-20',
      },
    });
    expect(element.props.issueReviewPageRequest).toEqual({
      projectKey: 'AP',
      after: {
        updatedAt: '2026-07-19T09:00:00.000Z',
        projectKey: 'AP',
        issueNumber: 17,
      },
    });
  });

  it('loads the bounded all-project page and direct public detail', async () => {
    const snapshot = {
      ...homeDatabaseSnapshot,
      projects: [],
    } satisfies DashboardSnapshot;

    requireBubblophySessionMock.mockResolvedValue(homeSession);
    getBubblophyDashboardSnapshotMock.mockResolvedValue(snapshot);
    readDashboardAllIssuePageMock.mockResolvedValue({
      status: 'success',
      sort: 'oldest',
      filters: { query: 'OAuth', status: 'ready', priority: 'high' },
      items: [],
      nextAfter: null,
    } satisfies ReadDashboardAllIssuePageResult);

    const { ProtectedBubblophyDashboard } = await import('@/app/page');
    const element = await ProtectedBubblophyDashboard({
      searchParams: Promise.resolve({
        project: 'all',
        issue: 'AP-1',
        q: ' OAuth ',
        status: 'ready',
        priority: 'high',
        sort: 'oldest',
        allAfterAt: '2026-07-19T12:00:00.000Z',
        allAfterProject: ' ap ',
        allAfterIssue: '14',
      }),
    });

    expect(readDashboardIssuePageMock).not.toHaveBeenCalled();
    expect(readDashboardMemberPageMock).not.toHaveBeenCalled();
    expect(readDashboardAllIssuePageMock).toHaveBeenCalledWith('user_owner', {
      sort: 'oldest',
      after: {
        updatedAt: '2026-07-19T12:00:00.000Z',
        projectKey: 'AP',
        issueNumber: 14,
      },
      query: 'OAuth',
      status: 'ready',
      priority: 'high',
    });
    expect(readDashboardIssueDetailMock).toHaveBeenCalledWith('user_owner', {
      issueKey: 'AP-1',
    });
    expect(readDashboardNotificationPageMock).toHaveBeenCalledWith(
      'user_owner',
      {}
    );
    expect(readDashboardIssueReviewPageMock).toHaveBeenCalledWith(
      'user_owner',
      {}
    );
    expect(element.props.issuePageResult).toBeNull();
    expect(element.props.allIssuePageResult).toMatchObject({
      status: 'success',
      items: [],
    });
    expect(element.props.allIssuePageRequest).toEqual({
      sort: 'oldest',
      after: {
        updatedAt: '2026-07-19T12:00:00.000Z',
        projectKey: 'AP',
        issueNumber: 14,
      },
      filters: { query: 'OAuth', status: 'ready', priority: 'high' },
    });
    expect(element.props.issueDetailResult).toEqual({ status: 'not_found' });
  });

  it('redacts a project when the final page membership gate loses access', async () => {
    const snapshot = {
      ...homeDatabaseSnapshot,
      projectMembers: [
        {
          id: 'AP:user_owner',
          projectKey: 'AP',
          authUserId: 'user_owner',
          label: 'Owner',
          role: 'owner',
          createdAt: '2026-07-19T10:00:00.000Z',
        },
      ],
      agentRuns: [
        {
          id: 'run-ap-5',
          issueId: 'AP-5',
          agentLabel: 'Runner',
          state: 'wartet',
          requestedBy: 'Mensch',
          lastEvent: 'Angelegt',
        },
      ],
      activity: [
        {
          id: 'event-ap',
          label: 'AP-Ereignis',
          actor: 'Mensch',
          occurredAt: '2026-07-19T10:00:00.000Z',
          projectKey: 'AP',
          issueId: 'AP-5',
        },
      ],
    } satisfies DashboardSnapshot;
    const detailResult = {
      status: 'success',
      project: {
        key: 'AP',
        name: 'Allowed Project',
        isArchived: false,
        currentUserRole: 'owner',
      },
      issue: {
        key: 'AP-5',
        issueNumber: 5,
        title: 'Race-Detail',
        description: 'Darf nach Membership-Entzug nicht erscheinen.',
        status: 'ready',
        priority: 'medium',
        requiresHumanApproval: false,
        assignedAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        createdAt: '2026-07-19T09:00:00.000Z',
        updatedAt: '2026-07-19T10:00:00.000Z',
        latestPlan: null,
        notes: [],
        hasMoreNotes: false,
      },
    } satisfies ReadDashboardIssueDetailResult;

    requireBubblophySessionMock.mockResolvedValue(homeSession);
    getBubblophyDashboardSnapshotMock.mockResolvedValue(snapshot);
    readDashboardIssuePageMock.mockResolvedValue({ status: 'not_found' });
    readDashboardIssueDetailMock.mockResolvedValue(detailResult);
    readDashboardNotificationPageMock.mockResolvedValue({
      status: 'not_found',
    } satisfies ReadDashboardNotificationPageResult);

    const { ProtectedBubblophyDashboard } = await import('@/app/page');
    const element = await ProtectedBubblophyDashboard({
      searchParams: Promise.resolve({ project: 'AP', issue: 'AP-5' }),
    });

    expect(element.props.snapshot.projects).toEqual([]);
    expect(element.props.snapshot.projectMembers).toEqual([]);
    expect(element.props.snapshot).not.toHaveProperty('agentTokens');
    expect(element.props.agentTokenPageResult).toBeNull();
    expect(element.props.notificationPageResult).toBeNull();
    expect(element.props.issueReviewPageResult).toBeNull();
    expect(element.props.snapshot.agentRuns).toEqual([]);
    expect(element.props.snapshot.activity).toEqual([]);
    expect(element.props.issueDetailResult).toBeNull();
    expect(element.props.issueDetailRequestKey).toBeNull();
    expect(element.props.deniedProjectKey).toBe('AP');
    expect(element.key).toBe('access-lost:AP');
  });

  it('loads the first page item detail when no issue is selected', async () => {
    const snapshot = {
      ...homeDatabaseSnapshot,
      projects: homeDatabaseSnapshot.projects.map((project) => ({
        ...project,
        openIssues: 1,
        readyIssues: 1,
      })),
    } satisfies DashboardSnapshot;
    const pageResult = {
      status: 'success',
      project: {
        key: 'AP',
        name: 'Allowed Project',
        isArchived: false,
        currentUserRole: 'owner',
      },
      sort: 'newest',
      filters: { query: null, status: null, priority: null },
      items: [
        {
          key: 'AP-5',
          issueNumber: 5,
          title: 'Erstes Issue',
          status: 'ready',
          priority: 'medium',
          requiresHumanApproval: false,
          assignedAuthUserId: null,
          assigneeLabel: 'Nicht zugewiesen',
          latestPlan: null,
        },
      ],
      nextAfterIssueNumber: null,
    } satisfies ReadDashboardIssuePageResult;
    const detailResult = {
      status: 'not_found',
    } satisfies ReadDashboardIssueDetailResult;

    requireBubblophySessionMock.mockResolvedValue(homeSession);
    getBubblophyDashboardSnapshotMock.mockResolvedValue(snapshot);
    readDashboardIssuePageMock.mockResolvedValue(pageResult);
    readDashboardIssueDetailMock.mockResolvedValue(detailResult);

    const { ProtectedBubblophyDashboard } = await import('@/app/page');
    const element = await ProtectedBubblophyDashboard({
      searchParams: Promise.resolve({ project: 'AP' }),
    });

    expect(readDashboardIssueDetailMock).toHaveBeenCalledWith('user_owner', {
      issueKey: 'AP-5',
    });
    expect(element.props.issueDetailResult).toBe(detailResult);
  });

  it('loads a full first-row fallback after a direct issue is not found', async () => {
    const pageResult = {
      status: 'success',
      project: {
        key: 'AP',
        name: 'Allowed Project',
        isArchived: false,
        currentUserRole: 'owner',
      },
      sort: 'newest',
      filters: { query: null, status: null, priority: null },
      items: [
        {
          key: 'AP-5',
          issueNumber: 5,
          title: 'Erstes Issue',
          status: 'ready',
          priority: 'medium',
          requiresHumanApproval: false,
          assignedAuthUserId: null,
          assigneeLabel: 'Nicht zugewiesen',
          latestPlan: null,
        },
      ],
      nextAfterIssueNumber: null,
    } satisfies ReadDashboardIssuePageResult;
    const fallbackDetail = {
      status: 'success',
      project: pageResult.project,
      issue: {
        ...pageResult.items[0]!,
        description: 'Vollständiges Fallback-Detail.',
        createdAt: '2026-07-19T09:00:00.000Z',
        updatedAt: '2026-07-19T10:00:00.000Z',
        latestPlan: null,
        notes: [],
        hasMoreNotes: false,
      },
    } satisfies ReadDashboardIssueDetailResult;

    requireBubblophySessionMock.mockResolvedValue(homeSession);
    getBubblophyDashboardSnapshotMock.mockResolvedValue(homeDatabaseSnapshot);
    readDashboardIssuePageMock.mockResolvedValue(pageResult);
    readDashboardIssueDetailMock
      .mockResolvedValueOnce({ status: 'not_found' })
      .mockResolvedValueOnce(fallbackDetail);

    const { ProtectedBubblophyDashboard } = await import('@/app/page');
    const element = await ProtectedBubblophyDashboard({
      searchParams: Promise.resolve({ project: 'AP', issue: 'AP-99' }),
    });

    expect(readDashboardIssueDetailMock).toHaveBeenNthCalledWith(
      1,
      'user_owner',
      { issueKey: 'AP-99' }
    );
    expect(readDashboardIssueDetailMock).toHaveBeenNthCalledWith(
      2,
      'user_owner',
      { issueKey: 'AP-5' }
    );
    expect(element.props.issueDetailResult).toBe(fallbackDetail);
    expect(element.props.issueDetailRequestKey).toBe('AP-5');
    expect(element.props.missingRequestedIssueKey).toBe('AP-99');
  });

  it('skips a stale page row after its direct detail is not found', async () => {
    const pageResult = {
      status: 'success',
      project: {
        key: 'AP',
        name: 'Allowed Project',
        isArchived: false,
        currentUserRole: 'owner',
      },
      sort: 'newest',
      filters: { query: null, status: null, priority: null },
      items: [
        {
          key: 'AP-99',
          issueNumber: 99,
          title: 'Gerade gelöschtes Issue',
          status: 'ready',
          priority: 'medium',
          requiresHumanApproval: false,
          assignedAuthUserId: null,
          assigneeLabel: 'Nicht zugewiesen',
          latestPlan: null,
        },
        {
          key: 'AP-5',
          issueNumber: 5,
          title: 'Nächstes sichtbares Issue',
          status: 'ready',
          priority: 'medium',
          requiresHumanApproval: false,
          assignedAuthUserId: null,
          assigneeLabel: 'Nicht zugewiesen',
          latestPlan: null,
        },
      ],
      nextAfterIssueNumber: null,
    } satisfies ReadDashboardIssuePageResult;
    const fallbackDetail = {
      status: 'success',
      project: pageResult.project,
      issue: {
        ...pageResult.items[1]!,
        description: 'Nächstes vollständiges Detail.',
        createdAt: '2026-07-19T09:00:00.000Z',
        updatedAt: '2026-07-19T10:00:00.000Z',
        latestPlan: null,
        notes: [],
        hasMoreNotes: false,
      },
    } satisfies ReadDashboardIssueDetailResult;

    requireBubblophySessionMock.mockResolvedValue(homeSession);
    getBubblophyDashboardSnapshotMock.mockResolvedValue(homeDatabaseSnapshot);
    readDashboardIssuePageMock.mockResolvedValue(pageResult);
    readDashboardIssueDetailMock
      .mockResolvedValueOnce({ status: 'not_found' })
      .mockResolvedValueOnce(fallbackDetail);

    const { ProtectedBubblophyDashboard } = await import('@/app/page');
    const element = await ProtectedBubblophyDashboard({
      searchParams: Promise.resolve({ project: 'AP', issue: 'AP-99' }),
    });

    expect(readDashboardIssueDetailMock).toHaveBeenNthCalledWith(
      2,
      'user_owner',
      { issueKey: 'AP-5' }
    );
    expect(element.props.issueDetailRequestKey).toBe('AP-5');
    expect(element.props.missingRequestedIssueKey).toBe('AP-99');
  });
});
