import type {
  BubblophyIssueDraftCreateStore,
  BubblophyIssueDraftCreateStoreInput,
} from '@/lib/issues/create';

import {
  createBubblophyIssueDraft,
  mapCreatedIssueToSummary,
} from '@/lib/issues/create';
import {
  buildBubblophyIssueCreatedEventInsert,
  getNextBubblophyIssueNumber,
} from '@/lib/issues/database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyIssueDraftCreateStoreInput
  ) => ReturnType<BubblophyIssueDraftCreateStore['createIssueWithCreatedEvent']>
): BubblophyIssueDraftCreateStore {
  return {
    createIssueWithCreatedEvent: vi.fn(handler),
  };
}

describe('createBubblophyIssueDraft', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects empty titles before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      createBubblophyIssueDraft(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          title: '   ',
          priority: 'mittel',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'empty_title',
    });

    expect(store.createIssueWithCreatedEvent).not.toHaveBeenCalled();
  });

  it('rejects runtime-invalid priority values before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      createBubblophyIssueDraft(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          title: 'Persistierten Draft anlegen',
          priority: 'dringend' as 'mittel',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'invalid_priority',
    });

    expect(store.createIssueWithCreatedEvent).not.toHaveBeenCalled();
  });

  it('denies creation when the store finds no project membership', async () => {
    const store = createStore(async () => null);

    await expect(
      createBubblophyIssueDraft(
        {
          authUserId: 'user_viewer',
          projectKey: 'BV',
          title: 'Fremdes Projekt beschreiben',
          priority: 'niedrig',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'forbidden',
    });

    expect(store.createIssueWithCreatedEvent).toHaveBeenCalledWith({
      authUserId: 'user_viewer',
      projectKey: 'BV',
      title: 'Fremdes Projekt beschreiben',
      description: '',
      priority: 'low',
    });
  });

  it('creates an issue draft through the store and returns a dashboard issue', async () => {
    const store = createStore(async (input) => ({
      project: {
        id: 'project_bubblesverse',
        key: input.projectKey,
        name: 'Bubblesverse',
      },
      issue: {
        id: 'issue_bv_15',
        issueNumber: 15,
        title: input.title,
        status: 'triage',
        priority: input.priority,
        assignedAuthUserId: null,
        requiresHumanApproval: true,
      },
    }));

    await expect(
      createBubblophyIssueDraft(
        {
          authUserId: 'user_owner',
          projectKey: ' BV ',
          title: '  Persistierten Draft vorbereiten  ',
          description: '  Erst Issue und Event, kein Run.  ',
          priority: 'hoch',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: 'Persistierten Draft vorbereiten',
        projectKey: 'BV',
        status: 'triage',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
      },
    });

    expect(store.createIssueWithCreatedEvent).toHaveBeenCalledTimes(1);
    expect(store.createIssueWithCreatedEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      projectKey: 'BV',
      title: 'Persistierten Draft vorbereiten',
      description: 'Erst Issue und Event, kein Run.',
      priority: 'high',
    });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      createBubblophyIssueDraft({
        authUserId: 'user_owner',
        projectKey: 'BV',
        title: 'Nur lokal möglich',
        priority: 'mittel',
      })
    ).resolves.toEqual({
      status: 'database_unavailable',
    });
  });
});

describe('Bubblophy issue write helpers', () => {
  it('calculates the next per-project issue number', () => {
    expect(getNextBubblophyIssueNumber(undefined)).toBe(1);
    expect(getNextBubblophyIssueNumber(null)).toBe(1);
    expect(getNextBubblophyIssueNumber(14)).toBe(15);
  });

  it('builds a human created-event insert without agent run fields', () => {
    expect(
      buildBubblophyIssueCreatedEventInsert({
        issueId: 'issue_bv_15',
        authUserId: 'user_owner',
        projectKey: 'BV',
        issueNumber: 15,
      })
    ).toEqual({
      issueId: 'issue_bv_15',
      eventType: 'created',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Issue BV-15 erstellt.',
      payload: {
        source: 'human',
        projectKey: 'BV',
        issueNumber: 15,
      },
    });
  });
});

describe('mapCreatedIssueToSummary', () => {
  it('maps created persistence rows into dashboard issue summaries', () => {
    expect(
      mapCreatedIssueToSummary({
        project: {
          id: 'project_novari',
          key: 'NO',
          name: 'Novari',
        },
        issue: {
          id: 'issue_no_3',
          issueNumber: 3,
          title: 'Mitgliedschaft prüfen',
          status: 'triage',
          priority: 'medium',
          assignedAuthUserId: 'user_owner',
          requiresHumanApproval: true,
        },
      })
    ).toEqual({
      id: 'NO-03',
      title: 'Mitgliedschaft prüfen',
      projectKey: 'NO',
      status: 'triage',
      priority: 'mittel',
      owner: 'user_owner',
      planSteps: 0,
      approvalRequired: true,
    });
  });
});
