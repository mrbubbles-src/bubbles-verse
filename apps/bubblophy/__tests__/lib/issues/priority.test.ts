import type {
  BubblophyIssuePriorityUpdateStore,
  BubblophyIssuePriorityUpdateStoreInput,
} from '@/lib/issues/priority';

import {
  mapUpdatedIssuePriorityToSummary,
  updateBubblophyIssuePriority,
} from '@/lib/issues/priority';
import {
  buildBubblophyIssuePriorityChangedEventInsert,
  canMutateBubblophyIssuePriority,
  shouldSkipBubblophyIssuePriorityChangeEvent,
} from '@/lib/issues/priority-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyIssuePriorityUpdateStoreInput
  ) => ReturnType<BubblophyIssuePriorityUpdateStore['updateIssuePriorityWithEvent']>
): BubblophyIssuePriorityUpdateStore {
  return {
    updateIssuePriorityWithEvent: vi.fn(handler),
  };
}

describe('updateBubblophyIssuePriority', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid input before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      updateBubblophyIssuePriority(
        {
          authUserId: 'user_owner',
          issueId: '   ',
          priority: 'hoch',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_issue' });
    await expect(
      updateBubblophyIssuePriority(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          priority: 'dringend' as 'hoch',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_priority' });

    expect(store.updateIssuePriorityWithEvent).not.toHaveBeenCalled();
  });

  it('passes normalized priority data to the store', async () => {
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
          title: 'Priorität pflegen',
          description: 'Ein echtes Issue.',
          status: 'planned',
          priority: input.priority,
          assignedAuthUserId: null,
          requiresHumanApproval: true,
          planStepCount: 2,
        },
      },
    }));

    await expect(
      updateBubblophyIssuePriority(
        {
          authUserId: 'user_owner',
          issueId: ' BV-12 ',
          priority: 'hoch',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Priorität pflegen',
        description: 'Ein echtes Issue.',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 2,
        approvalRequired: true,
      },
    });

    expect(store.updateIssuePriorityWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      issueId: 'BV-12',
      priority: 'high',
    });
  });

  it('returns store not_found, forbidden, and unchanged results unchanged', async () => {
    await expect(
      updateBubblophyIssuePriority(
        {
          authUserId: 'user_owner',
          issueId: 'BV-99',
          priority: 'mittel',
        },
        { store: createStore(async () => ({ status: 'not_found' })) }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      updateBubblophyIssuePriority(
        {
          authUserId: 'user_viewer',
          issueId: 'BV-12',
          priority: 'hoch',
        },
        { store: createStore(async () => ({ status: 'forbidden' })) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      updateBubblophyIssuePriority(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          priority: 'mittel',
        },
        { store: createStore(async () => ({ status: 'unchanged' })) }
      )
    ).resolves.toEqual({ status: 'unchanged' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      updateBubblophyIssuePriority({
        authUserId: 'user_owner',
        issueId: 'BV-12',
        priority: 'hoch',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy issue priority helpers', () => {
  it('maps updated persistence rows into dashboard issue summaries', () => {
    expect(
      mapUpdatedIssuePriorityToSummary({
        project: {
          id: 'project_bubblesverse',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issue: {
          id: 'issue_bv_12',
          issueNumber: 12,
          title: 'Priorität aktualisieren',
          description: '',
          status: 'ready',
          priority: 'high',
          assignedAuthUserId: 'user_owner',
          requiresHumanApproval: true,
          planStepCount: 1,
        },
      })
    ).toEqual({
      id: 'BV-12',
      title: 'Priorität aktualisieren',
      description: '',
      projectKey: 'BV',
      status: 'bereit',
      priority: 'hoch',
      owner: 'user_owner',
      planSteps: 1,
      approvalRequired: true,
    });
  });

  it('allows contributors but blocks read-only viewers from issue priority edits', () => {
    expect(canMutateBubblophyIssuePriority('owner')).toBe(true);
    expect(canMutateBubblophyIssuePriority('maintainer')).toBe(true);
    expect(canMutateBubblophyIssuePriority('member')).toBe(true);
    expect(canMutateBubblophyIssuePriority('viewer')).toBe(false);
  });

  it('detects same-priority no-op transitions before writing events', () => {
    expect(shouldSkipBubblophyIssuePriorityChangeEvent('medium', 'medium')).toBe(
      true
    );
    expect(shouldSkipBubblophyIssuePriorityChangeEvent('medium', 'high')).toBe(
      false
    );
  });

  it('builds a human priority-changed event with explicit action metadata', () => {
    expect(
      buildBubblophyIssuePriorityChangedEventInsert({
        issueDatabaseId: 'issue_bv_12',
        authUserId: 'user_owner',
        issueId: 'BV-12',
        previousPriority: 'medium',
        nextPriority: 'high',
      })
    ).toEqual({
      issueId: 'issue_bv_12',
      eventType: 'commented',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Priorität BV-12: medium -> high.',
      payload: {
        source: 'human',
        entity: 'issue',
        action: 'priority_changed',
        issueId: 'BV-12',
        previousPriority: 'medium',
        nextPriority: 'high',
        changedFields: ['priority'],
      },
    });
  });
});
