import 'server-only';

import type { db as bubblophyDb } from '@/drizzle/db';

import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { and, eq } from 'drizzle-orm';

import {
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

export type BubblophyContributorWriteTransaction = Parameters<
  Parameters<typeof bubblophyDb.transaction>[0]
>[0];

export type BubblophyIssueContributorWriteContextResult =
  | {
      status: 'ready';
      issueDatabaseId: string;
    }
  | { status: 'not_found' }
  | { status: 'forbidden' };

/**
 * Locks and authorizes one contributor write against an active issue.
 *
 * Project `SHARE` prevents archival while remaining compatible with audit
 * event foreign keys. Issue and membership `UPDATE` locks serialize mutations
 * and keep the authorization decision stable until the transaction commits.
 *
 * @param tx Active Drizzle transaction that will perform the mutation.
 * @param input Authenticated user plus parsed project key and issue number.
 * @returns Locked issue context, `not_found`, or `forbidden`.
 */
export async function lockBubblophyIssueContributorWriteContext(
  tx: BubblophyContributorWriteTransaction,
  input: {
    authUserId: string;
    projectKey: string;
    issueNumber: number;
  }
): Promise<BubblophyIssueContributorWriteContextResult> {
  const [project] = await tx
    .select({ id: bubblophyProjects.id })
    .from(bubblophyProjects)
    .where(
      and(
        eq(bubblophyProjects.key, input.projectKey),
        eq(bubblophyProjects.isArchived, false)
      )
    )
    .limit(1)
    .for('share');

  if (!project) {
    return { status: 'not_found' };
  }

  const [issue] = await tx
    .select({ id: bubblophyIssues.id })
    .from(bubblophyIssues)
    .where(
      and(
        eq(bubblophyIssues.projectId, project.id),
        eq(bubblophyIssues.issueNumber, input.issueNumber)
      )
    )
    .limit(1)
    .for('update');

  if (!issue) {
    return { status: 'not_found' };
  }

  const [membership] = await tx
    .select({ role: bubblophyProjectMembers.role })
    .from(bubblophyProjectMembers)
    .where(
      and(
        eq(bubblophyProjectMembers.projectId, project.id),
        eq(bubblophyProjectMembers.authUserId, input.authUserId)
      )
    )
    .limit(1)
    .for('update');

  if (!canContributeToBubblophyProject(membership?.role)) {
    return { status: 'forbidden' };
  }

  return {
    status: 'ready',
    issueDatabaseId: issue.id,
  };
}
