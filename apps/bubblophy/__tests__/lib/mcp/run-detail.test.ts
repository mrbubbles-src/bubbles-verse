// @vitest-environment node

import type { BubblophyMcpRunDetailReader } from '@/lib/mcp/run-detail';

import { getBubblophyMcpRun } from '@/lib/mcp/run-detail';

import { afterEach, describe, expect, it, vi } from 'vitest';

const runDetail = {
  project: { id: 'project_bv', key: 'BV', isArchived: false },
  issue: { key: 'BV-12', issueNumber: 12, title: 'MCP planen' },
  run: {
    id: 'run_bv_12',
    state: 'needs_review' as const,
    agentLabel: 'Codex',
    approvedAt: '2026-07-18T11:00:00.000Z',
    startedAt: '2026-07-18T11:05:00.000Z',
    finishedAt: null,
    createdAt: '2026-07-18T10:55:00.000Z',
    updatedAt: '2026-07-18T12:00:00.000Z',
    resultSummary: 'Bereit für Review',
  },
};

describe('getBubblophyMcpRun', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid identity, project, and run before reading', async () => {
    const readRun = vi.fn();

    await expect(
      getBubblophyMcpRun(
        ' ',
        { projectId: 'project_bv', runId: 'run_bv_12' },
        { readRun }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      getBubblophyMcpRun(
        'user-1',
        { projectId: ' ', runId: 'run_bv_12' },
        { readRun }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      getBubblophyMcpRun(
        'user-1',
        { projectId: 'project_bv', runId: ' ' },
        { readRun }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_run' });
    expect(readRun).not.toHaveBeenCalled();
  });

  it('normalizes identifiers and returns the visible run', async () => {
    const readRun = vi.fn<BubblophyMcpRunDetailReader>(async () => runDetail);

    await expect(
      getBubblophyMcpRun(
        ' user-1 ',
        { projectId: ' project_bv ', runId: ' run_bv_12 ' },
        { readRun }
      )
    ).resolves.toEqual({ status: 'success', ...runDetail });
    expect(readRun).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectId: 'project_bv',
      runId: 'run_bv_12',
    });
  });

  it('does not distinguish missing runs, projects, or memberships', async () => {
    await expect(
      getBubblophyMcpRun(
        'user-1',
        { projectId: 'project_foreign', runId: 'run_bv_12' },
        { readRun: async () => null }
      )
    ).resolves.toEqual({ status: 'not_found' });
  });

  it('returns database_unavailable without leaking failure details', async () => {
    const secret = 'postgres://secret@database.example/bubblophy';
    const result = await getBubblophyMcpRun(
      'user-1',
      { projectId: 'project_bv', runId: 'run_bv_12' },
      {
        readRun: async () => {
          throw new Error(secret);
        },
      }
    );
    expect(result).toEqual({ status: 'database_unavailable' });
    expect(JSON.stringify(result)).not.toContain(secret);

    vi.stubEnv('DATABASE_URL', '');
    await expect(
      getBubblophyMcpRun('user-1', {
        projectId: 'project_bv',
        runId: 'run_bv_12',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
