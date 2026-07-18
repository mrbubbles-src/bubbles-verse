'use server';

import type {
  TransitionBubblophyAgentRunInput,
  TransitionBubblophyAgentRunResult,
} from '@/lib/agent-runs/human-transition';
import type {
  RequestBubblophyAgentRunInput,
  RequestBubblophyAgentRunResult,
} from '@/lib/agent-runs/request';
import type {
  CreateBubblophyAgentTokenInput,
  CreateBubblophyAgentTokenResult,
} from '@/lib/agent-tokens/create';
import type {
  UpdateBubblophyAgentTokenLifecycleInput,
  UpdateBubblophyAgentTokenLifecycleResult,
} from '@/lib/agent-tokens/lifecycle';
import type {
  UpdateBubblophyIssueAssigneeInput,
  UpdateBubblophyIssueAssigneeResult,
} from '@/lib/issues/assignment';
import type {
  CreateBubblophyIssueDraftInput,
  CreateBubblophyIssueDraftResult,
} from '@/lib/issues/create';
import type {
  UpdateBubblophyIssueContentInput,
  UpdateBubblophyIssueContentResult,
} from '@/lib/issues/edit';
import type {
  CreateBubblophyIssueNoteInput,
  CreateBubblophyIssueNoteResult,
} from '@/lib/issues/notes';
import type {
  CreateOrUpdateBubblophyIssuePlanDraftInput,
  CreateOrUpdateBubblophyIssuePlanDraftResult,
} from '@/lib/issues/plans';
import type {
  UpdateBubblophyIssuePriorityInput,
  UpdateBubblophyIssuePriorityResult,
} from '@/lib/issues/priority';
import type {
  UpdateBubblophyIssueStatusInput,
  UpdateBubblophyIssueStatusResult,
} from '@/lib/issues/status';
import type {
  CreateBubblophyProjectInput,
  CreateBubblophyProjectResult,
} from '@/lib/projects/create';
import type { ReadBubblophyProjectInvitationManagerSnapshotResult } from '@/lib/projects/invitation-snapshot';
import type {
  CreateBubblophyProjectInvitationInput,
  CreateBubblophyProjectInvitationResult,
  ReinviteBubblophyProjectInvitationInput,
  ReinviteBubblophyProjectInvitationResult,
  RevokeBubblophyProjectInvitationInput,
  RevokeBubblophyProjectInvitationResult,
} from '@/lib/projects/invitations';
import type {
  TransitionBubblophyProjectArchiveInput,
  TransitionBubblophyProjectArchiveResult,
  UpdateBubblophyProjectContentInput,
  UpdateBubblophyProjectContentResult,
} from '@/lib/projects/manage';
import type {
  AddBubblophyProjectMemberInput,
  AddBubblophyProjectMemberResult,
  RemoveBubblophyProjectMemberInput,
  RemoveBubblophyProjectMemberResult,
  UpdateBubblophyProjectMemberRoleInput,
  UpdateBubblophyProjectMemberRoleResult,
} from '@/lib/projects/members';

import { transitionBubblophyAgentRun } from '@/lib/agent-runs/human-transition';
import { requestBubblophyAgentRun } from '@/lib/agent-runs/request';
import { createBubblophyAgentToken } from '@/lib/agent-tokens/create';
import { updateBubblophyAgentTokenLifecycle } from '@/lib/agent-tokens/lifecycle';
import { requireBubblophySession } from '@/lib/auth/session';
import { updateBubblophyIssueAssignee } from '@/lib/issues/assignment';
import { createBubblophyIssueDraft } from '@/lib/issues/create';
import { updateBubblophyIssueContent } from '@/lib/issues/edit';
import { createBubblophyIssueNote } from '@/lib/issues/notes';
import { createOrUpdateBubblophyIssuePlanDraft } from '@/lib/issues/plans';
import { updateBubblophyIssuePriority } from '@/lib/issues/priority';
import { updateBubblophyIssueStatus } from '@/lib/issues/status';
import { createBubblophyProject } from '@/lib/projects/create';
import { readBubblophyProjectInvitationManagerSnapshot } from '@/lib/projects/invitation-snapshot';
import {
  createBubblophyProjectInvitation,
  reinviteBubblophyProjectInvitation,
  revokeBubblophyProjectInvitation,
} from '@/lib/projects/invitations';
import {
  transitionBubblophyProjectArchive,
  updateBubblophyProjectContent,
} from '@/lib/projects/manage';
import {
  addBubblophyProjectMember,
  removeBubblophyProjectMember,
  updateBubblophyProjectMemberRole,
} from '@/lib/projects/members';

