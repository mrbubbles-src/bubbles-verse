import type {
  AddBubblophyProjectMemberActionInput,
  CreateBubblophyAgentTokenActionInput,
  CreateBubblophyIssueActionInput,
  CreateBubblophyIssueNoteActionInput,
  CreateBubblophyIssuePlanActionInput,
  CreateBubblophyProjectActionInput,
  RemoveBubblophyProjectMemberActionInput,
  RequestBubblophyAgentRunActionInput,
  TransitionBubblophyAgentRunActionInput,
  TransitionBubblophyProjectArchiveActionInput,
  UpdateBubblophyAgentTokenLifecycleActionInput,
  UpdateBubblophyIssueAssigneeActionInput,
  UpdateBubblophyIssueContentActionInput,
  UpdateBubblophyIssuePriorityActionInput,
  UpdateBubblophyIssueStatusActionInput,
  UpdateBubblophyProjectContentActionInput,
  UpdateBubblophyProjectMemberRoleActionInput,
} from '@/app/actions';
import type { TransitionBubblophyAgentRunInput } from '@/lib/agent-runs/human-transition';
import type { RequestBubblophyAgentRunInput } from '@/lib/agent-runs/request';
import type { CreateBubblophyAgentTokenInput } from '@/lib/agent-tokens/create';
import type { UpdateBubblophyAgentTokenLifecycleInput } from '@/lib/agent-tokens/lifecycle';
import type { UpdateBubblophyIssueAssigneeInput } from '@/lib/issues/assignment';
import type { CreateBubblophyIssueDraftInput } from '@/lib/issues/create';
import type { UpdateBubblophyIssueContentInput } from '@/lib/issues/edit';
import type { CreateOrUpdateBubblophyIssuePlanDraftInput } from '@/lib/issues/plans';
import type { CreateBubblophyIssueNoteInput } from '@/lib/issues/notes';
import type { UpdateBubblophyIssuePriorityInput } from '@/lib/issues/priority';
import type { UpdateBubblophyIssueStatusInput } from '@/lib/issues/status';
import type { CreateBubblophyProjectInput } from '@/lib/projects/create';
import type {
  TransitionBubblophyProjectArchiveInput,
  UpdateBubblophyProjectContentInput,
} from '@/lib/projects/manage';
import type {
  AddBubblophyProjectMemberInput,
  RemoveBubblophyProjectMemberInput,
  UpdateBubblophyProjectMemberRoleInput,
} from '@/lib/projects/members';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireBubblophySessionMock = vi.fn();
const createBubblophyIssueDraftMock = vi.fn();
const updateBubblophyIssueAssigneeMock = vi.fn();
const updateBubblophyIssueContentMock = vi.fn();
const createBubblophyIssuePlanDraftMock = vi.fn();
const createBubblophyIssueNoteMock = vi.fn();
const updateBubblophyIssuePriorityMock = vi.fn();
const updateBubblophyIssueStatusMock = vi.fn();
const createBubblophyProjectMock = vi.fn();
const updateBubblophyProjectContentMock = vi.fn();
const transitionBubblophyProjectArchiveMock = vi.fn();
const addBubblophyProjectMemberMock = vi.fn();
const updateBubblophyProjectMemberRoleMock = vi.fn();
const removeBubblophyProjectMemberMock = vi.fn();
const createBubblophyAgentTokenMock = vi.fn();
const updateBubblophyAgentTokenLifecycleMock = vi.fn();
const requestBubblophyAgentRunMock = vi.fn();
const transitionBubblophyAgentRunMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  requireBubblophySession: (options: { nextPath?: string }) =>
    requireBubblophySessionMock(options),
}));

vi.mock('@/lib/issues/create', () => ({
  createBubblophyIssueDraft: (input: CreateBubblophyIssueDraftInput) =>
    createBubblophyIssueDraftMock(input),
}));

vi.mock('@/lib/issues/assignment', () => ({
  updateBubblophyIssueAssignee: (input: UpdateBubblophyIssueAssigneeInput) =>
    updateBubblophyIssueAssigneeMock(input),
}));

