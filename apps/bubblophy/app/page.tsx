import type { DashboardAllIssuePageRequestState } from '@/lib/dashboard/all-issue-query';
import type { DashboardIssuePageRequestState } from '@/lib/dashboard/issue-query';
import type { DashboardSnapshot } from '@/lib/dashboard/types';

import { requireBubblophySession } from '@/lib/auth/session';
import { parseDashboardAllIssueQuery } from '@/lib/dashboard/all-issue-query';
import { readDashboardAllIssuePage } from '@/lib/dashboard/all-issues';
import { getBubblophyDashboardSnapshot } from '@/lib/dashboard/data';
import { parseDashboardIssueQuery } from '@/lib/dashboard/issue-query';
import {
  readDashboardIssueDetail,
  readDashboardIssuePage,
} from '@/lib/dashboard/issues';
import { parseDashboardRunCursor } from '@/lib/dashboard/run-query';
import { readDashboardRunPage } from '@/lib/dashboard/runs';
import { syncBubblophyUserProfile } from '@/lib/profiles/database-write';

import { Suspense } from 'react';

import { connection } from 'next/server';

import {
  createBubblophyAgentTokenAction,
  createBubblophyIssueAction,
  createBubblophyIssueNoteAction,
  createBubblophyIssuePlanAction,
  createBubblophyProjectAction,
  createBubblophyProjectInvitationAction,
  readBubblophyProjectInvitationManagerSnapshotAction,
  reinviteBubblophyProjectInvitationAction,
  removeBubblophyProjectMemberAction,
  requestBubblophyAgentRunAction,
  revokeBubblophyProjectInvitationAction,
  transitionBubblophyAgentRunAction,
  transitionBubblophyProjectArchiveAction,
  updateBubblophyAgentTokenLifecycleAction,
  updateBubblophyIssueAssigneeAction,
  updateBubblophyIssueContentAction,
  updateBubblophyIssuePriorityAction,
  updateBubblophyIssueStatusAction,
  updateBubblophyProjectContentAction,
  updateBubblophyProjectMemberRoleAction,
} from '@/app/actions';
import { BubblophyDashboard } from '@/components/dashboard/bubblophy-dashboard';

type BubblophyHomeSearchParams = Record<string, string | string[] | undefined>;

interface BubblophyHomeProps {
  searchParams: Promise<BubblophyHomeSearchParams>;
}

/**
 * Renders the Bubblophy MVP command center.
 *
 * The page requires an authorized human Supabase session, then renders the
 * current dashboard DTO behind the server-only data boundary.
 *
 * @returns The first human-controlled issue and agent orchestration dashboard.
 */
