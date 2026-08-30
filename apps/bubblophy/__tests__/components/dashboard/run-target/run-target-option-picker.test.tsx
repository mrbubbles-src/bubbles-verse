import type { ReadBubblophyRunTargetOptionsActionResult } from '@/app/actions';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RunTargetOptionPicker } from '@/components/dashboard/run-target/run-target-option-picker';

/** Builds a successful bounded read result for UI contract tests. */
function makeSuccessResult(
  overrides: Partial<
    Extract<ReadBubblophyRunTargetOptionsActionResult, { status: 'success' }>
  > = {}
): Extract<ReadBubblophyRunTargetOptionsActionResult, { status: 'success' }> {
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
    items: [],
    nextAfter: null,
    ...overrides,
  };
}

describe('RunTargetOptionPicker', () => {
  it('loads only the selected issue and selects the first public option', async () => {
    const onValueChange = vi.fn();
    const readOptionsAction = vi.fn().mockResolvedValue(
      makeSuccessResult({
        items: [{ id: 'token-1', label: 'Worker' }],
      })
    );

    render(
      <RunTargetOptionPicker
        issueKey="BV-12"
        selectedTokenId=""
        readOptionsAction={readOptionsAction}
        onValueChange={onValueChange}
      />
    );

    await waitFor(() => {
      expect(readOptionsAction).toHaveBeenCalledWith({ issueKey: 'BV-12' });
      expect(onValueChange).toHaveBeenCalledWith('token-1');
    });
    expect(
      screen.getByRole('searchbox', {
        name: 'Ausführbare Agent-Tokens durchsuchen',
      })
    ).toHaveAttribute('placeholder', 'Token-Label');
    expect(screen.queryByText(/scope|hash|ablauf/i)).not.toBeInTheDocument();
  });

  it('starts a fresh normalized literal-prefix search', async () => {
    const readOptionsAction = vi
      .fn()
      .mockResolvedValueOnce(makeSuccessResult())
      .mockResolvedValueOnce(makeSuccessResult({ query: 'worker' }));

    render(
      <RunTargetOptionPicker
        issueKey="BV-12"
        selectedTokenId=""
        readOptionsAction={readOptionsAction}
        onValueChange={vi.fn()}
      />
    );

    await waitFor(() => expect(readOptionsAction).toHaveBeenCalledTimes(1));
    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Ausführbare Agent-Tokens durchsuchen',
      }),
      { target: { value: ' worker ' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Suchen' }));

    await waitFor(() => {
      expect(readOptionsAction).toHaveBeenLastCalledWith({
        issueKey: 'BV-12',
        query: 'worker',
      });
    });
  });

  it('loads the next unfiltered page with the stable cursor', async () => {
    const after = { normalizedLabel: 'worker', id: 'token-20' };
    const readOptionsAction = vi
      .fn()
      .mockResolvedValueOnce(
        makeSuccessResult({
          items: [{ id: 'token-20', label: 'Worker' }],
          nextAfter: after,
        })
      )
      .mockResolvedValueOnce(
        makeSuccessResult({
          after,
          items: [{ id: 'token-21', label: 'Worker 2' }],
        })
      );

    render(
      <RunTargetOptionPicker
        issueKey="BV-12"
        selectedTokenId=""
        readOptionsAction={readOptionsAction}
        onValueChange={vi.fn()}
      />
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Weitere 20 laden' })
    );

    await waitFor(() => {
      expect(readOptionsAction).toHaveBeenLastCalledWith({
        issueKey: 'BV-12',
        after,
      });
    });
  });

  it('clears a stale target when access is lost', async () => {
    const onValueChange = vi.fn();
    const readOptionsAction = vi.fn().mockResolvedValue({
      status: 'not_found',
    });

    render(
      <RunTargetOptionPicker
        issueKey="BV-12"
        selectedTokenId="token-stale"
        readOptionsAction={readOptionsAction}
        onValueChange={onValueChange}
      />
    );

    expect(
      await screen.findByRole('alert', {
        name: '',
      })
    ).toHaveTextContent('Issue oder dein Projektzugriff');
    expect(onValueChange).toHaveBeenCalledWith('');
  });
});