vi.mock('@/lib/issues/edit', () => ({
  updateBubblophyIssueContent: (input: UpdateBubblophyIssueContentInput) =>
    updateBubblophyIssueContentMock(input),
}));

vi.mock('@/lib/issues/plans', () => ({
  createOrUpdateBubblophyIssuePlanDraft: (
    input: CreateOrUpdateBubblophyIssuePlanDraftInput
  ) => createBubblophyIssuePlanDraftMock(input),
}));

vi.mock('@/lib/issues/notes', () => ({
  createBubblophyIssueNote: (input: CreateBubblophyIssueNoteInput) =>
    createBubblophyIssueNoteMock(input),
}));

vi.mock('@/lib/issues/priority', () => ({
  updateBubblophyIssuePriority: (input: UpdateBubblophyIssuePriorityInput) =>
    updateBubblophyIssuePriorityMock(input),
}));

vi.mock('@/lib/issues/status', () => ({
  updateBubblophyIssueStatus: (input: UpdateBubblophyIssueStatusInput) =>
    updateBubblophyIssueStatusMock(input),
}));

vi.mock('@/lib/projects/create', () => ({
  createBubblophyProject: (input: CreateBubblophyProjectInput) =>
    createBubblophyProjectMock(input),
}));

vi.mock('@/lib/projects/manage', () => ({
  updateBubblophyProjectContent: (input: UpdateBubblophyProjectContentInput) =>
    updateBubblophyProjectContentMock(input),
  transitionBubblophyProjectArchive: (
    input: TransitionBubblophyProjectArchiveInput
  ) => transitionBubblophyProjectArchiveMock(input),
}));

vi.mock('@/lib/projects/members', () => ({
  addBubblophyProjectMember: (input: AddBubblophyProjectMemberInput) =>
    addBubblophyProjectMemberMock(input),
  updateBubblophyProjectMemberRole: (
    input: UpdateBubblophyProjectMemberRoleInput
  ) => updateBubblophyProjectMemberRoleMock(input),
  removeBubblophyProjectMember: (input: RemoveBubblophyProjectMemberInput) =>
    removeBubblophyProjectMemberMock(input),
}));

vi.mock('@/lib/agent-tokens/create', () => ({
  createBubblophyAgentToken: (input: CreateBubblophyAgentTokenInput) =>
    createBubblophyAgentTokenMock(input),
}));

vi.mock('@/lib/agent-tokens/lifecycle', () => ({
  updateBubblophyAgentTokenLifecycle: (
    input: UpdateBubblophyAgentTokenLifecycleInput
  ) => updateBubblophyAgentTokenLifecycleMock(input),
}));

vi.mock('@/lib/agent-runs/request', () => ({
  requestBubblophyAgentRun: (input: RequestBubblophyAgentRunInput) =>
    requestBubblophyAgentRunMock(input),
}));

vi.mock('@/lib/agent-runs/human-transition', () => ({
  transitionBubblophyAgentRun: (input: TransitionBubblophyAgentRunInput) =>
    transitionBubblophyAgentRunMock(input),
}));

