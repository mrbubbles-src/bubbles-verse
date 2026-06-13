import type {
  BubblophyIssueStatusUpdateStore,
  BubblophyIssueStatusUpdateStoreInput,
} from '@/lib/issues/status';

import {
  mapUpdatedIssueStatusToSummary,
  updateBubblophyIssueStatus,
} from '@/lib/issues/status';
import {
  buildBubblophyIssueStatusChangedEventInsert,
  shouldSkipBubblophyIssueStatusChangeEvent,
} from '@/lib/issues/status-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyIssueStatusUpdateStoreInput
  ) => ReturnType<BubblophyIssueStatusUpdateStore['updateIssueStatusWithEvent']>
): BubblophyIssueStatusUpdateStore {
  return {
    updateIssueStatusWithEvent: vi.fn(handler),
  };
}

describe('updateBubblophyIssueStatus', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid input before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      updateBubblophyIssueStatus(
        {
          authUserId: 'user_owner',
          issueId: '   ',
          status: 'geplant',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_issue' });
    await expect(
      updateBubblophyIssueStatus(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          status: 'fertig' as 'geplant',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_status' });
    await expect(
      updateBubblophyIssueStatus(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          status: 'geplant',
          reason: 'x'.repeat(241),
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'reason_too_long' });

    expect(store.updateIssueStatusWithEvent).not.toHaveBeenCalled();
  });

  it('passes normalized status data to the store', async () => {
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
          title: 'Status pflegen',
          status: input.status,
          priority: 'high',
          assignedAuthUserId: null,
          requiresHumanApproval: true,
          planStepCount: 2,
        },
      },
    }));

    await expect(
      updateBubblophyIssueStatus(
        {
          authUserId: 'user_owner',
          issueId: ' BV-12 ',
          status: 'bereit',
          reason: '  Menschlich geprüft.  ',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Status pflegen',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 2,
        approvalRequired: true,
      },
    });

    expect(store.updateIssueStatusWithEvent).toHaveBeenCalledTimes(1);
    expect(store.updateIssueStatusWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      issueId: 'BV-12',
      status: 'ready',
      reason: 'Menschlich geprüft.',
    });
  });

  it('maps a human close transition to the done status', async () => {
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
          title: 'Issue schließen',
          status: input.status,
          priority: 'medium',
          assignedAuthUserId: null,
          requiresHumanApproval: true,
          planStepCount: 0,
        },
      },
    }));

    await expect(
      updateBubblophyIssueStatus(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          status: 'erledigt',
        },
        { store }
      )
    ).resolves.toMatchObject({
      status: 'updated',
      issue: {
        id: 'BV-12',
        status: 'erledigt',
      },
    });

    expect(store.updateIssueStatusWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      issueId: 'BV-12',
      status: 'done',
      reason: '',
    });
  });

  it('returns store not_found, forbidden, and unchanged results unchanged', async () => {
    await expect(
      updateBubblophyIssueStatus(
        {
          authUserId: 'user_owner',
          issueId: 'BV-99',
          status: 'geplant',
        },
        { store: createStore(async () => ({ status: 'not_found' })) }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      updateBubblophyIssueStatus(
        {
          authUserId: 'user_viewer',
          issueId: 'BV-12',
          status: 'geplant',
        },
        { store: createStore(async () => ({ status: 'forbidden' })) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      updateBubblophyIssueStatus(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          status: 'geplant',
        },
        { store: createStore(async () => ({ status: 'unchanged' })) }
      )
    ).resolves.toEqual({ status: 'unchanged' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      updateBubblophyIssueStatus({
        authUserId: 'user_owner',
        issueId: 'BV-12',
        status: 'geplant',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy issue status helpers', () => {
  it('detects same-status no-op transitions before writing events', () => {
    expect(
      shouldSkipBubblophyIssueStatusChangeEvent('planned', 'planned')
    ).toBe(true);
    expect(shouldSkipBubblophyIssueStatusChangeEvent('planned', 'ready')).toBe(
      false
    );
  });

  it('maps updated persistence rows into dashboard issue summaries', () => {
    expect(
      mapUpdatedIssueStatusToSummary({
        project: {
          id: 'project_novari',
          key: 'NO',
          name: 'Novari',
        },
        issue: {
          id: 'issue_no_3',
          issueNumber: 3,
          title: 'Status aktualisieren',
          status: 'planned',
          priority: 'medium',
          assignedAuthUserId: 'user_owner',
          requiresHumanApproval: true,
          planStepCount: 4,
        },
      })
    ).toEqual({
      id: 'NO-03',
      title: 'Status aktualisieren',
      projectKey: 'NO',
      status: 'geplant',
      priority: 'mittel',
      owner: 'user_owner',
      planSteps: 4,
      approvalRequired: true,
    });
  });

  it('builds a human status-changed event without agent run fields', () => {
    expect(
      buildBubblophyIssueStatusChangedEventInsert({
        issueDatabaseId: 'issue_bv_12',
        authUserId: 'user_owner',
        issueId: 'BV-12',
        previousStatus: 'triage',
        nextStatus: 'planned',
        reason: 'Plan ist geprüft.',
      })
    ).toEqual({
      issueId: 'issue_bv_12',
      eventType: 'status_changed',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Status BV-12: triage → planned.',
      payload: {
        source: 'human',
        issueId: 'BV-12',
        previousStatus: 'triage',
        nextStatus: 'planned',
        reason: 'Plan ist geprüft.',
      },
    });
  });
});
