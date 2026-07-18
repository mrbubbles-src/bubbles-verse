import type {
  BubblophyIssueContentUpdateStore,
  BubblophyIssueContentUpdateStoreInput,
} from '@/lib/issues/edit';

import {
  mapUpdatedIssueContentToSummary,
  updateBubblophyIssueContent,
} from '@/lib/issues/edit';
import {
  buildBubblophyIssueUpdatedEventInsert,
  getChangedBubblophyIssueContentFields,
} from '@/lib/issues/edit-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyIssueContentUpdateStoreInput
  ) => ReturnType<
    BubblophyIssueContentUpdateStore['updateIssueContentWithEvent']
  >
): BubblophyIssueContentUpdateStore {
  return {
    updateIssueContentWithEvent: vi.fn(handler),
  };
}

describe('updateBubblophyIssueContent', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid input before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      updateBubblophyIssueContent(
        {
          authUserId: 'user_owner',
          issueId: '   ',
          title: 'Titel',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_issue' });
    await expect(
      updateBubblophyIssueContent(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          title: '   ',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_title' });
    await expect(
      updateBubblophyIssueContent(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          title: 'x'.repeat(181),
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'title_too_long' });
    await expect(
      updateBubblophyIssueContent(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          title: 'Titel',
          description: 'x'.repeat(4_001),
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'description_too_long',
    });

    expect(store.updateIssueContentWithEvent).not.toHaveBeenCalled();
  });

  it('passes normalized content data to the store', async () => {
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
          title: input.title,
          description: input.description,
          status: 'planned',
          priority: 'high',
          assignedAuthUserId: null,
          requiresHumanApproval: true,
          planStepCount: 2,
        },
      },
    }));

    await expect(
      updateBubblophyIssueContent(
        {
          authUserId: 'user_owner',
          issueId: ' BV-12 ',
          title: '  Neuer Titel  ',
          description: '  Neue Beschreibung  ',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Neuer Titel',
        description: 'Neue Beschreibung',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 2,
        approvalRequired: true,
      },
    });

    expect(store.updateIssueContentWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      issueId: 'BV-12',
      title: 'Neuer Titel',
      description: 'Neue Beschreibung',
    });
  });

  it('returns store not_found, forbidden, and unchanged results unchanged', async () => {
    await expect(
      updateBubblophyIssueContent(
        {
          authUserId: 'user_owner',
          issueId: 'BV-99',
          title: 'Titel',
        },
        { store: createStore(async () => ({ status: 'not_found' })) }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      updateBubblophyIssueContent(
        {
          authUserId: 'user_viewer',
          issueId: 'BV-12',
          title: 'Titel',
        },
        { store: createStore(async () => ({ status: 'forbidden' })) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      updateBubblophyIssueContent(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          title: 'Titel',
        },
        { store: createStore(async () => ({ status: 'unchanged' })) }
      )
    ).resolves.toEqual({ status: 'unchanged' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      updateBubblophyIssueContent({
        authUserId: 'user_owner',
        issueId: 'BV-12',
        title: 'Titel',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy issue edit helpers', () => {
  it('maps updated persistence rows into dashboard issue summaries', () => {
    expect(
      mapUpdatedIssueContentToSummary({
        project: {
          id: 'project_bubblesverse',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issue: {
          id: 'issue_bv_12',
          issueNumber: 12,
          title: 'Bearbeiteter Titel',
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
      title: 'Bearbeiteter Titel',
      description: '',
      projectKey: 'BV',
      status: 'bereit',
      priority: 'mittel',
      owner: 'user_member',
      planSteps: 1,
      approvalRequired: true,
    });
  });

  it('detects no-op content edits before writing events', () => {
    expect(
      getChangedBubblophyIssueContentFields({
        current: {
          title: 'Titel',
          description: '',
        },
        next: {
          title: 'Titel',
          description: '',
        },
      })
    ).toEqual([]);
    expect(
      getChangedBubblophyIssueContentFields({
        current: {
          title: 'Titel',
          description: '',
        },
        next: {
          title: 'Neuer Titel',
          description: 'Text',
        },
      })
    ).toEqual(['title', 'description']);
  });

  it('builds a human issue edit event with explicit action metadata', () => {
    expect(
      buildBubblophyIssueUpdatedEventInsert({
        issueDatabaseId: 'issue_bv_12',
        authUserId: 'user_owner',
        issueId: 'BV-12',
        changedFields: ['title', 'description'],
      })
    ).toEqual({
      issueId: 'issue_bv_12',
      eventType: 'commented',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Issue BV-12 bearbeitet.',
      payload: {
        source: 'human',
        entity: 'issue',
        action: 'updated',
        issueId: 'BV-12',
        changedFields: ['title', 'description'],
      },
    });
  });
});
