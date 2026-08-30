import 'server-only';

import type { BubblophyProjectRole } from '@/drizzle/db/schema';
import type {
  DashboardAssigneeOption,
  DashboardAssigneeOptionsReaderResult,
  DashboardAssigneeOptionsReadInput,
  DashboardCurrentAssignee,
} from '@/lib/dashboard/assignee-options';

import { DASHBOARD_ASSIGNEE_OPTIONS_PAGE_SIZE } from '@/lib/dashboard/assignee-options';
import { canContributeToBubblophyProject } from '@/lib/projects/permissions';

import { and, asc, eq, gt, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/drizzle/db';
import {
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
  bubblophyUserProfiles,
} from '@/drizzle/db/schema';

interface AssigneeIssueContextRow {
  projectId: string;
  projectKey: string;
  projectName: string;
  projectIsArchived: boolean;
  currentUserRole: BubblophyProjectRole;
  issueId: string;
  issueNumber: number;
  assignedAuthUserId: string | null;
}

interface FinalAssigneeIssueContextRow extends AssigneeIssueContextRow {
  currentAssigneeAuthUserId: string | null;
  currentAssigneeDisplayName: string | null;
  currentAssigneeRole: BubblophyProjectRole | null;
  candidateProjectId: string | null;
  candidateAuthUserId: string | null;
  candidateDisplayName: string | null;
  candidateRole: BubblophyProjectRole | null;
  candidateCreatedAt: string | null;
}

interface AssigneeOptionRow {
  projectId: string;
  authUserId: string;
  displayName: string | null;
  role: BubblophyProjectRole;
  createdAt: string;
}

/**
 * Selects one bounded assignment-target page for an active issue.
 *
 * The final issue read refreshes the actor role, exact project/issue binding,
 * current assignment, and candidate window before any data becomes public.
 *
 * @param input Normalized actor, issue identity, query, and stable cursor.
 * @returns Success, not-found, or forbidden without leaking foreign issues.
 */
export async function selectDashboardAssigneeOptionsForUser(
  input: DashboardAssigneeOptionsReadInput
): Promise<DashboardAssigneeOptionsReaderResult> {
  const initialContext = await selectAssigneeIssueContext(input);

  if (!initialContext || initialContext.projectIsArchived) {
    return { status: 'not_found' };
  }

  if (!canContributeToBubblophyProject(initialContext.currentUserRole)) {
    return { status: 'forbidden' };
  }

  const finalRows = await selectFinalAssigneeIssueRows(
    input,
    initialContext.projectId,
    initialContext.issueId
  );
  const finalContext = finalRows[0] ?? null;

  if (!hasStableIssueBinding(initialContext, finalContext, input)) {
    return { status: 'not_found' };
  }

  if (!canContributeToBubblophyProject(finalContext.currentUserRole)) {
    return { status: 'forbidden' };
  }

  const finalCandidateRows = finalRows.flatMap(mapFinalAssigneeOption);
  const optionRows = finalCandidateRows.filter(
    (row) =>
      row.projectId === finalContext.projectId &&
      row.authUserId !== finalContext.assignedAuthUserId
  );
  const visibleRows = optionRows.slice(0, DASHBOARD_ASSIGNEE_OPTIONS_PAGE_SIZE);
  const lastRow = visibleRows.at(-1);

  return {
    status: 'success',
    project: {
      key: finalContext.projectKey,
      name: finalContext.projectName,
      currentUserRole: finalContext.currentUserRole,
    },
    issueKey: input.issueKey,
    query: input.query,
    after: input.after,
    currentAssignee: mapCurrentAssignee(finalContext),
    items: visibleRows.map(mapAssigneeOption),
    nextAfter:
      !input.query &&
      optionRows.length > DASHBOARD_ASSIGNEE_OPTIONS_PAGE_SIZE &&
      lastRow
        ? { createdAt: lastRow.createdAt, authUserId: lastRow.authUserId }
        : null,
  };
}

/** Reads the initial actor, project, issue, and assignment binding. */
async function selectAssigneeIssueContext(
  input: DashboardAssigneeOptionsReadInput
): Promise<AssigneeIssueContextRow | null> {
  const [row] = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
      issueId: bubblophyIssues.id,
      issueNumber: bubblophyIssues.issueNumber,
      assignedAuthUserId: bubblophyIssues.assignedAuthUserId,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.projectId, bubblophyProjects.id)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjects.key, input.projectKey),
        eq(bubblophyIssues.issueNumber, input.issueNumber)
      )
    )
    .limit(1)) as AssigneeIssueContextRow[];

  return row ?? null;
}

/** Builds a literal case-insensitive prefix without wildcard expansion. */
function buildLiteralPrefix(query: string) {
  const prefix = `${escapeLikePattern(query.toLowerCase())}%`;

  return prefix;
}

