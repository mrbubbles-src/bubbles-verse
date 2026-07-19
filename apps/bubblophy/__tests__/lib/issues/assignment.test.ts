import type {
  BubblophyIssueAssigneeUpdateStore,
  BubblophyIssueAssigneeUpdateStoreInput,
} from '@/lib/issues/assignment';

import {
  mapUpdatedIssueAssigneeToSummary,
  updateBubblophyIssueAssignee,
} from '@/lib/issues/assignment';
import {
  buildBubblophyIssueAssigneeChangedEventInsert,
  shouldSkipBubblophyIssueAssigneeChangeEvent,
} from '@/lib/issues/assignment-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyIssueAssigneeUpdateStoreInput
  ) => ReturnType<
    BubblophyIssueAssigneeUpdateStore['updateIssueAssigneeWithEvent']
  >
): BubblophyIssueAssigneeUpdateStore {
  return {
    updateIssueAssigneeWithEvent: vi.fn(handler),
  };
}

describe('updateBubblophyIssueAssignee', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid input before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      updateBubblophyIssueAssignee(
        {
          authUserId: 'user_owner',
          issueId: '   ',
          assigneeAuthUserId: 'user_member',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_issue' });
    await expect(
      updateBubblophyIssueAssignee(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          assigneeAuthUserId: 'x'.repeat(161),
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'assignee_too_long',
    });

    expect(store.updateIssueAssigneeWithEvent).not.toHaveBeenCalled();
  });

  it('passes normalized assignee data to the store', async () => {
    const store = createStore(async (input) => ({
      status: 'updated',
      issue: {
        project: {
          id: 'project_bubblesverse',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issue: {
          id: 'issue_bv_12',
          issueNumber: 12,
          title: 'Zuweisung pflegen',
          description: 'Issue mit menschlicher Zuständigkeit.',
          status: 'planned',
          priority: 'medium',
          assignedAuthUserId: input.assigneeAuthUserId,
          requiresHumanApproval: true,
          planStepCount: 2,
        },
      },
    }));

    await expect(
      updateBubblophyIssueAssignee(
        {
          authUserId: 'user_owner',
          issueId: ' BV-12 ',
          assigneeAuthUserId: ' user_member ',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Zuweisung pflegen',
        description: 'Issue mit menschlicher Zuständigkeit.',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'mittel',
        assigneeAuthUserId: 'user_member',
        assigneeLabel: 'user_member',
        planSteps: 2,
        approvalRequired: true,
      },
    });

    expect(store.updateIssueAssigneeWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      issueId: 'BV-12',
      assigneeAuthUserId: 'user_member',
    });
  });

  it('normalizes empty assignee input into an unassignment', async () => {
    const store = createStore(async (input) => ({
      status: 'updated',
      issue: {
        project: {
          id: 'project_bubblesverse',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issue: {
          id: 'issue_bv_12',
          issueNumber: 12,
          title: 'Zuweisung entfernen',
          description: '',
          status: 'ready',
          priority: 'high',
          assignedAuthUserId: input.assigneeAuthUserId,
          requiresHumanApproval: true,
          planStepCount: 0,
        },
      },
    }));

    await expect(
      updateBubblophyIssueAssignee(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          assigneeAuthUserId: '   ',
        },
        { store }
      )
    ).resolves.toMatchObject({
      status: 'updated',
      issue: {
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
      },
    });

    expect(store.updateIssueAssigneeWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      issueId: 'BV-12',
      assigneeAuthUserId: null,
    });
  });

  it('returns store not_found, forbidden, invalid_assignee, and unchanged results unchanged', async () => {
    await expect(
      updateBubblophyIssueAssignee(
        {
          authUserId: 'user_owner',
          issueId: 'BV-99',
          assigneeAuthUserId: 'user_member',
        },
        { store: createStore(async () => ({ status: 'not_found' })) }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      updateBubblophyIssueAssignee(
        {
          authUserId: 'user_viewer',
          issueId: 'BV-12',
          assigneeAuthUserId: 'user_member',
        },
        { store: createStore(async () => ({ status: 'forbidden' })) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      updateBubblophyIssueAssignee(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          assigneeAuthUserId: 'user_other_project',
        },
        { store: createStore(async () => ({ status: 'invalid_assignee' })) }
      )
    ).resolves.toEqual({ status: 'invalid_assignee' });
    await expect(
      updateBubblophyIssueAssignee(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          assigneeAuthUserId: 'user_member',
        },
        { store: createStore(async () => ({ status: 'unchanged' })) }
      )
    ).resolves.toEqual({ status: 'unchanged' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      updateBubblophyIssueAssignee({
        authUserId: 'user_owner',
        issueId: 'BV-12',
        assigneeAuthUserId: 'user_member',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy issue assignment helpers', () => {
  it('maps updated persistence rows into dashboard issue summaries', () => {
    expect(
      mapUpdatedIssueAssigneeToSummary({
        project: {
          id: 'project_bubblesverse',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issue: {
          id: 'issue_bv_12',
          issueNumber: 12,
          title: 'Issue zuweisen',
          description: '',
          status: 'ready',
          priority: 'medium',
          assignedAuthUserId: 'user_member',
          requiresHumanApproval: true,
          planStepCount: 1,
        },
      })
    ).toEqual({
      id: 'BV-12',
      title: 'Issue zuweisen',
      description: '',
      projectKey: 'BV',
      status: 'bereit',
      priority: 'mittel',
      assigneeAuthUserId: 'user_member',
      assigneeLabel: 'user_member',
      planSteps: 1,
      approvalRequired: true,
    });
  });

  it('detects same-assignee no-op transitions before writing events', () => {
    expect(
      shouldSkipBubblophyIssueAssigneeChangeEvent('user_member', 'user_member')
    ).toBe(true);
    expect(
      shouldSkipBubblophyIssueAssigneeChangeEvent('user_member', null)
    ).toBe(false);
  });

  it('builds a human assignee-changed event with explicit action metadata', () => {
    expect(
      buildBubblophyIssueAssigneeChangedEventInsert({
        issueDatabaseId: 'issue_bv_12',
        authUserId: 'user_owner',
        issueId: 'BV-12',
        previousAssigneeAuthUserId: null,
        nextAssigneeAuthUserId: 'user_member',
      })
    ).toEqual({
      issueId: 'issue_bv_12',
      eventType: 'commented',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Zuweisung BV-12 geändert.',
      payload: {
        source: 'human',
        entity: 'issue',
        action: 'assignee_changed',
        issueId: 'BV-12',
        previousAssigneeAuthUserId: null,
        nextAssigneeAuthUserId: 'user_member',
        changedFields: ['assignedAuthUserId'],
      },
    });
  });
});
