import { mapDashboardRunPageToSummaries } from '@/lib/dashboard/run-view';

import { describe, expect, it } from 'vitest';

describe('mapDashboardRunPageToSummaries', () => {
  it('maps raw run states without exposing additional identifiers', () => {
    const [run] = mapDashboardRunPageToSummaries({
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        isArchived: false,
        currentUserRole: 'member',
      },
      items: [
        {
          id: 'run-1',
          issueKey: 'BV-12',
          agentLabel: 'codex',
          state: 'needs_review',
          updatedAt: '2026-07-19T12:00:00.000Z',
          resultSummary: 'Review bereit.',
        },
      ],
      nextAfter: null,
    });

    expect(run).toEqual({
      id: 'run-1',
      issueId: 'BV-12',
      agentLabel: 'codex',
      state: 'review',
      requestedBy: 'Mensch',
      lastEvent: 'Status review · zuletzt 2026-07-19T12:00:00.000Z',
      resultSummary: 'Review bereit.',
    });
  });
});
