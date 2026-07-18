// @vitest-environment node

import type { BubblophyMcpIssuePlanReader } from '@/lib/mcp/issue-plan';

import { getBubblophyMcpIssuePlan } from '@/lib/mcp/issue-plan';

import { afterEach, describe, expect, it, vi } from 'vitest';

const planDetail = {
  project: { id: 'project_bv', key: 'BV', isArchived: false },
  issue: { key: 'BV-12', issueNumber: 12, title: 'MCP planen' },
  plan: {
    version: 3,
    summary: 'Sicherer Plan',
    steps: [{ id: 'step_1', text: 'Vertrag prüfen' }],
    approvalStatus: 'draft' as const,
    approvedAt: null,
    createdAt: '2026-07-18T12:00:00.000Z',
  },
};

describe('getBubblophyMcpIssuePlan', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid identity, project, and issue number before reading', async () => {
    const readIssuePlan = vi.fn();

    await expect(
      getBubblophyMcpIssuePlan(
        ' ',
        { projectId: 'project_bv', issueNumber: 12 },
        { readIssuePlan }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      getBubblophyMcpIssuePlan(
        'user-1',
        { projectId: ' ', issueNumber: 12 },
        { readIssuePlan }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      getBubblophyMcpIssuePlan(
        'user-1',
        { projectId: 'project_bv', issueNumber: 0 },
        { readIssuePlan }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'invalid_issue_number',
    });
    expect(readIssuePlan).not.toHaveBeenCalled();
  });

  it('normalizes identifiers and returns the latest visible plan', async () => {
    const readIssuePlan = vi.fn<BubblophyMcpIssuePlanReader>(
      async () => planDetail
    );

    await expect(
      getBubblophyMcpIssuePlan(
        ' user-1 ',
        { projectId: ' project_bv ', issueNumber: 12 },
        { readIssuePlan }
      )
    ).resolves.toEqual({ status: 'success', ...planDetail });
    expect(readIssuePlan).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectId: 'project_bv',
      issueNumber: 12,
    });
  });

  it('returns a successful null plan for a visible issue without versions', async () => {
    await expect(
      getBubblophyMcpIssuePlan(
        'user-1',
        { projectId: 'project_bv', issueNumber: 12 },
        {
          readIssuePlan: async () => ({
            ...planDetail,
            plan: null,
          }),
        }
      )
    ).resolves.toMatchObject({ status: 'success', plan: null });
  });

  it('does not distinguish missing issues, projects, or memberships', async () => {
    await expect(
      getBubblophyMcpIssuePlan(
        'user-1',
        { projectId: 'project_foreign', issueNumber: 12 },
        { readIssuePlan: async () => null }
      )
    ).resolves.toEqual({ status: 'not_found' });
  });

  it('returns database_unavailable without leaking failure details', async () => {
    const secret = 'postgres://secret@database.example/bubblophy';
    const result = await getBubblophyMcpIssuePlan(
      'user-1',
      { projectId: 'project_bv', issueNumber: 12 },
      {
        readIssuePlan: async () => {
          throw new Error(secret);
        },
      }
    );
    expect(result).toEqual({ status: 'database_unavailable' });
    expect(JSON.stringify(result)).not.toContain(secret);

    vi.stubEnv('DATABASE_URL', '');
    await expect(
      getBubblophyMcpIssuePlan('user-1', {
        projectId: 'project_bv',
        issueNumber: 12,
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
