'use server';

import type {
  CreateBubblophyIssueDraftInput,
  CreateBubblophyIssueDraftResult,
} from '@/lib/issues/create';
import type {
  CreateBubblophyProjectInput,
  CreateBubblophyProjectResult,
} from '@/lib/projects/create';

import { requireBubblophySession } from '@/lib/auth/session';
import { createBubblophyIssueDraft } from '@/lib/issues/create';
import { createBubblophyProject } from '@/lib/projects/create';

export type CreateBubblophyIssueActionInput = Omit<
  CreateBubblophyIssueDraftInput,
  'authUserId'
>;

export type CreateBubblophyIssueActionResult = CreateBubblophyIssueDraftResult;

export type CreateBubblophyProjectActionInput = Omit<
  CreateBubblophyProjectInput,
  'authUserId'
>;

export type CreateBubblophyProjectActionResult = CreateBubblophyProjectResult;

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
