import type { DashboardIssueReviewPageItem } from '@/lib/dashboard/issue-review-notifications';
import type { DashboardNotificationPageItem } from '@/lib/dashboard/notifications';

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotificationFeed } from '@/components/dashboard/notifications/notification-feed';

const notifications: DashboardNotificationPageItem[] = [
  {
    runId: 'run-requested',
    issueKey: 'BV-12',
    projectKey: 'BV',
    projectName: 'Bubbles Verse',
    agentLabel: 'Codex lokal',
    state: 'requested',
    updatedAt: '2026-08-31T12:00:00.000Z',
    canManage: true,
  },
  {
    runId: 'run-review',
    issueKey: 'NO-8',
    projectKey: 'NO',
    projectName: 'Novari',
    agentLabel: 'Claude Windows',
    state: 'needs_review',
    updatedAt: '2026-08-31T11:00:00.000Z',
    canManage: false,
  },
  {
    runId: 'run-failed',
    issueKey: 'BV-7',
    projectKey: 'BV',
    projectName: 'Bubbles Verse',
    agentLabel: 'Codex lokal',
    state: 'failed',
    updatedAt: '2026-08-31T10:00:00.000Z',
    canManage: true,
  },
];

const noop = () => undefined;
const emptyIssueReviewProps = {
  issueReviews: [] as DashboardIssueReviewPageItem[],
  issueReviewStatus: null,
  issueReviewCursor: null,
  nextIssueReviewAfter: null,
  onFirstIssueReviewPage: noop,
  onNextIssueReviewPage: noop,
};

describe('NotificationFeed', () => {
  it('renders the three live run signals and opens their public issues', () => {
    const onIssueSelect = vi.fn();

    render(
      <NotificationFeed
        {...emptyIssueReviewProps}
        dataSource="database"
        notifications={notifications}
        status="success"
        cursor={null}
        nextAfter={null}
        onAgentRunTransitioned={noop}
        onIssueSelect={onIssueSelect}
        onFirstPage={noop}
        onNextPage={noop}
      />
    );

    expect(screen.getByText('Freigabe offen')).toBeVisible();
    expect(screen.getByText('Review nötig')).toBeVisible();
    expect(screen.getByText('Run fehlgeschlagen')).toBeVisible();
    expect(screen.getByText('NO-8')).toBeVisible();
    expect(screen.queryByText(/tokenHash|scope|authUser/i)).toBeNull();

    const reviewItem = screen.getByText('NO-8').closest('li');

    expect(reviewItem).toBeInstanceOf(HTMLElement);

    if (!reviewItem) {
      throw new Error('Expected the review notification to render.');
    }

    fireEvent.click(
      within(reviewItem).getByRole('button', { name: 'Issue öffnen' })
    );
    expect(onIssueSelect).toHaveBeenCalledWith('NO-8');
  });

  it('lets contributors decide requested runs directly', async () => {
    const onAgentRunTransitioned = vi.fn();
    const transitionAgentRunAction = vi.fn().mockResolvedValue({
      status: 'updated',
      run: {
        id: 'run-requested',
        issueId: 'BV-12',
        agentLabel: 'Codex lokal',
        state: 'läuft',
        requestedBy: 'Mensch',
        lastEvent: 'Run freigegeben',
      },
    });

    render(
      <NotificationFeed
        {...emptyIssueReviewProps}
        dataSource="database"
        notifications={notifications}
        status="success"
        cursor={null}
        nextAfter={null}
        transitionAgentRunAction={transitionAgentRunAction}
        onAgentRunTransitioned={onAgentRunTransitioned}
        onIssueSelect={noop}
        onFirstPage={noop}
        onNextPage={noop}
      />
    );

    const requestedItem = screen.getByText('BV-12').closest('li');
    const reviewItem = screen.getByText('NO-8').closest('li');

    expect(requestedItem).toBeInstanceOf(HTMLElement);
    expect(reviewItem).toBeInstanceOf(HTMLElement);

    if (!requestedItem || !reviewItem) {
      throw new Error('Expected the run notifications to render.');
    }

    expect(
      within(reviewItem).queryByRole('button', { name: 'Freigeben' })
    ).toBeNull();
    fireEvent.click(
      within(requestedItem).getByRole('button', { name: 'Freigeben' })
    );

    await waitFor(() => {
      expect(transitionAgentRunAction).toHaveBeenCalledWith({
        runId: 'run-requested',
        decision: 'approve',
      });
      expect(onAgentRunTransitioned).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'run-requested', state: 'läuft' })
      );
    });
  });

  it('keeps requested items visible when a decision fails', async () => {
    const transitionAgentRunAction = vi.fn().mockResolvedValue({
      status: 'token_unavailable',
    });

    render(
      <NotificationFeed
        {...emptyIssueReviewProps}
        dataSource="database"
        notifications={[notifications[0]!]}
        status="success"
        cursor={null}
        nextAfter={null}
        transitionAgentRunAction={transitionAgentRunAction}
        onAgentRunTransitioned={vi.fn()}
        onIssueSelect={noop}
        onFirstPage={noop}
        onNextPage={noop}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Freigeben' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'nicht ausführbar'
    );
    expect(screen.getByText('BV-12')).toBeVisible();
  });

  it('renders honest state and complete paging controls', () => {
    const onFirstPage = vi.fn();
    const onNextPage = vi.fn();
    const cursor = {
      updatedAt: '2026-08-30T12:00:00.000Z',
      runId: 'run-20',
    };
    const nextAfter = {
      updatedAt: '2026-08-29T12:00:00.000Z',
      runId: 'run-40',
    };
    const { rerender } = render(
      <NotificationFeed
        {...emptyIssueReviewProps}
        dataSource="database"
        notifications={[]}
        status="loading"
        cursor={cursor}
        nextAfter={nextAfter}
        onAgentRunTransitioned={noop}
        onIssueSelect={noop}
        onFirstPage={onFirstPage}
        onNextPage={onNextPage}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('werden geladen');

    rerender(
      <NotificationFeed
        {...emptyIssueReviewProps}
        dataSource="database"
        notifications={[]}
        status="success"
        cursor={cursor}
        nextAfter={nextAfter}
        onAgentRunTransitioned={noop}
        onIssueSelect={noop}
        onFirstPage={onFirstPage}
        onNextPage={onNextPage}
      />
    );

    expect(screen.getByText(/Keine offenen Run-Hinweise/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Erste Seite' }));
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onFirstPage).toHaveBeenCalledOnce();
    expect(onNextPage).toHaveBeenCalledWith(nextAfter);
  });

  it('shows the honest empty state for an empty configured database', () => {
    render(
      <NotificationFeed
        {...emptyIssueReviewProps}
        dataSource="empty_database"
        notifications={[]}
        status={null}
        cursor={null}
        nextAfter={null}
        onAgentRunTransitioned={noop}
        onIssueSelect={noop}
        onFirstPage={noop}
        onNextPage={noop}
      />
    );

    expect(screen.getByText(/Keine offenen Run-Hinweise/)).toBeVisible();
  });
});
