import type { ReadBubblophyIssueAssigneeOptionsActionResult } from '@/app/actions';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IssueAssigneeOptionPicker } from '@/components/dashboard/issue-assignee/issue-assignee-option-picker';

/** Builds a successful bounded read result for UI contract tests. */
function makeSuccessResult(
  overrides: Partial<
    Extract<
      ReadBubblophyIssueAssigneeOptionsActionResult,
      { status: 'success' }
    >
  > = {}
): Extract<
  ReadBubblophyIssueAssigneeOptionsActionResult,
  { status: 'success' }
> {
  return {
    status: 'success',
    project: {
      key: 'BV',
      name: 'Bubblesverse',
      currentUserRole: 'member',
    },
    issueKey: 'BV-12',
    query: null,
    after: null,
    currentAssignee: null,
    items: [],
    nextAfter: null,
    ...overrides,
  };
}

describe('IssueAssigneeOptionPicker', () => {
  it('loads only the selected issue and exposes no e-mail search', async () => {
    const readOptionsAction = vi.fn().mockResolvedValue(makeSuccessResult());

    render(
      <IssueAssigneeOptionPicker
        issueKey="BV-12"
        selectedAuthUserId=""
        selectedLabel="Nicht zugewiesen"
        readOptionsAction={readOptionsAction}
        onValueChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(readOptionsAction).toHaveBeenCalledWith({ issueKey: 'BV-12' });
    });
    expect(
      screen.getByRole('searchbox', {
        name: 'Projektmitglieder durchsuchen',
      })
    ).toHaveAttribute('placeholder', 'Nutzer-ID');
  });

  it('starts a fresh normalized prefix search', async () => {
    const readOptionsAction = vi
      .fn()
      .mockResolvedValueOnce(makeSuccessResult())
      .mockResolvedValueOnce(makeSuccessResult({ query: 'mar' }));

    render(
      <IssueAssigneeOptionPicker
        issueKey="BV-12"
        selectedAuthUserId=""
        selectedLabel="Nicht zugewiesen"
        readOptionsAction={readOptionsAction}
        onValueChange={vi.fn()}
      />
    );

    await waitFor(() => expect(readOptionsAction).toHaveBeenCalledTimes(1));
    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Projektmitglieder durchsuchen',
      }),
      { target: { value: ' mar ' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Suchen' }));

    await waitFor(() => {
      expect(readOptionsAction).toHaveBeenLastCalledWith({
        issueKey: 'BV-12',
        query: 'mar',
      });
    });
  });
});
