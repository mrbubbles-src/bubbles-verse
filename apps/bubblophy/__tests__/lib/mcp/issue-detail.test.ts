// @vitest-environment node

import type { BubblophyMcpIssueDetailReader } from '@/lib/mcp/issue-detail';

import { getBubblophyMcpIssue } from '@/lib/mcp/issue-detail';

import { afterEach, describe, expect, it, vi } from 'vitest';

const detail = {
  project: { id: 'project_bv', key: 'BV', isArchived: false },
  issue: {
    key: 'BV-12',
    issueNumber: 12,
    title: 'MCP-Zugriff ergänzen',
    description: 'Sicherer Detailvertrag',
    status: 'ready' as const,
    priority: 'high' as const,
    requiresHumanApproval: true,
    createdAt: '2026-07-17T12:00:00.000Z',
    updatedAt: '2026-07-18T12:00:00.000Z',
  },
};

describe('getBubblophyMcpIssue', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid identity, project, and issue number before reading', async () => {
    const readIssue = vi.fn();

    await expect(
      getBubblophyMcpIssue(
        ' ',
        { projectId: 'project_bv', issueNumber: 12 },
        { readIssue }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      getBubblophyMcpIssue(
        'user-1',
        { projectId: ' ', issueNumber: 12 },
        { readIssue }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      getBubblophyMcpIssue(
        'user-1',
        { projectId: 'project_bv', issueNumber: 0 },
        { readIssue }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_issue_number' });
    expect(readIssue).not.toHaveBeenCalled();
  });

  it('normalizes identifiers and returns one membership-scoped detail', async () => {
    const readIssue = vi.fn<BubblophyMcpIssueDetailReader>(async () => detail);

    await expect(
      getBubblophyMcpIssue(
        ' user-1 ',
        { projectId: ' project_bv ', issueNumber: 12 },
        { readIssue }
      )
    ).resolves.toEqual({ status: 'success', ...detail });
    expect(readIssue).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectId: 'project_bv',
      issueNumber: 12,
    });
  });

  it('does not distinguish missing issues, projects, or memberships', async () => {
    await expect(
      getBubblophyMcpIssue(
        'user-1',
        { projectId: 'project_foreign', issueNumber: 12 },
        { readIssue: async () => null }
      )
    ).resolves.toEqual({ status: 'not_found' });
  });

  it('returns a safe database failure with and without configuration', async () => {
    const secret = 'postgres://secret@database.example/bubblophy';
    const result = await getBubblophyMcpIssue(
      'user-1',
      { projectId: 'project_bv', issueNumber: 12 },
      {
        readIssue: async () => {
          throw new Error(secret);
        },
      }
    );
    expect(result).toEqual({ status: 'database_unavailable' });
    expect(JSON.stringify(result)).not.toContain(secret);

    vi.stubEnv('DATABASE_URL', '');
    await expect(
      getBubblophyMcpIssue('user-1', {
        projectId: 'project_bv',
        issueNumber: 12,
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
