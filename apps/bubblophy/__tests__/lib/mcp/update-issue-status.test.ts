// @vitest-environment node

import type { IssueStatus } from '@/lib/dashboard/types';
import type { UpdateBubblophyIssueStatusResult } from '@/lib/issues/status';
import type { GetBubblophyMcpIssueResult } from '@/lib/mcp/issue-detail';

import { updateBubblophyMcpIssueStatus } from '@/lib/mcp/update-issue-status';

import { describe, expect, it, vi } from 'vitest';

const visibleIssue: GetBubblophyMcpIssueResult = {
  status: 'success',
  project: { id: 'project_bv', key: 'BV', isArchived: false },
  issue: {
    key: 'BV-12',
    issueNumber: 12,
    title: 'Status sicher ändern',
    description: '',
    status: 'in_progress',
    priority: 'high',
    requiresHumanApproval: true,
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-18T11:00:00.000Z',
  },
};

const statusMappings = [
  ['triage', 'triage'],
  ['planned', 'geplant'],
  ['ready', 'bereit'],
  ['in_progress', 'in_arbeit'],
  ['review', 'review'],
  ['blocked', 'blockiert'],
  ['done', 'erledigt'],
] as const;

describe('updateBubblophyMcpIssueStatus', () => {
  it('rejects invalid identity, selectors, status, and reason before reads', async () => {
    const getIssue = vi.fn();
    const writeStatus = vi.fn();
    const input = {
      projectId: 'project_bv',
      issueNumber: 12,
      expectedStatus: 'in_progress' as const,
      status: 'review' as const,
      reason: 'Zur Prüfung bereit.',
    };

    await expect(
      updateBubblophyMcpIssueStatus(' ', 'client-1', input, {
        getIssue,
        writeStatus,
      })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      updateBubblophyMcpIssueStatus('user-1', ' ', input, {
        getIssue,
        writeStatus,
      })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_oauth_client' });
    await expect(
      updateBubblophyMcpIssueStatus(
        'user-1',
        'client-1',
        { ...input, projectId: ' ' },
        { getIssue, writeStatus }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      updateBubblophyMcpIssueStatus(
        'user-1',
        'client-1',
        { ...input, issueNumber: 0 },
        { getIssue, writeStatus }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_issue_number' });
    await expect(
      updateBubblophyMcpIssueStatus(
        'user-1',
        'client-1',
        { ...input, expectedStatus: 'invalid' as 'in_progress' },
        { getIssue, writeStatus }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_status' });
    await expect(
      updateBubblophyMcpIssueStatus(
        'user-1',
        'client-1',
        { ...input, reason: 'x'.repeat(241) },
        { getIssue, writeStatus }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'reason_too_long' });

    for (const status of ['blocked', 'done'] as const) {
      await expect(
        updateBubblophyMcpIssueStatus(
          'user-1',
          'client-1',
          { ...input, status, reason: ' ' },
          { getIssue, writeStatus }
        )
      ).resolves.toEqual({ status: 'invalid', reason: 'reason_required' });
    }

    expect(getIssue).not.toHaveBeenCalled();
    expect(writeStatus).not.toHaveBeenCalled();
  });

  it.each(statusMappings)(
    'maps public %s to dashboard status %s without narrowing existing targets',
    async (databaseStatus, dashboardStatus) => {
      const writeStatus = vi.fn(async () =>
        createUpdatedResult(dashboardStatus)
      );

      await updateBubblophyMcpIssueStatus(
        'user-1',
        'client-1',
        {
          projectId: 'project_bv',
          issueNumber: 12,
          expectedStatus: databaseStatus,
          status: databaseStatus,
          reason: ['blocked', 'done'].includes(databaseStatus)
            ? 'Begründeter Wechsel.'
            : undefined,
        },
        { getIssue: async () => visibleIssue, writeStatus }
      );

      expect(writeStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedStatus: dashboardStatus,
          status: dashboardStatus,
        })
      );
    }
  );

  it('returns only public updated fields and normalized OAuth attribution', async () => {
    const getIssue = vi.fn(async () => visibleIssue);
    const writeStatus = vi.fn(async () => createUpdatedResult('review'));

    await expect(
      updateBubblophyMcpIssueStatus(
        ' user-1 ',
        ' client-1 ',
        {
          projectId: ' project_bv ',
          issueNumber: 12,
          expectedStatus: 'in_progress',
          status: 'review',
          reason: ' Zur Prüfung bereit. ',
        },
        { getIssue, writeStatus }
      )
    ).resolves.toEqual({
      status: 'updated',
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issue: {
        key: 'BV-12',
        issueNumber: 12,
        title: 'Status sicher ändern',
        status: 'review',
      },
    });
    expect(getIssue).toHaveBeenCalledWith('user-1', {
      projectId: 'project_bv',
      issueNumber: 12,
    });
    expect(writeStatus).toHaveBeenCalledWith({
      authUserId: 'user-1',
      oauthClientId: 'client-1',
      issueId: 'BV-12',
      expectedStatus: 'in_arbeit',
      status: 'review',
      reason: ' Zur Prüfung bereit. ',
    });
  });

  it.each(['unchanged', 'conflict', 'forbidden'] as const)(
    'forwards writer %s without claiming an update',
    async (status) => {
      await expect(
        updateBubblophyMcpIssueStatus(
          'user-1',
          'client-1',
          {
            projectId: 'project_bv',
            issueNumber: 12,
            expectedStatus: 'in_progress',
            status: 'review',
          },
          {
            getIssue: async () => visibleIssue,
            writeStatus: async () => ({ status }),
          }
        )
      ).resolves.toEqual({ status });
    }
  );

  it('hides unreadable resources and database failures', async () => {
    await expect(
      updateBubblophyMcpIssueStatus(
        'user-1',
        'client-1',
        {
          projectId: 'foreign',
          issueNumber: 12,
          expectedStatus: 'in_progress',
          status: 'review',
        },
        {
          getIssue: async () => ({ status: 'not_found' }),
          writeStatus: vi.fn(),
        }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      updateBubblophyMcpIssueStatus(
        'user-1',
        'client-1',
        {
          projectId: 'project_bv',
          issueNumber: 12,
          expectedStatus: 'in_progress',
          status: 'review',
        },
        {
          getIssue: async () => visibleIssue,
          writeStatus: async () => {
            throw new Error('database unavailable');
          },
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

/** Builds a dashboard status result for MCP adapter tests. */
function createUpdatedResult(
  status: IssueStatus
): UpdateBubblophyIssueStatusResult {
  return {
    status: 'updated',
    issue: {
      id: 'BV-12',
      title: 'Status sicher ändern',
      projectKey: 'BV',
      status,
      priority: 'hoch',
      assigneeAuthUserId: null,
      assigneeLabel: 'Nicht zugewiesen',
      planSteps: 1,
      approvalRequired: true,
    },
  };
}