/** Escapes PostgreSQL LIKE wildcard characters in user-entered prefixes. */
function escapeLikePattern(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

/** Rechecks access and hydrates the final assignee/candidates in one read. */
async function selectFinalAssigneeIssueRows(
  input: DashboardAssigneeOptionsReadInput,
  projectId: string,
  issueId: string
): Promise<FinalAssigneeIssueContextRow[]> {
  const assigneeMemberships = alias(
    bubblophyProjectMembers,
    'bubblophy_assignee_option_current_membership'
  );
  const candidateMemberships = alias(
    bubblophyProjectMembers,
    'bubblophy_assignee_option_candidates'
  );
  const currentAssigneeProfiles = alias(
    bubblophyUserProfiles,
    'bubblophy_assignee_option_current_profile'
  );
  const candidateProfiles = alias(
    bubblophyUserProfiles,
    'bubblophy_assignee_option_candidate_profiles'
  );
  const candidateCondition = input.query
    ? sql`lower(${candidateMemberships.authUserId}) like ${buildLiteralPrefix(input.query)} escape '\\'`
    : input.after
      ? or(
          gt(candidateMemberships.createdAt, input.after.createdAt),
          and(
            eq(candidateMemberships.createdAt, input.after.createdAt),
            gt(candidateMemberships.authUserId, input.after.authUserId)
          )
        )
      : undefined;

  return (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
      issueId: bubblophyIssues.id,
      issueNumber: bubblophyIssues.issueNumber,
      assignedAuthUserId: bubblophyIssues.assignedAuthUserId,
      currentAssigneeAuthUserId: assigneeMemberships.authUserId,
      currentAssigneeDisplayName: currentAssigneeProfiles.displayName,
      currentAssigneeRole: assigneeMemberships.role,
      candidateProjectId: candidateMemberships.projectId,
      candidateAuthUserId: candidateMemberships.authUserId,
      candidateDisplayName: candidateProfiles.displayName,
      candidateRole: candidateMemberships.role,
      candidateCreatedAt: candidateMemberships.createdAt,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .innerJoin(
      bubblophyIssues,
      eq(bubblophyIssues.projectId, bubblophyProjects.id)
    )
    .leftJoin(
      assigneeMemberships,
      and(
        eq(assigneeMemberships.projectId, bubblophyProjects.id),
        eq(assigneeMemberships.authUserId, bubblophyIssues.assignedAuthUserId)
      )
    )
    .leftJoin(
      currentAssigneeProfiles,
      eq(currentAssigneeProfiles.authUserId, assigneeMemberships.authUserId)
    )
    .leftJoin(
      candidateMemberships,
      and(
        eq(candidateMemberships.projectId, bubblophyProjects.id),
        candidateCondition
      )
    )
    .leftJoin(
      candidateProfiles,
      eq(candidateProfiles.authUserId, candidateMemberships.authUserId)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjects.id, projectId),
        eq(bubblophyProjects.key, input.projectKey),
        eq(bubblophyIssues.id, issueId),
        eq(bubblophyIssues.issueNumber, input.issueNumber)
      )
    )
    .orderBy(
      input.query
        ? asc(sql`lower(${candidateMemberships.authUserId})`)
        : asc(candidateMemberships.createdAt),
      asc(candidateMemberships.authUserId)
    )
    .limit(
      DASHBOARD_ASSIGNEE_OPTIONS_PAGE_SIZE + 2
    )) as FinalAssigneeIssueContextRow[];
}

/** Checks final project, issue, active-state, and public-key stability. */
function hasStableIssueBinding(
  initial: AssigneeIssueContextRow,
  final: FinalAssigneeIssueContextRow | null,
  input: DashboardAssigneeOptionsReadInput
): final is FinalAssigneeIssueContextRow {
  return Boolean(
    final &&
    !final.projectIsArchived &&
    final.projectId === initial.projectId &&
    final.projectKey === initial.projectKey &&
    final.projectKey === input.projectKey &&
    final.issueId === initial.issueId &&
    final.issueNumber === initial.issueNumber &&
    final.issueNumber === input.issueNumber
  );
}

/** Maps a current project member into the public assignment option. */
function mapAssigneeOption(row: AssigneeOptionRow): DashboardAssigneeOption {
  return {
    authUserId: row.authUserId,
    label: row.displayName ?? row.authUserId,
    role: row.role,
  };
}

/** Maps one final candidate row, omitting members removed before the final read. */
function mapFinalAssigneeOption(
  row: FinalAssigneeIssueContextRow
): AssigneeOptionRow[] {
  if (
    !row.candidateProjectId ||
    !row.candidateAuthUserId ||
    !row.candidateRole ||
    !row.candidateCreatedAt
  ) {
    return [];
  }

  return [
    {
      projectId: row.candidateProjectId,
      authUserId: row.candidateAuthUserId,
      displayName: row.candidateDisplayName,
      role: row.candidateRole,
      createdAt: row.candidateCreatedAt,
    },
  ];
}

/** Maps the final persisted assignment, including dangling memberships. */
function mapCurrentAssignee(
  context: FinalAssigneeIssueContextRow
): DashboardCurrentAssignee | null {
  if (!context.assignedAuthUserId) {
    return null;
  }

  if (
    context.currentAssigneeAuthUserId === context.assignedAuthUserId &&
    context.currentAssigneeRole
  ) {
    return {
      authUserId: context.assignedAuthUserId,
      label: context.currentAssigneeDisplayName ?? context.assignedAuthUserId,
      role: context.currentAssigneeRole,
      isCurrentMember: true,
    };
  }

  return {
    authUserId: context.assignedAuthUserId,
    label: 'Ehemaliges Projektmitglied',
    role: null,
    isCurrentMember: false,
  };
}
