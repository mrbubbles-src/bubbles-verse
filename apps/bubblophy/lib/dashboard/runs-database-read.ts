import 'server-only';

import type {
  BubblophyAgentRunState,
  BubblophyProjectRole,
  JsonValue,
} from '@/drizzle/db/schema';
import type {
  DashboardRunPage,
  DashboardRunPageReadInput,
} from '@/lib/dashboard/runs';

import { DASHBOARD_RUN_PAGE_SIZE } from '@/lib/dashboard/runs';
import {
  buildSafeAgentRunResultSummary,
  formatBubblophyIssueKey,
} from '@/lib/issues/repository';

import { and, desc, eq, lt, or } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  bubblophyAgentRuns,
  bubblophyAgentTokens,
  bubblophyIssues,
  bubblophyProjectMembers,
  bubblophyProjects,
} from '@/drizzle/db/schema';

interface DashboardRunProjectRow {
  projectId: string;
  projectKey: string;
  projectName: string;
  projectIsArchived: boolean;
  currentUserRole: BubblophyProjectRole;
}

interface DashboardRunPageRow extends DashboardRunProjectRow {
  id: string;
  issueNumber: number;
  agentLabel: string;
  state: BubblophyAgentRunState;
  updatedAt: string;
  result: JsonValue | null;
}

/**
 * Selects one newest-first run page through current project membership.
 *
 * The second statement rebinds every returned run to membership, project,
 * issue, and token. An additional membership read proves legitimate emptiness.
 *
 * @param input Normalized actor, project key, and optional stable cursor.
 * @returns Public run page without project, issue, token, or actor IDs.
 */
export async function selectDashboardRunPageForUser(
  input: DashboardRunPageReadInput
): Promise<DashboardRunPage | null> {
  const candidateProject = await selectRunProject(
    input.authUserId,
    input.projectKey
  );

  if (!candidateProject) {
    return null;
  }

  const cursorCondition = input.after
    ? or(
        lt(bubblophyAgentRuns.updatedAt, input.after.updatedAt),
        and(
          eq(bubblophyAgentRuns.updatedAt, input.after.updatedAt),
          lt(bubblophyAgentRuns.id, input.after.id)
        )
      )
    : undefined;
  const rows = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
      id: bubblophyAgentRuns.id,
      issueNumber: bubblophyIssues.issueNumber,
      agentLabel: bubblophyAgentTokens.label,
      state: bubblophyAgentRuns.state,
      updatedAt: bubblophyAgentRuns.updatedAt,
      result: bubblophyAgentRuns.result,
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
    .innerJoin(
      bubblophyAgentRuns,
      eq(bubblophyAgentRuns.issueId, bubblophyIssues.id)
    )
    .innerJoin(
      bubblophyAgentTokens,
      and(
        eq(bubblophyAgentTokens.id, bubblophyAgentRuns.agentTokenId),
        eq(bubblophyAgentTokens.projectId, bubblophyProjects.id)
      )
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, input.authUserId),
        eq(bubblophyProjects.id, candidateProject.projectId),
        eq(bubblophyProjects.key, candidateProject.projectKey),
        cursorCondition
      )
    )
    .orderBy(desc(bubblophyAgentRuns.updatedAt), desc(bubblophyAgentRuns.id))
    .limit(DASHBOARD_RUN_PAGE_SIZE + 1)) as DashboardRunPageRow[];

  const currentProject = rows[0]
    ? mapRunProject(rows[0])
    : await selectRunProject(input.authUserId, candidateProject.projectKey);

  if (
    !currentProject ||
    currentProject.projectId !== candidateProject.projectId ||
    currentProject.projectKey !== input.projectKey
  ) {
    return null;
  }

  const visibleRows = rows.slice(0, DASHBOARD_RUN_PAGE_SIZE);
  const lastRow = visibleRows.at(-1);

  return {
    project: {
      key: currentProject.projectKey,
      name: currentProject.projectName,
      isArchived: currentProject.projectIsArchived,
      currentUserRole: currentProject.currentUserRole,
    },
    items: visibleRows.map((row) => ({
      id: row.id,
      issueKey: formatBubblophyIssueKey(row.projectKey, row.issueNumber),
      agentLabel: row.agentLabel,
      state: row.state,
      updatedAt: row.updatedAt,
      resultSummary: buildSafeAgentRunResultSummary(row.result) ?? null,
    })),
    nextAfter:
      rows.length > DASHBOARD_RUN_PAGE_SIZE && lastRow
        ? { updatedAt: lastRow.updatedAt, id: lastRow.id }
        : null,
  };
}

/** Reads current project membership and public project metadata. */
async function selectRunProject(authUserId: string, projectKey: string) {
  const [row] = (await db
    .select({
      projectId: bubblophyProjects.id,
      projectKey: bubblophyProjects.key,
      projectName: bubblophyProjects.name,
      projectIsArchived: bubblophyProjects.isArchived,
      currentUserRole: bubblophyProjectMembers.role,
    })
    .from(bubblophyProjectMembers)
    .innerJoin(
      bubblophyProjects,
      eq(bubblophyProjects.id, bubblophyProjectMembers.projectId)
    )
    .where(
      and(
        eq(bubblophyProjectMembers.authUserId, authUserId),
        eq(bubblophyProjects.key, projectKey)
      )
    )
    .limit(1)) as DashboardRunProjectRow[];

  return row ?? null;
}

/** Copies shared project fields from one membership-bound run row. */
function mapRunProject(row: DashboardRunPageRow): DashboardRunProjectRow {
  return {
    projectId: row.projectId,
    projectKey: row.projectKey,
    projectName: row.projectName,
    projectIsArchived: row.projectIsArchived,
    currentUserRole: row.currentUserRole,
  };
}