describe('createBubblophyIssueAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyIssueDraftMock.mockReset();
    updateBubblophyIssueAssigneeMock.mockReset();
    updateBubblophyIssueContentMock.mockReset();
    createBubblophyIssuePlanDraftMock.mockReset();
    createBubblophyIssueNoteMock.mockReset();
    updateBubblophyIssuePriorityMock.mockReset();
    updateBubblophyIssueStatusMock.mockReset();
    createBubblophyProjectMock.mockReset();
    updateBubblophyProjectContentMock.mockReset();
    transitionBubblophyProjectArchiveMock.mockReset();
    updateBubblophyProjectMemberRoleMock.mockReset();
    removeBubblophyProjectMemberMock.mockReset();
    createBubblophyAgentTokenMock.mockReset();
    updateBubblophyAgentTokenLifecycleMock.mockReset();
    transitionBubblophyAgentRunMock.mockReset();
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

describe('updateBubblophyIssueContentAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    updateBubblophyIssueContentMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    updateBubblophyIssueContentMock.mockResolvedValue({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Bearbeiteter Titel',
        description: 'Neue Beschreibung',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 2,
        approvalRequired: true,
      },
    });

    const { updateBubblophyIssueContentAction } = await import('@/app/actions');
    const result = await updateBubblophyIssueContentAction({
      authUserId: 'user_client_spoof',
      issueId: 'BV-12',
      title: 'Bearbeiteter Titel',
      description: 'Neue Beschreibung',
    } as UpdateBubblophyIssueContentActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(updateBubblophyIssueContentMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      issueId: 'BV-12',
      title: 'Bearbeiteter Titel',
      description: 'Neue Beschreibung',
    });
    expect(result).toEqual({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Bearbeiteter Titel',
        description: 'Neue Beschreibung',
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

describe('updateBubblophyIssueAssigneeAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    updateBubblophyIssueAssigneeMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    updateBubblophyIssueAssigneeMock.mockResolvedValue({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Zuweisung pflegen',
        description: 'Eine klare Zuständigkeit.',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'user_member',
        planSteps: 2,
        approvalRequired: true,
      },
    });

    const { updateBubblophyIssueAssigneeAction } =
      await import('@/app/actions');
    const result = await updateBubblophyIssueAssigneeAction({
      authUserId: 'user_client_spoof',
      issueId: 'BV-12',
      assigneeAuthUserId: 'user_member',
    } as UpdateBubblophyIssueAssigneeActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(updateBubblophyIssueAssigneeMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      issueId: 'BV-12',
      assigneeAuthUserId: 'user_member',
    });
    expect(result).toEqual({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Zuweisung pflegen',
        description: 'Eine klare Zuständigkeit.',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'user_member',
        planSteps: 2,
        approvalRequired: true,
      },
    });
  });

  it('forwards assignment denial results without client credentials', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    updateBubblophyIssueAssigneeMock.mockResolvedValue({
      status: 'invalid_assignee',
    });

    const { updateBubblophyIssueAssigneeAction } =
      await import('@/app/actions');
    const result = await updateBubblophyIssueAssigneeAction({
      authUserId: 'user_client_spoof',
      issueId: 'BV-12',
      assigneeAuthUserId: 'user_other_project',
    } as UpdateBubblophyIssueAssigneeActionInput & { authUserId: string });

    expect(updateBubblophyIssueAssigneeMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      issueId: 'BV-12',
      assigneeAuthUserId: 'user_other_project',
    });
    expect(updateBubblophyIssueAssigneeMock.mock.calls[0]?.[0]).not.toHaveProperty(
      'email'
    );
    expect(result).toEqual({ status: 'invalid_assignee' });
  });
});

describe('createBubblophyIssuePlanAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyIssueDraftMock.mockReset();
    createBubblophyIssuePlanDraftMock.mockReset();
    updateBubblophyIssuePriorityMock.mockReset();
    updateBubblophyIssueStatusMock.mockReset();
    createBubblophyProjectMock.mockReset();
    createBubblophyAgentTokenMock.mockReset();
    transitionBubblophyAgentRunMock.mockReset();
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

describe('createBubblophyIssueNoteAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyIssueNoteMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    createBubblophyIssueNoteMock.mockResolvedValue({
      status: 'created',
      note: {
        id: 'event_note_1',
        note: 'Plan-Review bleibt menschlich.',
        actor: 'Mensch',
        createdAt: '2026-06-14T10:00:00.000Z',
      },
    });

    const { createBubblophyIssueNoteAction } = await import('@/app/actions');
    const result = await createBubblophyIssueNoteAction({
      authUserId: 'user_client_spoof',
      issueId: 'BV-12',
      note: 'Plan-Review bleibt menschlich.',
    } as CreateBubblophyIssueNoteActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(createBubblophyIssueNoteMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      issueId: 'BV-12',
      note: 'Plan-Review bleibt menschlich.',
    });
    expect(result).toEqual({
      status: 'created',
      note: {
        id: 'event_note_1',
        note: 'Plan-Review bleibt menschlich.',
        actor: 'Mensch',
        createdAt: '2026-06-14T10:00:00.000Z',
      },
    });
  });

  it('forwards note validation and permission results without internal details', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    createBubblophyIssueNoteMock.mockResolvedValue({
      status: 'forbidden',
    });

    const { createBubblophyIssueNoteAction } = await import('@/app/actions');
    const result = await createBubblophyIssueNoteAction({
      authUserId: 'user_client_spoof',
      issueId: 'BV-12',
      note: 'Viewer darf nicht schreiben.',
    } as CreateBubblophyIssueNoteActionInput & { authUserId: string });

    expect(createBubblophyIssueNoteMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      issueId: 'BV-12',
      note: 'Viewer darf nicht schreiben.',
    });
    expect(createBubblophyIssueNoteMock.mock.calls[0]?.[0]).not.toHaveProperty(
      'email'
    );
    expect(result).toEqual({ status: 'forbidden' });
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
    transitionBubblophyAgentRunMock.mockReset();
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

describe('updateBubblophyIssuePriorityAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    updateBubblophyIssuePriorityMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    updateBubblophyIssuePriorityMock.mockResolvedValue({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Priorität pflegen',
        description: 'Eine wichtige Änderung.',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        owner: 'Nicht zugewiesen',
        planSteps: 2,
        approvalRequired: true,
      },
    });

    const { updateBubblophyIssuePriorityAction } =
      await import('@/app/actions');
    const result = await updateBubblophyIssuePriorityAction({
      authUserId: 'user_client_spoof',
      issueId: 'BV-12',
      priority: 'hoch',
    } as UpdateBubblophyIssuePriorityActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(updateBubblophyIssuePriorityMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      issueId: 'BV-12',
      priority: 'hoch',
    });
    expect(result).toEqual({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Priorität pflegen',
        description: 'Eine wichtige Änderung.',
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
    transitionBubblophyAgentRunMock.mockReset();
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
        description: 'Projektarbeit',
        isArchived: false,
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
        description: 'Projektarbeit',
        isArchived: false,
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

describe('updateBubblophyProjectContentAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    updateBubblophyProjectContentMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    updateBubblophyProjectContentMock.mockResolvedValue({
      status: 'updated',
      project: {
        id: 'project_bv',
        name: 'Bubblesverse lokal',
        key: 'BV',
        description: 'Projektbeschreibung aktualisiert.',
        isArchived: false,
        health: 'stabil',
        openIssues: 2,
        readyIssues: 1,
        blockedIssues: 0,
        memberCount: 2,
        agentTokenCount: 1,
      },
    });

    const { updateBubblophyProjectContentAction } =
      await import('@/app/actions');
    const result = await updateBubblophyProjectContentAction({
      authUserId: 'user_client_spoof',
      projectKey: 'BV',
      name: 'Bubblesverse lokal',
      description: 'Projektbeschreibung aktualisiert.',
    } as UpdateBubblophyProjectContentActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(updateBubblophyProjectContentMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      projectKey: 'BV',
      name: 'Bubblesverse lokal',
      description: 'Projektbeschreibung aktualisiert.',
    });
    expect(result).toEqual({
      status: 'updated',
      project: {
        id: 'project_bv',
        name: 'Bubblesverse lokal',
        key: 'BV',
        description: 'Projektbeschreibung aktualisiert.',
        isArchived: false,
        health: 'stabil',
        openIssues: 2,
        readyIssues: 1,
        blockedIssues: 0,
        memberCount: 2,
        agentTokenCount: 1,
      },
    });
  });
});

describe('transitionBubblophyProjectArchiveAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    transitionBubblophyProjectArchiveMock.mockReset();
  });

  it('resolves the auth user server-side for archive decisions', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    transitionBubblophyProjectArchiveMock.mockResolvedValue({
      status: 'updated',
      project: {
        id: 'project_bv',
        name: 'Bubblesverse',
        key: 'BV',
        description: 'Projektarbeit',
        isArchived: true,
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 2,
        agentTokenCount: 1,
      },
    });

    const { transitionBubblophyProjectArchiveAction } =
      await import('@/app/actions');
    const result = await transitionBubblophyProjectArchiveAction({
      authUserId: 'user_client_spoof',
      projectKey: 'BV',
      decision: 'archive',
    } as TransitionBubblophyProjectArchiveActionInput & {
      authUserId: string;
    });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(transitionBubblophyProjectArchiveMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      projectKey: 'BV',
      decision: 'archive',
    });
    expect(result).toEqual({
      status: 'updated',
      project: {
        id: 'project_bv',
        name: 'Bubblesverse',
        key: 'BV',
        description: 'Projektarbeit',
        isArchived: true,
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 2,
        agentTokenCount: 1,
      },
    });
  });
});

describe('project member actions', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    addBubblophyProjectMemberMock.mockReset();
    updateBubblophyProjectMemberRoleMock.mockReset();
    removeBubblophyProjectMemberMock.mockReset();
  });

  it('resolves the auth user server-side for member additions', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    addBubblophyProjectMemberMock.mockResolvedValue({
      status: 'added',
      member: {
        id: 'BV:user_martin',
        projectKey: 'BV',
        authUserId: 'user_martin',
        label: 'user_martin',
        role: 'member',
        createdAt: '2026-06-14T10:00:00.000Z',
      },
      memberCount: 3,
    });

    const { addBubblophyProjectMemberAction } = await import('@/app/actions');
    const result = await addBubblophyProjectMemberAction({
      authUserId: 'user_client_spoof',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      role: 'member',
    } as AddBubblophyProjectMemberActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(addBubblophyProjectMemberMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      role: 'member',
    });
    expect(result).toMatchObject({
      status: 'added',
      member: {
        authUserId: 'user_martin',
        role: 'member',
      },
    });
  });

  it('resolves the auth user server-side for role changes', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    updateBubblophyProjectMemberRoleMock.mockResolvedValue({
      status: 'updated',
      member: {
        id: 'BV:user_martin',
        projectKey: 'BV',
        authUserId: 'user_martin',
        label: 'user_martin',
        role: 'viewer',
        createdAt: '2026-06-13T10:00:00.000Z',
      },
      memberCount: 2,
    });

    const { updateBubblophyProjectMemberRoleAction } =
      await import('@/app/actions');
    const result = await updateBubblophyProjectMemberRoleAction({
      authUserId: 'user_client_spoof',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      role: 'viewer',
    } as UpdateBubblophyProjectMemberRoleActionInput & {
      authUserId: string;
    });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(updateBubblophyProjectMemberRoleMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      role: 'viewer',
    });
    expect(result).toMatchObject({
      status: 'updated',
      member: {
        authUserId: 'user_martin',
        role: 'viewer',
      },
    });
  });

  it('resolves the auth user server-side for member removal', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    removeBubblophyProjectMemberMock.mockResolvedValue({
      status: 'removed',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      memberCount: 1,
    });

    const { removeBubblophyProjectMemberAction } =
      await import('@/app/actions');
    const result = await removeBubblophyProjectMemberAction({
      authUserId: 'user_client_spoof',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
    } as RemoveBubblophyProjectMemberActionInput & { authUserId: string });

    expect(removeBubblophyProjectMemberMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
    });
    expect(result).toEqual({
      status: 'removed',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      memberCount: 1,
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
    transitionBubblophyAgentRunMock.mockReset();
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
        expiresAt: 'läuft nicht automatisch ab',
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
        expiresAt: 'läuft nicht automatisch ab',
        plaintextToken: 'bubblophy_agent_plaintext',
      },
    });
  });
});

