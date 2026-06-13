import type { BubblophyProjectIssuePersistenceRow } from '@/lib/issues/repository';

import {
  buildBubblophyProjectIssueSnapshot,
  buildBubblophyProjectIssueSnapshotForUser,
  deriveBubblophyProjectHealth,
  formatBubblophyIssueKey,
  mapBubblophyIssuePriority,
  mapBubblophyIssueStatus,
} from '@/lib/issues/repository';

import { describe, expect, it } from 'vitest';

const baseProjectRow = {
  projectId: 'project_bubblesverse',
  projectName: 'Bubblesverse',
  projectKey: 'BV',
  projectIsArchived: false,
  projectMemberCount: 3,
  activeAgentTokenCount: 2,
} satisfies Pick<
  BubblophyProjectIssuePersistenceRow,
  | 'projectId'
  | 'projectName'
  | 'projectKey'
  | 'projectIsArchived'
  | 'projectMemberCount'
  | 'activeAgentTokenCount'
>;

function makeIssueRow(
  row: Partial<BubblophyProjectIssuePersistenceRow>
): BubblophyProjectIssuePersistenceRow {
  return {
    ...baseProjectRow,
    issueDatabaseId: 'issue_bv_1',
    issueNumber: 1,
    issueTitle: 'Projekt-Issue vorbereiten',
    issueStatus: 'ready',
    issuePriority: 'high',
    issueAssignedAuthUserId: 'mrbubbles',
    issueRequiresHumanApproval: true,
    issuePlanStepCount: 3,
    ...row,
  };
}

describe('Bubblophy issue repository mapping', () => {
  it('maps database enum values into dashboard labels', () => {
    expect(mapBubblophyIssueStatus('triage')).toBe('triage');
    expect(mapBubblophyIssueStatus('planned')).toBe('geplant');
    expect(mapBubblophyIssueStatus('ready')).toBe('bereit');
    expect(mapBubblophyIssueStatus('in_progress')).toBe('in_arbeit');
    expect(mapBubblophyIssueStatus('review')).toBe('review');
    expect(mapBubblophyIssueStatus('blocked')).toBe('blockiert');
    expect(mapBubblophyIssueStatus('done')).toBeNull();

    expect(mapBubblophyIssuePriority('low')).toBe('niedrig');
    expect(mapBubblophyIssuePriority('medium')).toBe('mittel');
    expect(mapBubblophyIssuePriority('high')).toBe('hoch');
  });

  it('formats stable human-facing issue keys', () => {
    expect(formatBubblophyIssueKey('BV', 1)).toBe('BV-01');
    expect(formatBubblophyIssueKey('BV', 14)).toBe('BV-14');
  });

  it('builds project and issue summaries without opening a database connection', () => {
    const snapshot = buildBubblophyProjectIssueSnapshot([
      makeIssueRow({
        issueDatabaseId: 'issue_bv_14',
        issueNumber: 14,
        issueTitle: 'Agent-Zugriff mit projektbezogenen Tokens',
        issueStatus: 'ready',
        issuePriority: 'high',
        issuePlanStepCount: 5,
      }),
      makeIssueRow({
        issueDatabaseId: 'issue_bv_15',
        issueNumber: 15,
        issueTitle: 'Blockierte RLS-Frage klären',
        issueStatus: 'blocked',
        issuePriority: 'medium',
        issueAssignedAuthUserId: null,
        issueRequiresHumanApproval: null,
        issuePlanStepCount: -1,
      }),
      makeIssueRow({
        issueDatabaseId: 'issue_bv_16',
        issueNumber: 16,
        issueStatus: 'done',
      }),
    ]);

    expect(snapshot.projects).toEqual([
      {
        id: 'project_bubblesverse',
        name: 'Bubblesverse',
        key: 'BV',
        health: 'blockiert',
        openIssues: 2,
        readyIssues: 1,
        blockedIssues: 1,
        memberCount: 3,
        agentTokenCount: 2,
      },
    ]);

    expect(snapshot.issues).toEqual([
      {
        id: 'BV-14',
        title: 'Agent-Zugriff mit projektbezogenen Tokens',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'mrbubbles',
        planSteps: 5,
        approvalRequired: true,
      },
      {
        id: 'BV-15',
        title: 'Blockierte RLS-Frage klären',
        projectKey: 'BV',
        status: 'blockiert',
        priority: 'mittel',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
      },
    ]);
  });

  it('keeps empty and archived projects out of unsafe states', () => {
    const snapshot = buildBubblophyProjectIssueSnapshot([
      makeIssueRow({
        projectId: 'project_empty',
        projectName: 'Leeres Projekt',
        projectKey: 'LP',
        projectMemberCount: -1,
        activeAgentTokenCount: -1,
        issueDatabaseId: null,
        issueNumber: null,
        issueTitle: null,
        issueStatus: null,
        issuePriority: null,
      }),
      makeIssueRow({
        projectId: 'project_archived',
        projectName: 'Archiv',
        projectKey: 'AR',
        projectIsArchived: true,
      }),
    ]);

    expect(snapshot.projects).toEqual([
      {
        id: 'project_empty',
        name: 'Leeres Projekt',
        key: 'LP',
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 0,
        agentTokenCount: 0,
      },
    ]);
    expect(snapshot.issues).toEqual([]);
  });

  it('filters membership-aware rows to the authenticated user', () => {
    const snapshot = buildBubblophyProjectIssueSnapshotForUser('user_owner', [
      {
        ...makeIssueRow({
          projectId: 'project_allowed',
          projectName: 'Allowed',
          projectKey: 'AL',
        }),
        projectMemberAuthUserId: 'user_owner',
      },
      {
        ...makeIssueRow({
          projectId: 'project_foreign',
          projectName: 'Foreign',
          projectKey: 'FR',
        }),
        projectMemberAuthUserId: 'user_other',
      },
    ]);

    expect(snapshot.projects).toEqual([
      expect.objectContaining({
        id: 'project_allowed',
        key: 'AL',
      }),
    ]);
    expect(snapshot.issues).toEqual([
      expect.objectContaining({
        projectKey: 'AL',
      }),
    ]);
  });

  it('derives stable, attentive, and blocked project health', () => {
    expect(
      deriveBubblophyProjectHealth({
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
      })
    ).toBe('stabil');
    expect(
      deriveBubblophyProjectHealth({
        openIssues: 10,
        readyIssues: 0,
        blockedIssues: 0,
      })
    ).toBe('aufmerksam');
    expect(
      deriveBubblophyProjectHealth({
        openIssues: 1,
        readyIssues: 0,
        blockedIssues: 1,
      })
    ).toBe('blockiert');
  });
});
