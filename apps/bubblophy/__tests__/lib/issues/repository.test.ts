import {
  buildBubblophyAgentRunSummaries,
  buildBubblophyAgentTokenSummaries,
  buildBubblophyProjectMemberSummaries,
  buildBubblophyProjectSummaries,
  buildSafeAgentRunResultSummary,
  deriveBubblophyProjectHealth,
  formatBubblophyIssueKey,
  formatBubblophyProjectMemberId,
  mapBubblophyAgentRunState,
  mapBubblophyAgentTokenState,
  mapBubblophyIssuePriority,
  mapBubblophyIssueStatus,
} from '@/lib/issues/repository';

import { describe, expect, it } from 'vitest';

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

  it('maps display profiles and preserves a technical fallback', () => {
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
          displayName: 'Mara Owner',
          normalizedEmail: 'owner@example.test',
          role: 'owner',
          createdAt: '2026-06-13T10:00:00.000Z',
        },
      ])
    ).toEqual([
      {
        id: 'BV:user_owner',
        projectKey: 'BV',
        authUserId: 'user_owner',
        label: 'Mara Owner',
        email: 'owner@example.test',
        role: 'owner',
        createdAt: '2026-06-13T10:00:00.000Z',
      },
      {
        id: 'BV:user_viewer',
        projectKey: 'BV',
        authUserId: 'user_viewer',
        label: 'user_viewer',
        email: null,
        role: 'viewer',
        createdAt: '2026-06-13T11:00:00.000Z',
      },
    ]);
  });

  it('maps independent project aggregates without hydrating issues', () => {
    expect(
      buildBubblophyProjectSummaries([
        {
          id: 'project_empty',
          name: 'Leeres Projekt',
          key: 'LP',
          description: 'Noch ohne Issues.',
          isArchived: false,
          memberCount: -1,
          activeAgentTokenCount: -1,
          openIssueCount: -1,
          readyIssueCount: -1,
          blockedIssueCount: -1,
          currentUserRole: 'member',
        },
        {
          id: 'project_active',
          name: 'Bubblesverse',
          key: 'BV',
          description: 'Aktives Projekt.',
          isArchived: false,
          memberCount: 3,
          activeAgentTokenCount: 2,
          openIssueCount: 120,
          readyIssueCount: 17,
          blockedIssueCount: 4,
          currentUserRole: 'owner',
        },
        {
          id: 'project_archived',
          name: 'Archiv',
          key: 'AR',
          description: 'Nicht mehr operativ.',
          isArchived: true,
          memberCount: 2,
          activeAgentTokenCount: 1,
          openIssueCount: 8,
          readyIssueCount: 3,
          blockedIssueCount: 2,
          currentUserRole: 'viewer',
        },
      ])
    ).toEqual([
      {
        id: 'project_archived',
        name: 'Archiv',
        key: 'AR',
        description: 'Nicht mehr operativ.',
        isArchived: true,
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 2,
        agentTokenCount: 1,
        currentUserRole: 'viewer',
        health: 'stabil',
      },
      {
        id: 'project_active',
        name: 'Bubblesverse',
        key: 'BV',
        description: 'Aktives Projekt.',
        isArchived: false,
        openIssues: 120,
        readyIssues: 17,
        blockedIssues: 4,
        memberCount: 3,
        agentTokenCount: 2,
        currentUserRole: 'owner',
        health: 'blockiert',
      },
      {
        id: 'project_empty',
        name: 'Leeres Projekt',
        key: 'LP',
        description: 'Noch ohne Issues.',
        isArchived: false,
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 0,
        agentTokenCount: 0,
        currentUserRole: 'member',
        health: 'stabil',
      },
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
        result: null,
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
        resultSummary: undefined,
      },
    ]);
    expect(JSON.stringify(runs)).not.toContain('requestedByAuthUserId');
    expect(JSON.stringify(runs)).not.toContain('tokenHash');
    expect(JSON.stringify(runs)).not.toContain('plaintextToken');
  });

  it('maps agent run result summaries without token secrets', () => {
    const runs = buildBubblophyAgentRunSummaries([
      {
        id: 'run_codex',
        projectKey: 'BV',
        issueNumber: 7,
        agentTokenLabel: 'Codex lokal',
        state: 'needs_review',
        updatedAt: '2026-06-13T16:10:00.000Z',
        result: {
          summary: 'Diff ist bereit für menschliche Prüfung.',
          token: 'secret_token_value',
          authorization: 'Bearer abc',
          key: 'plain_key_value',
          message: 'Bearer visible_bearer_value',
        },
      },
    ]);

    expect(runs[0]?.resultSummary).toBe(
      'Diff ist bereit für menschliche Prüfung.'
    );
    expect(JSON.stringify(runs)).not.toContain('secret_token_value');
    expect(JSON.stringify(runs)).not.toContain('Bearer abc');
    expect(JSON.stringify(runs)).not.toContain('plain_key_value');
    expect(JSON.stringify(runs)).not.toContain('visible_bearer_value');
    expect(JSON.stringify(runs)).not.toContain('tokenHash');
  });

  it('redacts unsafe or raw structured agent run result details', () => {
    expect(
      buildSafeAgentRunResultSummary({
        token: 'secret_token_value',
        details: {
          authorization: 'Bearer abc',
          key: 'plain_key_value',
        },
      })
    ).toBeUndefined();
    expect(
      buildSafeAgentRunResultSummary({
        summary: 'x'.repeat(300),
      })
    ).toBe(`${'x'.repeat(239)}…`);
    expect(
      buildSafeAgentRunResultSummary({
        details: 'Kurze geprüfte Detailnotiz.',
      })
    ).toBe('Kurze geprüfte Detailnotiz.');
    expect(
      buildSafeAgentRunResultSummary({
        details: 'x'.repeat(130),
      })
    ).toBeUndefined();
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
