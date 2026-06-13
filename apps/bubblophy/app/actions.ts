'use server';

import type {
  CreateBubblophyAgentTokenInput,
  CreateBubblophyAgentTokenResult,
} from '@/lib/agent-tokens/create';
import type {
  CreateBubblophyIssueDraftInput,
  CreateBubblophyIssueDraftResult,
} from '@/lib/issues/create';
import type {
  CreateOrUpdateBubblophyIssuePlanDraftInput,
  CreateOrUpdateBubblophyIssuePlanDraftResult,
} from '@/lib/issues/plans';
import type {
  CreateBubblophyProjectInput,
  CreateBubblophyProjectResult,
} from '@/lib/projects/create';

import { createBubblophyAgentToken } from '@/lib/agent-tokens/create';
import { requireBubblophySession } from '@/lib/auth/session';
import { createBubblophyIssueDraft } from '@/lib/issues/create';
import { createOrUpdateBubblophyIssuePlanDraft } from '@/lib/issues/plans';
import { createBubblophyProject } from '@/lib/projects/create';

export type CreateBubblophyIssueActionInput = Omit<
  CreateBubblophyIssueDraftInput,
  'authUserId'
>;

export type CreateBubblophyIssueActionResult = CreateBubblophyIssueDraftResult;

export type CreateBubblophyIssuePlanActionInput = Omit<
  CreateOrUpdateBubblophyIssuePlanDraftInput,
  'authUserId'
>;

export type CreateBubblophyIssuePlanActionResult =
  CreateOrUpdateBubblophyIssuePlanDraftResult;

export type CreateBubblophyProjectActionInput = Omit<
  CreateBubblophyProjectInput,
  'authUserId'
>;

export type CreateBubblophyProjectActionResult = CreateBubblophyProjectResult;

export type CreateBubblophyAgentTokenActionInput = Omit<
  CreateBubblophyAgentTokenInput,
  'authUserId'
>;

export type CreateBubblophyAgentTokenActionResult =
  CreateBubblophyAgentTokenResult;

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