export type CreateBubblophyIssueActionInput = Omit<
  CreateBubblophyIssueDraftInput,
  'authUserId' | 'oauthClientId'
>;

export type CreateBubblophyIssueActionResult = CreateBubblophyIssueDraftResult;

export type UpdateBubblophyIssueContentActionInput = Omit<
  UpdateBubblophyIssueContentInput,
  'authUserId'
>;

export type UpdateBubblophyIssueContentActionResult =
  UpdateBubblophyIssueContentResult;

export type UpdateBubblophyIssueAssigneeActionInput = Omit<
  UpdateBubblophyIssueAssigneeInput,
  'authUserId'
>;

export type UpdateBubblophyIssueAssigneeActionResult =
  UpdateBubblophyIssueAssigneeResult;

export type CreateBubblophyIssuePlanActionInput = Omit<
  CreateOrUpdateBubblophyIssuePlanDraftInput,
  'authUserId' | 'oauthClientId'
>;

export type CreateBubblophyIssuePlanActionResult =
  CreateOrUpdateBubblophyIssuePlanDraftResult;

export type CreateBubblophyIssueNoteActionInput = Omit<
  CreateBubblophyIssueNoteInput,
  'authUserId' | 'oauthClientId'
>;

export type CreateBubblophyIssueNoteActionResult =
  CreateBubblophyIssueNoteResult;

export type UpdateBubblophyIssueStatusActionInput = Omit<
  UpdateBubblophyIssueStatusInput,
  'authUserId' | 'oauthClientId'
>;

export type UpdateBubblophyIssueStatusActionResult =
  UpdateBubblophyIssueStatusResult;

export type UpdateBubblophyIssuePriorityActionInput = Omit<
  UpdateBubblophyIssuePriorityInput,
  'authUserId'
>;

export type UpdateBubblophyIssuePriorityActionResult =
  UpdateBubblophyIssuePriorityResult;

export type CreateBubblophyProjectActionInput = Omit<
  CreateBubblophyProjectInput,
  'authUserId'
>;

export type CreateBubblophyProjectActionResult = CreateBubblophyProjectResult;

export type UpdateBubblophyProjectContentActionInput = Omit<
  UpdateBubblophyProjectContentInput,
  'authUserId'
>;

export type UpdateBubblophyProjectContentActionResult =
  UpdateBubblophyProjectContentResult;

export type TransitionBubblophyProjectArchiveActionInput = Omit<
  TransitionBubblophyProjectArchiveInput,
  'authUserId'
>;

export type TransitionBubblophyProjectArchiveActionResult =
  TransitionBubblophyProjectArchiveResult;

export type AddBubblophyProjectMemberActionInput = Omit<
  AddBubblophyProjectMemberInput,
  'authUserId'
>;

export type AddBubblophyProjectMemberActionResult =
  AddBubblophyProjectMemberResult;

export type UpdateBubblophyProjectMemberRoleActionInput = Omit<
  UpdateBubblophyProjectMemberRoleInput,
  'authUserId'
>;

export type UpdateBubblophyProjectMemberRoleActionResult =
  UpdateBubblophyProjectMemberRoleResult;

export type RemoveBubblophyProjectMemberActionInput = Omit<
  RemoveBubblophyProjectMemberInput,
  'authUserId'
>;

export type RemoveBubblophyProjectMemberActionResult =
  RemoveBubblophyProjectMemberResult;

export type CreateBubblophyProjectInvitationActionInput = Omit<
  CreateBubblophyProjectInvitationInput,
  'authUserId'
>;

export type CreateBubblophyProjectInvitationActionResult =
  CreateBubblophyProjectInvitationResult;

export type ReinviteBubblophyProjectInvitationActionInput = Omit<
  ReinviteBubblophyProjectInvitationInput,
  'authUserId'
>;

export type ReinviteBubblophyProjectInvitationActionResult =
  ReinviteBubblophyProjectInvitationResult;

export type RevokeBubblophyProjectInvitationActionInput = Omit<
  RevokeBubblophyProjectInvitationInput,
  'authUserId'
>;

