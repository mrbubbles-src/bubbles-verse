import type {
  createBubblophyAgentTokenAction,
  createBubblophyIssueAction,
  createBubblophyIssuePlanAction,
  createBubblophyProjectAction,
} from '@/app/actions';
import type { BubblophyDashboardSnapshotInput } from '@/lib/dashboard/data';
import type { DashboardSnapshot } from '@/lib/dashboard/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireBubblophySessionMock = vi.fn();
const getBubblophyDashboardSnapshotMock = vi.fn();
const BubblophyDashboardMock = vi.fn(
  (props: {
    snapshot: DashboardSnapshot;
    createIssueAction?: typeof createBubblophyIssueAction;
    createIssuePlanAction?: typeof createBubblophyIssuePlanAction;
    createProjectAction?: typeof createBubblophyProjectAction;
    createAgentTokenAction?: typeof createBubblophyAgentTokenAction;
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

vi.mock('@/components/dashboard/bubblophy-dashboard', () => ({
  BubblophyDashboard: (props: {
    snapshot: DashboardSnapshot;
    createIssueAction?: typeof createBubblophyIssueAction;
    createIssuePlanAction?: typeof createBubblophyIssuePlanAction;
    createProjectAction?: typeof createBubblophyProjectAction;
    createAgentTokenAction?: typeof createBubblophyAgentTokenAction;
  }) => BubblophyDashboardMock(props),
}));

describe('Bubblophy home page', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    getBubblophyDashboardSnapshotMock.mockReset();
    BubblophyDashboardMock.mockClear();
  });

  it('requires a human Bubblophy session before loading the dashboard DTO', async () => {
    const snapshot = {
      meta: {
        dataSource: 'database',
        label: 'Datenbankdaten',
        description: 'Read-only Testdaten.',
      },
      projects: [
        {
          id: 'project',
          name: 'Allowed Project',
          key: 'AP',
          health: 'stabil',
          openIssues: 1,
          readyIssues: 1,
          blockedIssues: 0,
          memberCount: 1,
          agentTokenCount: 0,
        },
      ],
      issues: [],
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
    expect(getBubblophyDashboardSnapshotMock).toHaveBeenCalledWith({
      session: {
        authUserId: 'user_owner',
        email: 'owner@example.test',
        user: {},
      },
    });
    expect(element.props.snapshot).toBe(snapshot);
    expect(element.props.createIssueAction).toEqual(expect.any(Function));
    expect(element.props.createIssuePlanAction).toEqual(expect.any(Function));
    expect(element.props.createProjectAction).toEqual(expect.any(Function));
    expect(element.props.createAgentTokenAction).toEqual(expect.any(Function));
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
  });
});
