'use server';

import type {
  CreateBubblophyIssueDraftInput,
  CreateBubblophyIssueDraftResult,
} from '@/lib/issues/create';

import { requireBubblophySession } from '@/lib/auth/session';
import { createBubblophyIssueDraft } from '@/lib/issues/create';

export type CreateBubblophyIssueActionInput = Omit<
  CreateBubblophyIssueDraftInput,
  'authUserId'
>;

export type CreateBubblophyIssueActionResult = CreateBubblophyIssueDraftResult;

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
