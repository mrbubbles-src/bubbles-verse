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
    agentRunRows: [
      {
        id: 'run_codex',
        projectKey: 'BV',
        projectIsArchived: false,
        issueNumber: 7,
        agentTokenLabel: 'Codex lokal',
        agentTokenScopes: ['runs:update'],
        agentTokenState: 'active',
        agentTokenExpiresAt: null,
        state: 'requested',
        updatedAt: '2026-06-13T16:10:00.000Z',
        result: null,
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
      projectMembers: [],
      activity: [],
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
    expect(snapshot.projectMembers).toEqual([]);
  });

  it('marks an available but empty database without using sample data', async () => {
    await expect(
      getBubblophyDashboardSnapshot({
        session,
        loadRows: async () =>
          makeDatabaseRows({
            projectRows: [],
            agentRunRows: [],
          }),
      })
    ).resolves.toMatchObject({
      meta: {
        dataSource: 'empty_database',
        label: 'Leere Datenbank',
      },
      projects: [],
      projectMembers: [],
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
    expect(snapshot).not.toHaveProperty('agentTokens');
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
  it('copies metadata and projects instead of sharing mutable objects', () => {
    const clone = cloneDashboardSnapshot(dashboardSnapshot);

    expect(clone.meta).toEqual(dashboardSnapshot.meta);
    expect(clone.meta).not.toBe(dashboardSnapshot.meta);
    expect(clone.currentUser).toEqual(dashboardSnapshot.currentUser);
    expect(clone.currentUser).not.toBe(dashboardSnapshot.currentUser);
    expect(clone.projects[0]).not.toBe(dashboardSnapshot.projects[0]);
  });

  it('clones current user identity without sharing references', () => {
    const clone = cloneDashboardSnapshot(dashboardSnapshot);

    clone.currentUser.authUserId = 'changed_user';

    expect(dashboardSnapshot.currentUser.authUserId).toBe('user_mrbubbles');
    expect(clone.currentUser.authUserId).toBe('changed_user');
  });
});
