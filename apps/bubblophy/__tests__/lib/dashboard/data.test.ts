import type { BubblophyProjectIssuePersistenceRow } from '@/lib/issues/repository';

import {
  cloneDashboardSnapshot,
  getBubblophyDashboardSnapshot,
  loadBubblophyProjectIssueDashboardSnapshot,
} from '@/lib/dashboard/data';
import { dashboardSnapshot } from '@/lib/dashboard/sample-data';

import { afterEach, describe, expect, it, vi } from 'vitest';

const session = {
  authUserId: 'user_owner',
};

function makeRow(
  row: Partial<BubblophyProjectIssuePersistenceRow> = {}
): BubblophyProjectIssuePersistenceRow {
  return {
    projectId: 'project_bubblesverse',
    projectName: 'Bubblesverse',
    projectKey: 'BV',
    projectIsArchived: false,
    projectMemberCount: 2,
    activeAgentTokenCount: 1,
    issueDatabaseId: 'issue_bv_7',
    issueNumber: 7,
    issueTitle: 'Persistenten Read-Pfad anschließen',
    issueStatus: 'ready',
    issuePriority: 'high',
    issueAssignedAuthUserId: 'user_owner',
    issueRequiresHumanApproval: true,
    issuePlanStepCount: 4,
    ...row,
  };
}

describe('getBubblophyDashboardSnapshot', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns database metadata and mapped rows when the loader succeeds', async () => {
    const selectRows = vi.fn(async () => [makeRow()]);

    await expect(
      getBubblophyDashboardSnapshot({ session, loadRows: selectRows })
    ).resolves.toMatchObject({
      meta: {
        dataSource: 'database',
      },
      projects: [
        {
          id: 'project_bubblesverse',
          key: 'BV',
          openIssues: 1,
          readyIssues: 1,
        },
      ],
      issues: [
        {
          id: 'BV-07',
          title: 'Persistenten Read-Pfad anschließen',
          priority: 'hoch',
          status: 'bereit',
        },
      ],
    });
    expect(selectRows).toHaveBeenCalledWith('user_owner');
  });

  it('keeps an available but empty database empty instead of using sample data', async () => {
    await expect(
      getBubblophyDashboardSnapshot({
        session,
        loadRows: async () => [],
      })
    ).resolves.toMatchObject({
      meta: {
        dataSource: 'database',
      },
      projects: [],
      issues: [],
      agentTokens: [],
      agentRuns: [],
      activity: [],
    });
  });

  it('falls back to explicit sample data when the database is not configured', async () => {
    vi.stubEnv('DATABASE_URL', '');

    const snapshot = await getBubblophyDashboardSnapshot({ session });

    expect(snapshot.meta.dataSource).toBe('database_unavailable');
    expect(snapshot.meta.label).toBe('Sample-Fallback');
    expect(snapshot.projects).toEqual(dashboardSnapshot.projects);
  });

  it('falls back to explicit sample data when the loader throws', async () => {
    const snapshot = await getBubblophyDashboardSnapshot({
      session,
      loadRows: async () => {
        throw new Error('database unavailable');
      },
    });

    expect(snapshot.meta.dataSource).toBe('database_unavailable');
    expect(snapshot.issues).toEqual(dashboardSnapshot.issues);
  });
});

describe('loadBubblophyProjectIssueDashboardSnapshot', () => {
  it('builds a database snapshot through an injected row selector', async () => {
    await expect(
      loadBubblophyProjectIssueDashboardSnapshot({
        authUserId: 'user_owner',
        selectRows: async () => [makeRow()],
      })
    ).resolves.toMatchObject({
      meta: {
        dataSource: 'database',
      },
      projects: [{ key: 'BV' }],
      issues: [{ id: 'BV-07' }],
    });
  });
});

describe('cloneDashboardSnapshot', () => {
  it('copies metadata and nested token scopes instead of sharing mutable objects', () => {
    const clone = cloneDashboardSnapshot(dashboardSnapshot);

    expect(clone.meta).toEqual(dashboardSnapshot.meta);
    expect(clone.meta).not.toBe(dashboardSnapshot.meta);
    expect(clone.agentTokens[0]).not.toBe(dashboardSnapshot.agentTokens[0]);
    expect(clone.agentTokens[0]?.scopes).not.toBe(
      dashboardSnapshot.agentTokens[0]?.scopes
    );
  });
});
