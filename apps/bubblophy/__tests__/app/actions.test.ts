import type {
  CreateBubblophyAgentTokenActionInput,
  CreateBubblophyIssueActionInput,
  CreateBubblophyIssuePlanActionInput,
  CreateBubblophyProjectActionInput,
  UpdateBubblophyIssueStatusActionInput,
} from '@/app/actions';
import type { CreateBubblophyAgentTokenInput } from '@/lib/agent-tokens/create';
import type { CreateBubblophyIssueDraftInput } from '@/lib/issues/create';
import type { CreateOrUpdateBubblophyIssuePlanDraftInput } from '@/lib/issues/plans';
import type { UpdateBubblophyIssueStatusInput } from '@/lib/issues/status';
import type { CreateBubblophyProjectInput } from '@/lib/projects/create';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireBubblophySessionMock = vi.fn();
const createBubblophyIssueDraftMock = vi.fn();
const createBubblophyIssuePlanDraftMock = vi.fn();
const updateBubblophyIssueStatusMock = vi.fn();
const createBubblophyProjectMock = vi.fn();
const createBubblophyAgentTokenMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  requireBubblophySession: (options: { nextPath?: string }) =>
    requireBubblophySessionMock(options),
}));

vi.mock('@/lib/issues/create', () => ({
  createBubblophyIssueDraft: (input: CreateBubblophyIssueDraftInput) =>
    createBubblophyIssueDraftMock(input),
}));

vi.mock('@/lib/issues/plans', () => ({
  createOrUpdateBubblophyIssuePlanDraft: (
    input: CreateOrUpdateBubblophyIssuePlanDraftInput
  ) => createBubblophyIssuePlanDraftMock(input),
}));

vi.mock('@/lib/issues/status', () => ({
  updateBubblophyIssueStatus: (input: UpdateBubblophyIssueStatusInput) =>
    updateBubblophyIssueStatusMock(input),
}));

vi.mock('@/lib/projects/create', () => ({
  createBubblophyProject: (input: CreateBubblophyProjectInput) =>
    createBubblophyProjectMock(input),
}));

vi.mock('@/lib/agent-tokens/create', () => ({
  createBubblophyAgentToken: (input: CreateBubblophyAgentTokenInput) =>
    createBubblophyAgentTokenMock(input),
}));

describe('createBubblophyIssueAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyIssueDraftMock.mockReset();
    createBubblophyIssuePlanDraftMock.mockReset();
    updateBubblophyIssueStatusMock.mockReset();
    createBubblophyProjectMock.mockReset();
    createBubblophyAgentTokenMock.mockReset();
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

describe('createBubblophyIssuePlanAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyIssueDraftMock.mockReset();
    createBubblophyIssuePlanDraftMock.mockReset();
    updateBubblophyIssueStatusMock.mockReset();
    createBubblophyProjectMock.mockReset();
    createBubblophyAgentTokenMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    createBubblophyIssuePlanDraftMock.mockResolvedValue({
      status: 'created',
      plan: {
        issueId: 'BV-12',
        version: 2,
        summary: 'Plan prüfen',
        steps: [{ id: 'step_1', text: 'Kontext lesen' }],
      },
    });

    const { createBubblophyIssuePlanAction } = await import('@/app/actions');
    const result = await createBubblophyIssuePlanAction({
      authUserId: 'user_client_spoof',
      issueId: 'BV-12',
      summary: 'Plan prüfen',
      steps: ['Kontext lesen'],
    } as CreateBubblophyIssuePlanActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(createBubblophyIssuePlanDraftMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      issueId: 'BV-12',
      summary: 'Plan prüfen',
      steps: ['Kontext lesen'],
    });
    expect(result).toEqual({
      status: 'created',
      plan: {
        issueId: 'BV-12',
        version: 2,
        summary: 'Plan prüfen',
        steps: [{ id: 'step_1', text: 'Kontext lesen' }],
      },
    });
  });
});

describe('updateBubblophyIssueStatusAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyIssueDraftMock.mockReset();
    createBubblophyIssuePlanDraftMock.mockReset();
    updateBubblophyIssueStatusMock.mockReset();
    createBubblophyProjectMock.mockReset();
    createBubblophyAgentTokenMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    updateBubblophyIssueStatusMock.mockResolvedValue({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Status pflegen',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 2,
        approvalRequired: true,
      },
    });

    const { updateBubblophyIssueStatusAction } = await import('@/app/actions');
    const result = await updateBubblophyIssueStatusAction({
      authUserId: 'user_client_spoof',
      issueId: 'BV-12',
      status: 'bereit',
      reason: 'Plan geprüft.',
    } as UpdateBubblophyIssueStatusActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(updateBubblophyIssueStatusMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      issueId: 'BV-12',
      status: 'bereit',
      reason: 'Plan geprüft.',
    });
    expect(result).toEqual({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Status pflegen',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 2,
        approvalRequired: true,
      },
    });
  });
});

describe('createBubblophyProjectAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyIssueDraftMock.mockReset();
    createBubblophyIssuePlanDraftMock.mockReset();
    updateBubblophyIssueStatusMock.mockReset();
    createBubblophyProjectMock.mockReset();
    createBubblophyAgentTokenMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    createBubblophyProjectMock.mockResolvedValue({
      status: 'created',
      project: {
        id: 'project_bv',
        name: 'Bubblesverse',
        key: 'BV',
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 1,
        agentTokenCount: 0,
      },
    });

    const { createBubblophyProjectAction } = await import('@/app/actions');
    const result = await createBubblophyProjectAction({
      authUserId: 'user_client_spoof',
      name: 'Bubblesverse',
      key: 'BV',
      description: 'Projektarbeit',
      repositoryUrl: 'https://github.com/mrbubbles/bubbles-verse',
    } as CreateBubblophyProjectActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(createBubblophyProjectMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      name: 'Bubblesverse',
      key: 'BV',
      description: 'Projektarbeit',
      repositoryUrl: 'https://github.com/mrbubbles/bubbles-verse',
    });
    expect(result).toEqual({
      status: 'created',
      project: {
        id: 'project_bv',
        name: 'Bubblesverse',
        key: 'BV',
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 1,
        agentTokenCount: 0,
      },
    });
  });
});

describe('createBubblophyAgentTokenAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyIssueDraftMock.mockReset();
    createBubblophyIssuePlanDraftMock.mockReset();
    updateBubblophyIssueStatusMock.mockReset();
    createBubblophyProjectMock.mockReset();
    createBubblophyAgentTokenMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    createBubblophyAgentTokenMock.mockResolvedValue({
      status: 'created',
      token: {
        id: 'token_codex',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        plaintextToken: 'bubblophy_agent_plaintext',
      },
    });

    const { createBubblophyAgentTokenAction } = await import('@/app/actions');
    const result = await createBubblophyAgentTokenAction({
      authUserId: 'user_client_spoof',
      projectKey: 'BV',
      label: 'Codex lokal',
      scopes: ['projects:read', 'issues:read'],
    } as CreateBubblophyAgentTokenActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(createBubblophyAgentTokenMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      projectKey: 'BV',
      label: 'Codex lokal',
      scopes: ['projects:read', 'issues:read'],
    });
    expect(result).toEqual({
      status: 'created',
      token: {
        id: 'token_codex',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        plaintextToken: 'bubblophy_agent_plaintext',
      },
    });
  });
});
