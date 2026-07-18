// @vitest-environment node

import type { RequestBubblophyAgentRunResult } from '@/lib/agent-runs/request';
import type { GetBubblophyMcpIssueResult } from '@/lib/mcp/issue-detail';

import { requestBubblophyMcpRun } from '@/lib/mcp/request-run';

import { describe, expect, it, vi } from 'vitest';

const visibleIssue: GetBubblophyMcpIssueResult = {
  status: 'success',
  project: { id: 'project_bv', key: 'BV', isArchived: false },
  issue: {
    key: 'BV-12',
    issueNumber: 12,
    title: 'Run vorbereiten',
    description: '',
    status: 'ready',
    priority: 'high',
    requiresHumanApproval: true,
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-18T11:00:00.000Z',
  },
};

describe('requestBubblophyMcpRun', () => {
  it('rejects invalid identity and public selectors before reads', async () => {
    const getIssue = vi.fn();
    const writeRun = vi.fn();
    const input = {
      projectId: 'project_bv',
      issueNumber: 12,
      runTargetId: 'token_codex',
      instructions: '',
    };

    await expect(
      requestBubblophyMcpRun(' ', 'client-1', input, {
        getIssue,
        writeRun,
      })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      requestBubblophyMcpRun('user-1', ' ', input, {
        getIssue,
        writeRun,
      })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_oauth_client' });
    await expect(
      requestBubblophyMcpRun(
        'user-1',
        'client-1',
        { ...input, projectId: ' ' },
        { getIssue, writeRun }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      requestBubblophyMcpRun(
        'user-1',
        'client-1',
        { ...input, issueNumber: 0 },
        { getIssue, writeRun }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_issue_number' });
    await expect(
      requestBubblophyMcpRun(
        'user-1',
        'client-1',
        { ...input, runTargetId: ' ' },
        { getIssue, writeRun }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_run_target' });
    expect(getIssue).not.toHaveBeenCalled();
    expect(writeRun).not.toHaveBeenCalled();
  });

  it('requests a visible target without approving or starting it', async () => {
    const getIssue = vi.fn(async () => visibleIssue);
    const writeRun = vi.fn<() => Promise<RequestBubblophyAgentRunResult>>(
      async () => ({
        status: 'requested',
        run: {
          id: 'run_bv_12',
          issueId: 'BV-12',
          agentLabel: 'Codex',
          state: 'wartet',
          requestedBy: 'Mensch',
          lastEvent: 'Anfrage gespeichert, keine Ausführung gestartet.',
        },
        createdAt: '2026-07-18T12:00:00.000Z',
      })
    );

    await expect(
      requestBubblophyMcpRun(
        ' user-1 ',
        ' client-1 ',
        {
          projectId: ' project_bv ',
          issueNumber: 12,
          runTargetId: ' token_codex ',
          instructions: ' Nur vorbereiten. ',
        },
        { getIssue, writeRun }
      )
    ).resolves.toEqual({
      status: 'requested',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issue: { key: 'BV-12', issueNumber: 12, title: 'Run vorbereiten' },
      run: {
        id: 'run_bv_12',
        state: 'requested',
        agentLabel: 'Codex',
        createdAt: '2026-07-18T12:00:00.000Z',
      },
    });
    expect(getIssue).toHaveBeenCalledWith('user-1', {
      projectId: 'project_bv',
      issueNumber: 12,
    });
    expect(writeRun).toHaveBeenCalledWith({
      authUserId: 'user-1',
      oauthClientId: 'client-1',
      issueId: 'BV-12',
      agentTokenId: 'token_codex',
      instructions: ' Nur vorbereiten. ',
    });
  });

  it('lets the locked writer reject an unavailable or hidden target', async () => {
    const writeRun = vi.fn(async () => ({
      status: 'token_unavailable' as const,
    }));

    await expect(
      requestBubblophyMcpRun(
        'user-1',
        'client-1',
        {
          projectId: 'project_bv',
          issueNumber: 12,
          runTargetId: 'token_hidden',
        },
        {
          getIssue: async () => visibleIssue,
          writeRun,
        }
      )
    ).resolves.toEqual({ status: 'token_unavailable' });
    expect(writeRun).toHaveBeenCalledWith(
      expect.objectContaining({ agentTokenId: 'token_hidden' })
    );
  });

  it('forwards hidden resources, writer denials, and database failures safely', async () => {
    await expect(
      requestBubblophyMcpRun(
        'user-1',
        'client-1',
        {
          projectId: 'foreign',
          issueNumber: 12,
          runTargetId: 'token_codex',
        },
        {
          getIssue: async () => ({ status: 'not_found' }),
          writeRun: vi.fn(),
        }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      requestBubblophyMcpRun(
        'user-1',
        'client-1',
        {
          projectId: 'project_bv',
          issueNumber: 12,
          runTargetId: 'token_codex',
        },
        {
          getIssue: async () => visibleIssue,
          writeRun: async () => ({ status: 'forbidden' }),
        }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      requestBubblophyMcpRun(
        'user-1',
        'client-1',
        {
          projectId: 'project_bv',
          issueNumber: 12,
          runTargetId: 'token_codex',
        },
        {
          getIssue: async () => ({ status: 'database_unavailable' }),
          writeRun: vi.fn(),
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
