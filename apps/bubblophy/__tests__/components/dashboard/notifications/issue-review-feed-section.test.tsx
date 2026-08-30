import type { DashboardIssueReviewPageItem } from '@/lib/dashboard/issue-review-notifications';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IssueReviewFeedSection } from '@/components/dashboard/notifications/issue-review-feed-section';

const reviews: DashboardIssueReviewPageItem[] = [
  {
    issueKey: 'BV-12',
    title: 'MCP-Handoff prüfen',
    projectKey: 'BV',
    projectName: 'Bubbles Verse',
    updatedAt: '2026-08-31T12:00:00.000Z',
  },
];

const noop = () => undefined;

describe('IssueReviewFeedSection', () => {
  it('labels issue review separately and opens the public issue', () => {
    const onIssueSelect = vi.fn();

    render(
      <IssueReviewFeedSection
        dataSource="database"
        reviews={reviews}
        status="success"
        cursor={null}
        nextAfter={null}
        onIssueSelect={onIssueSelect}
        onFirstPage={noop}
        onNextPage={noop}
      />
    );

    expect(screen.getByText('Issue-Reviews')).toBeVisible();
    expect(screen.getByText('Issue-Status')).toBeVisible();
    expect(screen.getByText('MCP-Handoff prüfen')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Issue öffnen' }));
    expect(onIssueSelect).toHaveBeenCalledWith('BV-12');
  });

  it('renders independent loading, error, empty, and paging states', () => {
    const onFirstPage = vi.fn();
    const onNextPage = vi.fn();
    const cursor = {
      updatedAt: '2026-08-30T12:00:00.000Z',
      projectKey: 'BV',
      issueNumber: 12,
    };
    const nextAfter = {
      updatedAt: '2026-08-29T12:00:00.000Z',
      projectKey: 'NO',
      issueNumber: 8,
    };
    const { rerender } = render(
      <IssueReviewFeedSection
        dataSource="database"
        reviews={[]}
        status="loading"
        cursor={cursor}
        nextAfter={nextAfter}
        onIssueSelect={noop}
        onFirstPage={onFirstPage}
        onNextPage={onNextPage}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Issue-Reviews werden geladen'
    );

    rerender(
      <IssueReviewFeedSection
        dataSource="database"
        reviews={[]}
        status="database_unavailable"
        cursor={cursor}
        nextAfter={nextAfter}
        onIssueSelect={noop}
        onFirstPage={onFirstPage}
        onNextPage={onNextPage}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Issue-Reviews konnten nicht geladen werden'
    );

    rerender(
      <IssueReviewFeedSection
        dataSource="database"
        reviews={[]}
        status="success"
        cursor={cursor}
        nextAfter={nextAfter}
        onIssueSelect={noop}
        onFirstPage={onFirstPage}
        onNextPage={onNextPage}
      />
    );
    expect(screen.getByText(/Keine Issues im Review/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Erste Review-Seite' }));
    fireEvent.click(screen.getByRole('button', { name: 'Weitere Reviews' }));
    expect(onFirstPage).toHaveBeenCalledOnce();
    expect(onNextPage).toHaveBeenCalledWith(nextAfter);
  });
});
