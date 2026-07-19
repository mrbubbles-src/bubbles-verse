import type { BubblophyDashboardPersistenceRows } from '@/lib/dashboard/data';
import type { BubblophyProjectPersistenceRow } from '@/lib/issues/repository';

import {
  cloneDashboardSnapshot,
  getBubblophyDashboardSnapshot,
  loadBubblophyDashboardSnapshot,
} from '@/lib/dashboard/data';
import { dashboardSnapshot } from '@/lib/dashboard/sample-data';

import { afterEach, describe, expect, it, vi } from 'vitest';

const session = {
  authUserId: 'user_owner',
};

function makeProjectRow(
  row: Partial<BubblophyProjectPersistenceRow> = {}
): BubblophyProjectPersistenceRow {
  return {
    id: 'project_bubblesverse',
    name: 'Bubblesverse',
    key: 'BV',
    description: 'Projektbeschreibung aus dem Read-Pfad.',
    isArchived: false,
    memberCount: 2,
    activeAgentTokenCount: 1,
    openIssueCount: 1,
    readyIssueCount: 1,
    blockedIssueCount: 0,
    currentUserRole: 'owner',
    ...row,
  };
}

function makeDatabaseRows(
  rows: Partial<BubblophyDashboardPersistenceRows> = {}
): BubblophyDashboardPersistenceRows {
  return {
    projectRows: [makeProjectRow()],
    projectMemberRows: [
      {
        projectKey: 'BV',
        authUserId: 'user_owner',
        role: 'owner',
        createdAt: '2026-06-13T10:00:00.000Z',
      },
      {
        projectKey: 'BV',
        authUserId: 'user_martin',
        role: 'viewer',
        createdAt: '2026-06-13T11:00:00.000Z',
      },
    ],
    agentTokenRows: [
      {
        id: 'token_codex',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'active',
        lastUsedAt: null,
        expiresAt: null,
      },
    ],
    agentRunRows: [
      {
        id: 'run_codex',
        projectKey: 'BV',
        issueNumber: 7,
        agentTokenLabel: 'Codex lokal',
        state: 'requested',
        updatedAt: '2026-06-13T16:10:00.000Z',
        result: null,
      },
    ],
    activityRows: [
      {
        id: 'event_token_created',
        summary: 'Agent-Token "Codex lokal" für BV erstellt.',
        actorAuthUserId: 'user_owner',
        actorAgentTokenLabel: null,
        createdAt: '2026-06-13T16:00:00.000Z',
        projectKey: 'BV',
        issueNumber: null,
      },
      {
        id: 'event_issue_ready',
        summary: 'Issue BV-07 auf bereit gesetzt.',
        actorAuthUserId: null,
        actorAgentTokenLabel: 'Codex lokal',
        createdAt: '2026-06-13T16:05:00.000Z',
        projectKey: 'BV',
        issueNumber: 7,
      },
    ],
    ...rows,
  };
}

