// @vitest-environment node

import type { CreateOrUpdateBubblophyIssuePlanDraftResult } from '@/lib/issues/plans';
import type { GetBubblophyMcpIssueResult } from '@/lib/mcp/issue-detail';

import { proposeBubblophyMcpPlan } from '@/lib/mcp/propose-plan';

import { describe, expect, it, vi } from 'vitest';

const visibleIssue = {
  status: 'success' as const,
  project: { id: 'project_bv', key: 'BV', isArchived: false },
  issue: {
    key: 'BV-12',
    issueNumber: 12,
    title: 'MCP planen',
    description: '',
    status: 'ready' as const,
    priority: 'high' as const,
    requiresHumanApproval: true,
    createdAt: '2026-07-17T12:00:00.000Z',
    updatedAt: '2026-07-18T12:00:00.000Z',
  },
};

describe('proposeBubblophyMcpPlan', () => {
  it('rejects invalid identity, client, project, and issue before reads', async () => {
    const getIssue = vi.fn();
    const writePlan = vi.fn();
    const input = {
      projectId: 'project_bv',
      issueNumber: 12,
      summary: 'Plan',
      steps: ['Vertrag prüfen'],
    };

    await expect(
      proposeBubblophyMcpPlan(' ', 'client-1', input, {
        getIssue,
        writePlan,
      })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      proposeBubblophyMcpPlan('user-1', ' ', input, { getIssue, writePlan })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_oauth_client' });
    await expect(
      proposeBubblophyMcpPlan(
        'user-1',
        'client-1',
        { ...input, projectId: ' ' },
        { getIssue, writePlan }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      proposeBubblophyMcpPlan(
        'user-1',
        'client-1',
        { ...input, issueNumber: 0 },
        { getIssue, writePlan }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_issue_number' });
    expect(getIssue).not.toHaveBeenCalled();
    expect(writePlan).not.toHaveBeenCalled();
  });

  it('rechecks a visible issue and writes an OAuth-attributed draft', async () => {
    const getIssue = vi.fn<() => Promise<GetBubblophyMcpIssueResult>>(
      async () => visibleIssue
    );
    const writePlan = vi.fn<
      () => Promise<CreateOrUpdateBubblophyIssuePlanDraftResult>
    >(async () => ({
      status: 'created',
      plan: {
        issueId: 'BV-12',
        version: 3,
        summary: 'Sicherer Entwurf',
        steps: [{ id: 'step_1', text: 'Vertrag prüfen' }],
      },
    }));

    await expect(
      proposeBubblophyMcpPlan(
        ' user-1 ',
        ' client-1 ',
        {
          projectId: ' project_bv ',
          issueNumber: 12,
          summary: ' Sicherer Entwurf ',
          steps: [' Vertrag prüfen '],
        },
        { getIssue, writePlan }
      )
    ).resolves.toEqual({
      status: 'created',
      project: visibleIssue.project,
      issue: {
        key: 'BV-12',
        issueNumber: 12,
        title: 'MCP planen',
      },
      plan: {
        version: 3,
        summary: 'Sicherer Entwurf',
        steps: [{ id: 'step_1', text: 'Vertrag prüfen' }],
        approvalStatus: 'draft',
      },
    });
    expect(getIssue).toHaveBeenCalledWith('user-1', {
      projectId: 'project_bv',
      issueNumber: 12,
    });
    expect(writePlan).toHaveBeenCalledWith({
      authUserId: 'user-1',
      oauthClientId: 'client-1',
      issueId: 'BV-12',
      summary: ' Sicherer Entwurf ',
      steps: [' Vertrag prüfen '],
    });
  });

  it('keeps inaccessible resources and denied roles safe', async () => {
    await expect(
      proposeBubblophyMcpPlan(
        'user-1',
        'client-1',
        {
          projectId: 'project_foreign',
          issueNumber: 12,
          steps: ['Plan'],
        },
        {
          getIssue: async () => ({ status: 'not_found' }),
          writePlan: vi.fn(),
        }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      proposeBubblophyMcpPlan(
        'user-1',
        'client-1',
        { projectId: 'project_bv', issueNumber: 12, steps: ['Plan'] },
        {
          getIssue: async () => visibleIssue,
          writePlan: async () => ({ status: 'forbidden' }),
        }
      )
    ).resolves.toEqual({ status: 'forbidden' });
  });

  it('maps validation and database failures without leaking details', async () => {
    await expect(
      proposeBubblophyMcpPlan(
        'user-1',
        'client-1',
        { projectId: 'project_bv', issueNumber: 12, steps: [] },
        {
          getIssue: async () => visibleIssue,
          writePlan: async () => ({
            status: 'invalid',
            reason: 'empty_steps',
          }),
        }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_steps' });
    await expect(
      proposeBubblophyMcpPlan(
        'user-1',
        'client-1',
        { projectId: 'project_bv', issueNumber: 12, steps: ['Plan'] },
        {
          getIssue: async () => visibleIssue,
          writePlan: async () => ({ status: 'database_unavailable' }),
        }
      )
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
