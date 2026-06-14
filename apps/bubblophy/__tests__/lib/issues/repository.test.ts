import type { BubblophyProjectIssuePersistenceRow } from '@/lib/issues/repository';

import {
  buildBubblophyActivityEvents,
  buildBubblophyAgentRunSummaries,
  buildBubblophyAgentTokenSummaries,
  buildBubblophyProjectIssueSnapshot,
  buildBubblophyProjectIssueSnapshotForUser,
  buildBubblophyProjectMemberSummaries,
  deriveBubblophyProjectHealth,
  formatBubblophyIssueKey,
  formatBubblophyProjectMemberId,
  mapBubblophyAgentRunState,
  mapBubblophyAgentTokenState,
  mapBubblophyIssuePriority,
  mapBubblophyIssueStatus,
} from '@/lib/issues/repository';

import { describe, expect, it } from 'vitest';

const baseProjectRow = {
  projectId: 'project_bubblesverse',
  projectName: 'Bubblesverse',
  projectKey: 'BV',
  projectDescription: 'Projektbeschreibung aus der Datenbank.',
  projectIsArchived: false,
  projectMemberCount: 3,
  activeAgentTokenCount: 2,
} satisfies Pick<
  BubblophyProjectIssuePersistenceRow,
  | 'projectId'
  | 'projectName'
  | 'projectKey'
  | 'projectDescription'
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
    issueDescription: 'Beschreibung aus der Datenbank.',
    issueStatus: 'ready',
    issuePriority: 'high',
    issueAssignedAuthUserId: 'mrbubbles',
    issueRequiresHumanApproval: true,
    issuePlanStepCount: 3,
    issuePlanVersion: null,
    issuePlanSummary: null,
    issuePlanSteps: null,
    issueNotes: [],
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
    expect(mapBubblophyIssueStatus('done')).toBe('erledigt');

    expect(mapBubblophyIssuePriority('low')).toBe('niedrig');
    expect(mapBubblophyIssuePriority('medium')).toBe('mittel');
    expect(mapBubblophyIssuePriority('high')).toBe('hoch');

    expect(mapBubblophyAgentTokenState('active')).toBe('aktiv');
    expect(mapBubblophyAgentTokenState('paused')).toBe('pausiert');
    expect(mapBubblophyAgentTokenState('revoked')).toBe('widerrufen');

    expect(mapBubblophyAgentRunState('requested')).toBe('wartet');
    expect(mapBubblophyAgentRunState('approved')).toBe('freigegeben');
    expect(mapBubblophyAgentRunState('running')).toBe('läuft');
    expect(mapBubblophyAgentRunState('needs_review')).toBe('review');
    expect(mapBubblophyAgentRunState('completed')).toBe('abgeschlossen');
    expect(mapBubblophyAgentRunState('cancelled')).toBe('abgebrochen');
    expect(mapBubblophyAgentRunState('failed')).toBe('fehlgeschlagen');
  });

  it('formats stable human-facing issue keys', () => {
    expect(formatBubblophyIssueKey('BV', 1)).toBe('BV-01');
    expect(formatBubblophyIssueKey('BV', 14)).toBe('BV-14');
  });

  it('maps project member rows without inventing profile or email fields', () => {
    expect(formatBubblophyProjectMemberId('BV', 'user_martin')).toBe(
      'BV:user_martin'
    );
    expect(
      buildBubblophyProjectMemberSummaries([
        {
          projectKey: 'BV',
          authUserId: 'user_viewer',
          role: 'viewer',
          createdAt: '2026-06-13T11:00:00.000Z',
        },
        {
          projectKey: 'BV',
          authUserId: 'user_owner',
          role: 'owner',
          createdAt: '2026-06-13T10:00:00.000Z',
        },
      ])
    ).toEqual([
      {
        id: 'BV:user_owner',
        projectKey: 'BV',
        authUserId: 'user_owner',
        label: 'user_owner',
        role: 'owner',
        createdAt: '2026-06-13T10:00:00.000Z',
      },
      {
        id: 'BV:user_viewer',
        projectKey: 'BV',
        authUserId: 'user_viewer',
        label: 'user_viewer',
        role: 'viewer',
        createdAt: '2026-06-13T11:00:00.000Z',
      },
    ]);
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
        description: 'Projektbeschreibung aus der Datenbank.',
        isArchived: false,
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
        description: 'Beschreibung aus der Datenbank.',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'mrbubbles',
        planSteps: 5,
        latestPlan: undefined,
        notes: [],
        approvalRequired: true,
      },
      {
        id: 'BV-15',
        title: 'Blockierte RLS-Frage klären',
        description: 'Beschreibung aus der Datenbank.',
        projectKey: 'BV',
        status: 'blockiert',
        priority: 'mittel',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        latestPlan: undefined,
        notes: [],
        approvalRequired: true,
      },
      {
        id: 'BV-16',
        title: 'Projekt-Issue vorbereiten',
        description: 'Beschreibung aus der Datenbank.',
        projectKey: 'BV',
        status: 'erledigt',
        priority: 'hoch',
        owner: 'mrbubbles',
        planSteps: 3,
        latestPlan: undefined,
        notes: [],
        approvalRequired: true,
      },
    ]);
  });

  it('maps latest plan content into issue summaries', () => {
    const snapshot = buildBubblophyProjectIssueSnapshot([
      makeIssueRow({
        issueDatabaseId: 'issue_bv_14',
        issueNumber: 14,
        issuePlanStepCount: 99,
        issuePlanVersion: 3,
        issuePlanSummary: 'Reload zeigt den letzten Plan.',
        issuePlanSteps: [
          { id: 'step_1', text: 'Kontext nach Reload lesen' },
          { id: 'step_2', text: 'UI-Details prüfen' },
          { id: 'broken', text: '   ' },
        ],
      }),
    ]);

    expect(snapshot.issues).toEqual([
      expect.objectContaining({
        id: 'BV-14',
        planSteps: 2,
        latestPlan: {
          version: 3,
          summary: 'Reload zeigt den letzten Plan.',
          steps: [
            { id: 'step_1', text: 'Kontext nach Reload lesen' },
            { id: 'step_2', text: 'UI-Details prüfen' },
          ],
        },
      }),
    ]);
  });

  it('masks raw auth identifiers in issue owner UI labels', () => {
    const snapshot = buildBubblophyProjectIssueSnapshot([
      makeIssueRow({
        issueAssignedAuthUserId: 'user_owner',
      }),
      makeIssueRow({
        issueDatabaseId: 'issue_bv_2',
        issueNumber: 2,
        issueAssignedAuthUserId: '2e3f7004-3065-449f-84f8-0ecb68c1cb46',
      }),
    ]);

    expect(snapshot.issues).toEqual([
      expect.objectContaining({
        id: 'BV-01',
        owner: 'Mensch',
      }),
      expect.objectContaining({
        id: 'BV-02',
        owner: 'Mensch',
      }),
    ]);
    expect(JSON.stringify(snapshot)).not.toContain('user_owner');
    expect(JSON.stringify(snapshot)).not.toContain(
      '2e3f7004-3065-449f-84f8-0ecb68c1cb46'
    );
  });

  it('keeps empty projects visible and archived projects non-operative', () => {
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
        issueDescription: null,
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

    expect(snapshot.projects).toHaveLength(2);
    expect(snapshot.projects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'project_empty',
          name: 'Leeres Projekt',
          key: 'LP',
          isArchived: false,
          health: 'stabil',
          openIssues: 0,
          readyIssues: 0,
          blockedIssues: 0,
          memberCount: 0,
          agentTokenCount: 0,
        }),
        expect.objectContaining({
          id: 'project_archived',
          name: 'Archiv',
          key: 'AR',
          isArchived: true,
          health: 'stabil',
          openIssues: 0,
          readyIssues: 0,
          blockedIssues: 0,
        }),
      ])
    );
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

  it('maps public agent token rows without secret fields', () => {
    const tokens = buildBubblophyAgentTokenSummaries([
      {
        id: 'token_b',
        label: 'Claude Code',
        projectKey: 'BV',
        scopes: ['plans:write'],
        state: 'paused',
        lastUsedAt: '2026-06-13T10:00:00.000Z',
        expiresAt: null,
      },
      {
        id: 'token_a',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'active',
        lastUsedAt: null,
        expiresAt: '2000-01-01T00:00:00.000Z',
      },
      {
        id: 'token_c',
        label: 'Archiv',
        projectKey: 'BV',
        scopes: ['issues:read'],
        state: 'revoked',
        lastUsedAt: null,
        expiresAt: null,
      },
    ]);

    expect(tokens).toEqual([
      {
        id: 'token_c',
        label: 'Archiv',
        projectKey: 'BV',
        scopes: ['issues:read'],
        state: 'widerrufen',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: 'läuft nicht automatisch ab',
      },
      {
        id: 'token_b',
        label: 'Claude Code',
        projectKey: 'BV',
        scopes: ['plans:write'],
        state: 'pausiert',
        lastUsedAt: '2026-06-13T10:00:00.000Z',
        expiresAt: 'läuft nicht automatisch ab',
      },
      {
        id: 'token_a',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'abgelaufen',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: '2000-01-01T00:00:00.000Z',
      },
    ]);
    expect(JSON.stringify(tokens)).not.toContain('tokenHash');
    expect(JSON.stringify(tokens)).not.toContain('plaintextToken');
  });

  it('maps public agent run rows without raw auth or token secrets', () => {
    const runs = buildBubblophyAgentRunSummaries([
      {
        id: 'run_codex',
        projectKey: 'BV',
        issueNumber: 7,
        agentTokenLabel: 'Codex lokal',
        state: 'requested',
        updatedAt: '2026-06-13T16:10:00.000Z',
      },
    ]);

    expect(runs).toEqual([
      {
        id: 'run_codex',
        issueId: 'BV-07',
        agentLabel: 'Codex lokal',
        state: 'wartet',
        requestedBy: 'Mensch',
        lastEvent: 'Status wartet · zuletzt 2026-06-13T16:10:00.000Z',
      },
    ]);
    expect(JSON.stringify(runs)).not.toContain('requestedByAuthUserId');
    expect(JSON.stringify(runs)).not.toContain('tokenHash');
    expect(JSON.stringify(runs)).not.toContain('plaintextToken');
  });

  it('maps project events into activity without exposing raw auth user IDs', () => {
    expect(
      buildBubblophyActivityEvents([
        {
          id: 'event_human',
          summary: 'Agent-Token erstellt.',
          actorAuthUserId: 'user_123',
          actorAgentTokenLabel: null,
          createdAt: '2026-06-13T10:00:00.000Z',
          projectKey: 'BV',
          issueNumber: null,
        },
        {
          id: 'event_agent',
          summary: 'Run angefragt.',
          actorAuthUserId: null,
          actorAgentTokenLabel: 'Codex lokal',
          createdAt: '2026-06-13T11:00:00.000Z',
          projectKey: 'BV',
          issueNumber: 7,
        },
      ])
    ).toEqual([
      {
        id: 'event_human',
        label: 'Agent-Token erstellt.',
        actor: 'Mensch',
        occurredAt: '2026-06-13T10:00:00.000Z',
        projectKey: 'BV',
      },
      {
        id: 'event_agent',
        label: 'Run angefragt.',
        actor: 'Agent-Token Codex lokal',
        occurredAt: '2026-06-13T11:00:00.000Z',
        projectKey: 'BV',
        issueId: 'BV-07',
      },
    ]);
  });

  it('maps member-added project events into safe activity', () => {
    const activity = buildBubblophyActivityEvents([
      {
        id: 'event_member_added',
        summary: 'Projekt BV: Mitglied added.',
        actorAuthUserId: 'user_owner',
        actorAgentTokenLabel: null,
        createdAt: '2026-06-14T10:00:00.000Z',
        projectKey: 'BV',
        issueNumber: null,
      },
    ]);

    expect(activity).toEqual([
      {
        id: 'event_member_added',
        label: 'Projekt BV: Mitglied added.',
        actor: 'Mensch',
        occurredAt: '2026-06-14T10:00:00.000Z',
        projectKey: 'BV',
      },
    ]);
    expect(JSON.stringify(activity)).not.toContain('user_owner');
    expect(JSON.stringify(activity)).not.toContain('@');
    expect(JSON.stringify(activity)).not.toContain('profile');
    expect(JSON.stringify(activity)).not.toContain('tokenHash');
    expect(JSON.stringify(activity)).not.toContain('plaintextToken');
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