export default function Home({ searchParams }: BubblophyHomeProps) {
  return (
    <Suspense fallback={<BubblophyDashboardGateFallback />}>
      <ProtectedBubblophyDashboard searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Renders a minimal loading surface while the human session gate resolves.
 *
 * @returns Full-page authentication loading state.
 */
function BubblophyDashboardGateFallback() {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-6 text-foreground">
      <div className="max-w-sm space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Bubblophy prüft
        </p>
        <h1 className="text-2xl font-semibold">Session wird geprüft.</h1>
        <p className="text-sm text-muted-foreground">
          Sobald Login und Zugriff bestätigt sind, öffnet sich das
          Kontrollzentrum.
        </p>
      </div>
    </main>
  );
}

/**
 * Resolves the protected Bubblophy dashboard after the incoming request exists.
 *
 * @returns Authorized issue and agent orchestration dashboard.
 */
export async function ProtectedBubblophyDashboard({
  searchParams = Promise.resolve({}),
}: Partial<BubblophyHomeProps> = {}) {
  await connection();
  const session = await requireBubblophySession({ nextPath: '/' });

  await syncBubblophyUserProfile({
    user: session.user,
    normalizedEmail: session.email,
  }).catch(() => undefined);

  const dashboardSnapshot = await getBubblophyDashboardSnapshot({ session });
  const rawSearchParams = await searchParams;
  const selectedProjectKey = getFirstSearchParam(rawSearchParams.project)
    ?.trim()
    .toUpperCase();
  const selectedProject = dashboardSnapshot.projects.find(
    (project) => project.key === selectedProjectKey
  );
  const canReadProjectIssues =
    dashboardSnapshot.meta.dataSource === 'database' &&
    Boolean(selectedProject);
  const canReadAllIssues =
    dashboardSnapshot.meta.dataSource === 'database' && !selectedProject;
  const issueQuery = parseDashboardIssueQuery({
    query: getFirstSearchParam(rawSearchParams.q),
    status: getFirstSearchParam(rawSearchParams.status),
    priority: getFirstSearchParam(rawSearchParams.priority),
    sort: getFirstSearchParam(rawSearchParams.sort),
    after: getFirstSearchParam(rawSearchParams.after),
  });
  const allIssueQuery = parseDashboardAllIssueQuery({
    query: getFirstSearchParam(rawSearchParams.q),
    status: getFirstSearchParam(rawSearchParams.status),
    priority: getFirstSearchParam(rawSearchParams.priority),
    sort: getFirstSearchParam(rawSearchParams.sort),
    afterAt: getFirstSearchParam(rawSearchParams.allAfterAt),
    afterProject: getFirstSearchParam(rawSearchParams.allAfterProject),
    afterIssue: getFirstSearchParam(rawSearchParams.allAfterIssue),
  });
  const runCursor = parseDashboardRunCursor(
    getFirstSearchParam(rawSearchParams.runAfterAt),
    getFirstSearchParam(rawSearchParams.runAfterId)
  );
  const requestedIssueKey = getFirstSearchParam(rawSearchParams.issue)
    ?.trim()
    .toUpperCase();
  const requestedPersistedIssueKey =
    requestedIssueKey &&
    (selectedProject
      ? isPersistedIssueKeyForProject(requestedIssueKey, selectedProject.key)
      : isPersistedIssueKey(requestedIssueKey))
      ? requestedIssueKey
      : null;
  const issuePageRequest =
    canReadProjectIssues && selectedProject
      ? ({
          projectKey: selectedProject.key,
          ...issueQuery,
        } satisfies DashboardIssuePageRequestState)
      : null;
  const issuePagePromise =
    canReadProjectIssues && selectedProject
      ? readDashboardIssuePage(session.authUserId, {
          projectKey: selectedProject.key,
          sort: issueQuery.sort,
          afterIssueNumber: issueQuery.afterIssueNumber ?? undefined,
          query: issueQuery.filters.query ?? undefined,
          status: issueQuery.filters.status ?? 'all',
          priority: issueQuery.filters.priority ?? 'all',
        })
      : Promise.resolve(null);
  const allIssuePageRequest = canReadAllIssues
    ? ({ ...allIssueQuery } satisfies DashboardAllIssuePageRequestState)
    : null;
  const allIssuePagePromise = canReadAllIssues
    ? readDashboardAllIssuePage(session.authUserId, {
        sort: allIssueQuery.sort,
        after: allIssueQuery.after ?? undefined,
        query: allIssueQuery.filters.query ?? undefined,
        status: allIssueQuery.filters.status ?? 'all',
        priority: allIssueQuery.filters.priority ?? 'all',
      })
    : Promise.resolve(null);
  const runPageRequest =
    canReadProjectIssues && selectedProject
      ? { projectKey: selectedProject.key, after: runCursor }
      : null;
  const runPagePromise =
    canReadProjectIssues && selectedProject
      ? readDashboardRunPage(session.authUserId, {
          projectKey: selectedProject.key,
          after: runCursor ?? undefined,
        })
      : Promise.resolve(null);
  const requestedIssueDetailPromise =
    dashboardSnapshot.meta.dataSource === 'database' &&
    requestedPersistedIssueKey
      ? readDashboardIssueDetail(session.authUserId, {
          issueKey: requestedPersistedIssueKey,
        })
      : Promise.resolve(null);
  const [
    issuePageResult,
    allIssuePageResult,
    requestedIssueDetailResult,
    runPageResult,
  ] = await Promise.all([
    issuePagePromise,
    allIssuePagePromise,
    requestedIssueDetailPromise,
    runPagePromise,
  ]);
  const missingRequestedIssueKey =
    requestedIssueDetailResult?.status === 'not_found'
      ? requestedPersistedIssueKey
      : null;
  const firstPageIssueKey =
    issuePageResult?.status === 'success'
      ? issuePageResult.items.find(
          (issue) => issue.key !== missingRequestedIssueKey
        )?.key
      : allIssuePageResult?.status === 'success'
        ? allIssuePageResult.items.find(
            (issue) => issue.key !== missingRequestedIssueKey
          )?.key
        : undefined;
  const shouldLoadFirstPageDetail =
    !requestedIssueDetailResult ||
    requestedIssueDetailResult.status === 'not_found';
  const firstPageIssueDetailResult =
    dashboardSnapshot.meta.dataSource === 'database' &&
    firstPageIssueKey &&
    shouldLoadFirstPageDetail &&
    firstPageIssueKey !== requestedPersistedIssueKey
      ? await readDashboardIssueDetail(session.authUserId, {
          issueKey: firstPageIssueKey,
        })
      : null;
  const hasLostProjectAccess =
    issuePageResult?.status === 'not_found' ||
    runPageResult?.status === 'not_found';
  const issueDetailRequestKey = hasLostProjectAccess
    ? null
    : firstPageIssueDetailResult
      ? (firstPageIssueKey ?? null)
      : requestedPersistedIssueKey;
  const issueDetailResult = hasLostProjectAccess
    ? null
    : (firstPageIssueDetailResult ?? requestedIssueDetailResult);
  const safeDashboardSnapshot =
    hasLostProjectAccess && selectedProject
      ? redactDashboardProject(dashboardSnapshot, selectedProject.key)
      : dashboardSnapshot;

  return (
    <BubblophyDashboard
      key={
        hasLostProjectAccess && selectedProject
          ? `access-lost:${selectedProject.key}`
          : 'dashboard'
      }
      snapshot={safeDashboardSnapshot}
      deniedProjectKey={
        hasLostProjectAccess && selectedProject ? selectedProject.key : null
      }
      issuePageRequest={issuePageRequest}
      issuePageResult={issuePageResult}
      allIssuePageRequest={allIssuePageRequest}
      allIssuePageResult={allIssuePageResult}
      issueDetailRequestKey={issueDetailRequestKey}
      issueDetailResult={issueDetailResult}
      missingRequestedIssueKey={missingRequestedIssueKey}
      runPageRequest={runPageRequest}
      runPageResult={hasLostProjectAccess ? null : runPageResult}
      createIssueAction={createBubblophyIssueAction}
      updateIssueContentAction={updateBubblophyIssueContentAction}
      updateIssueAssigneeAction={updateBubblophyIssueAssigneeAction}
      createIssuePlanAction={createBubblophyIssuePlanAction}
      createIssueNoteAction={createBubblophyIssueNoteAction}
      updateIssueStatusAction={updateBubblophyIssueStatusAction}
      updateIssuePriorityAction={updateBubblophyIssuePriorityAction}
      requestAgentRunAction={requestBubblophyAgentRunAction}
      transitionAgentRunAction={transitionBubblophyAgentRunAction}
      createProjectAction={createBubblophyProjectAction}
      updateProjectContentAction={updateBubblophyProjectContentAction}
      transitionProjectArchiveAction={transitionBubblophyProjectArchiveAction}
      readProjectInvitationsAction={
        readBubblophyProjectInvitationManagerSnapshotAction
      }
      createProjectInvitationAction={createBubblophyProjectInvitationAction}
      reinviteProjectInvitationAction={reinviteBubblophyProjectInvitationAction}
      revokeProjectInvitationAction={revokeBubblophyProjectInvitationAction}
      updateProjectMemberRoleAction={updateBubblophyProjectMemberRoleAction}
      removeProjectMemberAction={removeBubblophyProjectMemberAction}
      createAgentTokenAction={createBubblophyAgentTokenAction}
      updateAgentTokenLifecycleAction={updateBubblophyAgentTokenLifecycleAction}
    />
  );
}

/** Returns the first scalar value from a Next.js search parameter. */
function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Checks whether a public numeric issue key belongs to one project. */
function isPersistedIssueKeyForProject(issueKey: string, projectKey: string) {
  const issueNumber = issueKey.slice(projectKey.length + 1);

  return (
    issueKey.startsWith(`${projectKey}-`) && /^[1-9]\d*$/.test(issueNumber)
  );
}

/** Checks whether a public issue key contains a valid project and number. */
function isPersistedIssueKey(issueKey: string) {
  return /^[A-Z0-9]{2,8}-[1-9]\d*$/.test(issueKey);
}

/** Removes every selected-project entity after the final membership gate fails. */
function redactDashboardProject(
  snapshot: DashboardSnapshot,
  projectKey: string
): DashboardSnapshot {
  const issueKeyPrefix = `${projectKey}-`;

  return {
    ...snapshot,
    projects: snapshot.projects.filter((project) => project.key !== projectKey),
    issues: snapshot.issues.filter((issue) => issue.projectKey !== projectKey),
    projectMembers: snapshot.projectMembers.filter(
      (member) => member.projectKey !== projectKey
    ),
    agentTokens: snapshot.agentTokens.filter(
      (token) => token.projectKey !== projectKey
    ),
    agentRuns: snapshot.agentRuns.filter(
      (run) => !run.issueId.startsWith(issueKeyPrefix)
    ),
    activity: snapshot.activity.filter(
      (event) =>
        event.projectKey !== projectKey &&
        !event.issueId?.startsWith(issueKeyPrefix)
    ),
  };
}