export type RevokeBubblophyProjectInvitationActionResult =
  RevokeBubblophyProjectInvitationResult;

export interface ReadBubblophyProjectInvitationManagerSnapshotActionInput {
  projectKey: string;
}

export type ReadBubblophyProjectInvitationManagerSnapshotActionResult =
  ReadBubblophyProjectInvitationManagerSnapshotResult;

export type CreateBubblophyAgentTokenActionInput = Omit<
  CreateBubblophyAgentTokenInput,
  'authUserId'
>;

export type CreateBubblophyAgentTokenActionResult =
  CreateBubblophyAgentTokenResult;

export type UpdateBubblophyAgentTokenLifecycleActionInput = Omit<
  UpdateBubblophyAgentTokenLifecycleInput,
  'authUserId'
>;

export type UpdateBubblophyAgentTokenLifecycleActionResult =
  UpdateBubblophyAgentTokenLifecycleResult;

export type RequestBubblophyAgentRunActionInput = Omit<
  RequestBubblophyAgentRunInput,
  'authUserId' | 'oauthClientId'
>;

export type RequestBubblophyAgentRunActionResult =
  RequestBubblophyAgentRunResult;

export type TransitionBubblophyAgentRunActionInput = Omit<
  TransitionBubblophyAgentRunInput,
  'authUserId'
>;

export type TransitionBubblophyAgentRunActionResult =
  TransitionBubblophyAgentRunResult;

/**
 * Persists a human-created Bubblophy issue draft for the current session.
 *
 * The client never provides an auth user ID. The action resolves the authorized
 * human session server-side, then delegates membership checks to the issue
 * create service.
 *
 * @param input Project key, title, optional description, and priority.
 * @returns Structured result for the dashboard dialog.
 */
export async function createBubblophyIssueAction(
  input: CreateBubblophyIssueActionInput
): Promise<CreateBubblophyIssueActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return createBubblophyIssueDraft({
    authUserId: session.authUserId,
    projectKey: input.projectKey,
    title: input.title,
    description: input.description,
    priority: input.priority,
  });
}

/**
 * Persists human edits to a Bubblophy issue for the current session.
 *
 * The client never provides an auth user ID. The action resolves the
 * authorized human session server-side, then delegates object ownership,
 * role checks, no-op detection, and audit writing to the issue edit service.
 *
 * @param input Issue key, title, and optional description.
 * @returns Structured result for the dashboard detail editor.
 */