describe('getBubblophyDashboardSnapshot', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns database metadata and mapped rows when the loader succeeds', async () => {
    const selectRows = vi.fn(async () => makeDatabaseRows());

    await expect(
      getBubblophyDashboardSnapshot({ session, loadRows: selectRows })
    ).resolves.toMatchObject({
      meta: {
        dataSource: 'database',
      },
      currentUser: {
        authUserId: 'user_owner',
      },
      projects: [
        {
          id: 'project_bubblesverse',
          key: 'BV',
          openIssues: 1,
          readyIssues: 1,
        },
      ],
      projectMembers: [
        {
          id: 'BV:user_owner',
          authUserId: 'user_owner',
          role: 'owner',
          label: 'user_owner',
        },
        {
          id: 'BV:user_martin',
          authUserId: 'user_martin',
          role: 'viewer',
          label: 'user_martin',
        },
      ],
      agentTokens: [
        {
          id: 'token_codex',
          label: 'Codex lokal',
          projectKey: 'BV',
          scopes: ['projects:read', 'issues:read'],
          state: 'aktiv',
          lastUsedAt: 'noch nie verwendet',
          expiresAt: 'läuft nicht automatisch ab',
        },
      ],
      activity: [
        {
          id: 'event_token_created',
          label: 'Agent-Token "Codex lokal" für BV erstellt.',
          actor: 'Mensch',
          occurredAt: '2026-06-13T16:00:00.000Z',
          projectKey: 'BV',
        },
        {
          id: 'event_issue_ready',
          label: 'Issue BV-07 auf bereit gesetzt.',
          actor: 'Agent-Token Codex lokal',
          occurredAt: '2026-06-13T16:05:00.000Z',
          projectKey: 'BV',
          issueId: 'BV-07',
        },
      ],
      agentRuns: [
        {
          id: 'run_codex',
          issueId: 'BV-07',
          agentLabel: 'Codex lokal',
          state: 'wartet',
          requestedBy: 'Mensch',
          lastEvent: 'Status wartet · zuletzt 2026-06-13T16:10:00.000Z',
        },
      ],
    });
    expect(selectRows).toHaveBeenCalledWith('user_owner');
  });

  it('includes current auth user id in database snapshots', async () => {
    const snapshot = await getBubblophyDashboardSnapshot({
      session,
      loadRows: async () => makeDatabaseRows(),
    });

    expect(snapshot.currentUser).toEqual({
      authUserId: 'user_owner',
    });
    expect(JSON.stringify(snapshot.currentUser)).not.toContain('email');
    expect(JSON.stringify(snapshot.currentUser)).not.toContain('profile');
  });

  it('does not expose token secrets in database snapshots', async () => {
    const snapshot = await getBubblophyDashboardSnapshot({
      session,
      loadRows: async () => makeDatabaseRows(),
    });
    const serializedSnapshot = JSON.stringify(snapshot);

    expect(serializedSnapshot).not.toContain('tokenHash');
    expect(serializedSnapshot).not.toContain('plaintextToken');
    expect(serializedSnapshot).not.toContain('requestedByAuthUserId');
    expect(serializedSnapshot).not.toContain('actorAuthUserId');
    expect(serializedSnapshot).not.toContain('assigneeAuthUserId');
    expect(snapshot.projectMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          authUserId: 'user_owner',
          label: 'user_owner',
        }),
      ])
    );
  });

  it('marks an available but empty database without using sample data', async () => {
    await expect(
      getBubblophyDashboardSnapshot({
        session,
        loadRows: async () =>
          makeDatabaseRows({
            projectRows: [],
            projectMemberRows: [],
            agentTokenRows: [],
            agentRunRows: [],
            activityRows: [],
          }),
      })
    ).resolves.toMatchObject({
      meta: {
        dataSource: 'empty_database',
        label: 'Leere Datenbank',
      },
      projects: [],
      projectMembers: [],
      agentTokens: [],
      agentRuns: [],
      activity: [],
    });
  });

  it('returns a safe setup state when the database is not configured', async () => {
    vi.stubEnv('DATABASE_URL', '');

    const snapshot = await getBubblophyDashboardSnapshot({ session });

    expect(snapshot.meta.dataSource).toBe('database_unavailable');
    expect(snapshot.meta.label).toBe('Datenbank nicht bereit');
    expect(snapshot.meta.reason).toBe('not_configured');
    expect(snapshot.meta.hint).toContain('DATABASE_URL');
    expect(snapshot.currentUser.authUserId).toBe('user_owner');
    expect(snapshot.projects).toEqual([]);
    expect(snapshot.agentTokens).toEqual([]);
    expect(snapshot.activity).toEqual([]);
  });

  it('returns a safe schema setup state when the loader reports missing tables', async () => {
    const snapshot = await getBubblophyDashboardSnapshot({
      session,
      loadRows: async () => {
        throw new Error('relation "bubblophy_projects" does not exist');
      },
    });

    expect(snapshot.meta.dataSource).toBe('database_unavailable');
    expect(snapshot.meta.reason).toBe('schema_missing');
    expect(snapshot.meta.hint).toContain('Bubblophy-Tabellen');
    expect(JSON.stringify(snapshot)).not.toContain('bubblophy_projects');
  });

  it('returns a safe connection setup state when the loader cannot connect', async () => {
    const snapshot = await getBubblophyDashboardSnapshot({
      session,
      loadRows: async () => {
        throw new Error('connect ECONNREFUSED postgres://secret@example');
      },
    });

    const serializedSnapshot = JSON.stringify(snapshot);

    expect(snapshot.meta.dataSource).toBe('database_unavailable');
    expect(snapshot.meta.reason).toBe('connection_failed');
    expect(snapshot.projects).toEqual([]);
    expect(serializedSnapshot).not.toContain('secret@example');
  });
});

describe('loadBubblophyDashboardSnapshot', () => {
  it('builds a database snapshot through an injected row selector', async () => {
    await expect(
      loadBubblophyDashboardSnapshot({
        authUserId: 'user_owner',
        selectRows: async () => makeDatabaseRows(),
      })
    ).resolves.toMatchObject({
      meta: {
        dataSource: 'database',
      },
      projects: [{ key: 'BV' }],
    });
  });
});

describe('cloneDashboardSnapshot', () => {
  it('copies metadata and nested token scopes instead of sharing mutable objects', () => {
    const clone = cloneDashboardSnapshot(dashboardSnapshot);

    expect(clone.meta).toEqual(dashboardSnapshot.meta);
    expect(clone.meta).not.toBe(dashboardSnapshot.meta);
    expect(clone.currentUser).toEqual(dashboardSnapshot.currentUser);
    expect(clone.currentUser).not.toBe(dashboardSnapshot.currentUser);
    expect(clone.agentTokens[0]).not.toBe(dashboardSnapshot.agentTokens[0]);
    expect(clone.agentTokens[0]?.scopes).not.toBe(
      dashboardSnapshot.agentTokens[0]?.scopes
    );
  });

  it('clones current user identity without sharing references', () => {
    const clone = cloneDashboardSnapshot(dashboardSnapshot);

    clone.currentUser.authUserId = 'changed_user';

    expect(dashboardSnapshot.currentUser.authUserId).toBe('user_mrbubbles');
    expect(clone.currentUser.authUserId).toBe('changed_user');
  });
});
