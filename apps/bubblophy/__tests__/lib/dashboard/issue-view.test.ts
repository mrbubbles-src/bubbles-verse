import type {
  DashboardIssueDetail,
  DashboardIssuePage,
} from '@/lib/dashboard/issues';

import {
  combineDashboardProjectAccess,
  mapDashboardIssueDetailToSummary,
  mapDashboardIssuePageToSummaries,
  matchesDashboardIssueQuery,
} from '@/lib/dashboard/issue-view';

import { describe, expect, it } from 'vitest';

const page: DashboardIssuePage = {
  project: {
    key: 'BV',
    name: 'Bubblesverse',
    isArchived: false,
    currentUserRole: 'member',
  },
  sort: 'newest',
  filters: { query: null, status: null, priority: null },
  items: [
    {
      key: 'BV-14',
      issueNumber: 14,
      title: 'Queue anbinden',
      status: 'in_progress',
      priority: 'high',
      requiresHumanApproval: true,
      assignedAuthUserId: 'user-2',
      latestPlan: { version: 2, stepCount: 3 },
    },
  ],
  nextAfterIssueNumber: 14,
};

describe('dashboard issue read-model mapping', () => {
  it('combines conflicting access proofs with least privilege', () => {
    expect(
      combineDashboardProjectAccess(
        {
          key: 'BV',
          name: 'Bubblesverse',
          isArchived: true,
          currentUserRole: 'viewer',
        },
        {
          key: 'BV',
          name: 'Bubblesverse',
          isArchived: false,
          currentUserRole: 'owner',
        }
      )
    ).toEqual({
      key: 'BV',
      name: 'Bubblesverse',
      isArchived: true,
      currentUserRole: 'viewer',
    });
  });

  it('rejects access proofs for different projects', () => {
    expect(
      combineDashboardProjectAccess(page.project, {
        ...page.project,
        key: 'NO',
      })
    ).toBeNull();
  });

  it('maps lightweight page items without inventing detail fields', () => {
    expect(mapDashboardIssuePageToSummaries(page)).toEqual([
      {
        id: 'BV-14',
        title: 'Queue anbinden',
        projectKey: 'BV',
        status: 'in_arbeit',
        priority: 'hoch',
        assigneeAuthUserId: 'user-2',
        assigneeLabel: 'Mensch',
        planSteps: 3,
        approvalRequired: true,
      },
    ]);
  });

  it('maps the independently loaded detail and normalized plan', () => {
    const detail: DashboardIssueDetail = {
      project: page.project,
      issue: {
        key: 'BV-14',
        issueNumber: 14,
        title: 'Queue anbinden',
        description: 'Direkter Detailinhalt.',
        status: 'ready',
        priority: 'medium',
        requiresHumanApproval: false,
        assignedAuthUserId: null,
        createdAt: '2026-07-18T10:00:00.000Z',
        updatedAt: '2026-07-19T10:00:00.000Z',
        latestPlan: {
          version: 3,
          summary: 'Detailplan',
          steps: [{ id: 'step_1', text: 'Direkt öffnen' }],
        },
      },
    };

    expect(
      mapDashboardIssueDetailToSummary(detail, {
        id: 'BV-14',
        title: 'Alter Titel',
        projectKey: 'BV',
        status: 'triage',
        priority: 'niedrig',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        notes: [
          {
            id: 'note-1',
            note: 'Bestehende Notiz',
            actor: 'Mara',
            createdAt: '2026-07-19T09:00:00.000Z',
          },
        ],
        approvalRequired: false,
      })
    ).toMatchObject({
      id: 'BV-14',
      description: 'Direkter Detailinhalt.',
      status: 'bereit',
      priority: 'mittel',
      planSteps: 1,
      latestPlan: {
        version: 3,
        summary: 'Detailplan',
        steps: [{ id: 'step_1', text: 'Direkt öffnen' }],
      },
      notes: [{ id: 'note-1', note: 'Bestehende Notiz' }],
      approvalRequired: false,
    });
  });

  it('matches locally overlaid issues against active queue filters', () => {
    const issue = mapDashboardIssuePageToSummaries(page)[0]!;

    expect(
      matchesDashboardIssueQuery(issue, {
        filters: { query: 'queue', status: 'in_progress', priority: 'high' },
        sort: 'newest',
        afterIssueNumber: null,
      })
    ).toBe(true);
    expect(
      matchesDashboardIssueQuery(issue, {
        filters: { query: null, status: 'done', priority: null },
        sort: 'newest',
        afterIssueNumber: null,
      })
    ).toBe(false);
  });
});
