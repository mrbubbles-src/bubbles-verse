// @vitest-environment node

import type { BubblophyMcpIssueReader } from '@/lib/mcp/issues';

import { listBubblophyMcpIssues } from '@/lib/mcp/issues';

import { afterEach, describe, expect, it, vi } from 'vitest';

const issuePage = {
  project: {
    id: 'project_bv',
    key: 'BV',
    isArchived: false,
  },
  issues: [
    {
      key: 'BV-12',
      issueNumber: 12,
      title: 'MCP-Zugriff ergänzen',
      status: 'ready' as const,
      priority: 'high' as const,
      requiresHumanApproval: true,
      updatedAt: '2026-07-18T12:00:00.000Z',
    },
  ],
  nextAfterIssueNumber: null,
};

describe('listBubblophyMcpIssues', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects empty identities and project IDs before reading data', async () => {
    const readIssues = vi.fn();

    await expect(
      listBubblophyMcpIssues(' ', { projectId: 'project_bv' }, { readIssues })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      listBubblophyMcpIssues('user-1', { projectId: ' ' }, { readIssues })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    expect(readIssues).not.toHaveBeenCalled();
  });

  it('rejects invalid pagination before reading data', async () => {
    const readIssues = vi.fn();

    await expect(
      listBubblophyMcpIssues(
        'user-1',
        { projectId: 'project_bv', limit: 101 },
        { readIssues }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_limit' });
    await expect(
      listBubblophyMcpIssues(
        'user-1',
        { projectId: 'project_bv', afterIssueNumber: -1 },
        { readIssues }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_cursor' });
    expect(readIssues).not.toHaveBeenCalled();
  });

  it('normalizes input and returns only the membership-scoped page', async () => {
    const readIssues = vi.fn<BubblophyMcpIssueReader>(async () => issuePage);

    await expect(
      listBubblophyMcpIssues(
        ' user-1 ',
        { projectId: ' project_bv ', limit: 25, afterIssueNumber: 10 },
        { readIssues }
      )
    ).resolves.toEqual({ status: 'success', ...issuePage });
    expect(readIssues).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectId: 'project_bv',
      limit: 25,
      afterIssueNumber: 10,
    });
  });

  it('uses bounded defaults and does not reveal missing memberships', async () => {
    const readIssues = vi.fn<BubblophyMcpIssueReader>(async () => null);

    await expect(
      listBubblophyMcpIssues(
        'user-1',
        { projectId: 'project_foreign' },
        { readIssues }
      )
    ).resolves.toEqual({ status: 'not_found' });
    expect(readIssues).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectId: 'project_foreign',
      limit: 50,
      afterIssueNumber: 0,
    });
  });

  it('returns database_unavailable without leaking database failures', async () => {
    const secret = 'postgres://secret@database.example/bubblophy';

    await expect(
      listBubblophyMcpIssues(
        'user-1',
        { projectId: 'project_bv' },
        {
          readIssues: async () => {
            throw new Error(secret);
          },
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });

    vi.stubEnv('DATABASE_URL', '');
    const result = await listBubblophyMcpIssues('user-1', {
      projectId: 'project_bv',
    });
    expect(result).toEqual({ status: 'database_unavailable' });
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});