describe('updateBubblophyAgentTokenLifecycleAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    createBubblophyAgentTokenMock.mockReset();
    updateBubblophyAgentTokenLifecycleMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    updateBubblophyAgentTokenLifecycleMock.mockResolvedValue({
      status: 'updated',
      token: {
        id: 'token_codex',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read'],
        state: 'pausiert',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: 'läuft nicht automatisch ab',
      },
    });

    const { updateBubblophyAgentTokenLifecycleAction } =
      await import('@/app/actions');
    const result = await updateBubblophyAgentTokenLifecycleAction({
      authUserId: 'user_client_spoof',
      tokenId: 'token_codex',
      decision: 'pause',
    } as UpdateBubblophyAgentTokenLifecycleActionInput & {
      authUserId: string;
    });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(updateBubblophyAgentTokenLifecycleMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      tokenId: 'token_codex',
      decision: 'pause',
    });
    expect(result).toEqual({
      status: 'updated',
      token: {
        id: 'token_codex',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read'],
        state: 'pausiert',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: 'läuft nicht automatisch ab',
      },
    });
  });
});

describe('requestBubblophyAgentRunAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    requestBubblophyAgentRunMock.mockReset();
    transitionBubblophyAgentRunMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    requestBubblophyAgentRunMock.mockResolvedValue({
      status: 'requested',
      run: {
        id: 'run_bv_12',
        issueId: 'BV-12',
        agentLabel: 'codex-local-lio',
        state: 'wartet',
        requestedBy: 'Mensch',
        lastEvent: 'Anfrage gespeichert: Nur vorbereiten.',
      },
    });

    const { requestBubblophyAgentRunAction } = await import('@/app/actions');
    const result = await requestBubblophyAgentRunAction({
      authUserId: 'user_client_spoof',
      issueId: 'BV-12',
      agentTokenId: 'token_codex',
      instructions: 'Nur vorbereiten.',
    } as RequestBubblophyAgentRunActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(requestBubblophyAgentRunMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      issueId: 'BV-12',
      agentTokenId: 'token_codex',
      instructions: 'Nur vorbereiten.',
    });
    expect(result).toEqual({
      status: 'requested',
      run: {
        id: 'run_bv_12',
        issueId: 'BV-12',
        agentLabel: 'codex-local-lio',
        state: 'wartet',
        requestedBy: 'Mensch',
        lastEvent: 'Anfrage gespeichert: Nur vorbereiten.',
      },
    });
  });
});

describe('transitionBubblophyAgentRunAction', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    transitionBubblophyAgentRunMock.mockReset();
  });

  it('resolves the auth user server-side instead of accepting a client authUserId', async () => {
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user_server',
      email: 'owner@example.test',
      user: {},
    });
    transitionBubblophyAgentRunMock.mockResolvedValue({
      status: 'updated',
      run: {
        id: 'run_bv_12',
        issueId: 'BV-12',
        agentLabel: 'codex-local-lio',
        state: 'freigegeben',
        requestedBy: 'Mensch',
        lastEvent: 'Run BV-12 wurde menschlich freigegeben.',
      },
    });

    const { transitionBubblophyAgentRunAction } = await import('@/app/actions');
    const result = await transitionBubblophyAgentRunAction({
      authUserId: 'user_client_spoof',
      runId: 'run_bv_12',
      decision: 'approve',
    } as TransitionBubblophyAgentRunActionInput & { authUserId: string });

    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/',
    });
    expect(transitionBubblophyAgentRunMock).toHaveBeenCalledWith({
      authUserId: 'user_server',
      runId: 'run_bv_12',
      decision: 'approve',
    });
    expect(result).toEqual({
      status: 'updated',
      run: {
        id: 'run_bv_12',
        issueId: 'BV-12',
        agentLabel: 'codex-local-lio',
        state: 'freigegeben',
        requestedBy: 'Mensch',
        lastEvent: 'Run BV-12 wurde menschlich freigegeben.',
      },
    });
  });
});
