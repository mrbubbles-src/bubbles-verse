import type { CreateBubblophyIssueActionInput } from '@/app/actions';
import type { CreateBubblophyIssueDraftInput } from '@/lib/issues/create';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireBubblophySessionMock = vi.fn();
const createBubblophyIssueDraftMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  requireBubblophySession: (options: { nextPath?: string }) =>
    requireBubblophySessionMock(options),
}));

vi.mock('@/lib/issues/create', () => ({
  createBubblophyIssueDraft: (input: CreateBubblophyIssueDraftInput) =>
    createBubblophyIssueDraftMock(input),
}));

describe('createBubblophyIssueAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyIssueDraftMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    createBubblophyIssueDraftMock.mockResolvedValue({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: 'Persistiertes Issue',
        projectKey: 'BV',
        status: 'triage',
        priority: 'mittel',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
      },
    });

    const { createBubblophyIssueAction } = await import('@/app/actions');
    const result = await createBubblophyIssueAction({
      authUserId: 'user_client_spoof',
      projectKey: 'BV',
      title: 'Persistiertes Issue',
      description: 'Nur die serverseitige Session zählt.',
      priority: 'mittel',
    } as CreateBubblophyIssueActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(createBubblophyIssueDraftMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      projectKey: 'BV',
      title: 'Persistiertes Issue',
      description: 'Nur die serverseitige Session zählt.',
      priority: 'mittel',
    });
    expect(result).toEqual({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: 'Persistiertes Issue',
        projectKey: 'BV',
        status: 'triage',
        priority: 'mittel',
        owner: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
      },
    });
  });
});
