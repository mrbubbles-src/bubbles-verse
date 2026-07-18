import 'server-only';

import type { db as bubblophyDb } from '@/drizzle/db';

import {
  lockBubblophyProjectForHumanWrite,
  lockBubblophyProjectMembersForHumanWrite,
} from '@/lib/projects/human-write-locks-database';
import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { and, eq } from 'drizzle-orm';

import { bubblophyIssues } from '@/drizzle/db/schema';

export type BubblophyContributorWriteTransaction = Parameters<
  Parameters<typeof bubblophyDb.transaction>[0]
>[0];

export type BubblophyIssueContributorWriteContextResult =
  | {
      status: 'ready';
      issueDatabaseId: string;
      projectId: string;
      projectKey: string;
      memberships: Awaited<
        ReturnType<typeof lockBubblophyProjectMembersForHumanWrite>
      >;
    }
  | { status: 'not_found' }
  | { status: 'forbidden' };

/**
 * Locks and authorizes one contributor write against an active issue.
 *
 * Project `SHARE` prevents archival while remaining compatible with audit
 * event foreign keys. Issue `NO KEY UPDATE` serializes non-key mutations while
 * remaining compatible with the audit event's implicit foreign-key lock.
 * Actor and optional related memberships are locked in one stable `UPDATE`
 * order so authorization and assignment targets remain valid until commit.
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
    relatedAuthUserIds?: string[];
  }
): Promise<BubblophyIssueContributorWriteContextResult> {
  const project = await lockBubblophyProjectForHumanWrite(tx, {
    project: { key: input.projectKey },
    lockMode: 'share',
  });

  if (!project || project.isArchived) {
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
    .for('no key update');

  if (!issue) {
    return { status: 'not_found' };
  }

  const actorAuthUserId = input.authUserId.trim();
  const memberships = await lockBubblophyProjectMembersForHumanWrite(tx, {
    projectId: project.id,
    authUserIds: [actorAuthUserId, ...(input.relatedAuthUserIds ?? [])],
  });
  const actorMembership = memberships.find(
    (membership) => membership.authUserId === actorAuthUserId
  );

  if (!canContributeToBubblophyProject(actorMembership?.role)) {
    return { status: 'forbidden' };
  }

  return {
    status: 'ready',
    issueDatabaseId: issue.id,
    projectId: project.id,
    projectKey: project.key,
    memberships,
  };
}