export async function updateBubblophyIssueContentAction(
  input: UpdateBubblophyIssueContentActionInput
): Promise<UpdateBubblophyIssueContentActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return updateBubblophyIssueContent({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Persists a human issue assignment change for the current session.
 *
 * The client never provides an auth user ID. The action resolves the
 * authorized human session server-side, then delegates project membership,
 * assignee membership, and audit writing to the issue assignment service.
 *
 * @param input Issue key and project member auth user ID, or empty to unassign.
 * @returns Structured result for the dashboard assignment control.
 */
export async function updateBubblophyIssueAssigneeAction(
  input: UpdateBubblophyIssueAssigneeActionInput
): Promise<UpdateBubblophyIssueAssigneeActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return updateBubblophyIssueAssignee({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Persists a human-authored issue plan draft for the current session.
 *
 * The client never provides an auth user ID. The action resolves the authorized
 * human session server-side, then delegates issue membership checks and event
 * writing to the plan service. It does not start an agent run.
 *
 * @param input Issue key, optional summary, and bounded plan steps.
 * @returns Structured result for the dashboard plan dialog.
 */
export async function createBubblophyIssuePlanAction(
  input: CreateBubblophyIssuePlanActionInput
): Promise<CreateBubblophyIssuePlanActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return createOrUpdateBubblophyIssuePlanDraft({
    authUserId: session.authUserId,
    issueId: input.issueId,
    summary: input.summary,
    steps: input.steps,
  });
}

/**
 * Appends a human note to a Bubblophy issue for the current session.
 *
 * The client never provides an auth user ID. The action resolves the authorized
 * human session server-side, then delegates membership, archive checks, and
 * append-only event writing to the issue note service.
 *
 * @param input Issue key and bounded note text.
 * @returns Structured result for the dashboard issue note form.
 */
export async function createBubblophyIssueNoteAction(
  input: CreateBubblophyIssueNoteActionInput
): Promise<CreateBubblophyIssueNoteActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return createBubblophyIssueNote({
    authUserId: session.authUserId,
    issueId: input.issueId,
    note: input.note,
  });
}

/**
 * Persists a human issue status transition for the current session.
 *
 * The client never provides an auth user ID. The action resolves the authorized
 * human session server-side, then delegates issue membership and audit event
 * writing to the status service. It does not start an agent run.
 *
 * @param input Issue key, target status, and optional reason.
 * @returns Structured result for the dashboard detail panel.
 */
export async function updateBubblophyIssueStatusAction(
  input: UpdateBubblophyIssueStatusActionInput
): Promise<UpdateBubblophyIssueStatusActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return updateBubblophyIssueStatus({
    issueId: input.issueId,
    expectedStatus: input.expectedStatus,
    status: input.status,
    reason: input.reason,
    authUserId: session.authUserId,
  });
}

/**
 * Persists a human issue priority change for the current session.
 *
 * The client never provides an auth user ID. The action resolves the
 * authorized human session server-side, then delegates issue membership and
 * audit event writing to the priority service. It does not start an agent run.
 *
 * @param input Issue key and target priority.
 * @returns Structured result for the dashboard detail panel.
 */
export async function updateBubblophyIssuePriorityAction(
  input: UpdateBubblophyIssuePriorityActionInput
): Promise<UpdateBubblophyIssuePriorityActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return updateBubblophyIssuePriority({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Persists a human-owned Bubblophy project for the current session.
 *
 * The client never provides an auth user ID. The action resolves the authorized
 * human session server-side, then delegates validation and duplicate handling
 * to the project create service.
 *
 * @param input Project name, key, optional description, and repository URL.
 * @returns Structured result for the dashboard project dialog.
 */
export async function createBubblophyProjectAction(
  input: CreateBubblophyProjectActionInput
): Promise<CreateBubblophyProjectActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return createBubblophyProject({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Persists human project title/description edits for this session.
 *
 * The client never provides an auth user ID. The service enforces
 * owner/maintainer roles, no-op detection, and project audit metadata.
 *
 * @param input Project key, name, and optional description.
 * @returns Structured result for project management controls.
 */
export async function updateBubblophyProjectContentAction(
  input: UpdateBubblophyProjectContentActionInput
): Promise<UpdateBubblophyProjectContentActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return updateBubblophyProjectContent({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Archives or restores a project for the current human session.
 *
 * The client never provides an auth user ID. The service enforces
 * owner/maintainer roles and writes explicit project lifecycle audit metadata.
 *
 * @param input Project key and archive lifecycle decision.
 * @returns Structured result for project management controls.
 */
export async function transitionBubblophyProjectArchiveAction(
  input: TransitionBubblophyProjectArchiveActionInput
): Promise<TransitionBubblophyProjectArchiveActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return transitionBubblophyProjectArchive({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Updates a non-owner project member role for the current human session.
 *
 * The client never provides an auth user ID. The service enforces project
 * membership, owner/maintainer roles, archived-project blocking, and audit
 * metadata without accepting profile or email data from the browser.
 *
 * @param input Project key, target member, expected role, and next role.
 * @returns Structured result for project member controls.
 */
export async function updateBubblophyProjectMemberRoleAction(
  input: UpdateBubblophyProjectMemberRoleActionInput
): Promise<UpdateBubblophyProjectMemberRoleActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return updateBubblophyProjectMemberRole({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Adds a non-owner project member for the current human session.
 *
 * The client never provides an auth user ID. The service accepts only a known
 * auth user ID and role, then enforces project membership and audit metadata.
 *
 * @param input Project key, target auth user ID, and initial non-owner role.
 * @returns Structured result for project member controls.
 */
export async function addBubblophyProjectMemberAction(
  input: AddBubblophyProjectMemberActionInput
): Promise<AddBubblophyProjectMemberActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return addBubblophyProjectMember({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Removes a non-owner project member for the current human session.
 *
 * The current schema has no soft-disable field, so the service performs a
 * guarded hard membership removal and blocks self-removal.
 *
 * @param input Project key, target member user ID, and expected role.
 * @returns Structured result for project member controls.
 */
export async function removeBubblophyProjectMemberAction(
  input: RemoveBubblophyProjectMemberActionInput
): Promise<RemoveBubblophyProjectMemberActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return removeBubblophyProjectMember({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Creates a pending project invitation for the current manager session.
 *
 * @param input Project key, email address, and invited non-owner role.
 * @returns Created invitation with a one-time token or a safe status.
 */
export async function createBubblophyProjectInvitationAction(
  input: CreateBubblophyProjectInvitationActionInput
): Promise<CreateBubblophyProjectInvitationActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return createBubblophyProjectInvitation({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Rotates an open invitation token and expiry for the current manager session.
 *
 * @param input Invitation ID and expected update time.
 * @returns Updated invitation with a new one-time token or a safe status.
 */
export async function reinviteBubblophyProjectInvitationAction(
  input: ReinviteBubblophyProjectInvitationActionInput
): Promise<ReinviteBubblophyProjectInvitationActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return reinviteBubblophyProjectInvitation({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Revokes an open invitation for the current manager session.
 *
 * @param input Invitation ID and expected update time.
 * @returns Revoked invitation reference or a safe status.
 */
export async function revokeBubblophyProjectInvitationAction(
  input: RevokeBubblophyProjectInvitationActionInput
): Promise<RevokeBubblophyProjectInvitationActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return revokeBubblophyProjectInvitation({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Reads redacted invitation metadata for the current project manager session.
 *
 * @param input Project key whose invitations should be managed.
 * @returns Manager-only snapshot without token hashes or invitation actor IDs.
 */
export async function readBubblophyProjectInvitationManagerSnapshotAction(
  input: ReadBubblophyProjectInvitationManagerSnapshotActionInput
): Promise<ReadBubblophyProjectInvitationManagerSnapshotActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return readBubblophyProjectInvitationManagerSnapshot({
    authUserId: session.authUserId,
    projectKey: input.projectKey,
  });
}

/**
 * Creates a scoped Bubblophy agent token for the current human session.
 *
 * The client never provides an auth user ID or token hash. The service
 * generates the bearer token server-side, stores only its hash, and returns the
 * plaintext exactly once for immediate copy.
 *
 * @param input Project key, label, scopes, and optional expiry.
 * @returns Structured result for the dashboard token dialog.
 */
export async function createBubblophyAgentTokenAction(
  input: CreateBubblophyAgentTokenActionInput
): Promise<CreateBubblophyAgentTokenActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return createBubblophyAgentToken({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Applies a human lifecycle decision to an agent token for this session.
 *
 * The client never provides an auth user ID. The service delegates project
 * binding, owner/maintainer checks, transition rules, and audit writing to the
 * server-only token lifecycle store.
 *
 * @param input Token ID and lifecycle decision.
 * @returns Structured result for the dashboard token controls.
 */
export async function updateBubblophyAgentTokenLifecycleAction(
  input: UpdateBubblophyAgentTokenLifecycleActionInput
): Promise<UpdateBubblophyAgentTokenLifecycleActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return updateBubblophyAgentTokenLifecycle({
    ...input,
    authUserId: session.authUserId,
  });
}

/**
 * Requests a human-controlled agent run for the current session.
 *
 * The client never provides an auth user ID. The action records a waiting run
 * request and audit event only; it does not start an agent or execute tools.
 *
 * @param input Issue key, selected token ID, and optional instructions.
 * @returns Structured result for the future dashboard run request UI.
 */
export async function requestBubblophyAgentRunAction(
  input: RequestBubblophyAgentRunActionInput
): Promise<RequestBubblophyAgentRunActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return requestBubblophyAgentRun({
    issueId: input.issueId,
    agentTokenId: input.agentTokenId,
    instructions: input.instructions,
    authUserId: session.authUserId,
  });
}

/**
 * Applies a human approve/cancel decision to a requested agent run.
 *
 * The client never provides an auth user ID. The action resolves the human
 * session server-side, delegates project membership and state-machine checks
 * to the run service, and does not start any agent execution.
 *
 * @param input Run ID and human decision.
 * @returns Structured result for the run queue.
 */
export async function transitionBubblophyAgentRunAction(
  input: TransitionBubblophyAgentRunActionInput
): Promise<TransitionBubblophyAgentRunActionResult> {
  const session = await requireBubblophySession({ nextPath: '/' });

  return transitionBubblophyAgentRun({
    ...input,
    authUserId: session.authUserId,
  });
}
