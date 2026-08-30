'use client';

import type {
  CreateBubblophyAgentTokenActionInput,
  CreateBubblophyAgentTokenActionResult,
  CreateBubblophyIssueActionInput,
  CreateBubblophyIssueActionResult,
  CreateBubblophyIssueNoteActionInput,
  CreateBubblophyIssueNoteActionResult,
  CreateBubblophyIssuePlanActionInput,
  CreateBubblophyIssuePlanActionResult,
  CreateBubblophyProjectActionInput,
  CreateBubblophyProjectActionResult,
  CreateBubblophyProjectInvitationActionInput,
  CreateBubblophyProjectInvitationActionResult,
  ReadBubblophyIssueAssigneeOptionsActionInput,
  ReadBubblophyIssueAssigneeOptionsActionResult,
  ReadBubblophyProjectInvitationManagerSnapshotActionResult,
  ReadBubblophyRunTargetOptionsActionInput,
  ReadBubblophyRunTargetOptionsActionResult,
  ReinviteBubblophyProjectInvitationActionInput,
  ReinviteBubblophyProjectInvitationActionResult,
  RemoveBubblophyProjectMemberActionInput,
  RemoveBubblophyProjectMemberActionResult,
  RequestBubblophyAgentRunActionInput,
  RequestBubblophyAgentRunActionResult,
  RevokeBubblophyProjectInvitationActionInput,
  RevokeBubblophyProjectInvitationActionResult,
  TransitionBubblophyAgentRunActionInput,
  TransitionBubblophyAgentRunActionResult,
  TransitionBubblophyProjectArchiveActionInput,
  TransitionBubblophyProjectArchiveActionResult,
  UpdateBubblophyAgentTokenLifecycleActionInput,
  UpdateBubblophyAgentTokenLifecycleActionResult,
  UpdateBubblophyIssueAssigneeActionInput,
  UpdateBubblophyIssueAssigneeActionResult,
  UpdateBubblophyIssueContentActionInput,
  UpdateBubblophyIssueContentActionResult,
  UpdateBubblophyIssuePriorityActionInput,
  UpdateBubblophyIssuePriorityActionResult,
  UpdateBubblophyIssueStatusActionInput,
  UpdateBubblophyIssueStatusActionResult,
  UpdateBubblophyProjectContentActionInput,
  UpdateBubblophyProjectContentActionResult,
  UpdateBubblophyProjectMemberRoleActionInput,
  UpdateBubblophyProjectMemberRoleActionResult,
} from '@/app/actions';
import type {
  DashboardActivityCursor,
  DashboardActivityKind,
  DashboardActivityPageItem,
  ReadDashboardActivityPageResult,
} from '@/lib/dashboard/activity';
import type { DashboardActivityPageRequestState } from '@/lib/dashboard/activity-query';
import type { DashboardAllIssuePageRequestState } from '@/lib/dashboard/all-issue-query';
import type {
  DashboardAllIssueCursor,
  ReadDashboardAllIssuePageResult,
} from '@/lib/dashboard/all-issues';
import type {
  DashboardIssuePageRequestState,
  DashboardIssueQueryPatch,
} from '@/lib/dashboard/issue-query';
import type { DashboardProjectAccess } from '@/lib/dashboard/issue-view';
import type {
  ReadDashboardIssueDetailResult,
  ReadDashboardIssuePageResult,
} from '@/lib/dashboard/issues';
import type {
  DashboardMemberCursor,
  DashboardMemberPageRequestState,
} from '@/lib/dashboard/member-query';
import type { ReadDashboardMemberPageResult } from '@/lib/dashboard/members';
import type {
  DashboardRunCursor,
  DashboardRunPageRequestState,
} from '@/lib/dashboard/run-query';
import type { ReadDashboardRunPageResult } from '@/lib/dashboard/runs';
import type {
  AgentRunState,
  AgentRunSummary,
  AgentTokenState,
  AgentTokenSummary,
  DashboardSnapshot,
  IssueNoteSummary,
  IssuePriority,
  IssueStatus,
  IssueSummary,
  ProjectHealth,
  ProjectMemberRole,
  ProjectMemberSummary,
  ProjectSummary,
} from '@/lib/dashboard/types';
import type { KeyboardEvent } from 'react';

import {
  clearDashboardActivityCursor,
  isDashboardActivityPageRequestCurrent,
  parseDashboardActivityQuery,
  setDashboardActivityKindParams,
  setDashboardActivityPageParams,
  writeDashboardActivityQueryParams,
} from '@/lib/dashboard/activity-query';
import {
  isDashboardAllIssuePageRequestCurrent,
  parseDashboardAllIssueQuery,
  patchDashboardAllIssueQueryParams,
  setDashboardAllIssuePageParams,
  writeDashboardAllIssueQueryParams,
} from '@/lib/dashboard/all-issue-query';
import {
  isDashboardIssuePageRequestCurrent,
  parseDashboardIssueQuery,
  patchDashboardIssueQueryParams,
  setDashboardIssuePageParams,
  writeDashboardIssueQueryParams,
} from '@/lib/dashboard/issue-query';
import {
  combineDashboardProjectAccess,
  mapDashboardAllIssuePageToSummaries,
  mapDashboardIssueDetailToSummary,
  mapDashboardIssuePageToSummaries,
  matchesDashboardIssueQuery,
} from '@/lib/dashboard/issue-view';
import {
  agentRunStateLabels,
  agentTokenStateLabels,
  issuePriorityLabels,
  issueStatusLabels,
  projectHealthLabels,
} from '@/lib/dashboard/labels';
import {
  isDashboardMemberPageRequestCurrent,
  parseDashboardMemberCursor,
  setDashboardMemberPageParams,
} from '@/lib/dashboard/member-query';
import { getIssueReadinessPercent } from '@/lib/dashboard/metrics';
import {
  isDashboardRunPageRequestCurrent,
  parseDashboardRunCursor,
  setDashboardRunPageParams,
} from '@/lib/dashboard/run-query';
import { mapDashboardRunPageToSummaries } from '@/lib/dashboard/run-view';
import { DASHBOARD_ISSUE_NOTE_LIMIT } from '@/lib/dashboard/types';
import {
  canContributeToBubblophyProject,
  canManageBubblophyProject,
} from '@/lib/projects/permissions';
import { projectMemberRoleLabels } from '@/lib/projects/role-presentation';
import { bubblophySidebarData, getBubblophyBreadcrumbs } from '@/lib/sidebar';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { BubblesAppHeader } from '@bubbles/ui/components/bubbles-app-header';
import { BubblesSidebarLayout } from '@bubbles/ui/components/bubbles-sidebar-layout';
import {
  Add01Icon,
  AlertCircleIcon,
  CheckListIcon,
  DashboardSquare01Icon,
  FlashIcon,
  Folder01Icon,
  HugeiconsIcon,
  UserGroupIcon,
} from '@bubbles/ui/lib/hugeicons';
import { Badge } from '@bubbles/ui/shadcn/badge';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bubbles/ui/shadcn/dialog';
import { Input } from '@bubbles/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bubbles/ui/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bubbles/ui/shadcn/table';
import { Textarea } from '@bubbles/ui/shadcn/textarea';

import { IssueAssigneeOptionPicker } from '@/components/dashboard/issue-assignee/issue-assignee-option-picker';
import { IssueQueueControls } from '@/components/dashboard/issue-queue/issue-queue-controls';
import { ProjectInvitationManager } from '@/components/dashboard/project-invitations/project-invitation-manager';
import { ProjectRoleGuide } from '@/components/dashboard/project-members/project-role-guide';
import { RunTargetOptionPicker } from '@/components/dashboard/run-target/run-target-option-picker';

interface BubblophyDashboardProps {
  snapshot: DashboardSnapshot;
  deniedProjectKey?: string | null;
  allIssuePageRequest?: DashboardAllIssuePageRequestState | null;
  allIssuePageResult?: ReadDashboardAllIssuePageResult | null;
  issuePageRequest?: DashboardIssuePageRequestState | null;
  issuePageResult?: ReadDashboardIssuePageResult | null;
  issueDetailRequestKey?: string | null;
  issueDetailResult?: ReadDashboardIssueDetailResult | null;
  missingRequestedIssueKey?: string | null;
  runPageRequest?: DashboardRunPageRequestState | null;
  runPageResult?: ReadDashboardRunPageResult | null;
  memberPageRequest?: DashboardMemberPageRequestState | null;
  memberPageResult?: ReadDashboardMemberPageResult | null;
  activityPageRequest?: DashboardActivityPageRequestState | null;
  activityPageResult?: ReadDashboardActivityPageResult | null;
  createIssueAction?: (
    input: CreateBubblophyIssueActionInput
  ) => Promise<CreateBubblophyIssueActionResult>;
  updateIssueContentAction?: (
    input: UpdateBubblophyIssueContentActionInput
  ) => Promise<UpdateBubblophyIssueContentActionResult>;
  updateIssueAssigneeAction?: (
    input: UpdateBubblophyIssueAssigneeActionInput
  ) => Promise<UpdateBubblophyIssueAssigneeActionResult>;
  readIssueAssigneeOptionsAction?: (
    input: ReadBubblophyIssueAssigneeOptionsActionInput
  ) => Promise<ReadBubblophyIssueAssigneeOptionsActionResult>;
  readRunTargetOptionsAction?: (
    input: ReadBubblophyRunTargetOptionsActionInput
  ) => Promise<ReadBubblophyRunTargetOptionsActionResult>;
  createIssuePlanAction?: (
    input: CreateBubblophyIssuePlanActionInput
  ) => Promise<CreateBubblophyIssuePlanActionResult>;
  createIssueNoteAction?: (
    input: CreateBubblophyIssueNoteActionInput
  ) => Promise<CreateBubblophyIssueNoteActionResult>;
  updateIssueStatusAction?: (
    input: UpdateBubblophyIssueStatusActionInput
  ) => Promise<UpdateBubblophyIssueStatusActionResult>;
  updateIssuePriorityAction?: (
    input: UpdateBubblophyIssuePriorityActionInput
  ) => Promise<UpdateBubblophyIssuePriorityActionResult>;
  requestAgentRunAction?: (
    input: RequestBubblophyAgentRunActionInput
  ) => Promise<RequestBubblophyAgentRunActionResult>;
  transitionAgentRunAction?: (
    input: TransitionBubblophyAgentRunActionInput
  ) => Promise<TransitionBubblophyAgentRunActionResult>;
  createProjectAction?: (
    input: CreateBubblophyProjectActionInput
  ) => Promise<CreateBubblophyProjectActionResult>;
  updateProjectContentAction?: (
    input: UpdateBubblophyProjectContentActionInput
  ) => Promise<UpdateBubblophyProjectContentActionResult>;
  transitionProjectArchiveAction?: (
    input: TransitionBubblophyProjectArchiveActionInput
  ) => Promise<TransitionBubblophyProjectArchiveActionResult>;
  readProjectInvitationsAction?: (input: {
    projectKey: string;
  }) => Promise<ReadBubblophyProjectInvitationManagerSnapshotActionResult>;
  createProjectInvitationAction?: (
    input: CreateBubblophyProjectInvitationActionInput
  ) => Promise<CreateBubblophyProjectInvitationActionResult>;
  reinviteProjectInvitationAction?: (
    input: ReinviteBubblophyProjectInvitationActionInput
  ) => Promise<ReinviteBubblophyProjectInvitationActionResult>;
  revokeProjectInvitationAction?: (
    input: RevokeBubblophyProjectInvitationActionInput
  ) => Promise<RevokeBubblophyProjectInvitationActionResult>;
  updateProjectMemberRoleAction?: (
    input: UpdateBubblophyProjectMemberRoleActionInput
  ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>;
  removeProjectMemberAction?: (
    input: RemoveBubblophyProjectMemberActionInput
  ) => Promise<RemoveBubblophyProjectMemberActionResult>;
  createAgentTokenAction?: (
    input: CreateBubblophyAgentTokenActionInput
  ) => Promise<CreateBubblophyAgentTokenActionResult>;
  updateAgentTokenLifecycleAction?: (
    input: UpdateBubblophyAgentTokenLifecycleActionInput
  ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>;
}

const issueStatusVariant = {
  triage: 'outline',
  geplant: 'secondary',
  bereit: 'published',
  in_arbeit: 'default',
  review: 'draft',
  blockiert: 'destructive',
  erledigt: 'secondary',
} satisfies Record<IssueStatus, React.ComponentProps<typeof Badge>['variant']>;

const issuePriorityVariant = {
  niedrig: 'outline',
  mittel: 'secondary',
  hoch: 'destructive',
} satisfies Record<
  IssuePriority,
  React.ComponentProps<typeof Badge>['variant']
>;

const healthVariant = {
  stabil: 'published',
  aufmerksam: 'draft',
  blockiert: 'destructive',
} satisfies Record<
  ProjectHealth,
  React.ComponentProps<typeof Badge>['variant']
>;

const tokenVariant = {
  aktiv: 'published',
  pausiert: 'secondary',
  widerrufen: 'destructive',
  abgelaufen: 'draft',
} satisfies Record<
  AgentTokenState,
  React.ComponentProps<typeof Badge>['variant']
>;

const projectMemberRoleVariant = {
  owner: 'default',
  maintainer: 'published',
  member: 'secondary',
  viewer: 'outline',
} satisfies Record<
  ProjectMemberRole,
  React.ComponentProps<typeof Badge>['variant']
>;

const mutableProjectMemberRoles = [
  'maintainer',
  'member',
  'viewer',
] satisfies ProjectMemberRole[];

const runVariant = {
  wartet: 'draft',
  freigegeben: 'published',
  läuft: 'default',
  review: 'secondary',
  abgeschlossen: 'published',
  abgebrochen: 'secondary',
  fehlgeschlagen: 'destructive',
} satisfies Record<
  AgentRunState,
  React.ComponentProps<typeof Badge>['variant']
>;

type ProjectFilterKey = 'all' | string;

type IssuePageStatus =
  | ReadDashboardIssuePageResult['status']
  | ReadDashboardAllIssuePageResult['status']
  | 'loading';

type MemberPageStatus = ReadDashboardMemberPageResult['status'] | 'loading';

type DashboardIssue = IssueSummary | LocalDraftIssue;

/** Merges issue sources by stable public key while preserving source order. */
function mergeIssuesById(...sources: IssueSummary[][]) {
  const issuesById = new Map<string, IssueSummary>();

  for (const source of sources) {
    for (const issue of source) {
      issuesById.set(issue.id, issue);
    }
  }

  return [...issuesById.values()];
}

/**
 * Merges run summaries by public run ID while preserving source precedence.
 *
 * @param sources Ordered run groups with the authoritative group first.
 * @returns Deduplicated run summaries in stable source order.
 */
function mergeAgentRunsById(...sources: AgentRunSummary[][]) {
  const runsById = new Map<string, AgentRunSummary>();

  for (const source of sources) {
    for (const run of source) {
      if (!runsById.has(run.id)) {
        runsById.set(run.id, run);
      }
    }
  }

  return [...runsById.values()];
}

type LocalDraftIssue = IssueSummary & {
  createdLabel: string;
  description: string;
  isLocalDraft: true;
};

interface LocalDraftIssueInput {
  description: string;
  priority: IssuePriority;
  projectKey: string;
  title: string;
}

interface PersistedIssueInput {
  description: string;
  priority: IssuePriority;
  projectKey: string;
  title: string;
}

type IssuePlanDraft = Extract<
  CreateBubblophyIssuePlanActionResult,
  { status: 'created' }
>['plan'];

interface PersistedProjectInput {
  description: string;
  key: string;
  name: string;
  repositoryUrl: string;
}

type CreatedAgentToken = Extract<
  CreateBubblophyAgentTokenActionResult,
  { status: 'created' }
>['token'];

const agentTokenScopeOptions = [
  'projects:read',
  'issues:read',
  'issues:write',
  'plans:write',
  'runs:create',
  'runs:update',
];

const agentUpdateableRunStates: readonly AgentRunState[] = [
  'freigegeben',
  'läuft',
  'review',
];

/**
 * Checks whether an issue row is a local-only draft.
 *
 * @param issue Dashboard issue row from sample data or local draft state.
 * @returns True when the issue is a local draft.
 */
function isLocalDraftIssue(issue: DashboardIssue): issue is LocalDraftIssue {
  return 'isLocalDraft' in issue && issue.isLocalDraft;
}

/**
 * Returns the project metric contribution for one issue status.
 *
 * Completed issues remain visible but do not contribute to open-work metrics.
 *
 * @param status Dashboard issue status.
 * @returns Counter contribution for project issue metrics.
 */
function getIssueStatusMetricContribution(status: IssueStatus) {
  return {
    openIssues: status === 'erledigt' ? 0 : 1,
    readyIssues: status === 'bereit' ? 1 : 0,
    blockedIssues: status === 'blockiert' ? 1 : 0,
  };
}

/**
 * Converts a reloaded issue's latest plan into the local plan DTO shape.
 *
 * @param issue Dashboard issue from the loaded snapshot.
 * @returns Plan DTO with issue ID, or `undefined` when no plan exists.
 */
function getPersistedIssuePlanDraft(
  issue: Pick<IssueSummary, 'id' | 'latestPlan'>
): IssuePlanDraft | undefined {
  if (!issue.latestPlan) {
    return undefined;
  }

  return {
    issueId: issue.id,
    version: issue.latestPlan.version,
    summary: issue.latestPlan.summary,
    steps: issue.latestPlan.steps,
  };
}

/**
 * Normalizes the project query parameter against visible projects.
 *
 * @param projectKey Raw query parameter value.
 * @param projects Visible project summaries.
 * @returns A safe project filter key.
 */
function getInitialProjectFilterKey(
  projectKey: string | null,
  projects: ProjectSummary[]
): ProjectFilterKey {
  if (!projectKey || projectKey === 'all') {
    return 'all';
  }

  const normalizedProjectKey = projectKey.trim().toUpperCase();

  return projects.some((project) => project.key === normalizedProjectKey)
    ? normalizedProjectKey
    : 'all';
}

/**
 * Resolves the initial issue selection from query parameters and data.
 *
 * @param input Query issue ID, project filter, and current issues.
 * @returns A visible issue ID, or an empty string when none exists.
 */
function getInitialIssueSelection(input: {
  issueId: string | null;
  projectKey: ProjectFilterKey;
  issues: IssueSummary[];
}) {
  const normalizedIssueId = input.issueId?.trim().toUpperCase() ?? '';
  const visibleIssues =
    input.projectKey === 'all'
      ? input.issues
      : input.issues.filter((issue) => issue.projectKey === input.projectKey);
  const queriedIssue = visibleIssues.find(
    (issue) => issue.id === normalizedIssueId
  );

  return queriedIssue?.id ?? visibleIssues[0]?.id ?? '';
}

/**
 * Builds the dashboard href for persisted project and issue selection.
 *
 * @param pathname Current route path.
 * @param searchParams Current query parameters.
 * @param projectKey Selected project filter.
 * @param issueId Selected issue ID.
 * @returns Route href with selection encoded as query parameters.
 */
function buildSelectionHref({
  pathname,
  searchParams,
  projectKey,
  issueId,
}: {
  pathname: string;
  searchParams: URLSearchParams;
  projectKey: ProjectFilterKey;
  issueId: string;
}) {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (projectKey === 'all') {
    nextParams.delete('project');
  } else {
    nextParams.set('project', projectKey);
  }

  if (issueId) {
    nextParams.set('issue', issueId);
  } else {
    nextParams.delete('issue');
  }

  const query = nextParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

/** Builds a dashboard href from already-normalized search parameters. */
function buildDashboardHref(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Applies successful local status updates to project summaries.
 *
 * @param projects Project summaries from the latest snapshot and client inserts.
 * @param baseIssues Persisted issues before local status overlays.
 * @param updatedIssuesById Issue summaries returned from successful status writes.
 * @returns Project summaries with deterministic local status deltas.
 */
function applyIssueStatusMetricOverlays({
  projects,
  baseIssues,
  updatedIssuesById,
}: {
  projects: ProjectSummary[];
  baseIssues: IssueSummary[];
  updatedIssuesById: Record<string, IssueSummary>;
}) {
  const baseIssuesById = new Map(baseIssues.map((issue) => [issue.id, issue]));
  const deltasByProjectKey = new Map<
    string,
    Pick<ProjectSummary, 'openIssues' | 'readyIssues' | 'blockedIssues'>
  >();

  for (const updatedIssue of Object.values(updatedIssuesById)) {
    const baseIssue = baseIssuesById.get(updatedIssue.id);

    if (
      !baseIssue ||
      baseIssue.projectKey !== updatedIssue.projectKey ||
      baseIssue.status === updatedIssue.status
    ) {
      continue;
    }

    const previous = getIssueStatusMetricContribution(baseIssue.status);
    const next = getIssueStatusMetricContribution(updatedIssue.status);
    const currentDelta = deltasByProjectKey.get(updatedIssue.projectKey) ?? {
      openIssues: 0,
      readyIssues: 0,
      blockedIssues: 0,
    };

    deltasByProjectKey.set(updatedIssue.projectKey, {
      openIssues:
        currentDelta.openIssues + next.openIssues - previous.openIssues,
      readyIssues:
        currentDelta.readyIssues + next.readyIssues - previous.readyIssues,
      blockedIssues:
        currentDelta.blockedIssues +
        next.blockedIssues -
        previous.blockedIssues,
    });
  }

  return projects.map((project) => {
    const delta = deltasByProjectKey.get(project.key);

    if (!delta) {
      return project;
    }

    return {
      ...project,
      openIssues: Math.max(0, project.openIssues + delta.openIssues),
      readyIssues: Math.max(0, project.readyIssues + delta.readyIssues),
      blockedIssues: Math.max(0, project.blockedIssues + delta.blockedIssues),
    };
  });
}

/**
 * Merges unconfirmed local notes over the authoritative bounded server list.
 *
 * Server-confirmed IDs keep their server order. Only still-pending notes are
 * prepended, duplicates are removed, and the visible contract stays at 50.
 *
 * @param serverNotes Authoritative newest-first notes from the detail read.
 * @param pendingNotes Successful writes not yet present in the server read.
 * @param serverHasMoreNotes Whether the server already truncated older notes.
 * @returns Bounded notes plus an honest older-history marker.
 */
function mergeBoundedIssueNotes(
  serverNotes: IssueNoteSummary[],
  pendingNotes: IssueNoteSummary[],
  serverHasMoreNotes: boolean
): { notes: IssueNoteSummary[]; hasMoreNotes: boolean } {
  const serverNoteIds = new Set(serverNotes.map((note) => note.id));
  const seenNoteIds = new Set<string>();
  const mergedNotes = [
    ...pendingNotes.filter((note) => !serverNoteIds.has(note.id)),
    ...serverNotes,
  ].filter((note) => {
    if (seenNoteIds.has(note.id)) {
      return false;
    }

    seenNoteIds.add(note.id);
    return true;
  });

  return {
    notes: mergedNotes.slice(0, DASHBOARD_ISSUE_NOTE_LIMIT),
    hasMoreNotes:
      serverHasMoreNotes || mergedNotes.length > DASHBOARD_ISSUE_NOTE_LIMIT,
  };
}

/**
 * Renders the first Bubblophy command-center screen.
 *
 * Use this component with a `DashboardSnapshot` DTO from either local sample
 * data or the future server-only data access layer.
 *
 * @param props Snapshot of projects, issues, agent tokens, runs, and audit events.
 * @returns A mobile-first issue and agent orchestration dashboard.
 */
export function BubblophyDashboard({
  snapshot,
  deniedProjectKey = null,
  allIssuePageRequest = null,
  allIssuePageResult = null,
  issuePageRequest = null,
  issuePageResult = null,
  issueDetailRequestKey = null,
  issueDetailResult = null,
  missingRequestedIssueKey = null,
  runPageRequest = null,
  runPageResult = null,
  memberPageRequest = null,
  memberPageResult = null,
  activityPageRequest = null,
  activityPageResult = null,
  createIssueAction,
  updateIssueContentAction,
  updateIssueAssigneeAction,
  readIssueAssigneeOptionsAction,
  readRunTargetOptionsAction,
  createIssuePlanAction,
  createIssueNoteAction,
  updateIssueStatusAction,
  updateIssuePriorityAction,
  requestAgentRunAction,
  transitionAgentRunAction,
  createProjectAction,
  updateProjectContentAction,
  transitionProjectArchiveAction,
  readProjectInvitationsAction,
  createProjectInvitationAction,
  reinviteProjectInvitationAction,
  revokeProjectInvitationAction,
  updateProjectMemberRoleAction,
  removeProjectMemberAction,
  createAgentTokenAction,
  updateAgentTokenLifecycleAction,
}: BubblophyDashboardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingSelectionSourceHrefRef = useRef<string | null>(null);
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isAgentTokenDialogOpen, setIsAgentTokenDialogOpen] = useState(false);
  const [localDrafts, setLocalDrafts] = useState<LocalDraftIssue[]>([]);
  const [persistedIssues, setPersistedIssues] = useState<IssueSummary[]>([]);
  const [issuePlansById, setIssuePlansById] = useState<
    Record<string, IssuePlanDraft>
  >({});
  const [pendingIssueNotesById, setPendingIssueNotesById] = useState<
    Record<string, { notes: IssueNoteSummary[]; hasMoreNotes: boolean }>
  >({});
  const [updatedIssuesById, setUpdatedIssuesById] = useState<
    Record<string, IssueSummary>
  >({});
  const [persistedProjects, setPersistedProjects] = useState<ProjectSummary[]>(
    []
  );
  const [updatedProjectsByKey, setUpdatedProjectsByKey] = useState<
    Record<string, ProjectSummary>
  >({});
  const [updatedProjectMembersById, setUpdatedProjectMembersById] = useState<
    Record<string, ProjectMemberSummary>
  >({});
  const [removedProjectMemberIds, setRemovedProjectMemberIds] = useState<
    string[]
  >([]);
  const [persistedAgentTokens, setPersistedAgentTokens] = useState<
    AgentTokenSummary[]
  >([]);
  const [updatedAgentTokensById, setUpdatedAgentTokensById] = useState<
    Record<string, AgentTokenSummary>
  >({});
  const [persistedAgentRuns, setPersistedAgentRuns] = useState<
    AgentRunSummary[]
  >([]);
  const [updatedAgentRunsById, setUpdatedAgentRunsById] = useState<
    Record<string, AgentRunSummary>
  >({});
  const [recentMutationFeedback, setRecentMutationFeedback] = useState<
    string | null
  >(null);
  const [draftSequence, setDraftSequence] = useState(1);
  const canUseDatabase =
    snapshot.meta.dataSource === 'database' ||
    snapshot.meta.dataSource === 'empty_database';

  const visibleLocalDrafts = useMemo(
    () => localDrafts.filter((issue) => issue.projectKey !== deniedProjectKey),
    [deniedProjectKey, localDrafts]
  );
  const visiblePersistedIssues = useMemo(
    () =>
      persistedIssues.filter((issue) => issue.projectKey !== deniedProjectKey),
    [deniedProjectKey, persistedIssues]
  );
  const baseProjects = useMemo(
    () =>
      [...persistedProjects, ...snapshot.projects]
        .filter((project) => project.key !== deniedProjectKey)
        .map((project) => updatedProjectsByKey[project.key] ?? project),
    [
      deniedProjectKey,
      persistedProjects,
      snapshot.projects,
      updatedProjectsByKey,
    ]
  );
  const urlProjectKey = getInitialProjectFilterKey(
    searchParams.get('project'),
    baseProjects
  );
  const issueQuery = useMemo(
    () =>
      parseDashboardIssueQuery({
        query: searchParams.get('q'),
        status: searchParams.get('status'),
        priority: searchParams.get('priority'),
        sort: searchParams.get('sort'),
        after: searchParams.get('after'),
      }),
    [searchParams]
  );
  const allIssueQuery = useMemo(
    () =>
      parseDashboardAllIssueQuery({
        query: searchParams.get('q'),
        status: searchParams.get('status'),
        priority: searchParams.get('priority'),
        sort: searchParams.get('sort'),
        afterAt: searchParams.get('allAfterAt'),
        afterProject: searchParams.get('allAfterProject'),
        afterIssue: searchParams.get('allAfterIssue'),
      }),
    [searchParams]
  );
  const activityQuery = useMemo(
    () =>
      parseDashboardActivityQuery({
        kind: searchParams.get('activityKind'),
        afterAt: searchParams.get('activityAfterAt'),
        afterSource: searchParams.get('activityAfterSource'),
        afterId: searchParams.get('activityAfterId'),
      }),
    [searchParams]
  );
  const hasAllIssuePageBoundary =
    snapshot.meta.dataSource === 'database' &&
    urlProjectKey === 'all' &&
    (allIssuePageRequest !== null || allIssuePageResult !== null);
  const isCurrentAllIssuePageRequest = isDashboardAllIssuePageRequestCurrent(
    allIssuePageRequest,
    allIssueQuery
  );
  const currentAllIssuePageResult = isCurrentAllIssuePageRequest
    ? allIssuePageResult
    : null;
  const hasConcreteIssuePageBoundary =
    snapshot.meta.dataSource === 'database' &&
    urlProjectKey !== 'all' &&
    (issuePageRequest !== null || issuePageResult !== null);
  const isCurrentIssuePageRequest = isDashboardIssuePageRequestCurrent(
    issuePageRequest,
    urlProjectKey,
    issueQuery
  );
  const currentIssuePageResult =
    isCurrentIssuePageRequest &&
    (issuePageResult?.status !== 'success' ||
      issuePageResult.project.key === urlProjectKey)
      ? issuePageResult
      : null;
  const hasIssuePageBoundary =
    hasAllIssuePageBoundary || hasConcreteIssuePageBoundary;
  const runCursor = useMemo(
    () =>
      parseDashboardRunCursor(
        searchParams.get('runAfterAt'),
        searchParams.get('runAfterId')
      ),
    [searchParams]
  );
  const hasConcreteRunPageBoundary =
    snapshot.meta.dataSource === 'database' &&
    urlProjectKey !== 'all' &&
    (runPageRequest !== null || runPageResult !== null);
  const isCurrentRunPageRequest = isDashboardRunPageRequestCurrent(
    runPageRequest,
    urlProjectKey,
    runCursor
  );
  const currentRunPageResult =
    isCurrentRunPageRequest &&
    (runPageResult?.status !== 'success' ||
      runPageResult.project.key === urlProjectKey)
      ? runPageResult
      : null;
  const memberCursor = useMemo(
    () =>
      parseDashboardMemberCursor(
        searchParams.get('memberAfterAt'),
        searchParams.get('memberAfterAuthUserId')
      ),
    [searchParams]
  );
  const hasConcreteMemberPageBoundary =
    snapshot.meta.dataSource === 'database' &&
    urlProjectKey !== 'all' &&
    (memberPageRequest !== null || memberPageResult !== null);
  const isCurrentMemberPageRequest = isDashboardMemberPageRequestCurrent(
    memberPageRequest,
    urlProjectKey,
    memberCursor
  );
  const currentMemberPageResult =
    isCurrentMemberPageRequest &&
    (memberPageResult?.status !== 'success' ||
      memberPageResult.project.key === urlProjectKey)
      ? memberPageResult
      : null;
  const activityProjectKey = urlProjectKey === 'all' ? null : urlProjectKey;
  const hasActivityPageBoundary =
    snapshot.meta.dataSource === 'database' &&
    (activityPageRequest !== null || activityPageResult !== null);
  const currentActivityPageResult = isDashboardActivityPageRequestCurrent(
    activityPageRequest,
    activityProjectKey,
    activityQuery
  )
    ? activityPageResult
    : null;
  const rawUrlIssueId = searchParams.get('issue')?.trim().toUpperCase() ?? '';
  const currentMissingRequestedIssueKey =
    missingRequestedIssueKey === rawUrlIssueId
      ? missingRequestedIssueKey
      : null;
  const firstCurrentPageIssueKey =
    currentIssuePageResult?.status === 'success'
      ? currentIssuePageResult.items.find(
          (issue) => issue.key !== currentMissingRequestedIssueKey
        )?.key
      : currentAllIssuePageResult?.status === 'success'
        ? currentAllIssuePageResult.items.find(
            (issue) => issue.key !== currentMissingRequestedIssueKey
          )?.key
        : undefined;
  const isCurrentIssueDetailRequest = Boolean(
    issueDetailRequestKey &&
    (issueDetailRequestKey === rawUrlIssueId ||
      (!rawUrlIssueId && issueDetailRequestKey === firstCurrentPageIssueKey) ||
      (currentMissingRequestedIssueKey === rawUrlIssueId &&
        issueDetailRequestKey === firstCurrentPageIssueKey) ||
      (!/^([A-Z0-9]{2,8})-[1-9]\d*$/.test(rawUrlIssueId) &&
        issueDetailRequestKey === firstCurrentPageIssueKey))
  );
  const currentIssueDetailResult = isCurrentIssueDetailRequest
    ? issueDetailResult
    : null;
  const shouldPreserveUnavailableIssueId = Boolean(
    rawUrlIssueId &&
    currentIssueDetailResult?.status === 'database_unavailable' &&
    issueDetailRequestKey === rawUrlIssueId
  );
  const currentSuccessfulIssueDetail =
    currentIssueDetailResult?.status === 'success' &&
    (urlProjectKey === 'all' ||
      currentIssueDetailResult.project.key === urlProjectKey) &&
    currentIssuePageResult?.status !== 'not_found'
      ? currentIssueDetailResult
      : null;
  const serverAllPageIssues = useMemo(
    () =>
      currentAllIssuePageResult?.status === 'success'
        ? mapDashboardAllIssuePageToSummaries(currentAllIssuePageResult).filter(
            (issue) =>
              issue.projectKey !== deniedProjectKey &&
              issue.id !== currentMissingRequestedIssueKey
          )
        : [],
    [
      currentAllIssuePageResult,
      currentMissingRequestedIssueKey,
      deniedProjectKey,
    ]
  );
  const serverPageIssues = useMemo(
    () =>
      currentIssuePageResult?.status === 'success' &&
      currentIssuePageResult.project.key === urlProjectKey
        ? mapDashboardIssuePageToSummaries(currentIssuePageResult).filter(
            (issue) =>
              issue.projectKey !== deniedProjectKey &&
              issue.id !== currentMissingRequestedIssueKey
          )
        : [],
    [
      currentIssuePageResult,
      deniedProjectKey,
      currentMissingRequestedIssueKey,
      urlProjectKey,
    ]
  );
  const serverQueueIssues =
    urlProjectKey === 'all' ? serverAllPageIssues : serverPageIssues;
  const serverQueueIssueIds = useMemo(
    () => new Set(serverQueueIssues.map((issue) => issue.id)),
    [serverQueueIssues]
  );
  const serverDetailIssue = useMemo(() => {
    if (!currentSuccessfulIssueDetail) {
      return [];
    }

    return [mapDashboardIssueDetailToSummary(currentSuccessfulIssueDetail)];
  }, [currentSuccessfulIssueDetail]);
  const serverConfirmedPersistedIssueIds = useMemo(() => {
    const persistedIssueIds = new Set(
      visiblePersistedIssues.map((issue) => issue.id)
    );

    return new Set(
      [...serverQueueIssues, ...serverDetailIssue]
        .map((issue) => issue.id)
        .filter((issueId) => persistedIssueIds.has(issueId))
    );
  }, [serverDetailIssue, serverQueueIssues, visiblePersistedIssues]);

  if (serverConfirmedPersistedIssueIds.size > 0) {
    setPersistedIssues((currentIssues) =>
      currentIssues.filter(
        (issue) => !serverConfirmedPersistedIssueIds.has(issue.id)
      )
    );
  }

  const baseIssues = useMemo<IssueSummary[]>(() => {
    const queueSafePersistedIssues =
      hasAllIssuePageBoundary && currentAllIssuePageResult?.status !== 'success'
        ? []
        : hasConcreteIssuePageBoundary &&
            currentIssuePageResult?.status !== 'success'
          ? visiblePersistedIssues.filter(
              (issue) => issue.projectKey !== urlProjectKey
            )
          : visiblePersistedIssues;

    const currentPersistedIssues = queueSafePersistedIssues.filter(
      (issue) => issue.id !== currentMissingRequestedIssueKey
    );
    const unconfirmedPersistedIssues = currentPersistedIssues.filter(
      (issue) => !serverConfirmedPersistedIssueIds.has(issue.id)
    );

    return mergeIssuesById(
      serverQueueIssues,
      serverDetailIssue,
      unconfirmedPersistedIssues
    );
  }, [
    currentAllIssuePageResult,
    currentIssuePageResult,
    currentMissingRequestedIssueKey,
    hasAllIssuePageBoundary,
    hasConcreteIssuePageBoundary,
    serverConfirmedPersistedIssueIds,
    serverDetailIssue,
    serverQueueIssues,
    urlProjectKey,
    visiblePersistedIssues,
  ]);
  const allAgentTokens = useMemo(
    () =>
      [...persistedAgentTokens, ...snapshot.agentTokens]
        .filter((token) => token.projectKey !== deniedProjectKey)
        .map((token) => updatedAgentTokensById[token.id] ?? token),
    [
      deniedProjectKey,
      persistedAgentTokens,
      snapshot.agentTokens,
      updatedAgentTokensById,
    ]
  );
  const serverPageRuns = useMemo(
    () =>
      currentRunPageResult?.status === 'success'
        ? mapDashboardRunPageToSummaries(currentRunPageResult)
        : [],
    [currentRunPageResult]
  );
  const allAgentRuns = useMemo(() => {
    const snapshotRuns = snapshot.agentRuns.filter(
      (run) =>
        (!deniedProjectKey ||
          !run.issueId.startsWith(`${deniedProjectKey}-`)) &&
        (!hasConcreteRunPageBoundary ||
          !run.issueId.startsWith(`${urlProjectKey}-`))
    );
    const currentPersistedRuns =
      hasConcreteRunPageBoundary && runCursor
        ? persistedAgentRuns.filter(
            (run) => !run.issueId.startsWith(`${urlProjectKey}-`)
          )
        : persistedAgentRuns;

    return mergeAgentRunsById(
      serverPageRuns,
      currentPersistedRuns,
      snapshotRuns
    ).map((run) => updatedAgentRunsById[run.id] ?? run);
  }, [
    deniedProjectKey,
    hasConcreteRunPageBoundary,
    persistedAgentRuns,
    runCursor,
    serverPageRuns,
    snapshot.agentRuns,
    updatedAgentRunsById,
    urlProjectKey,
  ]);
  const allProjectMembers = useMemo(
    () =>
      snapshot.projectMembers
        .filter((member) => member.projectKey !== deniedProjectKey)
        .filter((member) => !removedProjectMemberIds.includes(member.id))
        .map((member) => ({
          ...member,
          role: updatedProjectMembersById[member.id]?.role ?? member.role,
        })),
    [
      deniedProjectKey,
      removedProjectMemberIds,
      snapshot.projectMembers,
      updatedProjectMembersById,
    ]
  );
  const allIssues = useMemo<DashboardIssue[]>(
    () =>
      [...visibleLocalDrafts, ...baseIssues].map((issue) => {
        const updatedIssue = updatedIssuesById[issue.id];
        const plan =
          issuePlansById[issue.id] ?? getPersistedIssuePlanDraft(issue);
        const issueWithUpdate = updatedIssue
          ? { ...issue, ...updatedIssue }
          : issue;
        const pendingNoteState = pendingIssueNotesById[issue.id];
        const issueWithNotes =
          pendingNoteState || issueWithUpdate.notes
            ? {
                ...issueWithUpdate,
                ...mergeBoundedIssueNotes(
                  issueWithUpdate.notes ?? [],
                  pendingNoteState?.notes ?? [],
                  Boolean(
                    issueWithUpdate.hasMoreNotes ||
                    pendingNoteState?.hasMoreNotes
                  )
                ),
              }
            : issueWithUpdate;
        const issueWithAssignee = {
          ...issueWithNotes,
          assigneeLabel: getIssueAssigneeLabel(
            issueWithNotes,
            allProjectMembers
          ),
        };

        if (!plan) {
          return issueWithAssignee;
        }

        return {
          ...issueWithAssignee,
          planSteps: plan.steps.length,
        };
      }),
    [
      allProjectMembers,
      baseIssues,
      pendingIssueNotesById,
      issuePlansById,
      visibleLocalDrafts,
      updatedIssuesById,
    ]
  );
  const urlIssueId = shouldPreserveUnavailableIssueId
    ? rawUrlIssueId
    : getInitialIssueSelection({
        issueId: searchParams.get('issue'),
        projectKey: urlProjectKey,
        issues: allIssues,
      });
  const selectedProjectKey = urlProjectKey;
  const selectedIssueId = urlIssueId;
  const displayedAgentTokens = useMemo(() => {
    if (selectedProjectKey === 'all') {
      return allAgentTokens;
    }

    return allAgentTokens.filter(
      (token) => token.projectKey === selectedProjectKey
    );
  }, [allAgentTokens, selectedProjectKey]);
  const displayedAgentRuns = useMemo(() => {
    if (selectedProjectKey === 'all') {
      return allAgentRuns;
    }

    return allAgentRuns.filter((run) =>
      run.issueId.startsWith(`${selectedProjectKey}-`)
    );
  }, [allAgentRuns, selectedProjectKey]);
  const displayedActivity = useMemo(() => {
    if (snapshot.meta.dataSource === 'database') {
      return currentActivityPageResult?.status === 'success'
        ? currentActivityPageResult.items
        : [];
    }

    const visibleActivity = snapshot.activity.filter(
      (event) =>
        event.projectKey !== deniedProjectKey &&
        (!deniedProjectKey ||
          !event.issueId?.startsWith(`${deniedProjectKey}-`))
    );

    if (selectedProjectKey === 'all') {
      return visibleActivity;
    }

    return visibleActivity.filter(
      (event) => event.projectKey === selectedProjectKey
    );
  }, [
    currentActivityPageResult,
    deniedProjectKey,
    selectedProjectKey,
    snapshot.activity,
    snapshot.meta.dataSource,
  ]);

  const latestSelectedProjectAccess = combineDashboardProjectAccess(
    currentIssuePageResult?.status === 'success'
      ? currentIssuePageResult.project
      : null,
    currentSuccessfulIssueDetail?.project ?? null,
    currentMemberPageResult?.status === 'success'
      ? currentMemberPageResult.project
      : null
  );
  const allPageProjectAccessByKey = useMemo(() => {
    const accessByKey = new Map<string, DashboardProjectAccess>();

    if (currentAllIssuePageResult?.status !== 'success') {
      return accessByKey;
    }

    for (const item of currentAllIssuePageResult.items) {
      accessByKey.set(item.project.key, {
        ...item.project,
        isArchived: false,
      });
    }

    return accessByKey;
  }, [currentAllIssuePageResult]);
  const allProjects = useMemo(
    () =>
      applyIssueStatusMetricOverlays({
        projects: baseProjects,
        baseIssues,
        updatedIssuesById,
      }).map((project) => {
        const hasConfirmedProjectMutation = Boolean(
          updatedProjectsByKey[project.key]
        );
        const currentAccess = combineDashboardProjectAccess(
          allPageProjectAccessByKey.get(project.key) ?? null,
          project.key === latestSelectedProjectAccess?.key
            ? latestSelectedProjectAccess
            : null
        );

        if (
          selectedProjectKey === 'all' &&
          hasAllIssuePageBoundary &&
          !currentAccess
        ) {
          return {
            ...project,
            currentUserRole: undefined,
          };
        }

        return currentAccess
          ? {
              ...project,
              name: hasConfirmedProjectMutation
                ? project.name
                : currentAccess.name,
              isArchived: hasConfirmedProjectMutation
                ? project.isArchived
                : currentAccess.isArchived,
              currentUserRole: currentAccess.currentUserRole,
            }
          : project;
      }),
    [
      allPageProjectAccessByKey,
      baseIssues,
      baseProjects,
      hasAllIssuePageBoundary,
      latestSelectedProjectAccess,
      selectedProjectKey,
      updatedProjectsByKey,
      updatedIssuesById,
    ]
  );
  const activeProjects = useMemo(
    () => allProjects.filter((project) => !project.isArchived),
    [allProjects]
  );
  const projectByKey = useMemo(
    () => new Map(allProjects.map((project) => [project.key, project])),
    [allProjects]
  );
  const activeContributorProjects = useMemo(
    () =>
      activeProjects.filter((project) =>
        canContributeToBubblophyProject(project.currentUserRole)
      ),
    [activeProjects]
  );
  const activeManagerProjects = useMemo(
    () =>
      activeProjects.filter((project) =>
        canManageBubblophyProject(project.currentUserRole)
      ),
    [activeProjects]
  );
  const manageableProjectKeys = useMemo(
    () => new Set(activeManagerProjects.map((project) => project.key)),
    [activeManagerProjects]
  );
  const agentTokenCreationProjects = useMemo(
    () =>
      selectedProjectKey === 'all'
        ? activeManagerProjects
        : activeManagerProjects.filter(
            (project) => project.key === selectedProjectKey
          ),
    [activeManagerProjects, selectedProjectKey]
  );
  const issueCreationProjects = canUseDatabase
    ? activeContributorProjects
    : activeProjects;

  const filteredIssues = useMemo(() => {
    const localDraftIssueIds = new Set(
      visibleLocalDrafts.map((issue) => issue.id)
    );
    const confirmedPersistedIssueIds = new Set(
      visiblePersistedIssues.map((issue) => issue.id)
    );

    return allIssues.filter((issue) => {
      const isSelectedConfirmedIssue =
        issue.id === rawUrlIssueId && confirmedPersistedIssueIds.has(issue.id);
      const belongsToCurrentPage =
        selectedProjectKey === 'all'
          ? !hasAllIssuePageBoundary ||
            (allIssueQuery.after === null &&
              localDraftIssueIds.has(issue.id)) ||
            isSelectedConfirmedIssue ||
            (currentAllIssuePageResult?.status === 'success' &&
              serverQueueIssueIds.has(issue.id))
          : !hasConcreteIssuePageBoundary ||
            (issueQuery.afterIssueNumber === null &&
              localDraftIssueIds.has(issue.id)) ||
            isSelectedConfirmedIssue ||
            (currentIssuePageResult?.status === 'success' &&
              serverQueueIssueIds.has(issue.id));

      return (
        (selectedProjectKey === 'all' ||
          issue.projectKey === selectedProjectKey) &&
        belongsToCurrentPage &&
        matchesDashboardIssueQuery(issue, issueQuery)
      );
    });
  }, [
    allIssueQuery.after,
    allIssues,
    currentAllIssuePageResult,
    currentIssuePageResult,
    hasAllIssuePageBoundary,
    hasConcreteIssuePageBoundary,
    issueQuery,
    rawUrlIssueId,
    visibleLocalDrafts,
    visiblePersistedIssues,
    selectedProjectKey,
    serverQueueIssueIds,
  ]);
  const selectedProject =
    selectedProjectKey === 'all'
      ? null
      : (allProjects.find((project) => project.key === selectedProjectKey) ??
        null);
  const isSelectedProjectArchived = selectedProject?.isArchived ?? false;
  const canManageSelectedProject = canManageBubblophyProject(
    selectedProject?.currentUserRole
  );
  const selectedProjectMembers = selectedProject
    ? hasConcreteMemberPageBoundary
      ? currentMemberPageResult?.status === 'success'
        ? currentMemberPageResult.items
            .filter((member) => !removedProjectMemberIds.includes(member.id))
            .map((member) => ({
              ...member,
              role: updatedProjectMembersById[member.id]?.role ?? member.role,
            }))
        : []
      : allProjectMembers.filter(
          (member) => member.projectKey === selectedProject.key
        )
    : [];

  const selectedIssue =
    allIssues.find((issue) => issue.id === selectedIssueId) ??
    (shouldPreserveUnavailableIssueId ? null : filteredIssues[0]) ??
    null;
  const selectedIssueProject = selectedIssue
    ? allProjects.find((project) => project.key === selectedIssue.projectKey)
    : null;
  const canContributeToSelectedIssueProject = canContributeToBubblophyProject(
    selectedIssueProject?.currentUserRole
  );
  const isSelectedIssueProjectArchived =
    selectedIssueProject?.isArchived ?? false;
  const writableIssueIds = useMemo(
    () =>
      new Set(
        allIssues
          .filter((issue) => {
            const project = projectByKey.get(issue.projectKey);

            return (
              !project?.isArchived &&
              canContributeToBubblophyProject(project?.currentUserRole)
            );
          })
          .map((issue) => issue.id)
      ),
    [allIssues, projectByKey]
  );
  const writableRunIssueIds = useMemo(() => {
    const issueIds = new Set(writableIssueIds);

    for (const run of serverPageRuns) {
      issueIds.delete(run.issueId);
    }

    if (
      currentRunPageResult?.status === 'success' &&
      !currentRunPageResult.project.isArchived &&
      canContributeToBubblophyProject(
        currentRunPageResult.project.currentUserRole
      )
    ) {
      for (const run of serverPageRuns) {
        issueIds.add(run.issueId);
      }
    }

    return issueIds;
  }, [currentRunPageResult, serverPageRuns, writableIssueIds]);
  const selectedIssueRuns = selectedIssue
    ? allAgentRuns.filter((run) => run.issueId === selectedIssue.id)
    : [];
  const selectedIssuePlan = selectedIssue
    ? (issuePlansById[selectedIssue.id] ??
      getPersistedIssuePlanDraft(selectedIssue))
    : undefined;
  const openIssues = allProjects.reduce(
    (sum, project) => sum + project.openIssues,
    0
  );
  const readyIssues = allProjects.reduce(
    (sum, project) => sum + project.readyIssues,
    0
  );
  const blockedIssues = allProjects.reduce(
    (sum, project) => sum + project.blockedIssues,
    0
  );
  const totalOpenIssues = openIssues + visibleLocalDrafts.length;
  const readiness = getIssueReadinessPercent({
    readyIssues,
    openIssues: totalOpenIssues,
  });
  const canOpenIssueDialog =
    issueCreationProjects.length > 0 &&
    !isSelectedProjectArchived &&
    (!canUseDatabase ||
      !selectedProject ||
      canContributeToBubblophyProject(selectedProject.currentUserRole));
  const canCreateFirstProjectFromHeader =
    activeProjects.length === 0 &&
    canUseDatabase &&
    Boolean(createProjectAction);
  const pushDashboardParams = (nextParams: URLSearchParams) => {
    const currentQuery = searchParams.toString();
    const sourceHref = buildDashboardHref(
      pathname,
      new URLSearchParams(currentQuery)
    );
    const targetHref = buildDashboardHref(pathname, nextParams);

    pendingSelectionSourceHrefRef.current = sourceHref;
    router.push(targetHref);
  };
  const updateSelectionUrl = (
    projectKey: ProjectFilterKey,
    issueId: string,
    options: { resetIssueCursor?: boolean } = {}
  ) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (projectKey === 'all') {
      nextParams.delete('project');
    } else {
      nextParams.set('project', projectKey);
    }

    if (issueId) {
      nextParams.set('issue', issueId);
    } else {
      nextParams.delete('issue');
    }

    if (options.resetIssueCursor) {
      nextParams.delete('after');
      nextParams.delete('allAfterAt');
      nextParams.delete('allAfterProject');
      nextParams.delete('allAfterIssue');
      nextParams.delete('runAfterAt');
      nextParams.delete('runAfterId');
    }

    pushDashboardParams(nextParams);
  };
  const refreshDatabaseSnapshot = () => {
    router.refresh();
  };

  useEffect(() => {
    const currentQuery = searchParams.toString();
    const currentHref = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    const pendingSourceHref = pendingSelectionSourceHrefRef.current;

    if (pendingSourceHref) {
      if (currentHref === pendingSourceHref) {
        return;
      }

      pendingSelectionSourceHrefRef.current = null;
    }

    const hasSelectionState =
      searchParams.has('project') || searchParams.has('issue');
    const canonicalIssueParams =
      urlProjectKey === 'all'
        ? writeDashboardAllIssueQueryParams(
            new URLSearchParams(searchParams.toString()),
            allIssueQuery
          )
        : writeDashboardIssueQueryParams(
            new URLSearchParams(searchParams.toString()),
            issueQuery
          );

    if (urlProjectKey !== 'all') {
      canonicalIssueParams.delete('allAfterAt');
      canonicalIssueParams.delete('allAfterProject');
      canonicalIssueParams.delete('allAfterIssue');
    }

    const canonicalQueryParams = writeDashboardActivityQueryParams(
      setDashboardMemberPageParams(
        setDashboardRunPageParams(
          canonicalIssueParams,
          urlProjectKey === 'all' ? null : runCursor
        ),
        urlProjectKey === 'all' ? null : memberCursor
      ),
      activityQuery
    );
    const targetHref = buildSelectionHref({
      pathname,
      searchParams: canonicalQueryParams,
      projectKey: hasSelectionState ? urlProjectKey : 'all',
      issueId: hasSelectionState ? urlIssueId : '',
    });

    if (currentHref !== targetHref) {
      router.replace(targetHref);
    }
  }, [
    allIssueQuery,
    activityQuery,
    issueQuery,
    memberCursor,
    pathname,
    router,
    runCursor,
    searchParams,
    urlIssueId,
    urlProjectKey,
  ]);

  const handleProjectSelect = (projectKey: ProjectFilterKey) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (projectKey === 'all') {
      nextParams.delete('project');
    } else {
      nextParams.set('project', projectKey);
    }

    nextParams.delete('after');
    nextParams.delete('allAfterAt');
    nextParams.delete('allAfterProject');
    nextParams.delete('allAfterIssue');
    nextParams.delete('runAfterAt');
    nextParams.delete('runAfterId');
    nextParams.delete('memberAfterAt');
    nextParams.delete('memberAfterAuthUserId');
    clearDashboardActivityCursor(nextParams);
    nextParams.delete('issue');
    pushDashboardParams(nextParams);
  };

  const handleIssueSelect = (issueId: string) => {
    updateSelectionUrl(selectedProjectKey, issueId);
  };

  const handleIssueFiltersChange = (patch: DashboardIssueQueryPatch) => {
    pushDashboardParams(
      selectedProjectKey === 'all'
        ? patchDashboardAllIssueQueryParams(
            new URLSearchParams(searchParams.toString()),
            patch
          )
        : patchDashboardIssueQueryParams(
            new URLSearchParams(searchParams.toString()),
            patch
          )
    );
  };

  const handleIssuePageChange = (afterIssueNumber: number | null) => {
    pushDashboardParams(
      setDashboardIssuePageParams(
        new URLSearchParams(searchParams.toString()),
        afterIssueNumber
      )
    );
  };

  const handleAllIssuePageChange = (after: DashboardAllIssueCursor | null) => {
    pushDashboardParams(
      setDashboardAllIssuePageParams(
        new URLSearchParams(searchParams.toString()),
        after
      )
    );
  };

  const handleRunPageChange = (after: typeof runCursor) => {
    pushDashboardParams(
      setDashboardRunPageParams(
        new URLSearchParams(searchParams.toString()),
        after
      )
    );
  };

  const handleMemberPageChange = (after: DashboardMemberCursor | null) => {
    pushDashboardParams(
      setDashboardMemberPageParams(
        new URLSearchParams(searchParams.toString()),
        after
      )
    );
  };

  const handleActivityKindChange = (kind: DashboardActivityKind) => {
    pushDashboardParams(
      setDashboardActivityKindParams(
        new URLSearchParams(searchParams.toString()),
        kind
      )
    );
  };

  const handleActivityPageChange = (after: DashboardActivityCursor | null) => {
    pushDashboardParams(
      setDashboardActivityPageParams(
        new URLSearchParams(searchParams.toString()),
        after
      )
    );
  };

  const handleCreateDraft = (input: LocalDraftIssueInput) => {
    const draftId = `${input.projectKey}-DRAFT-${draftSequence
      .toString()
      .padStart(2, '0')}`;
    const draft: LocalDraftIssue = {
      id: draftId,
      title: input.title.trim(),
      projectKey: input.projectKey,
      status: 'triage',
      priority: input.priority,
      assigneeAuthUserId: null,
      assigneeLabel: 'Lokaler Draft',
      planSteps: 0,
      approvalRequired: true,
      createdLabel: 'gerade eben',
      description:
        input.description.trim() || 'Noch keine Beschreibung erfasst.',
      isLocalDraft: true,
    };

    setDraftSequence((currentSequence) => currentSequence + 1);
    setLocalDrafts((currentDrafts) => [draft, ...currentDrafts]);
    updateSelectionUrl(input.projectKey, draftId, { resetIssueCursor: true });
    setIsDraftDialogOpen(false);
  };

  const handlePersistedIssueCreated = (issue: IssueSummary) => {
    setPersistedIssues((currentIssues) => [issue, ...currentIssues]);
    updateSelectionUrl(issue.projectKey, issue.id, {
      resetIssueCursor: true,
    });
    setRecentMutationFeedback(`Issue ${issue.id} wurde erstellt.`);
    refreshDatabaseSnapshot();
    setIsDraftDialogOpen(false);
  };

  const handlePersistedProjectCreated = (project: ProjectSummary) => {
    setPersistedProjects((currentProjects) => [project, ...currentProjects]);
    updateSelectionUrl(project.key, '', { resetIssueCursor: true });
    setRecentMutationFeedback(`Projekt ${project.key} wurde erstellt.`);
    refreshDatabaseSnapshot();
    setIsProjectDialogOpen(false);
  };

  const handleProjectUpdated = (project: ProjectSummary) => {
    const currentProject = allProjects.find(
      (candidate) => candidate.key === project.key
    );

    setUpdatedProjectsByKey((currentProjects) => ({
      ...currentProjects,
      [project.key]: {
        ...project,
        currentUserRole:
          project.currentUserRole ?? currentProject?.currentUserRole,
      },
    }));
    setRecentMutationFeedback(`Projekt ${project.key} wurde aktualisiert.`);
    refreshDatabaseSnapshot();
  };

  const handleProjectMemberRoleUpdated = (
    member: ProjectMemberSummary,
    memberCount: number
  ) => {
    const currentMember =
      selectedProjectMembers.find((candidate) => candidate.id === member.id) ??
      allProjectMembers.find((candidate) => candidate.id === member.id);
    const displayedMember = currentMember
      ? {
          ...member,
          label: currentMember.label,
          email: currentMember.email ?? null,
        }
      : member;

    setUpdatedProjectMembersById((currentMembers) => ({
      ...currentMembers,
      [member.id]: displayedMember,
    }));

    const project = allProjects.find(
      (currentProject) => currentProject.key === member.projectKey
    );

    if (project) {
      handleProjectUpdated({ ...project, memberCount });
    } else {
      refreshDatabaseSnapshot();
    }

    setRecentMutationFeedback(
      `Mitglied ${displayedMember.label} wurde in ${member.projectKey} aktualisiert.`
    );
  };

  const handleProjectMemberRemoved = (input: {
    projectKey: string;
    memberAuthUserId: string;
    memberCount: number;
  }) => {
    const memberId = `${input.projectKey}:${input.memberAuthUserId}`;
    const removedMember =
      selectedProjectMembers.find((member) => member.id === memberId) ??
      allProjectMembers.find((member) => member.id === memberId);
    const removedMemberLabel =
      removedMember?.label !== input.memberAuthUserId
        ? removedMember?.label
        : undefined;

    setRemovedProjectMemberIds((currentIds) =>
      currentIds.includes(memberId) ? currentIds : [...currentIds, memberId]
    );

    const project = allProjects.find(
      (currentProject) => currentProject.key === input.projectKey
    );

    if (project) {
      handleProjectUpdated({
        ...project,
        memberCount: input.memberCount,
      });
    } else {
      refreshDatabaseSnapshot();
    }

    setRecentMutationFeedback(
      removedMemberLabel
        ? `Mitglied ${removedMemberLabel} wurde aus ${input.projectKey} entfernt.`
        : `Ein Mitglied wurde aus ${input.projectKey} entfernt.`
    );
  };

  const handleIssuePlanSaved = (plan: IssuePlanDraft) => {
    setIssuePlansById((currentPlans) => ({
      ...currentPlans,
      [plan.issueId]: plan,
    }));
    setRecentMutationFeedback(`Plan für ${plan.issueId} wurde gespeichert.`);
    refreshDatabaseSnapshot();
  };

  const handleIssueNoteCreated = (issueId: string, note: IssueNoteSummary) => {
    setPendingIssueNotesById((currentNotes) => {
      const currentNoteState = currentNotes[issueId];

      return {
        ...currentNotes,
        [issueId]: mergeBoundedIssueNotes(
          [],
          [note, ...(currentNoteState?.notes ?? [])],
          currentNoteState?.hasMoreNotes ?? false
        ),
      };
    });
    setRecentMutationFeedback(`Notiz für ${issueId} wurde gespeichert.`);
    refreshDatabaseSnapshot();
  };

  const handleIssueUpdated = (issue: IssueSummary) => {
    setUpdatedIssuesById((currentIssues) => ({
      ...currentIssues,
      [issue.id]: issue,
    }));
    setRecentMutationFeedback(`Issue ${issue.id} wurde aktualisiert.`);
    refreshDatabaseSnapshot();
  };

  const handleAgentTokenCreated = (token: CreatedAgentToken) => {
    const summary: AgentTokenSummary = {
      id: token.id,
      label: token.label,
      projectKey: token.projectKey,
      scopes: token.scopes,
      state: token.state,
      lastUsedAt: token.lastUsedAt,
      expiresAt: token.expiresAt,
    };

    setPersistedAgentTokens((currentTokens) => [summary, ...currentTokens]);
    setRecentMutationFeedback(`Agent-Token ${summary.label} wurde erstellt.`);
    refreshDatabaseSnapshot();
  };

  const handleAgentTokenLifecycleUpdated = (token: AgentTokenSummary) => {
    setUpdatedAgentTokensById((currentTokens) => ({
      ...currentTokens,
      [token.id]: token,
    }));
    setRecentMutationFeedback(`Agent-Token ${token.label} wurde aktualisiert.`);
    refreshDatabaseSnapshot();
  };

  const handleAgentRunRequested = (run: AgentRunSummary) => {
    setPersistedAgentRuns((currentRuns) => [run, ...currentRuns]);
    setRecentMutationFeedback(`Run ${run.id} wurde angefragt.`);
    refreshDatabaseSnapshot();
  };

  const handleAgentRunTransitioned = (run: AgentRunSummary) => {
    setUpdatedAgentRunsById((currentRuns) => ({
      ...currentRuns,
      [run.id]: run,
    }));
    setRecentMutationFeedback(`Run ${run.id} wurde aktualisiert.`);
    refreshDatabaseSnapshot();
  };

  const handleDeleteDraft = (issueId: string) => {
    setLocalDrafts((currentDrafts) =>
      currentDrafts.filter((draft) => draft.id !== issueId)
    );
    updateSelectionUrl('all', '');
  };

  return (
    <BubblesSidebarLayout
      sidebarData={bubblophySidebarData}
      defaultOpen
      header={
        <BubblesAppHeader
          breadcrumbs={getBubblophyBreadcrumbs()}
          subtitle="Human-gesteuerte Issue- und Agent-Orchestrierung"
          actions={
            <DashboardToolbar
              canCreateIssue={canOpenIssueDialog}
              canCreateProject={canCreateFirstProjectFromHeader}
              disabledReason={
                isSelectedProjectArchived
                  ? 'Dieses Projekt ist archiviert.'
                  : 'Erstelle zuerst ein Projekt.'
              }
              onCreateIssue={() => setIsDraftDialogOpen(true)}
              onCreateProject={() => setIsProjectDialogOpen(true)}
            />
          }
        />
      }>
      <main className="min-h-svh bg-background text-foreground">
        <section className="mx-auto max-w-7xl min-w-0 px-4 py-4 sm:px-6 lg:px-8">
          <header
            id="overview"
            className="scroll-mt-24 border-b border-border pb-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Human-in-the-loop
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">
                Issue- und Agent-Orchestrierung
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-pretty text-muted-foreground">
                Bubblophy hält Projektarbeit, Issue-Pläne, Agent-Tokens und
                Freigaben in einer Oberfläche. Menschen entscheiden, Agenten
                führen nur begrenzte Schritte aus.
              </p>
              <DataSourceStatus snapshot={snapshot} />
            </div>
          </header>

          <div className="grid gap-4 py-5 sm:grid-cols-3">
            <MetricCard
              icon={Folder01Icon}
              label="Offene Issues"
              value={openIssues.toString()}
              caption={
                visibleLocalDrafts.length > 0
                  ? `${readyIssues} bereit · ${visibleLocalDrafts.length} lokal`
                  : `${readyIssues} bereit für Freigabe`
              }
            />
            <MetricCard
              icon={CheckListIcon}
              label="Readiness"
              value={`${readiness}%`}
              caption="gemessen an offenen Issues"
            />
            <MetricCard
              icon={AlertCircleIcon}
              label="Blocker"
              value={blockedIssues.toString()}
              caption="brauchen menschliche Entscheidung"
            />
          </div>

          {recentMutationFeedback ? (
            <div
              role="status"
              aria-label="Letzte bestätigte Aktion"
              className="mb-5 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Zuletzt lokal bestätigt:
              </span>{' '}
              {recentMutationFeedback}{' '}
              <span>
                Temporäres Feedback aus dieser Sitzung; gespeicherte Daten
                bleiben die Quelle der Wahrheit.
              </span>
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="grid gap-5">
              <ProjectOverview
                meta={snapshot.meta}
                projects={allProjects}
                projectMembers={selectedProjectMembers}
                memberPageStatus={
                  hasConcreteMemberPageBoundary && !currentMemberPageResult
                    ? 'loading'
                    : (currentMemberPageResult?.status ?? null)
                }
                memberCursor={memberCursor}
                nextMemberAfter={
                  currentMemberPageResult?.status === 'success'
                    ? currentMemberPageResult.nextAfter
                    : null
                }
                canCreateProject={
                  canUseDatabase && Boolean(createProjectAction)
                }
                canManageProjects={
                  canUseDatabase &&
                  canManageSelectedProject &&
                  Boolean(updateProjectContentAction) &&
                  Boolean(transitionProjectArchiveAction)
                }
                readiness={readiness}
                selectedProjectKey={selectedProjectKey}
                updateProjectContentAction={updateProjectContentAction}
                transitionProjectArchiveAction={transitionProjectArchiveAction}
                readProjectInvitationsAction={readProjectInvitationsAction}
                createProjectInvitationAction={createProjectInvitationAction}
                reinviteProjectInvitationAction={
                  reinviteProjectInvitationAction
                }
                revokeProjectInvitationAction={revokeProjectInvitationAction}
                updateProjectMemberRoleAction={updateProjectMemberRoleAction}
                removeProjectMemberAction={removeProjectMemberAction}
                onCreateProject={() => setIsProjectDialogOpen(true)}
                onProjectUpdated={handleProjectUpdated}
                onProjectMemberRoleUpdated={handleProjectMemberRoleUpdated}
                onProjectMemberRemoved={handleProjectMemberRemoved}
                onFirstMemberPage={() => handleMemberPageChange(null)}
                onNextMemberPage={handleMemberPageChange}
                onProjectSelect={handleProjectSelect}
              />
              <IssueQueue
                dataSource={snapshot.meta.dataSource}
                issues={filteredIssues}
                issueQuery={issueQuery}
                issuePageStatus={
                  hasIssuePageBoundary
                    ? selectedProjectKey === 'all'
                      ? (currentAllIssuePageResult?.status ?? 'loading')
                      : (currentIssuePageResult?.status ?? 'loading')
                    : null
                }
                issueDetailStatus={currentIssueDetailResult?.status ?? null}
                requestedIssueNotFound={
                  currentMissingRequestedIssueKey !== null
                }
                hasCurrentIssuePage={
                  selectedProjectKey === 'all'
                    ? allIssueQuery.after !== null
                    : issueQuery.afterIssueNumber !== null
                }
                hasNextIssuePage={
                  selectedProjectKey === 'all'
                    ? currentAllIssuePageResult?.status === 'success' &&
                      currentAllIssuePageResult.nextAfter !== null
                    : currentIssuePageResult?.status === 'success' &&
                      currentIssuePageResult.nextAfterIssueNumber !== null
                }
                issuePlan={selectedIssuePlan}
                selectedIssue={selectedIssue}
                selectedProjectKey={selectedProjectKey}
                canPersistIssuePlans={
                  canUseDatabase &&
                  !isSelectedIssueProjectArchived &&
                  canContributeToSelectedIssueProject &&
                  Boolean(createIssuePlanAction)
                }
                canPersistIssueNotes={
                  canUseDatabase &&
                  !isSelectedIssueProjectArchived &&
                  canContributeToSelectedIssueProject &&
                  Boolean(createIssueNoteAction)
                }
                canPersistIssueContent={
                  canUseDatabase &&
                  !isSelectedIssueProjectArchived &&
                  canContributeToSelectedIssueProject &&
                  Boolean(updateIssueContentAction)
                }
                canPersistIssueStatus={
                  canUseDatabase &&
                  !isSelectedIssueProjectArchived &&
                  canContributeToSelectedIssueProject &&
                  Boolean(updateIssueStatusAction)
                }
                canPersistIssuePriority={
                  canUseDatabase &&
                  !isSelectedIssueProjectArchived &&
                  canContributeToSelectedIssueProject &&
                  Boolean(updateIssuePriorityAction)
                }
                canPersistIssueAssignee={
                  canUseDatabase &&
                  !isSelectedIssueProjectArchived &&
                  canContributeToSelectedIssueProject &&
                  Boolean(updateIssueAssigneeAction)
                }
                createIssuePlanAction={createIssuePlanAction}
                createIssueNoteAction={createIssueNoteAction}
                updateIssueContentAction={updateIssueContentAction}
                updateIssueAssigneeAction={updateIssueAssigneeAction}
                readIssueAssigneeOptionsAction={readIssueAssigneeOptionsAction}
                readRunTargetOptionsAction={readRunTargetOptionsAction}
                updateIssueStatusAction={updateIssueStatusAction}
                updateIssuePriorityAction={updateIssuePriorityAction}
                requestAgentRunAction={
                  canContributeToSelectedIssueProject &&
                  !isSelectedIssueProjectArchived
                    ? requestAgentRunAction
                    : undefined
                }
                projectMembers={allProjectMembers}
                agentRuns={selectedIssueRuns}
                onProjectSelect={handleProjectSelect}
                onDraftDelete={handleDeleteDraft}
                onIssuePlanSaved={handleIssuePlanSaved}
                onIssueNoteCreated={handleIssueNoteCreated}
                onIssueContentUpdated={handleIssueUpdated}
                onIssueAssigneeUpdated={handleIssueUpdated}
                onIssueStatusUpdated={handleIssueUpdated}
                onIssuePriorityUpdated={handleIssueUpdated}
                onAgentRunRequested={handleAgentRunRequested}
                onIssueSelect={handleIssueSelect}
                onIssueFiltersChange={handleIssueFiltersChange}
                onFirstIssuePage={() => {
                  if (selectedProjectKey === 'all') {
                    handleAllIssuePageChange(null);
                  } else {
                    handleIssuePageChange(null);
                  }
                }}
                onNextIssuePage={() => {
                  if (
                    selectedProjectKey === 'all' &&
                    currentAllIssuePageResult?.status === 'success'
                  ) {
                    handleAllIssuePageChange(
                      currentAllIssuePageResult.nextAfter
                    );
                  } else if (currentIssuePageResult?.status === 'success') {
                    handleIssuePageChange(
                      currentIssuePageResult.nextAfterIssueNumber
                    );
                  }
                }}
                canCreateIssue={
                  canOpenIssueDialog &&
                  (!hasIssuePageBoundary ||
                    (selectedProjectKey === 'all'
                      ? currentAllIssuePageResult?.status === 'success'
                      : currentIssuePageResult?.status === 'success'))
                }
                onCreateIssue={() => setIsDraftDialogOpen(true)}
              />
            </div>

            <aside className="grid content-start gap-5">
              <AgentAccess
                dataSource={snapshot.meta.dataSource}
                agentTokens={displayedAgentTokens}
                projects={allProjects}
                canCreateAgentToken={
                  canUseDatabase &&
                  agentTokenCreationProjects.length > 0 &&
                  Boolean(createAgentTokenAction)
                }
                canUpdateAgentTokens={
                  canUseDatabase && Boolean(updateAgentTokenLifecycleAction)
                }
                manageableProjectKeys={manageableProjectKeys}
                updateAgentTokenLifecycleAction={
                  updateAgentTokenLifecycleAction
                }
                onCreateAgentToken={() => setIsAgentTokenDialogOpen(true)}
                onAgentTokenLifecycleUpdated={handleAgentTokenLifecycleUpdated}
              />
              <RunQueue
                dataSource={snapshot.meta.dataSource}
                agentRuns={displayedAgentRuns}
                selectedProjectKey={selectedProjectKey}
                runPageStatus={
                  hasConcreteRunPageBoundary && !currentRunPageResult
                    ? 'loading'
                    : (currentRunPageResult?.status ?? null)
                }
                runCursor={runCursor}
                nextAfter={
                  currentRunPageResult?.status === 'success'
                    ? currentRunPageResult.nextAfter
                    : null
                }
                writableIssueIds={writableRunIssueIds}
                transitionAgentRunAction={transitionAgentRunAction}
                onAgentRunTransitioned={handleAgentRunTransitioned}
                onIssueSelect={handleIssueSelect}
                onFirstPage={() => handleRunPageChange(null)}
                onNextPage={handleRunPageChange}
              />
              <ActivityFeed
                activity={displayedActivity}
                dataSource={snapshot.meta.dataSource}
                kind={activityQuery.kind}
                cursor={activityQuery.after}
                nextAfter={
                  currentActivityPageResult?.status === 'success'
                    ? currentActivityPageResult.nextAfter
                    : null
                }
                status={
                  hasActivityPageBoundary && !currentActivityPageResult
                    ? 'loading'
                    : (currentActivityPageResult?.status ?? null)
                }
                onKindChange={handleActivityKindChange}
                onFirstPage={() => handleActivityPageChange(null)}
                onNextPage={handleActivityPageChange}
              />
            </aside>
          </div>
        </section>
      </main>
      {isDraftDialogOpen ? (
        <NewIssueDraftDialog
          projects={issueCreationProjects}
          open={isDraftDialogOpen}
          selectedProjectKey={selectedProjectKey}
          canPersistToDatabase={
            canUseDatabase &&
            activeContributorProjects.length > 0 &&
            Boolean(createIssueAction)
          }
          createIssueAction={createIssueAction}
          onCreateDraft={handleCreateDraft}
          onPersistedIssueCreated={handlePersistedIssueCreated}
          onOpenChange={setIsDraftDialogOpen}
        />
      ) : null}
      {isProjectDialogOpen ? (
        <NewProjectDialog
          open={isProjectDialogOpen}
          createProjectAction={createProjectAction}
          onOpenChange={setIsProjectDialogOpen}
          onPersistedProjectCreated={handlePersistedProjectCreated}
        />
      ) : null}
      {isAgentTokenDialogOpen ? (
        <NewAgentTokenDialog
          projects={agentTokenCreationProjects}
          open={isAgentTokenDialogOpen}
          createAgentTokenAction={createAgentTokenAction}
          onAgentTokenCreated={handleAgentTokenCreated}
          onOpenChange={setIsAgentTokenDialogOpen}
        />
      ) : null}
    </BubblesSidebarLayout>
  );
}

/**
 * Renders the current dashboard data source without interrupting work.
 *
 * @param props Dashboard snapshot with source metadata.
 * @returns Compact source status row.
 */
function DataSourceStatus({ snapshot }: BubblophyDashboardProps) {
  const variant = {
    sample: 'outline',
    database: 'published',
    empty_database: 'secondary',
    database_unavailable: 'draft',
  } satisfies Record<
    DashboardSnapshot['meta']['dataSource'],
    React.ComponentProps<typeof Badge>['variant']
  >;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant={variant[snapshot.meta.dataSource]}>
        {snapshot.meta.label}
      </Badge>
      <span>{snapshot.meta.description}</span>
      {snapshot.meta.hint ? <span>{snapshot.meta.hint}</span> : null}
    </div>
  );
}

/**
 * Renders dashboard-level actions with clear local behavior.
 *
 * @param props Availability flags and handlers for the primary dashboard CTA.
 * @returns Primary toolbar controls.
 */
function DashboardToolbar({
  canCreateIssue,
  canCreateProject,
  disabledReason,
  onCreateIssue,
  onCreateProject,
}: {
  canCreateIssue: boolean;
  canCreateProject: boolean;
  disabledReason: string;
  onCreateIssue: () => void;
  onCreateProject: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {canCreateProject ? (
        <Button size="lg" type="button" onClick={onCreateProject}>
          <HugeiconsIcon
            aria-hidden
            data-icon="inline-start"
            icon={Folder01Icon}
            strokeWidth={2}
          />
          Neues Projekt
        </Button>
      ) : (
        <Button
          size="lg"
          type="button"
          disabled={!canCreateIssue}
          title={canCreateIssue ? undefined : disabledReason}
          onClick={onCreateIssue}>
          <HugeiconsIcon
            aria-hidden
            data-icon="inline-start"
            icon={Add01Icon}
            strokeWidth={2}
          />
          Neues Issue
        </Button>
      )}
    </div>
  );
}

/**
 * Renders one top-level numeric dashboard metric.
 *
 * @param props Icon, label, value, and short explanatory caption.
 * @returns A compact metric card.
 */
function MetricCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>['icon'];
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <HugeiconsIcon
            aria-hidden
            icon={icon}
            strokeWidth={2}
            className="size-4"
          />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Renders project cards with issue readiness and access indicators.
 *
 * @param props Dashboard snapshot and aggregate readiness percentage.
 * @returns Project overview panel.
 */
function ProjectOverview({
  meta,
  projects,
  projectMembers,
  memberPageStatus,
  memberCursor,
  nextMemberAfter,
  canCreateProject,
  canManageProjects,
  readiness,
  selectedProjectKey,
  updateProjectContentAction,
  transitionProjectArchiveAction,
  readProjectInvitationsAction,
  createProjectInvitationAction,
  reinviteProjectInvitationAction,
  revokeProjectInvitationAction,
  updateProjectMemberRoleAction,
  removeProjectMemberAction,
  onCreateProject,
  onProjectUpdated,
  onProjectMemberRoleUpdated,
  onProjectMemberRemoved,
  onFirstMemberPage,
  onNextMemberPage,
  onProjectSelect,
}: {
  meta: DashboardSnapshot['meta'];
  projects: ProjectSummary[];
  projectMembers: ProjectMemberSummary[];
  memberPageStatus: MemberPageStatus | null;
  memberCursor: DashboardMemberCursor | null;
  nextMemberAfter: DashboardMemberCursor | null;
  canCreateProject: boolean;
  canManageProjects: boolean;
  readiness: number;
  selectedProjectKey: ProjectFilterKey;
  updateProjectContentAction?: (
    input: UpdateBubblophyProjectContentActionInput
  ) => Promise<UpdateBubblophyProjectContentActionResult>;
  transitionProjectArchiveAction?: (
    input: TransitionBubblophyProjectArchiveActionInput
  ) => Promise<TransitionBubblophyProjectArchiveActionResult>;
  readProjectInvitationsAction?: (input: {
    projectKey: string;
  }) => Promise<ReadBubblophyProjectInvitationManagerSnapshotActionResult>;
  createProjectInvitationAction?: (
    input: CreateBubblophyProjectInvitationActionInput
  ) => Promise<CreateBubblophyProjectInvitationActionResult>;
  reinviteProjectInvitationAction?: (
    input: ReinviteBubblophyProjectInvitationActionInput
  ) => Promise<ReinviteBubblophyProjectInvitationActionResult>;
  revokeProjectInvitationAction?: (
    input: RevokeBubblophyProjectInvitationActionInput
  ) => Promise<RevokeBubblophyProjectInvitationActionResult>;
  updateProjectMemberRoleAction?: (
    input: UpdateBubblophyProjectMemberRoleActionInput
  ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>;
  removeProjectMemberAction?: (
    input: RemoveBubblophyProjectMemberActionInput
  ) => Promise<RemoveBubblophyProjectMemberActionResult>;
  onCreateProject: () => void;
  onProjectUpdated: (project: ProjectSummary) => void;
  onProjectMemberRoleUpdated: (
    member: ProjectMemberSummary,
    memberCount: number
  ) => void;
  onProjectMemberRemoved: (input: {
    projectKey: string;
    memberAuthUserId: string;
    memberCount: number;
  }) => void;
  onFirstMemberPage: () => void;
  onNextMemberPage: (after: DashboardMemberCursor) => void;
  onProjectSelect: (projectKey: ProjectFilterKey) => void;
}) {
  const isDatabaseUnavailable = meta.dataSource === 'database_unavailable';
  const isEmptyDatabase = meta.dataSource === 'empty_database';
  const handleProjectKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    projectKey: ProjectFilterKey
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onProjectSelect(projectKey);
  };
  const selectedProject =
    selectedProjectKey === 'all'
      ? null
      : (projects.find((project) => project.key === selectedProjectKey) ??
        null);

  return (
    <Card id="projects" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Projekte</CardTitle>
        <CardDescription>
          {isDatabaseUnavailable
            ? 'Datenbank oder Tabellen sind noch nicht bereit.'
            : 'Arbeitslast, Blocker und begrenzte Agent-Zugänge pro Projekt.'}
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center gap-2">
            {canCreateProject ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onCreateProject}>
                Neues Projekt
              </Button>
            ) : null}
            <button
              type="button"
              aria-pressed={selectedProjectKey === 'all'}
              aria-label={`Alle Projekte auswählen, ${readiness}% bereit`}
              onClick={() => onProjectSelect('all')}
              onKeyDown={(event) => handleProjectKeyDown(event, 'all')}>
              <Badge
                variant={selectedProjectKey === 'all' ? 'default' : 'outline'}>
                Alle · {readiness}% bereit
              </Badge>
            </button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {projects.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground md:col-span-3">
            {isDatabaseUnavailable ? (
              <div className="grid gap-2">
                <p className="font-medium text-foreground">
                  Datenbank-Setup erforderlich.
                </p>
                <p>
                  Bubblophy konnte keine Projekt-Tabellen lesen. Es werden hier
                  keine Beispielprojekte als Ersatz angezeigt.
                </p>
                {meta.hint ? <p>{meta.hint}</p> : null}
              </div>
            ) : (
              <div className="grid gap-2">
                <p className="font-medium text-foreground">
                  {isEmptyDatabase
                    ? 'Noch keine Projekte in der Datenbank.'
                    : 'Noch keine Projekte für diesen User.'}
                </p>
                <p>
                  {isEmptyDatabase
                    ? 'Erstelle das erste Projekt, um echte Issues und Agent-Tokens zu verwalten.'
                    : 'Sobald du Mitglied eines Projekts bist, erscheint es hier.'}
                </p>
              </div>
            )}
          </div>
        ) : null}
        <nav
          aria-label="Projektfilter"
          className="contents"
          data-slot="bubblophy-project-navigation">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              aria-pressed={selectedProjectKey === project.key}
              aria-label={`Projekt ${project.name} (${project.key}) auswählen`}
              onClick={() => onProjectSelect(project.key)}
              onKeyDown={(event) => handleProjectKeyDown(event, project.key)}
              className="grid min-h-44 gap-4 rounded-md border border-border bg-background p-4 text-left transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none aria-pressed:border-primary aria-pressed:bg-primary/5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">
                    {project.name}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {project.key}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {project.isArchived ? (
                    <Badge variant="secondary">Archiviert</Badge>
                  ) : null}
                  <Badge variant={healthVariant[project.health]}>
                    {projectHealthLabels[project.health]}
                  </Badge>
                </div>
              </div>
              {project.description ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {project.description}
                </p>
              ) : null}

              <ReadinessBar
                label={`${project.readyIssues} bereit`}
                totalLabel={`${project.openIssues} offen`}
                value={getIssueReadinessPercent({
                  readyIssues: project.readyIssues,
                  openIssues: project.openIssues,
                })}
              />

              <div className="grid grid-cols-3 gap-1.5 text-xs sm:gap-2">
                <ProjectStat label="Blocker" value={project.blockedIssues} />
                <ProjectStat label="Team" value={project.memberCount} />
                <ProjectStat label="Tokens" value={project.agentTokenCount} />
              </div>
            </button>
          ))}
        </nav>
        {selectedProject && canManageProjects ? (
          <ProjectManagementPanel
            project={selectedProject}
            updateProjectContentAction={updateProjectContentAction}
            transitionProjectArchiveAction={transitionProjectArchiveAction}
            onProjectUpdated={onProjectUpdated}
          />
        ) : null}
        {selectedProject ? (
          <ProjectMembersPanel
            project={selectedProject}
            members={projectMembers}
            status={memberPageStatus}
            cursor={memberCursor}
            nextAfter={nextMemberAfter}
            readProjectInvitationsAction={readProjectInvitationsAction}
            createProjectInvitationAction={createProjectInvitationAction}
            reinviteProjectInvitationAction={reinviteProjectInvitationAction}
            revokeProjectInvitationAction={revokeProjectInvitationAction}
            updateProjectMemberRoleAction={updateProjectMemberRoleAction}
            removeProjectMemberAction={removeProjectMemberAction}
            onProjectMemberRoleUpdated={onProjectMemberRoleUpdated}
            onProjectMemberRemoved={onProjectMemberRemoved}
            onFirstPage={onFirstMemberPage}
            onNextPage={onNextMemberPage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Renders a database-backed project creation dialog.
 *
 * @param props Open state, server action, and success callback.
 * @returns Dialog for creating a project plus owner membership.
 */
function NewProjectDialog({
  open,
  createProjectAction,
  onOpenChange,
  onPersistedProjectCreated,
}: {
  open: boolean;
  createProjectAction?: (
    input: CreateBubblophyProjectActionInput
  ) => Promise<CreateBubblophyProjectActionResult>;
  onOpenChange: (open: boolean) => void;
  onPersistedProjectCreated: (project: ProjectSummary) => void;
}) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canSubmit =
    Boolean(createProjectAction) &&
    name.trim().length > 0 &&
    key.trim().length > 0 &&
    !isPending;

  const projectInput = {
    name,
    key,
    description,
    repositoryUrl,
  } satisfies PersistedProjectInput;

  const handleSubmit = () => {
    if (!canSubmit || !createProjectAction) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: CreateBubblophyProjectActionResult;

      try {
        result = await createProjectAction(projectInput);
      } catch {
        setActionError(
          'Das Projekt konnte gerade nicht erstellt werden. Versuche es erneut.'
        );
        return;
      }

      if (result.status === 'created') {
        onPersistedProjectCreated(result.project);
        return;
      }

      setActionError(getCreateProjectActionErrorMessage(result));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label="Projekt erstellen"
        className="max-h-[min(90svh,42rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Projekt erstellen</DialogTitle>
          <DialogDescription>
            Erstellt ein Projekt und trägt dich als Owner ein. Es entstehen
            keine Issues, Agent-Tokens oder Runs.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          <label className="grid gap-1.5 text-sm font-medium">
            Name
            <Input
              name="name"
              placeholder="Bubblesverse"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Key
            <Input
              name="key"
              placeholder="BV"
              value={key}
              onChange={(event) => setKey(event.currentTarget.value)}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Beschreibung
            <Textarea
              name="description"
              placeholder="Worum geht es in diesem Projekt?"
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Repository URL
            <Input
              name="repositoryUrl"
              placeholder="https://github.com/org/repo"
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.currentTarget.value)}
            />
          </label>

          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Der Server normalisiert den Key und prüft Duplikate. Die Repository
            URL ist optional, muss aber mit https:// beginnen.
          </div>

          {actionError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? 'Erstellt...' : 'Projekt erstellen'}
            </Button>
          </DialogFooter>

          {!canSubmit ? (
            <p className="text-xs text-muted-foreground">
              Name und Key sind nötig. Der Key darf 2 bis 8 Zeichen enthalten:
              A-Z und 0-9.
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders project edit and archive controls for one selected project.
 *
 * @param props Selected project, server actions, and success callback.
 * @returns Project management panel with safe server-backed actions.
 */
function ProjectManagementPanel({
  project,
  updateProjectContentAction,
  transitionProjectArchiveAction,
  onProjectUpdated,
}: {
  project: ProjectSummary;
  updateProjectContentAction?: (
    input: UpdateBubblophyProjectContentActionInput
  ) => Promise<UpdateBubblophyProjectContentActionResult>;
  transitionProjectArchiveAction?: (
    input: TransitionBubblophyProjectArchiveActionInput
  ) => Promise<TransitionBubblophyProjectArchiveActionResult>;
  onProjectUpdated: (project: ProjectSummary) => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedName = name.trim();
  const normalizedDescription = description.trim();
  const hasContentChanges =
    normalizedName !== project.name ||
    normalizedDescription !== (project.description ?? '');
  const canSaveContent =
    Boolean(updateProjectContentAction) &&
    normalizedName.length > 0 &&
    hasContentChanges &&
    !isPending;

  const handleContentSubmit = () => {
    if (!canSaveContent || !updateProjectContentAction) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: UpdateBubblophyProjectContentActionResult;

      try {
        result = await updateProjectContentAction({
          projectKey: project.key,
          name,
          description,
        });
      } catch {
        setActionError(
          'Die Projektänderung konnte gerade nicht gespeichert werden. Versuche es erneut.'
        );
        return;
      }

      if (result.status === 'updated') {
        onProjectUpdated(result.project);
        setConfirmArchive(false);
        return;
      }

      if (result.status === 'unchanged') {
        return;
      }

      setActionError(getProjectManagementActionErrorMessage(result));
    });
  };

  const handleArchiveDecision = () => {
    if (!transitionProjectArchiveAction || isPending) {
      return;
    }

    if (!project.isArchived && !confirmArchive) {
      setConfirmArchive(true);
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: TransitionBubblophyProjectArchiveActionResult;

      try {
        result = await transitionProjectArchiveAction({
          projectKey: project.key,
          decision: project.isArchived ? 'restore' : 'archive',
        });
      } catch {
        setActionError(
          'Der Projektstatus konnte gerade nicht geändert werden. Versuche es erneut.'
        );
        return;
      }

      if (result.status === 'updated') {
        onProjectUpdated(result.project);
        setConfirmArchive(false);
        return;
      }

      if (result.status === 'unchanged') {
        setConfirmArchive(false);
        return;
      }

      setActionError(getProjectArchiveActionErrorMessage(result));
    });
  };

  const handleReset = () => {
    setName(project.name);
    setDescription(project.description ?? '');
    setActionError(null);
  };

  return (
    <section className="grid gap-3 rounded-md border border-border bg-muted/20 p-4 md:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-sm font-medium">Projekt verwalten</h3>
          <p className="text-xs text-muted-foreground">
            {project.isArchived
              ? 'Dieses Projekt ist archiviert. Operative Aktionen bleiben gesperrt, bis es wiederhergestellt wird.'
              : 'Änderungen bleiben projektgebunden und schreiben ein Audit-Event.'}
          </p>
        </div>
        <Badge variant={project.isArchived ? 'secondary' : 'outline'}>
          {project.isArchived ? 'Archiviert' : 'Aktiv'}
        </Badge>
      </div>
      <form
        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          handleContentSubmit();
        }}>
        <label className="grid gap-1.5 text-sm font-medium">
          Name
          <Input
            name="projectName"
            value={name}
            aria-invalid={normalizedName.length === 0}
            disabled={project.isArchived || isPending}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Beschreibung
          <Input
            name="projectDescription"
            value={description}
            disabled={project.isArchived || isPending}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={!canSaveContent || project.isArchived}>
            {isPending ? 'Speichert...' : 'Speichern'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleReset}>
            Zurücksetzen
          </Button>
        </div>
      </form>
      {normalizedName.length === 0 ? (
        <p className="text-xs text-destructive">
          Der Projektname darf nicht leer sein.
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={project.isArchived ? 'default' : 'outline'}
          disabled={!transitionProjectArchiveAction || isPending}
          onClick={handleArchiveDecision}>
          {project.isArchived
            ? 'Projekt wiederherstellen'
            : confirmArchive
              ? 'Endgültig archivieren'
              : 'Projekt archivieren'}
        </Button>
        {confirmArchive ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setConfirmArchive(false)}>
            Abbrechen
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Renders membership controls for one selected project.
 *
 * @param props Selected project, public member rows, server actions, and callbacks.
 * @returns Project member list with guarded role and removal actions.
 */
function ProjectMembersPanel({
  project,
  members,
  status,
  cursor,
  nextAfter,
  readProjectInvitationsAction,
  createProjectInvitationAction,
  reinviteProjectInvitationAction,
  revokeProjectInvitationAction,
  updateProjectMemberRoleAction,
  removeProjectMemberAction,
  onProjectMemberRoleUpdated,
  onProjectMemberRemoved,
  onFirstPage,
  onNextPage,
}: {
  project: ProjectSummary;
  members: ProjectMemberSummary[];
  status: MemberPageStatus | null;
  cursor: DashboardMemberCursor | null;
  nextAfter: DashboardMemberCursor | null;
  readProjectInvitationsAction?: (input: {
    projectKey: string;
  }) => Promise<ReadBubblophyProjectInvitationManagerSnapshotActionResult>;
  createProjectInvitationAction?: (
    input: CreateBubblophyProjectInvitationActionInput
  ) => Promise<CreateBubblophyProjectInvitationActionResult>;
  reinviteProjectInvitationAction?: (
    input: ReinviteBubblophyProjectInvitationActionInput
  ) => Promise<ReinviteBubblophyProjectInvitationActionResult>;
  revokeProjectInvitationAction?: (
    input: RevokeBubblophyProjectInvitationActionInput
  ) => Promise<RevokeBubblophyProjectInvitationActionResult>;
  updateProjectMemberRoleAction?: (
    input: UpdateBubblophyProjectMemberRoleActionInput
  ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>;
  removeProjectMemberAction?: (
    input: RemoveBubblophyProjectMemberActionInput
  ) => Promise<RemoveBubblophyProjectMemberActionResult>;
  onProjectMemberRoleUpdated: (
    member: ProjectMemberSummary,
    memberCount: number
  ) => void;
  onProjectMemberRemoved: (input: {
    projectKey: string;
    memberAuthUserId: string;
    memberCount: number;
  }) => void;
  onFirstPage: () => void;
  onNextPage: (after: DashboardMemberCursor) => void;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState<
    string | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const canManageMembers =
    !project.isArchived &&
    (project.currentUserRole === 'owner' ||
      project.currentUserRole === 'maintainer') &&
    Boolean(updateProjectMemberRoleAction || removeProjectMemberAction);

  const handleRoleChange = (
    member: ProjectMemberSummary,
    role: UpdateBubblophyProjectMemberRoleActionInput['role']
  ) => {
    if (
      !canManageMembers ||
      !updateProjectMemberRoleAction ||
      member.role === 'owner' ||
      isPending
    ) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: UpdateBubblophyProjectMemberRoleActionResult;

      try {
        result = await updateProjectMemberRoleAction({
          projectKey: project.key,
          memberAuthUserId: member.authUserId,
          expectedRole: member.role,
          role,
        });
      } catch {
        setActionError(
          'Die Rolle konnte gerade nicht geändert werden. Versuche es erneut.'
        );
        return;
      }

      if (result.status === 'updated') {
        onProjectMemberRoleUpdated(result.member, result.memberCount);
        return;
      }

      if (result.status === 'unchanged') {
        return;
      }

      setActionError(getProjectMemberRoleActionErrorMessage(result));
    });
  };

  const handleRemove = (member: ProjectMemberSummary) => {
    if (
      !canManageMembers ||
      !removeProjectMemberAction ||
      member.role === 'owner' ||
      isPending
    ) {
      return;
    }

    if (confirmRemoveMemberId !== member.id) {
      setConfirmRemoveMemberId(member.id);
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: RemoveBubblophyProjectMemberActionResult;

      try {
        result = await removeProjectMemberAction({
          projectKey: project.key,
          memberAuthUserId: member.authUserId,
          expectedRole: member.role,
        });
      } catch {
        setActionError(
          'Das Mitglied konnte gerade nicht entfernt werden. Versuche es erneut.'
        );
        return;
      }

      if (result.status === 'removed') {
        onProjectMemberRemoved(result);
        setConfirmRemoveMemberId(null);
        return;
      }

      setActionError(getProjectMemberRemovalActionErrorMessage(result));
    });
  };

  return (
    <section className="grid gap-3 rounded-md border border-border bg-muted/20 p-4 md:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="text-sm font-medium">Mitglieder</h3>
          <p className="text-xs text-muted-foreground">
            {project.isArchived
              ? 'Archivierte Projekte zeigen Mitglieder nur lesend an.'
              : 'Owner und Maintainer verwalten den Teamzugang per E-Mail-Einladung.'}
          </p>
        </div>
        <Badge variant="outline">
          {members.length} von {project.memberCount} sichtbar
        </Badge>
      </div>

      {project.currentUserRole ? (
        <ProjectRoleGuide
          currentRole={project.currentUserRole}
          isArchived={project.isArchived}
        />
      ) : null}

      <ProjectInvitationManager
        key={project.key}
        createInvitationAction={createProjectInvitationAction}
        project={project}
        readInvitationsAction={readProjectInvitationsAction}
        reinviteInvitationAction={reinviteProjectInvitationAction}
        revokeInvitationAction={revokeProjectInvitationAction}
      />

      {status === 'loading' ? (
        <p role="status" className="text-sm text-muted-foreground">
          Mitgliederliste wird geladen.
        </p>
      ) : null}
      {status === 'database_unavailable' ? (
        <p role="status" className="text-sm text-muted-foreground">
          Die Mitgliederliste ist gerade nicht verfügbar. Einladungen und andere
          Dashboard-Bereiche bleiben nutzbar.
        </p>
      ) : null}
      {status === 'invalid' ? (
        <p role="status" className="text-sm text-muted-foreground">
          Der Mitglieder-Cursor ist ungültig. Kehre zur ersten Seite zurück.
        </p>
      ) : null}

      {status === 'success' ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {cursor ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onFirstPage}>
              Zur ersten Mitgliederseite
            </Button>
          ) : null}
          {nextAfter ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onNextPage(nextAfter)}>
              Weitere 20 Mitglieder
            </Button>
          ) : null}
        </div>
      ) : null}

      {(status === null || status === 'success') && members.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          Für dieses Projekt sind im aktuellen Snapshot keine Mitglieder
          sichtbar.
        </p>
      ) : status === null || status === 'success' ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mitglied</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Seit</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const canChangeThisMember =
                  canManageMembers &&
                  member.role !== 'owner' &&
                  Boolean(updateProjectMemberRoleAction);
                const canRemoveThisMember =
                  canManageMembers &&
                  member.role !== 'owner' &&
                  Boolean(removeProjectMemberAction);
                const isConfirmingRemoval = confirmRemoveMemberId === member.id;

                return (
                  <TableRow key={member.id}>
                    <TableCell className="max-w-[14rem]">
                      <span
                        className={`block truncate ${member.label === member.authUserId ? 'font-mono text-xs' : 'text-sm font-medium'}`}>
                        {member.label}
                      </span>
                      {member.email && member.email !== member.label ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {canChangeThisMember ? (
                        <select
                          aria-label={`Rolle für ${member.label}`}
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          value={member.role}
                          disabled={isPending}
                          onChange={(event) =>
                            handleRoleChange(
                              member,
                              event.currentTarget
                                .value as UpdateBubblophyProjectMemberRoleActionInput['role']
                            )
                          }>
                          {mutableProjectMemberRoles.map((role) => (
                            <option key={role} value={role}>
                              {projectMemberRoleLabels[role]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={projectMemberRoleVariant[member.role]}>
                          {projectMemberRoleLabels[member.role]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {member.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      {canRemoveThisMember ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              isConfirmingRemoval ? 'destructive' : 'outline'
                            }
                            disabled={isPending}
                            onClick={() => handleRemove(member)}>
                            {isConfirmingRemoval
                              ? 'Endgültig entfernen'
                              : 'Entfernen'}
                          </Button>
                          {isConfirmingRemoval ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => setConfirmRemoveMemberId(null)}>
                              Abbrechen
                            </Button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {member.role === 'owner'
                            ? 'Owner geschützt'
                            : project.isArchived
                              ? 'Archiviert'
                              : 'Nur lesend'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      {!project.isArchived && !canManageMembers ? (
        <p className="text-xs text-muted-foreground">
          Rollenänderungen und Entfernen sind nur für Owner und Maintainer mit
          aktiver Server-Action verfügbar.
        </p>
      ) : null}
    </section>
  );
}

/**
 * Renders one small project statistic.
 *
 * @param props Label and numeric value.
 * @returns A bordered project stat cell.
 */
function ProjectStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-muted/30 p-1.5 text-center sm:p-2">
      <p className="font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 truncate text-[0.6875rem] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/**
 * Renders a stable server-safe progress readout for project readiness.
 *
 * @param props Label text, total text, and percentage value from 0 to 100.
 * @returns A compact progress bar without locale-dependent hydration output.
 */
function ReadinessBar({
  label,
  totalLabel,
  value,
}: {
  label: string;
  totalLabel: string;
  value: number;
}) {
  const roundedValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      aria-label={`${label}, ${totalLabel}`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={roundedValue}
      role="progressbar"
      className="grid gap-2">
      <div className="flex items-center gap-3 text-xs">
        <span className="font-medium">{label}</span>
        <span className="ml-auto text-muted-foreground tabular-nums">
          {totalLabel}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-md bg-muted">
        <div
          className="h-full bg-primary"
          style={{ width: `${roundedValue}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Renders the issue queue as the primary work surface.
 *
 * @param props Filtered issues plus selected issue state.
 * @returns Responsive issue table and detail panel.
 */
function IssueQueue({
  dataSource,
  issues,
  issueQuery,
  issuePageStatus,
  issueDetailStatus,
  requestedIssueNotFound,
  hasCurrentIssuePage,
  hasNextIssuePage,
  issuePlan,
  selectedIssue,
  selectedProjectKey,
  canPersistIssuePlans,
  canPersistIssueNotes,
  canPersistIssueContent,
  canPersistIssueStatus,
  canPersistIssuePriority,
  canPersistIssueAssignee,
  createIssuePlanAction,
  createIssueNoteAction,
  updateIssueContentAction,
  updateIssueAssigneeAction,
  readIssueAssigneeOptionsAction,
  readRunTargetOptionsAction,
  updateIssueStatusAction,
  updateIssuePriorityAction,
  requestAgentRunAction,
  projectMembers,
  agentRuns,
  onProjectSelect,
  onDraftDelete,
  onIssuePlanSaved,
  onIssueNoteCreated,
  onIssueContentUpdated,
  onIssueAssigneeUpdated,
  onIssueStatusUpdated,
  onIssuePriorityUpdated,
  onAgentRunRequested,
  onIssueSelect,
  onIssueFiltersChange,
  onFirstIssuePage,
  onNextIssuePage,
  canCreateIssue,
  onCreateIssue,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  issues: DashboardIssue[];
  issueQuery: ReturnType<typeof parseDashboardIssueQuery>;
  issuePageStatus: IssuePageStatus | null;
  issueDetailStatus: ReadDashboardIssueDetailResult['status'] | null;
  requestedIssueNotFound: boolean;
  hasCurrentIssuePage: boolean;
  hasNextIssuePage: boolean;
  issuePlan?: IssuePlanDraft;
  selectedIssue: DashboardIssue | null;
  selectedProjectKey: ProjectFilterKey;
  canPersistIssuePlans: boolean;
  canPersistIssueNotes: boolean;
  canPersistIssueContent: boolean;
  canPersistIssueStatus: boolean;
  canPersistIssuePriority: boolean;
  canPersistIssueAssignee: boolean;
  createIssuePlanAction?: (
    input: CreateBubblophyIssuePlanActionInput
  ) => Promise<CreateBubblophyIssuePlanActionResult>;
  createIssueNoteAction?: (
    input: CreateBubblophyIssueNoteActionInput
  ) => Promise<CreateBubblophyIssueNoteActionResult>;
  updateIssueContentAction?: (
    input: UpdateBubblophyIssueContentActionInput
  ) => Promise<UpdateBubblophyIssueContentActionResult>;
  updateIssueAssigneeAction?: (
    input: UpdateBubblophyIssueAssigneeActionInput
  ) => Promise<UpdateBubblophyIssueAssigneeActionResult>;
  readIssueAssigneeOptionsAction?: (
    input: ReadBubblophyIssueAssigneeOptionsActionInput
  ) => Promise<ReadBubblophyIssueAssigneeOptionsActionResult>;
  readRunTargetOptionsAction?: (
    input: ReadBubblophyRunTargetOptionsActionInput
  ) => Promise<ReadBubblophyRunTargetOptionsActionResult>;
  updateIssueStatusAction?: (
    input: UpdateBubblophyIssueStatusActionInput
  ) => Promise<UpdateBubblophyIssueStatusActionResult>;
  updateIssuePriorityAction?: (
    input: UpdateBubblophyIssuePriorityActionInput
  ) => Promise<UpdateBubblophyIssuePriorityActionResult>;
  requestAgentRunAction?: (
    input: RequestBubblophyAgentRunActionInput
  ) => Promise<RequestBubblophyAgentRunActionResult>;
  projectMembers: ProjectMemberSummary[];
  agentRuns: AgentRunSummary[];
  onProjectSelect: (projectKey: ProjectFilterKey) => void;
  onDraftDelete: (issueId: string) => void;
  onIssuePlanSaved: (plan: IssuePlanDraft) => void;
  onIssueNoteCreated: (issueId: string, note: IssueNoteSummary) => void;
  onIssueContentUpdated: (issue: IssueSummary) => void;
  onIssueAssigneeUpdated: (issue: IssueSummary) => void;
  onIssueStatusUpdated: (issue: IssueSummary) => void;
  onIssuePriorityUpdated: (issue: IssueSummary) => void;
  onAgentRunRequested: (run: AgentRunSummary) => void;
  onIssueSelect: (issueId: string) => void;
  onIssueFiltersChange: (patch: DashboardIssueQueryPatch) => void;
  onFirstIssuePage: () => void;
  onNextIssuePage: () => void;
  canCreateIssue: boolean;
  onCreateIssue: () => void;
}) {
  const issuePageFailed =
    issuePageStatus !== null &&
    issuePageStatus !== 'success' &&
    issuePageStatus !== 'loading';
  const issuePageLoading = issuePageStatus === 'loading';
  const handleIssueRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    issueId: string
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onIssueSelect(issueId);
  };

  return (
    <Card id="issues" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Issue-Queue</CardTitle>
        <CardDescription>
          {selectedProjectKey === 'all'
            ? 'Projektübergreifende, zugriffsgeprüfte Übersicht.'
            : `Gefiltert auf Projekt ${selectedProjectKey}.`}
        </CardDescription>
        {selectedProjectKey !== 'all' ? (
          <CardAction>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onProjectSelect('all')}>
              Filter lösen
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        {issuePageStatus === 'success' ? (
          <div className="2xl:col-span-2">
            <IssueQueueControls
              key={issueQuery.filters.query ?? ''}
              query={issueQuery}
              hasCurrentPage={hasCurrentIssuePage}
              hasNextPage={hasNextIssuePage}
              onFiltersChange={onIssueFiltersChange}
              onFirstPage={onFirstIssuePage}
              onNextPage={onNextIssuePage}
            />
          </div>
        ) : null}

        {issuePageStatus === 'database_unavailable' ? (
          <p
            role="status"
            className="text-sm text-muted-foreground 2xl:col-span-2">
            Die Issue-Liste ist gerade nicht verfügbar. Andere
            Dashboard-Bereiche bleiben nutzbar.
          </p>
        ) : null}
        {issuePageStatus === 'loading' ? (
          <p
            role="status"
            className="text-sm text-muted-foreground 2xl:col-span-2">
            Die Issue-Liste wird für diese URL geladen.
          </p>
        ) : null}
        {issuePageStatus === 'not_found' ? (
          <p
            role="status"
            className="text-sm text-muted-foreground 2xl:col-span-2">
            Das Projekt oder dein Zugriff darauf ist nicht mehr verfügbar.
          </p>
        ) : null}
        {issuePageStatus === 'invalid' ? (
          <p
            role="status"
            className="text-sm text-muted-foreground 2xl:col-span-2">
            Die Issue-URL war ungültig und wurde nicht geladen.
          </p>
        ) : null}
        {issueDetailStatus === 'database_unavailable' ? (
          <p
            role="status"
            className="text-sm text-muted-foreground 2xl:col-span-2">
            Die vollständigen Issue-Details sind gerade nicht verfügbar. Die
            Queue bleibt nutzbar.
          </p>
        ) : null}
        {issueDetailStatus === 'not_found' || requestedIssueNotFound ? (
          <p
            role="status"
            className="text-sm text-muted-foreground 2xl:col-span-2">
            Das direkt verlinkte Issue ist nicht mehr verfügbar. Bubblophy zeigt
            stattdessen die aktuelle Queue-Auswahl.
          </p>
        ) : null}

        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priorität</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Zuständig</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-sm text-muted-foreground">
                    <div className="grid gap-3">
                      <div>
                        <p>
                          {issuePageLoading
                            ? 'Issue-Daten werden geladen.'
                            : issuePageFailed
                              ? 'Keine Issue-Daten geladen.'
                              : issueQuery.filters.query ||
                                  issueQuery.filters.status ||
                                  issueQuery.filters.priority
                                ? 'Keine Issues passen zu diesen Filtern.'
                                : 'Noch keine Issues für diesen Filter.'}
                        </p>
                        {selectedProjectKey !== 'all' &&
                        !issuePageFailed &&
                        !issuePageLoading ? (
                          <p className="mt-1">
                            Das ausgewählte Projekt ist bereit für das erste
                            echte Issue.
                          </p>
                        ) : null}
                      </div>
                      {selectedProjectKey !== 'all' && canCreateIssue ? (
                        <div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={onCreateIssue}>
                            <HugeiconsIcon
                              aria-hidden
                              data-icon="inline-start"
                              icon={Add01Icon}
                              strokeWidth={2}
                            />
                            Issue für {selectedProjectKey} anlegen
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
              {issues.map((issue) => (
                <TableRow
                  key={issue.id}
                  tabIndex={0}
                  aria-selected={selectedIssue?.id === issue.id}
                  aria-label={`Issue ${issue.id}: ${issue.title} auswählen`}
                  data-state={selectedIssue?.id === issue.id ? 'selected' : ''}
                  className="cursor-pointer transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-2 focus-visible:outline-ring/40 data-[state=selected]:bg-muted/40"
                  onClick={() => onIssueSelect(issue.id)}
                  onKeyDown={(event) => handleIssueRowKeyDown(event, issue.id)}>
                  <TableCell className="font-mono text-muted-foreground">
                    <button
                      type="button"
                      aria-pressed={selectedIssue?.id === issue.id}
                      className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none aria-pressed:text-primary"
                      onClick={() => onIssueSelect(issue.id)}>
                      {issue.id}
                    </button>
                  </TableCell>
                  <TableCell className="min-w-64 whitespace-normal">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={selectedIssue?.id === issue.id}
                        className="text-left font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none aria-pressed:text-primary"
                        onClick={() => onIssueSelect(issue.id)}>
                        {issue.title}
                      </button>
                      {isLocalDraftIssue(issue) ? (
                        <Badge variant="draft">Lokal</Badge>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Projekt {issue.projectKey}
                      {isLocalDraftIssue(issue) ? ' · Lokal' : ''}
                      {issue.approvalRequired ? ' · Freigabe nötig' : ''}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={issueStatusVariant[issue.status]}>
                      {issueStatusLabels[issue.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={issuePriorityVariant[issue.priority]}>
                      {issuePriorityLabels[issue.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {issue.planSteps} Schritte
                  </TableCell>
                  <TableCell>{issue.assigneeLabel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <IssueDetailPanel
          dataSource={dataSource}
          issue={selectedIssue}
          issuePlan={issuePlan}
          canPersistIssuePlans={canPersistIssuePlans}
          canPersistIssueNotes={canPersistIssueNotes}
          canPersistIssueContent={canPersistIssueContent}
          canPersistIssueStatus={canPersistIssueStatus}
          canPersistIssuePriority={canPersistIssuePriority}
          canPersistIssueAssignee={canPersistIssueAssignee}
          createIssuePlanAction={createIssuePlanAction}
          createIssueNoteAction={createIssueNoteAction}
          updateIssueContentAction={updateIssueContentAction}
          updateIssueAssigneeAction={updateIssueAssigneeAction}
          readIssueAssigneeOptionsAction={readIssueAssigneeOptionsAction}
          readRunTargetOptionsAction={readRunTargetOptionsAction}
          updateIssueStatusAction={updateIssueStatusAction}
          updateIssuePriorityAction={updateIssuePriorityAction}
          requestAgentRunAction={requestAgentRunAction}
          projectMembers={projectMembers}
          agentRuns={agentRuns}
          onDraftDelete={onDraftDelete}
          onIssuePlanSaved={onIssuePlanSaved}
          onIssueNoteCreated={onIssueNoteCreated}
          onIssueContentUpdated={onIssueContentUpdated}
          onIssueAssigneeUpdated={onIssueAssigneeUpdated}
          onIssueStatusUpdated={onIssueStatusUpdated}
          onIssuePriorityUpdated={onIssuePriorityUpdated}
          onAgentRunRequested={onAgentRunRequested}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Renders details for the currently selected issue.
 *
 * @param props Selected issue, or null when a filter has no results.
 * @returns Issue detail panel.
 */
function IssueDetailPanel({
  dataSource,
  issue,
  issuePlan,
  canPersistIssuePlans,
  canPersistIssueNotes,
  canPersistIssueContent,
  canPersistIssueStatus,
  canPersistIssuePriority,
  canPersistIssueAssignee,
  createIssuePlanAction,
  createIssueNoteAction,
  updateIssueContentAction,
  updateIssueAssigneeAction,
  readIssueAssigneeOptionsAction,
  readRunTargetOptionsAction,
  updateIssueStatusAction,
  updateIssuePriorityAction,
  requestAgentRunAction,
  projectMembers,
  agentRuns,
  onDraftDelete,
  onIssuePlanSaved,
  onIssueNoteCreated,
  onIssueContentUpdated,
  onIssueAssigneeUpdated,
  onIssueStatusUpdated,
  onIssuePriorityUpdated,
  onAgentRunRequested,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  issue: DashboardIssue | null;
  issuePlan?: IssuePlanDraft;
  canPersistIssuePlans: boolean;
  canPersistIssueNotes: boolean;
  canPersistIssueContent: boolean;
  canPersistIssueStatus: boolean;
  canPersistIssuePriority: boolean;
  canPersistIssueAssignee: boolean;
  createIssuePlanAction?: (
    input: CreateBubblophyIssuePlanActionInput
  ) => Promise<CreateBubblophyIssuePlanActionResult>;
  createIssueNoteAction?: (
    input: CreateBubblophyIssueNoteActionInput
  ) => Promise<CreateBubblophyIssueNoteActionResult>;
  updateIssueContentAction?: (
    input: UpdateBubblophyIssueContentActionInput
  ) => Promise<UpdateBubblophyIssueContentActionResult>;
  updateIssueAssigneeAction?: (
    input: UpdateBubblophyIssueAssigneeActionInput
  ) => Promise<UpdateBubblophyIssueAssigneeActionResult>;
  readIssueAssigneeOptionsAction?: (
    input: ReadBubblophyIssueAssigneeOptionsActionInput
  ) => Promise<ReadBubblophyIssueAssigneeOptionsActionResult>;
  readRunTargetOptionsAction?: (
    input: ReadBubblophyRunTargetOptionsActionInput
  ) => Promise<ReadBubblophyRunTargetOptionsActionResult>;
  updateIssueStatusAction?: (
    input: UpdateBubblophyIssueStatusActionInput
  ) => Promise<UpdateBubblophyIssueStatusActionResult>;
  updateIssuePriorityAction?: (
    input: UpdateBubblophyIssuePriorityActionInput
  ) => Promise<UpdateBubblophyIssuePriorityActionResult>;
  requestAgentRunAction?: (
    input: RequestBubblophyAgentRunActionInput
  ) => Promise<RequestBubblophyAgentRunActionResult>;
  projectMembers: ProjectMemberSummary[];
  agentRuns: AgentRunSummary[];
  onDraftDelete: (issueId: string) => void;
  onIssuePlanSaved: (plan: IssuePlanDraft) => void;
  onIssueNoteCreated: (issueId: string, note: IssueNoteSummary) => void;
  onIssueContentUpdated: (issue: IssueSummary) => void;
  onIssueAssigneeUpdated: (issue: IssueSummary) => void;
  onIssueStatusUpdated: (issue: IssueSummary) => void;
  onIssuePriorityUpdated: (issue: IssueSummary) => void;
  onAgentRunRequested: (run: AgentRunSummary) => void;
}) {
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  if (!issue) {
    return (
      <aside
        aria-label="Issue-Details"
        className="grid content-start gap-2 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Kein Issue ausgewählt.</p>
        <p>
          Wähle ein Issue in der Queue aus oder lege im aktuellen Projekt das
          erste Issue an.
        </p>
      </aside>
    );
  }

  const visibleDescription = isLocalDraftIssue(issue)
    ? undefined
    : issue.description?.trim();
  const issueProjectMembers = projectMembers.filter(
    (member) => member.projectKey === issue.projectKey
  );

  return (
    <aside
      aria-label="Issue-Details"
      className="grid content-start gap-4 rounded-md border border-border bg-muted/20 p-4">
      <IssueContentPanel
        key={`${issue.id}-${issue.title}-${visibleDescription ?? ''}`}
        issue={issue}
        visibleDescription={visibleDescription}
        canPersistIssueContent={
          canPersistIssueContent && !isLocalDraftIssue(issue)
        }
        updateIssueContentAction={updateIssueContentAction}
        onIssueContentUpdated={onIssueContentUpdated}
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={issueStatusVariant[issue.status]}>
          {issueStatusLabels[issue.status]}
        </Badge>
        <Badge variant={issuePriorityVariant[issue.priority]}>
          {issuePriorityLabels[issue.priority]}
        </Badge>
      </div>

      <dl className="grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Plan</dt>
          <dd className="font-medium tabular-nums">
            {issue.planSteps} Schritte
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Freigabe</dt>
          <dd className="font-medium">
            {issue.approvalRequired ? 'Mensch nötig' : 'Nicht nötig'}
          </dd>
        </div>
      </dl>

      <IssueAssigneeUpdatePanel
        key={`assignee-${issue.id}-${issue.assigneeAuthUserId ?? 'none'}`}
        issue={issue}
        projectMembers={issueProjectMembers}
        canPersistIssueAssignee={
          canPersistIssueAssignee && !isLocalDraftIssue(issue)
        }
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        readIssueAssigneeOptionsAction={readIssueAssigneeOptionsAction}
        onIssueAssigneeUpdated={onIssueAssigneeUpdated}
      />

      <IssueStatusTransitionPanel
        key={`${issue.id}-${issue.status}`}
        issue={issue}
        canPersistIssueStatus={
          canPersistIssueStatus && !isLocalDraftIssue(issue)
        }
        updateIssueStatusAction={updateIssueStatusAction}
        onIssueStatusUpdated={onIssueStatusUpdated}
      />

      <IssuePriorityUpdatePanel
        key={issue.id}
        issue={issue}
        canPersistIssuePriority={
          canPersistIssuePriority && !isLocalDraftIssue(issue)
        }
        updateIssuePriorityAction={updateIssuePriorityAction}
        onIssuePriorityUpdated={onIssuePriorityUpdated}
      />

      <AgentRunRequestPanel
        key={`run-request-${issue.id}`}
        dataSource={dataSource}
        issue={issue}
        readRunTargetOptionsAction={readRunTargetOptionsAction}
        requestAgentRunAction={requestAgentRunAction}
        onAgentRunRequested={onAgentRunRequested}
      />

      <div className="grid gap-2 rounded-md border border-border bg-background p-3">
        <h4 className="text-sm font-medium">Runs für dieses Issue</h4>
        {agentRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Für dieses Issue gibt es noch keine angefragten Runs.
          </p>
        ) : (
          <ol className="grid gap-2">
            {agentRuns.map((run) => (
              <li
                key={run.id}
                className="grid gap-1 rounded-md border border-border p-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{run.agentLabel}</span>
                  <Badge variant={runVariant[run.state]}>
                    {agentRunStateLabels[run.state]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{run.lastEvent}</p>
                {run.resultSummary ? (
                  <>
                    <AgentRunResultSummary summary={run.resultSummary} />
                    {canPersistIssueNotes && createIssueNoteAction ? (
                      <AgentRunResultNoteAction
                        issueId={issue.id}
                        run={run}
                        createIssueNoteAction={createIssueNoteAction}
                        onIssueNoteCreated={onIssueNoteCreated}
                      />
                    ) : null}
                  </>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>

      <IssueNotesPanel
        key={`notes-${issue.id}`}
        issue={issue}
        canPersistIssueNotes={canPersistIssueNotes && !isLocalDraftIssue(issue)}
        createIssueNoteAction={createIssueNoteAction}
        onIssueNoteCreated={onIssueNoteCreated}
      />

      <div className="grid gap-2 rounded-md border border-border bg-background p-3">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-sm font-medium">Plan und Notiz</h4>
          {canPersistIssuePlans && !isLocalDraftIssue(issue) ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsPlanDialogOpen(true)}>
              {issuePlan ? 'Plan bearbeiten' : 'Plan entwerfen'}
            </Button>
          ) : null}
        </div>
        {isLocalDraftIssue(issue) ? (
          <>
            <p className="text-sm text-muted-foreground">{issue.description}</p>
            <p className="text-xs text-muted-foreground">
              Lokaler Draft von {issue.createdLabel}. Plan-Schritte werden erst
              nach echter Persistenz gespeichert.
            </p>
          </>
        ) : issuePlan ? (
          <div className="grid gap-3">
            {issuePlan.summary ? (
              <p className="text-sm text-muted-foreground">
                {issuePlan.summary}
              </p>
            ) : null}
            <ol className="grid gap-2 text-sm">
              {issuePlan.steps.map((step, index) => (
                <li
                  key={step.id}
                  className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">
              Plan v{issuePlan.version}, menschlich gespeichert. Es wurde kein
              Agent-Run gestartet.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {dataSource === 'database' || dataSource === 'empty_database'
              ? 'Noch kein Plan gespeichert. Nutze „Plan entwerfen“, um Summary und Schritte dauerhaft am Issue zu sichern.'
              : `Sample-Daten enthalten aktuell ${issue.planSteps} Plan-Schritte als Zähler. Die ausformulierten Schritte folgen mit der Datenanbindung.`}
          </p>
        )}
      </div>

      {!isLocalDraftIssue(issue) ? (
        <IssueAgentBriefingPanel issue={issue} issuePlan={issuePlan} />
      ) : null}

      {isLocalDraftIssue(issue) ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => onDraftDelete(issue.id)}>
          Draft verwerfen
        </Button>
      ) : null}
      {isPlanDialogOpen ? (
        <IssuePlanDraftDialog
          issue={issue}
          issuePlan={issuePlan}
          open={isPlanDialogOpen}
          createIssuePlanAction={createIssuePlanAction}
          onIssuePlanSaved={onIssuePlanSaved}
          onOpenChange={setIsPlanDialogOpen}
        />
      ) : null}
    </aside>
  );
}

function IssueAgentBriefingPanel({
  issue,
  issuePlan,
}: {
  issue: IssueSummary;
  issuePlan?: IssuePlanDraft;
}) {
  return (
    <div className="grid gap-2 rounded-md border border-border bg-background p-3">
      <div className="grid gap-1">
        <h4 className="text-sm font-medium">Lokaler Agent-Auftrag</h4>
        <p className="text-xs text-muted-foreground">
          Kopiert Issue- und Plan-Kontext für Codex oder Claude Code. Startet
          keinen Agenten; der Mensch entscheidet einen neuen Run bewusst.
        </p>
      </div>
      <CopyableCommandBlock
        label="Agent-Auftrag kopieren"
        value={buildIssueAgentBriefing({ issue, issuePlan })}
      />
    </div>
  );
}

/**
 * Builds a bounded text briefing for local agents from visible issue context.
 *
 * @param input Persisted issue and optional persisted plan draft.
 * @returns Plain text without secrets, tokens, auth data, or shell commands.
 */
function buildIssueAgentBriefing({
  issue,
  issuePlan,
}: {
  issue: IssueSummary;
  issuePlan?: IssuePlanDraft;
}) {
  const lines = [
    'Bubblophy lokaler Agent-Auftrag',
    '',
    'Grenzen:',
    '- Keine automatische Ausführung.',
    '- Kein Agent wurde gestartet.',
    '- Der Mensch entscheidet bewusst, ob ein neuer Run angefragt wird.',
    '',
    `Projekt: ${issue.projectKey}`,
    `Issue: ${issue.id}`,
    `Titel: ${issue.title}`,
    `Status: ${issueStatusLabels[issue.status]}`,
    `Priorität: ${issuePriorityLabels[issue.priority]}`,
  ];

  if (issuePlan) {
    lines.push('', `Plan v${issuePlan.version}:`);

    if (issuePlan.summary) {
      lines.push(`Summary: ${issuePlan.summary}`);
    }

    if (issuePlan.steps.length > 0) {
      lines.push('Schritte:');
      issuePlan.steps.forEach((step, index) => {
        lines.push(`${index + 1}. ${step.text}`);
      });
    }
  } else {
    lines.push('', 'Plan: Noch kein gespeicherter Plan vorhanden.');
  }

  return lines.join('\n');
}

/**
 * Renders the selected issue title/description and optional edit form.
 *
 * @param props Issue content, server action, and update callback.
 * @returns Read mode or a persisted issue edit form.
 */
function IssueContentPanel({
  issue,
  visibleDescription,
  canPersistIssueContent,
  updateIssueContentAction,
  onIssueContentUpdated,
}: {
  issue: DashboardIssue;
  visibleDescription?: string;
  canPersistIssueContent: boolean;
  updateIssueContentAction?: (
    input: UpdateBubblophyIssueContentActionInput
  ) => Promise<UpdateBubblophyIssueContentActionResult>;
  onIssueContentUpdated: (issue: IssueSummary) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(visibleDescription ?? '');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizedTitle = title.trim();
  const normalizedDescription = description.trim();
  const hasChanges =
    normalizedTitle !== issue.title ||
    normalizedDescription !== (visibleDescription ?? '');
  const canSubmit =
    canPersistIssueContent &&
    Boolean(updateIssueContentAction) &&
    normalizedTitle.length > 0 &&
    hasChanges &&
    !isPending;

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(issue.title);
    setDescription(visibleDescription ?? '');
    setActionError(null);
  };

  const handleSubmit = () => {
    if (!canSubmit || !updateIssueContentAction) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: UpdateBubblophyIssueContentActionResult;

      try {
        result = await updateIssueContentAction({
          issueId: issue.id,
          title,
          description,
        });
      } catch {
        setActionError(
          'Die Änderung konnte gerade nicht gespeichert werden. Versuche es erneut.'
        );
        return;
      }

      if (result.status === 'updated') {
        onIssueContentUpdated(result.issue);
        setIsEditing(false);
        return;
      }

      if (result.status === 'unchanged') {
        setIsEditing(false);
        return;
      }

      setActionError(getIssueContentActionErrorMessage(result));
    });
  };

  if (isEditing) {
    return (
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="w-fit font-mono">
            {issue.id}
          </Badge>
          <Badge variant="secondary" className="w-fit">
            Bearbeitung
          </Badge>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">
          Titel
          <Input
            name="title"
            value={title}
            aria-invalid={normalizedTitle.length === 0}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Beschreibung
          <Textarea
            name="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
        </label>
        {normalizedTitle.length === 0 ? (
          <p className="text-xs text-destructive">
            Der Titel darf nicht leer sein.
          </p>
        ) : null}
        {actionError ? (
          <p role="alert" className="text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={!canSubmit}>
            {isPending ? 'Speichert...' : 'Speichern'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleCancel}>
            Abbrechen
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline" className="w-fit font-mono">
            {issue.id}
          </Badge>
          {canPersistIssueContent && updateIssueContentAction ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}>
              Bearbeiten
            </Button>
          ) : null}
        </div>
        {isLocalDraftIssue(issue) ? (
          <Badge variant="draft" className="w-fit">
            Lokal / nicht gespeichert
          </Badge>
        ) : null}
        <h3 className="text-base font-semibold text-pretty">{issue.title}</h3>
        <p className="text-sm text-muted-foreground">
          Projekt {issue.projectKey} · Zuständig {issue.assigneeLabel}
        </p>
      </div>
      {visibleDescription ? (
        <p className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
          {visibleDescription}
        </p>
      ) : null}
    </div>
  );
}

const issueStatusOptions = [
  'triage',
  'geplant',
  'bereit',
  'in_arbeit',
  'review',
  'blockiert',
  'erledigt',
] satisfies IssueStatus[];

/**
 * Renders a human-only issue status transition control.
 *
 * @param props Selected issue, status action, and success callback.
 * @returns Compact status transition form or non-persistent explanation.
 */
function IssueStatusTransitionPanel({
  issue,
  canPersistIssueStatus,
  updateIssueStatusAction,
  onIssueStatusUpdated,
}: {
  issue: DashboardIssue;
  canPersistIssueStatus: boolean;
  updateIssueStatusAction?: (
    input: UpdateBubblophyIssueStatusActionInput
  ) => Promise<UpdateBubblophyIssueStatusActionResult>;
  onIssueStatusUpdated: (issue: IssueSummary) => void;
}) {
  const availableStatuses = issueStatusOptions.filter(
    (status) => status !== issue.status
  );
  const [nextStatus, setNextStatus] = useState<IssueStatus>(
    availableStatuses[0] ?? issue.status
  );
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canSubmit =
    canPersistIssueStatus &&
    Boolean(updateIssueStatusAction) &&
    nextStatus !== issue.status &&
    !isPending;

  const handleSubmit = () => {
    if (!canSubmit || !updateIssueStatusAction) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: UpdateBubblophyIssueStatusActionResult;

      try {
        result = await updateIssueStatusAction({
          issueId: issue.id,
          expectedStatus: issue.status,
          status: nextStatus,
          reason,
        });
      } catch {
        setActionError(
          'Der Status konnte gerade nicht gespeichert werden. Versuche es erneut.'
        );
        return;
      }

      if (result.status === 'updated') {
        onIssueStatusUpdated(result.issue);
        setReason('');
        return;
      }

      setActionError(getIssueStatusActionErrorMessage(result));
    });
  };

  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-3">
      <div className="grid gap-1">
        <h4 className="text-sm font-medium">Status pflegen</h4>
        <p className="text-xs text-muted-foreground">
          Menschliche Statusänderung ohne Agent-Run oder automatische
          Ausführung.
        </p>
      </div>

      {canPersistIssueStatus && updateIssueStatusAction ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          <label className="grid gap-1.5 text-sm font-medium">
            Neuer Status
            <select
              name="status"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={nextStatus}
              onChange={(event) =>
                setNextStatus(event.currentTarget.value as IssueStatus)
              }>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {issueStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Grund
            <Input
              name="reason"
              placeholder="Kurz, warum der Status wechselt"
              value={reason}
              onChange={(event) => setReason(event.currentTarget.value)}
            />
          </label>

          {actionError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          ) : null}

          <Button type="submit" size="sm" disabled={!canSubmit}>
            {isPending ? 'Speichert...' : 'Status speichern'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Persistente Statusänderungen sind nur für gespeicherte Issues bei
          aktiver Datenbank verfügbar.
        </p>
      )}
    </div>
  );
}

const issuePriorityOptions = [
  'niedrig',
  'mittel',
  'hoch',
] satisfies IssuePriority[];

/**
 * Resolves the currently selected assignee from its stable Auth user ID.
 *
 * @param issue Selected dashboard issue.
 * @returns Matching project member auth ID, or empty string for unassigned.
 */
function getCurrentIssueAssigneeAuthUserId(issue: DashboardIssue) {
  return issue.assigneeAuthUserId ?? '';
}

/**
 * Resolves a human-facing assignee label without using it as an identifier.
 *
 * @param issue Issue with a stable optional assignee Auth user ID.
 * @param projectMembers Membership-scoped display profiles.
 * @returns Profile label, persisted fallback, or unassigned label.
 */
function getIssueAssigneeLabel(
  issue: Pick<
    DashboardIssue,
    'projectKey' | 'assigneeAuthUserId' | 'assigneeLabel'
  >,
  projectMembers: ProjectMemberSummary[]
) {
  if (!issue.assigneeAuthUserId) {
    return issue.assigneeLabel || 'Nicht zugewiesen';
  }

  return (
    projectMembers.find(
      (member) =>
        member.projectKey === issue.projectKey &&
        member.authUserId === issue.assigneeAuthUserId
    )?.label ?? issue.assigneeLabel
  );
}

/**
 * Renders a human-only issue assignment update control.
 *
 * @param props Selected issue, project members, action, and success callback.
 * @returns Compact assignee form or non-persistent explanation.
 */
function IssueAssigneeUpdatePanel({
  issue,
  projectMembers,
  canPersistIssueAssignee,
  updateIssueAssigneeAction,
  readIssueAssigneeOptionsAction,
  onIssueAssigneeUpdated,
}: {
  issue: DashboardIssue;
  projectMembers: ProjectMemberSummary[];
  canPersistIssueAssignee: boolean;
  updateIssueAssigneeAction?: (
    input: UpdateBubblophyIssueAssigneeActionInput
  ) => Promise<UpdateBubblophyIssueAssigneeActionResult>;
  readIssueAssigneeOptionsAction?: (
    input: ReadBubblophyIssueAssigneeOptionsActionInput
  ) => Promise<ReadBubblophyIssueAssigneeOptionsActionResult>;
  onIssueAssigneeUpdated: (issue: IssueSummary) => void;
}) {
  const currentAssigneeAuthUserId = getCurrentIssueAssigneeAuthUserId(issue);
  const [nextAssigneeAuthUserId, setNextAssigneeAuthUserId] = useState(
    currentAssigneeAuthUserId
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const previousIssueIdRef = useRef(issue.id);
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    if (previousIssueIdRef.current === issue.id) {
      return;
    }

    previousIssueIdRef.current = issue.id;
    setNextAssigneeAuthUserId(currentAssigneeAuthUserId);
    setActionError(null);
    setActionSuccess(null);
  }, [currentAssigneeAuthUserId, issue.id]);

  const isKnownAssignee =
    nextAssigneeAuthUserId === '' ||
    Boolean(readIssueAssigneeOptionsAction) ||
    projectMembers.some(
      (member) => member.authUserId === nextAssigneeAuthUserId
    );
  const canSubmit =
    canPersistIssueAssignee &&
    Boolean(updateIssueAssigneeAction) &&
    (Boolean(readIssueAssigneeOptionsAction) || projectMembers.length > 0) &&
    isKnownAssignee &&
    nextAssigneeAuthUserId !== currentAssigneeAuthUserId &&
    !isPending;

  const handleSubmit = () => {
    if (!canSubmit || !updateIssueAssigneeAction) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      try {
        const result = await updateIssueAssigneeAction({
          issueId: issue.id,
          assigneeAuthUserId: nextAssigneeAuthUserId || null,
        });

        if (result.status === 'updated') {
          onIssueAssigneeUpdated(result.issue);
          setActionSuccess('Zuweisung gespeichert.');
          return;
        }

        if (result.status === 'unchanged') {
          setActionSuccess('Zuweisung gespeichert.');
          return;
        }

        setActionError(getIssueAssigneeActionErrorMessage(result));
      } catch {
        setActionError(
          'Die Zuweisung konnte gerade nicht gespeichert werden. Versuche es erneut.'
        );
      }
    });
  };

  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-3">
      <div className="grid gap-1">
        <h4 className="text-sm font-medium">Zuweisung pflegen</h4>
        <p className="text-xs text-muted-foreground">
          Zuweisung an vorhandene Projektmitglieder. Status, Plan und Runs
          bleiben unverändert.
        </p>
      </div>

      {canPersistIssueAssignee && updateIssueAssigneeAction ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          {readIssueAssigneeOptionsAction ? (
            <IssueAssigneeOptionPicker
              issueKey={issue.id}
              selectedAuthUserId={nextAssigneeAuthUserId}
              selectedLabel={issue.assigneeLabel}
              disabled={isPending}
              readOptionsAction={readIssueAssigneeOptionsAction}
              onValueChange={(value) => {
                setNextAssigneeAuthUserId(value);
                setActionError(null);
                setActionSuccess(null);
              }}
            />
          ) : (
            <label className="grid gap-1.5 text-sm font-medium">
              Zuständig
              <select
                name="assigneeAuthUserId"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={nextAssigneeAuthUserId}
                onChange={(event) => {
                  setNextAssigneeAuthUserId(event.currentTarget.value);
                  setActionError(null);
                  setActionSuccess(null);
                }}>
                <option value="">Nicht zugewiesen</option>
                {projectMembers.map((member) => (
                  <option key={member.id} value={member.authUserId}>
                    {member.label}
                    {member.email && member.email !== member.label
                      ? ` · ${member.email}`
                      : ''}{' '}
                    · {projectMemberRoleLabels[member.role]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {actionError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          ) : null}
          {actionSuccess ? (
            <p className="text-sm text-muted-foreground">{actionSuccess}</p>
          ) : null}

          <Button type="submit" size="sm" disabled={!canSubmit}>
            {isPending ? 'Speichert...' : 'Zuweisung speichern'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Persistente Zuweisungen sind nur für gespeicherte Issues mit
          Projektmitgliedern bei aktiver Datenbank verfügbar.
        </p>
      )}
    </div>
  );
}

/**
 * Picks the first selectable priority different from the current issue value.
 *
 * @param priority Current issue priority.
 * @returns A valid target priority for the priority update form.
 */
function getDefaultNextIssuePriority(priority: IssuePriority) {
  return issuePriorityOptions.find((option) => option !== priority) ?? priority;
}

/**
 * Checks whether a form value is a supported issue priority.
 *
 * @param value Form value from the native select.
 * @returns True when the value can be sent to the priority action.
 */
function isIssuePriorityOption(value: string): value is IssuePriority {
  return issuePriorityOptions.includes(value as IssuePriority);
}

/**
 * Renders a human-only issue priority update control.
 *
 * @param props Selected issue, priority action, and success callback.
 * @returns Compact priority form or non-persistent explanation.
 */
function IssuePriorityUpdatePanel({
  issue,
  canPersistIssuePriority,
  updateIssuePriorityAction,
  onIssuePriorityUpdated,
}: {
  issue: DashboardIssue;
  canPersistIssuePriority: boolean;
  updateIssuePriorityAction?: (
    input: UpdateBubblophyIssuePriorityActionInput
  ) => Promise<UpdateBubblophyIssuePriorityActionResult>;
  onIssuePriorityUpdated: (issue: IssueSummary) => void;
}) {
  const availablePriorities = issuePriorityOptions.filter(
    (priority) => priority !== issue.priority
  );
  const [nextPriority, setNextPriority] = useState<IssuePriority>(
    getDefaultNextIssuePriority(issue.priority)
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedNextPriority = availablePriorities.includes(nextPriority)
    ? nextPriority
    : getDefaultNextIssuePriority(issue.priority);
  const canSubmit =
    canPersistIssuePriority &&
    Boolean(updateIssuePriorityAction) &&
    isIssuePriorityOption(selectedNextPriority) &&
    selectedNextPriority !== issue.priority &&
    !isPending;

  const handleSubmit = () => {
    if (!canSubmit || !updateIssuePriorityAction) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    startTransition(async () => {
      try {
        const result = await updateIssuePriorityAction({
          issueId: issue.id,
          priority: selectedNextPriority,
        });

        if (result.status === 'updated') {
          onIssuePriorityUpdated(result.issue);
          setNextPriority(getDefaultNextIssuePriority(result.issue.priority));
          setActionSuccess('Priorität gespeichert.');
          return;
        }

        if (result.status === 'unchanged') {
          setActionSuccess('Priorität gespeichert.');
          return;
        }

        setActionError(getIssuePriorityActionErrorMessage(result));
      } catch {
        setActionError(
          'Die Priorität konnte gerade nicht gespeichert werden. Versuche es erneut.'
        );
      }
    });
  };

  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-3">
      <div className="grid gap-1">
        <h4 className="text-sm font-medium">Priorität pflegen</h4>
        <p className="text-xs text-muted-foreground">
          Menschliche Prioritätsänderung ohne Agent-Run oder automatische
          Ausführung.
        </p>
      </div>

      {canPersistIssuePriority && updateIssuePriorityAction ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          <label className="grid gap-1.5 text-sm font-medium">
            Neue Priorität
            <select
              name="priority"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedNextPriority}
              onChange={(event) => {
                const priority = event.currentTarget.value;

                if (!isIssuePriorityOption(priority)) {
                  return;
                }

                setNextPriority(priority);
                setActionError(null);
                setActionSuccess(null);
              }}>
              {availablePriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {issuePriorityLabels[priority]}
                </option>
              ))}
            </select>
          </label>

          {actionError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          ) : null}
          {actionSuccess ? (
            <p className="text-sm text-muted-foreground">{actionSuccess}</p>
          ) : null}

          <Button type="submit" size="sm" disabled={!canSubmit}>
            {isPending ? 'Speichert...' : 'Priorität speichern'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Persistente Prioritätsänderungen sind nur für gespeicherte Issues bei
          aktiver Datenbank verfügbar.
        </p>
      )}
    </div>
  );
}

/**
 * Renders append-only human notes for the selected issue.
 *
 * @param props Issue, server action, and local append callback.
 * @returns Issue-local note list and note form.
 */
function IssueNotesPanel({
  issue,
  canPersistIssueNotes,
  createIssueNoteAction,
  onIssueNoteCreated,
}: {
  issue: DashboardIssue;
  canPersistIssueNotes: boolean;
  createIssueNoteAction?: (
    input: CreateBubblophyIssueNoteActionInput
  ) => Promise<CreateBubblophyIssueNoteActionResult>;
  onIssueNoteCreated: (issueId: string, note: IssueNoteSummary) => void;
}) {
  const notes = issue.notes ?? [];
  const [noteText, setNoteText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedNote = noteText.trim();
  const canSubmit =
    canPersistIssueNotes &&
    Boolean(createIssueNoteAction) &&
    normalizedNote.length > 0 &&
    normalizedNote.length <= 2000 &&
    !isPending;

  const handleSubmit = () => {
    if (!canSubmit || !createIssueNoteAction) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      try {
        const result = await createIssueNoteAction({
          issueId: issue.id,
          note: noteText,
        });

        if (result.status === 'created') {
          onIssueNoteCreated(issue.id, result.note);
          setNoteText('');
          setActionSuccess('Notiz gespeichert.');
          return;
        }

        setActionError(getIssueNoteActionErrorMessage(result));
      } catch {
        setActionError(
          'Die Notiz konnte gerade nicht gespeichert werden. Versuche es erneut.'
        );
      }
    });
  };

  return (
    <div
      aria-label={`Notizen für ${issue.id}`}
      className="grid gap-3 rounded-md border border-border bg-background p-3">
      <div className="grid gap-1">
        <h4 className="text-sm font-medium">Notizen</h4>
        <p className="text-xs text-muted-foreground">
          Append-only Review- und Planungsnotizen. Kein Run wird gestartet.
        </p>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Notizen für dieses Issue.
        </p>
      ) : (
        <ol className="grid gap-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="grid gap-1 rounded-md border border-border p-2 text-sm">
              <p className="break-words whitespace-pre-wrap">{note.note}</p>
              <p className="text-xs text-muted-foreground">
                {note.actor} · {note.createdAt}
              </p>
            </li>
          ))}
        </ol>
      )}

      {issue.hasMoreNotes ? (
        <p className="text-xs text-muted-foreground">
          Ältere Notizen sind in dieser Ansicht noch nicht geladen.
        </p>
      ) : null}

      {canPersistIssueNotes && createIssueNoteAction ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          <label className="grid gap-1.5 text-sm font-medium">
            Neue Notiz
            <Textarea
              name="issueNote"
              maxLength={2000}
              placeholder="Kurze Entscheidung, Review-Notiz oder Planhinweis"
              value={noteText}
              onChange={(event) => {
                setActionError(null);
                setActionSuccess(null);
                setNoteText(event.currentTarget.value);
              }}
            />
          </label>

          <p className="text-xs text-muted-foreground">
            Maximal 2.000 Zeichen nach Trim. Speichert ein Issue-Event, keinen
            Kommentar-Thread mit Editierfunktion.
          </p>

          {actionError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          ) : null}

          {actionSuccess ? (
            <p role="status" className="text-sm text-muted-foreground">
              {actionSuccess}
            </p>
          ) : null}

          <Button type="submit" size="sm" disabled={!canSubmit}>
            {isPending ? 'Speichert...' : 'Notiz speichern'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Notizen können nur für gespeicherte Issues in aktiven Projekten mit
          Datenbankzugriff angelegt werden.
        </p>
      )}
    </div>
  );
}

/**
 * Renders a human-only agent run request control.
 *
 * @param props Selected issue, bounded options action, and request action.
 * @returns Compact request form or a non-persistent explanation.
 */
function AgentRunRequestPanel({
  dataSource,
  issue,
  readRunTargetOptionsAction,
  requestAgentRunAction,
  onAgentRunRequested,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  issue: DashboardIssue;
  readRunTargetOptionsAction?: (
    input: ReadBubblophyRunTargetOptionsActionInput
  ) => Promise<ReadBubblophyRunTargetOptionsActionResult>;
  requestAgentRunAction?: (
    input: RequestBubblophyAgentRunActionInput
  ) => Promise<RequestBubblophyAgentRunActionResult>;
  onAgentRunRequested: (run: AgentRunSummary) => void;
}) {
  const isDatabaseSource =
    dataSource === 'database' || dataSource === 'empty_database';
  const canRequestRun =
    isDatabaseSource &&
    !isLocalDraftIssue(issue) &&
    Boolean(readRunTargetOptionsAction) &&
    Boolean(requestAgentRunAction);
  const [agentTokenId, setAgentTokenId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canSubmit = canRequestRun && Boolean(agentTokenId) && !isPending;

  const handleSubmit = () => {
    if (!canSubmit || !requestAgentRunAction) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: RequestBubblophyAgentRunActionResult;

      try {
        result = await requestAgentRunAction({
          issueId: issue.id,
          agentTokenId,
          instructions,
        });
      } catch {
        setActionError(
          'Der Run konnte gerade nicht angefragt werden. Prüfe die Verbindung und versuche es erneut.'
        );
        return;
      }

      if (result.status === 'requested') {
        onAgentRunRequested(result.run);
        setInstructions('');
        return;
      }

      setActionError(getAgentRunRequestActionErrorMessage(result));
    });
  };

  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-3">
      <div className="grid gap-1">
        <h4 className="text-sm font-medium">Run anfragen</h4>
        <p className="text-xs text-muted-foreground">
          Erstellt nur einen wartenden Run-Eintrag. Es wird kein Agent gestartet
          und kein Code ausgeführt.
        </p>
      </div>

      {canRequestRun ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          {readRunTargetOptionsAction ? (
            <RunTargetOptionPicker
              issueKey={issue.id}
              selectedTokenId={agentTokenId}
              disabled={isPending}
              readOptionsAction={readRunTargetOptionsAction}
              onValueChange={setAgentTokenId}
            />
          ) : null}

          <label className="grid gap-1.5 text-sm font-medium">
            Auftrag
            <Textarea
              name="instructions"
              placeholder="Optional: Was soll später geprüft werden?"
              maxLength={500}
              value={instructions}
              onChange={(event) => setInstructions(event.currentTarget.value)}
            />
          </label>

          <p className="text-xs text-muted-foreground">
            Maximal 500 Zeichen. Die Anfrage wartet auf menschliche Freigabe;
            sie ist kein Autostart.
          </p>

          {actionError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          ) : null}

          <Button type="submit" size="sm" disabled={!canSubmit}>
            {isPending ? 'Fragt an...' : 'Run anfragen'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          {getAgentRunRequestUnavailableMessage({
            dataSource,
            issue,
            readRunTargetOptionsAction,
            requestAgentRunAction,
          })}
        </p>
      )}
    </div>
  );
}

/**
 * Renders the human issue plan draft dialog.
 *
 * @param props Selected issue, optional existing plan, and server action.
 * @returns Dialog for writing a plan without starting an agent run.
 */
function IssuePlanDraftDialog({
  issue,
  issuePlan,
  open,
  createIssuePlanAction,
  onIssuePlanSaved,
  onOpenChange,
}: {
  issue: DashboardIssue;
  issuePlan?: IssuePlanDraft;
  open: boolean;
  createIssuePlanAction?: (
    input: CreateBubblophyIssuePlanActionInput
  ) => Promise<CreateBubblophyIssuePlanActionResult>;
  onIssuePlanSaved: (plan: IssuePlanDraft) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [summary, setSummary] = useState(issuePlan?.summary ?? '');
  const [steps, setSteps] = useState(
    issuePlan?.steps.map((step) => step.text) ?? ['']
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const normalizedSteps = steps
    .map((step) => step.trim())
    .filter((step) => step.length > 0);
  const canSubmit =
    Boolean(createIssuePlanAction) && normalizedSteps.length > 0 && !isPending;

  const updateStep = (index: number, value: string) => {
    setSteps((currentSteps) =>
      currentSteps.map((step, stepIndex) =>
        stepIndex === index ? value : step
      )
    );
  };

  const removeStep = (index: number) => {
    setSteps((currentSteps) =>
      currentSteps.filter((_, stepIndex) => stepIndex !== index)
    );
  };

  const handleSubmit = () => {
    if (!canSubmit || !createIssuePlanAction) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      try {
        const result = await createIssuePlanAction({
          issueId: issue.id,
          summary,
          steps: normalizedSteps,
        });

        if (result.status === 'created') {
          onIssuePlanSaved(result.plan);
          onOpenChange(false);
          return;
        }

        setActionError(getIssuePlanActionErrorMessage(result));
      } catch {
        setActionError(
          'Der Plan konnte gerade nicht gespeichert werden. Versuche es erneut.'
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90svh,42rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {issuePlan ? 'Plan bearbeiten' : 'Plan entwerfen'}
          </DialogTitle>
          <DialogDescription>
            Speichert eine neue menschliche Planversion für {issue.id}. Es wird
            kein Agent-Run gestartet.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}>
          <label className="grid gap-1.5 text-sm font-medium">
            Plan-Zusammenfassung
            <Textarea
              name="summary"
              placeholder="Was ist der menschliche Arbeitsplan?"
              value={summary}
              onChange={(event) => setSummary(event.currentTarget.value)}
            />
          </label>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Schritte</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={steps.length >= 12 || isPending}
                onClick={() =>
                  setSteps((currentSteps) => [...currentSteps, ''])
                }>
                Schritt hinzufügen
              </Button>
            </div>
            {steps.map((step, index) => (
              <div
                key={`${index}-${steps.length}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  aria-label={`Schritt ${index + 1}`}
                  value={step}
                  placeholder={`Schritt ${index + 1}`}
                  onChange={(event) =>
                    updateStep(index, event.currentTarget.value)
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={steps.length === 1 || isPending}
                  onClick={() => removeStep(index)}>
                  Entfernen
                </Button>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Plan-Speichern prüft Session und Projektmitgliedschaft serverseitig,
            schreibt eine neue Planversion plus Audit-Event und startet keinen
            Agent-Run.
          </div>

          {actionError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? 'Speichert...' : 'Plan speichern'}
            </Button>
          </DialogFooter>

          {!canSubmit ? (
            <p className="text-xs text-muted-foreground">
              Mindestens ein nicht-leerer Schritt ist nötig.
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders scoped agent token state.
 *
 * @param props Dashboard snapshot with agent token summaries.
 * @returns Agent token panel.
 */
function AgentAccess({
  dataSource,
  agentTokens,
  projects,
  canCreateAgentToken,
  canUpdateAgentTokens,
  manageableProjectKeys,
  updateAgentTokenLifecycleAction,
  onCreateAgentToken,
  onAgentTokenLifecycleUpdated,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  agentTokens: AgentTokenSummary[];
  projects: ProjectSummary[];
  canCreateAgentToken: boolean;
  canUpdateAgentTokens: boolean;
  manageableProjectKeys: ReadonlySet<string>;
  updateAgentTokenLifecycleAction?: (
    input: UpdateBubblophyAgentTokenLifecycleActionInput
  ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>;
  onCreateAgentToken: () => void;
  onAgentTokenLifecycleUpdated: (token: AgentTokenSummary) => void;
}) {
  const isDatabaseSource =
    dataSource === 'database' || dataSource === 'empty_database';

  return (
    <Card id="agents" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon
            aria-hidden
            icon={UserGroupIcon}
            strokeWidth={2}
            className="size-4"
          />
          Agent-Tokens
        </CardTitle>
        <CardDescription>
          Projektbegrenzt, gehasht gespeichert, ohne Supabase-Service-Role.
        </CardDescription>
        {canCreateAgentToken ? (
          <CardAction>
            <Button type="button" size="sm" onClick={onCreateAgentToken}>
              Agent-Token erstellen
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3">
        {!isDatabaseSource && agentTokens.length > 0 ? (
          <p className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Beispielhafte Agent-Token-Vorschau aus Sample/Fallback-Daten. Hier
            sind keine operativen Tokens aktiv.
          </p>
        ) : null}
        {agentTokens.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Noch keine Agent-Tokens für diese Datenquelle.
          </p>
        ) : null}
        {agentTokens.map((token) => (
          <div key={token.id} className="rounded-md border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{token.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {token.projectKey} · {token.lastUsedAt}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ablauf: {token.expiresAt}
                </p>
              </div>
              <Badge variant={tokenVariant[token.state]}>
                {agentTokenStateLabels[token.state]}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {token.scopes.map((scope) => (
                <Badge key={scope} variant="outline">
                  {scope}
                </Badge>
              ))}
            </div>
            {canUpdateAgentTokens &&
            manageableProjectKeys.has(token.projectKey) &&
            updateAgentTokenLifecycleAction ? (
              <AgentTokenLifecycleControls
                key={`${token.id}-${token.state}`}
                token={token}
                updateAgentTokenLifecycleAction={
                  updateAgentTokenLifecycleAction
                }
                onAgentTokenLifecycleUpdated={onAgentTokenLifecycleUpdated}
              />
            ) : null}
            {isDatabaseSource ? (
              <AgentTokenHandoff
                token={token}
                projectId={
                  projects.find((project) => project.key === token.projectKey)
                    ?.id
                }
              />
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Renders local-agent usage details for one public token row.
 *
 * @param props Public token summary and optional resolved project database ID.
 * @returns Narrow handoff guide for the existing agent read/update endpoints.
 */
function AgentTokenHandoff({
  token,
  projectId,
}: {
  token: AgentTokenSummary;
  projectId?: string;
}) {
  const canReadIssueContext =
    token.state === 'aktiv' && token.scopes.includes('issues:read');
  const canUpdateRuns =
    token.state === 'aktiv' && token.scopes.includes('runs:update');
  const projectIssuesEndpoint = buildAgentProjectIssuesEndpoint(projectId);
  const projectIssuesCurl = buildAgentProjectIssuesCurlExample(projectId);

  return (
    <div className="mt-3 grid gap-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
      <div className="grid gap-1">
        <p className="text-sm font-medium">Lokaler Agent-Handoff</p>
        <p className="text-xs text-muted-foreground">
          Die nutzbaren Agent-API-Pfade sind aktuell offene Issues eines
          Projekts lesen und Status-Update. Planen, Run-Erstellen und
          Issue-Schreiben bleiben bis zu eigenen Endpunkten in der App beim
          Menschen.
        </p>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2 rounded-md border border-border bg-background/60 p-3">
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">GET Projekt-Issues</dt>
              <dd className="font-mono break-all">{projectIssuesEndpoint}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Benötigter Scope</dt>
              <dd className="font-mono">issues:read</dd>
            </div>
          </dl>

          {canReadIssueContext ? (
            <CopyableCommandBlock
              label="Issue-Kontext kopieren"
              value={projectIssuesCurl}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Dieses Token kann keine Projekt-Issues lesen, weil es nicht aktiv
              ist oder der Scope <span className="font-mono">issues:read</span>{' '}
              fehlt.
            </p>
          )}
        </div>

        <div className="grid gap-2 rounded-md border border-border bg-background/60 p-3">
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">PATCH Status</dt>
              <dd className="font-mono break-all">
                {buildAgentRunUpdateEndpoint()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Benötigter Scope</dt>
              <dd className="font-mono">runs:update</dd>
            </div>
          </dl>

          {canUpdateRuns ? (
            <CopyableCommandBlock
              label="PATCH-Beispiel kopieren"
              value={buildAgentRunUpdateCurlExample()}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Dieses Token kann keine Agent-Run-Statusupdates schreiben, weil es
              nicht aktiv ist oder der Scope{' '}
              <span className="font-mono">runs:update</span> fehlt.
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-mono">running</span>,{' '}
        <span className="font-mono">needs_review</span>,{' '}
        <span className="font-mono">completed</span> und{' '}
        <span className="font-mono">failed</span> speichern nur Status, Message
        und Result-JSON. Bubblophy führt dadurch keinen Code aus und startet
        keinen Hintergrundprozess.
      </p>
    </div>
  );
}

/**
 * Builds the agent project issue endpoint with a resolved ID when available.
 *
 * @param projectId Project database ID resolved from the token project key.
 * @returns Endpoint path with a real ID or the safe placeholder.
 */
function buildAgentProjectIssuesEndpoint(projectId?: string) {
  return `/api/agent-projects/${projectId ?? '<project-id>'}/issues`;
}

/**
 * Builds the copyable read-only issue-context command for local agents.
 *
 * @param projectId Project database ID resolved from the token project key.
 * @returns Curl example with a real project ID or the safe placeholder.
 */
function buildAgentProjectIssuesCurlExample(projectId?: string) {
  return `curl -X GET "$BUBBLOPHY_BASE_URL${buildAgentProjectIssuesEndpoint(projectId)}" \\
  -H "Authorization: Bearer <agent-token>"`;
}

/**
 * Builds the agent run update endpoint with a concrete run ID when available.
 *
 * @param runId Agent run database ID for a concrete local handoff.
 * @returns Endpoint path with a real run ID or the safe placeholder.
 */
function buildAgentRunUpdateEndpoint(runId?: string) {
  return `/api/agent-runs/${runId ?? '<run-id>'}`;
}

/**
 * Builds the copyable run update command for local agents.
 *
 * @param runId Agent run database ID for a concrete local handoff.
 * @returns Curl example with a real run ID or the safe placeholder.
 */
function buildAgentRunUpdateCurlExample(runId?: string) {
  return `curl -X PATCH "$BUBBLOPHY_BASE_URL${buildAgentRunUpdateEndpoint(runId)}" \\
  -H "Authorization: Bearer <agent-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"state":"running","message":"Lokaler Agent hat begonnen."}'`;
}

/**
 * Checks whether a run state can accept scoped agent status updates.
 *
 * @param state Dashboard run state.
 * @returns True when a local agent handoff is meaningful for this state.
 */
function canShowConcreteAgentRunHandoff(state: AgentRunState) {
  return agentUpdateableRunStates.includes(state);
}

/**
 * Renders a copyable command or secret block without persisting its value.
 *
 * @param props Button label and text value to copy.
 * @returns Code block with optional clipboard feedback.
 */
function CopyableCommandBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle'
  );

  const handleCopy = () => {
    if (!navigator.clipboard) {
      setCopyState('failed');
      return;
    }

    void navigator.clipboard
      .writeText(value)
      .then(() => setCopyState('copied'))
      .catch(() => setCopyState('failed'));
  };

  return (
    <div className="grid min-w-0 gap-2">
      <pre className="min-w-0 overflow-x-auto rounded-md bg-background p-3 text-xs">
        <code>{value}</code>
      </pre>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
          {label}
        </Button>
        {copyState === 'copied' ? (
          <span className="text-xs text-muted-foreground">Kopiert.</span>
        ) : null}
        {copyState === 'failed' ? (
          <span className="text-xs text-muted-foreground">
            Manuell kopieren.
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Renders real server-backed lifecycle controls for one agent token.
 *
 * @param props Token row, lifecycle action, and success callback.
 * @returns Inline lifecycle buttons with explicit denial feedback.
 */
function AgentTokenLifecycleControls({
  token,
  updateAgentTokenLifecycleAction,
  onAgentTokenLifecycleUpdated,
}: {
  token: AgentTokenSummary;
  updateAgentTokenLifecycleAction: (
    input: UpdateBubblophyAgentTokenLifecycleActionInput
  ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>;
  onAgentTokenLifecycleUpdated: (token: AgentTokenSummary) => void;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRevokeConfirming, setIsRevokeConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const availableDecisions = getAvailableAgentTokenLifecycleDecisions(token);

  const handleDecision = (
    decision: UpdateBubblophyAgentTokenLifecycleActionInput['decision']
  ) => {
    if (isPending) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: UpdateBubblophyAgentTokenLifecycleActionResult;

      try {
        result = await updateAgentTokenLifecycleAction({
          tokenId: token.id,
          decision,
        });
      } catch {
        setActionError(
          'Das Agent-Token konnte gerade nicht geändert werden. Versuche es erneut.'
        );
        return;
      }

      if (result.status === 'updated' || result.status === 'unchanged') {
        onAgentTokenLifecycleUpdated(result.token);
        setIsRevokeConfirming(false);
        return;
      }

      setActionError(getAgentTokenLifecycleActionErrorMessage(result));
    });
  };

  if (availableDecisions.length === 0) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        Für diesen Token sind keine weiteren Lifecycle-Aktionen verfügbar.
      </p>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      <div className="flex flex-wrap gap-2">
        {availableDecisions.map((decision) =>
          decision === 'revoke' ? (
            <Button
              key={decision}
              type="button"
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                setActionError(null);
                setIsRevokeConfirming(true);
              }}>
              {getAgentTokenLifecycleDecisionLabel(decision)}
            </Button>
          ) : (
            <Button
              key={decision}
              type="button"
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => handleDecision(decision)}>
              {getAgentTokenLifecycleDecisionLabel(decision)}
            </Button>
          )
        )}
      </div>
      {isRevokeConfirming ? (
        <div className="grid gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
          <p className="text-xs text-muted-foreground">
            Widerruf ist endgültig. Dieses Token kann danach nicht fortgesetzt
            werden.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => handleDecision('revoke')}>
              Endgültig widerrufen
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setIsRevokeConfirming(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      ) : null}
      {actionError ? (
        <p role="alert" className="text-xs text-destructive">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Renders the human-controlled agent token creation dialog.
 *
 * @param props Projects, server action, and one-time result callback.
 * @returns Dialog for creating a scoped agent token without starting a run.
 */
function NewAgentTokenDialog({
  projects,
  open,
  createAgentTokenAction,
  onAgentTokenCreated,
  onOpenChange,
}: {
  projects: ProjectSummary[];
  open: boolean;
  createAgentTokenAction?: (
    input: CreateBubblophyAgentTokenActionInput
  ) => Promise<CreateBubblophyAgentTokenActionResult>;
  onAgentTokenCreated: (token: CreatedAgentToken) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [projectKey, setProjectKey] = useState(projects[0]?.key ?? '');
  const [label, setLabel] = useState('');
  const [scopes, setScopes] = useState<string[]>([
    'projects:read',
    'issues:read',
  ]);
  const [expiresAt, setExpiresAt] = useState('');
  const [createdToken, setCreatedToken] = useState<CreatedAgentToken | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canSubmit =
    Boolean(createAgentTokenAction) &&
    Boolean(projectKey) &&
    Boolean(label.trim()) &&
    scopes.length > 0 &&
    !isPending &&
    !createdToken;

  const toggleScope = (scope: string) => {
    setScopes((currentScopes) =>
      currentScopes.includes(scope)
        ? currentScopes.filter((currentScope) => currentScope !== scope)
        : [...currentScopes, scope]
    );
  };

  const handleSubmit = () => {
    if (!canSubmit || !createAgentTokenAction) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      let result: CreateBubblophyAgentTokenActionResult;

      try {
        result = await createAgentTokenAction({
          projectKey,
          label,
          scopes,
          ...(expiresAt ? { expiresAt } : {}),
        });
      } catch {
        setActionError(
          'Das Agent-Token konnte gerade nicht erstellt werden. Versuche es erneut.'
        );
        return;
      }

      if (result.status === 'created') {
        setCreatedToken(result.token);
        onAgentTokenCreated(result.token);
        return;
      }

      setActionError(getAgentTokenActionErrorMessage(result));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90svh,42rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agent-Token erstellen</DialogTitle>
          <DialogDescription>
            Erstellt ein projektbegrenztes Token. Der Klartext wird nur einmal
            angezeigt und nicht im Browser gespeichert.
          </DialogDescription>
        </DialogHeader>

        {createdToken ? (
          <div className="grid gap-4">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium">Token jetzt kopieren</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dieser Klartext ist später nicht wieder sichtbar. Speichere ihn
                nicht in localStorage und teile ihn nur mit dem vorgesehenen
                Agent-Prozess.
              </p>
              <div className="mt-3">
                <CopyableCommandBlock
                  label="Token kopieren"
                  value={createdToken.plaintextToken}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Ablauf: {createdToken.expiresAt}
              </p>
            </div>
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
              <p className="text-sm font-medium">Nutzung für lokale Agenten</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nutze das Token als Bearer Secret nur für die gewählten Scopes.
                Die Beispiele bleiben bei Platzhaltern, damit keine echten
                Secrets in Logs oder Dokumentation landen.
              </p>
              <div className="mt-3 grid gap-3">
                {createdToken.scopes.includes('issues:read') ? (
                  <CopyableCommandBlock
                    label="Issue-Kontext kopieren"
                    value={buildAgentProjectIssuesCurlExample()}
                  />
                ) : null}
                {createdToken.scopes.includes('runs:update') ? (
                  <CopyableCommandBlock
                    label="PATCH-Beispiel kopieren"
                    value={buildAgentRunUpdateCurlExample()}
                  />
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Fertig
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}>
            <label className="grid gap-1.5 text-sm font-medium">
              Projekt
              <select
                name="projectKey"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={projectKey}
                onChange={(event) => setProjectKey(event.currentTarget.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.key}>
                    {project.key} · {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              Label
              <Input
                name="label"
                placeholder="Codex lokal"
                value={label}
                onChange={(event) => setLabel(event.currentTarget.value)}
              />
            </label>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Scopes</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {agentTokenScopeOptions.map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={scopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                    />
                    <span>{scope}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="grid gap-1.5 text-sm font-medium">
              Ablauf
              <Input
                name="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.currentTarget.value)}
              />
              <span className="text-xs font-normal text-muted-foreground">
                Optional. Leer bedeutet, dass das Token nicht automatisch
                abläuft. Der Ablauf muss in der Zukunft liegen und maximal 366
                Tage entfernt sein.
              </span>
            </label>

            <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Token-Erstellung prüft serverseitig Owner/Maintainer-Rollen,
              speichert nur den Hash und startet keinen Agent-Run. Projektweite
              Audit-Events folgen mit einem eigenen Event-Modell.
            </div>

            {actionError ? (
              <p role="alert" className="text-sm text-destructive">
                {actionError}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isPending ? 'Erstellt...' : 'Token erstellen'}
              </Button>
            </DialogFooter>

            {!canSubmit ? (
              <p className="text-xs text-muted-foreground">
                Projekt, Label und mindestens ein Scope sind nötig.
              </p>
            ) : null}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders pending and reviewable agent runs.
 *
 * @param props Data source and agent run summaries.
 * @returns Run queue panel.
 */
function RunQueue({
  dataSource,
  agentRuns,
  selectedProjectKey,
  runPageStatus,
  runCursor,
  nextAfter,
  writableIssueIds,
  transitionAgentRunAction,
  onAgentRunTransitioned,
  onIssueSelect,
  onFirstPage,
  onNextPage,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  agentRuns: AgentRunSummary[];
  selectedProjectKey: ProjectFilterKey;
  runPageStatus: ReadDashboardRunPageResult['status'] | 'loading' | null;
  runCursor: DashboardRunCursor | null;
  nextAfter: DashboardRunCursor | null;
  writableIssueIds: ReadonlySet<string>;
  transitionAgentRunAction?: (
    input: TransitionBubblophyAgentRunActionInput
  ) => Promise<TransitionBubblophyAgentRunActionResult>;
  onAgentRunTransitioned: (run: AgentRunSummary) => void;
  onIssueSelect: (issueId: string) => void;
  onFirstPage: () => void;
  onNextPage: (after: DashboardRunCursor) => void;
}) {
  const isDatabaseSource =
    dataSource === 'database' || dataSource === 'empty_database';

  return (
    <Card id="runs" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon
            aria-hidden
            icon={FlashIcon}
            strokeWidth={2}
            className="size-4"
          />
          Runs
        </CardTitle>
        <CardDescription>
          Agent-Runs entstehen nur nach Anfrage und expliziter menschlicher
          Freigabe.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {selectedProjectKey !== 'all' && runPageStatus === 'success' ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border/60 pb-3">
            {runCursor ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onFirstPage}>
                Zur ersten Run-Seite
              </Button>
            ) : null}
            {nextAfter ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onNextPage(nextAfter)}>
                Weitere 20 Runs
              </Button>
            ) : null}
          </div>
        ) : null}
        {selectedProjectKey !== 'all' &&
        runPageStatus === 'database_unavailable' ? (
          <p role="status" className="text-sm text-muted-foreground">
            Die Run-Liste ist gerade nicht verfügbar. Andere Dashboard-Bereiche
            bleiben nutzbar.
          </p>
        ) : null}
        {selectedProjectKey !== 'all' && runPageStatus === 'loading' ? (
          <p role="status" className="text-sm text-muted-foreground">
            Run-Liste wird geladen.
          </p>
        ) : null}
        {!isDatabaseSource ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Sample/Fallback zeigt keine operative Run-Queue. Echte Runs werden
            erst angezeigt, wenn ein gespeicherter, menschlich freigegebener
            Run-Workflow existiert.
          </div>
        ) : null}
        {isDatabaseSource &&
        runPageStatus !== 'database_unavailable' &&
        runPageStatus !== 'loading' &&
        agentRuns.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Noch keine Runs. Bubblophy startet keine Agenten automatisch; ein
            Run-Request braucht immer eine explizite menschliche Freigabe.
          </div>
        ) : null}
        {isDatabaseSource
          ? agentRuns.map((run) => {
              const canTransitionRun = writableIssueIds.has(run.issueId);

              return (
                <div
                  key={run.id}
                  className="grid min-w-0 gap-2 rounded-md bg-muted/30 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{run.issueId}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.agentLabel} · angefragt von {run.requestedBy}
                      </p>
                    </div>
                    <Badge variant={runVariant[run.state]}>
                      {agentRunStateLabels[run.state]}
                    </Badge>
                  </div>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onIssueSelect(run.issueId)}>
                      Issue öffnen
                    </Button>
                  </div>
                  <dl className="grid gap-1 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Run-ID</dt>
                      <dd className="font-mono break-all">{run.id}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    {run.lastEvent}
                  </p>
                  {run.resultSummary ? (
                    <AgentRunResultSummary summary={run.resultSummary} />
                  ) : null}
                  {run.state === 'review' ? (
                    <div className="rounded-md border border-border bg-background/60 p-2 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">
                        Review nötig
                      </p>
                      <p>
                        Prüfe das Ergebnis im Issue {run.issueId}. Entscheide
                        dort über Status, Notiz oder Plan und frage bewusst
                        einen neuen Run an, falls weitere Agent-Arbeit nötig
                        ist.
                      </p>
                    </div>
                  ) : null}
                  {canShowConcreteAgentRunHandoff(run.state) &&
                  run.canAgentReportStatus ? (
                    <div className="grid gap-2 rounded-md border border-border bg-background/60 p-2">
                      <p className="text-xs text-muted-foreground">
                        Lokaler Agent kann für diesen Run Status melden. Kein
                        Autostart, nur PATCH mit Token-Platzhalter.
                      </p>
                      <CopyableCommandBlock
                        label={`PATCH für ${run.id} kopieren`}
                        value={buildAgentRunUpdateCurlExample(run.id)}
                      />
                    </div>
                  ) : null}
                  {run.state === 'wartet' &&
                  canTransitionRun &&
                  transitionAgentRunAction ? (
                    <RunDecisionControls
                      run={run}
                      transitionAgentRunAction={transitionAgentRunAction}
                      onAgentRunTransitioned={onAgentRunTransitioned}
                    />
                  ) : null}
                </div>
              );
            })
          : null}
      </CardContent>
    </Card>
  );
}

function AgentRunResultSummary({ summary }: { summary: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background/60 p-2 text-xs">
      <p className="font-medium text-foreground">Agent-Ergebnis</p>
      <p className="mt-1 break-words text-muted-foreground">{summary}</p>
    </div>
  );
}

function AgentRunResultNoteAction({
  issueId,
  run,
  createIssueNoteAction,
  onIssueNoteCreated,
}: {
  issueId: string;
  run: AgentRunSummary;
  createIssueNoteAction: (
    input: CreateBubblophyIssueNoteActionInput
  ) => Promise<CreateBubblophyIssueNoteActionResult>;
  onIssueNoteCreated: (issueId: string, note: IssueNoteSummary) => void;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (isPending || !run.resultSummary) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      try {
        const result = await createIssueNoteAction({
          issueId,
          note: buildAgentRunResultNoteText(run),
        });

        if (result.status === 'created') {
          onIssueNoteCreated(issueId, result.note);
          setActionSuccess(
            `Agent-Ergebnis aus Run ${run.id} wurde als Notiz gespeichert.`
          );
          return;
        }

        setActionError(getIssueNoteActionErrorMessage(result));
      } catch {
        setActionError(
          'Das Agent-Ergebnis konnte gerade nicht als Notiz gespeichert werden. Versuche es erneut.'
        );
      }
    });
  };

  return (
    <div className="grid gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={handleSave}>
        {isPending ? 'Speichert...' : 'Als Notiz übernehmen'}
      </Button>
      {actionError ? (
        <p role="alert" className="text-xs text-destructive">
          {actionError}
        </p>
      ) : null}
      {actionSuccess ? (
        <p role="status" className="text-xs text-muted-foreground">
          {actionSuccess}
        </p>
      ) : null}
    </div>
  );
}

function buildAgentRunResultNoteText(run: AgentRunSummary) {
  return `Agent-Ergebnis aus Run ${run.id}:\n\n${run.resultSummary ?? ''}`;
}

/**
 * Renders real human approve/cancel actions for a requested run.
 *
 * @param props Run row, server action, and success callback.
 * @returns Inline decision buttons with server-backed feedback.
 */
function RunDecisionControls({
  run,
  transitionAgentRunAction,
  onAgentRunTransitioned,
}: {
  run: AgentRunSummary;
  transitionAgentRunAction: (
    input: TransitionBubblophyAgentRunActionInput
  ) => Promise<TransitionBubblophyAgentRunActionResult>;
  onAgentRunTransitioned: (run: AgentRunSummary) => void;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDecision = (
    decision: TransitionBubblophyAgentRunActionInput['decision']
  ) => {
    if (isPending) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      try {
        const result = await transitionAgentRunAction({
          runId: run.id,
          decision,
        });

        if (result.status === 'updated') {
          onAgentRunTransitioned(result.run);
          return;
        }

        setActionError(getAgentRunTransitionActionErrorMessage(result));
      } catch {
        setActionError(
          'Die Run-Entscheidung konnte gerade nicht gespeichert werden. Versuche es erneut.'
        );
      }
    });
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => handleDecision('approve')}>
          {isPending ? 'Prüft...' : 'Freigeben'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleDecision('cancel')}>
          Abbrechen
        </Button>
      </div>
      {actionError ? (
        <p role="alert" className="text-xs text-destructive">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Renders recent audit-visible activity.
 *
 * @param props Dashboard snapshot with activity events.
 * @returns Activity timeline panel.
 */
function ActivityFeed({
  activity,
  dataSource,
  kind,
  cursor,
  nextAfter,
  status,
  onKindChange,
  onFirstPage,
  onNextPage,
}: {
  activity: Array<
    DashboardSnapshot['activity'][number] | DashboardActivityPageItem
  >;
  dataSource: DashboardSnapshot['meta']['dataSource'];
  kind: DashboardActivityKind;
  cursor: DashboardActivityCursor | null;
  nextAfter: DashboardActivityCursor | null;
  status: ReadDashboardActivityPageResult['status'] | 'loading' | null;
  onKindChange: (kind: DashboardActivityKind) => void;
  onFirstPage: () => void;
  onNextPage: (after: DashboardActivityCursor) => void;
}) {
  const isDatabaseSource =
    dataSource === 'database' || dataSource === 'empty_database';
  const hasLoadError =
    status === 'database_unavailable' ||
    status === 'invalid' ||
    status === 'not_found';

  return (
    <Card id="activity" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon
            aria-hidden
            icon={DashboardSquare01Icon}
            strokeWidth={2}
            className="size-4"
          />
          Aktivität
        </CardTitle>
        <CardDescription>
          Neueste Projekt- und Issue-Ereignisse aus dem Audit-Verlauf.
        </CardDescription>
        {isDatabaseSource ? (
          <CardAction>
            <Select
              value={kind}
              onValueChange={(value) => {
                if (isDashboardActivityKind(value)) {
                  onKindChange(value);
                }
              }}>
              <SelectTrigger aria-label="Ereignisart filtern" size="sm">
                <SelectValue>{activityKindLabels[kind]}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value="all">Alle Ereignisse</SelectItem>
                  <SelectItem value="issue">Issue-Ereignisse</SelectItem>
                  <SelectItem value="project">Projekt-Ereignisse</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!isDatabaseSource && activity.length > 0 ? (
          <p className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Beispielhafte Audit-Vorschau aus Sample/Fallback-Daten. Echte
            Projekt-Events werden nur im Datenbankmodus geladen.
          </p>
        ) : null}
        {status === 'loading' ? (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Audit-Aktivität wird geladen.
          </p>
        ) : null}
        {hasLoadError ? (
          <p
            role="alert"
            className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Audit-Aktivität konnte nicht geladen werden. Lade die Seite erneut.
          </p>
        ) : null}
        {status !== 'loading' && !hasLoadError && activity.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Für diesen Ausschnitt gibt es noch keine Audit-Aktivität.
          </p>
        ) : null}
        <ol className="grid gap-3">
          {activity.map((event) => (
            <li
              key={event.id}
              className="grid grid-cols-[5.25rem_minmax(0,1fr)] gap-3 text-sm">
              <time
                dateTime={event.occurredAt}
                title={event.occurredAt}
                className="font-mono text-xs text-muted-foreground tabular-nums">
                {formatDashboardActivityTime(event.occurredAt)}
              </time>
              <div className="border-l border-border pl-3">
                <p>{event.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.actor}
                </p>
              </div>
            </li>
          ))}
        </ol>
        {isDatabaseSource && !hasLoadError ? (
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!cursor || status === 'loading'}
              onClick={onFirstPage}>
              Erste Seite
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!nextAfter || status === 'loading'}
              onClick={() => {
                if (nextAfter) {
                  onNextPage(nextAfter);
                }
              }}>
              Weiter
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

const activityKindLabels = {
  all: 'Alle Ereignisse',
  issue: 'Issue-Ereignisse',
  project: 'Projekt-Ereignisse',
} satisfies Record<DashboardActivityKind, string>;

/** Formats ISO audit timestamps compactly without locale-dependent hydration. */
function formatDashboardActivityTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);

  return match ? `${match[3]}.${match[2]}. ${match[4]}:${match[5]}` : value;
}

/** Checks the three selectable audit filter values from the UI primitive. */
function isDashboardActivityKind(
  value: string | null
): value is DashboardActivityKind {
  return value === 'all' || value === 'issue' || value === 'project';
}

/**
 * Renders a local-only issue draft dialog.
 *
 * @param props Project options, open state, and current project filter.
 * @returns Dialog for drafting an issue without persisting it.
 */
function NewIssueDraftDialog({
  projects,
  open,
  selectedProjectKey,
  canPersistToDatabase,
  createIssueAction,
  onCreateDraft,
  onPersistedIssueCreated,
  onOpenChange,
}: {
  projects: DashboardSnapshot['projects'];
  open: boolean;
  selectedProjectKey: ProjectFilterKey;
  canPersistToDatabase: boolean;
  createIssueAction?: (
    input: CreateBubblophyIssueActionInput
  ) => Promise<CreateBubblophyIssueActionResult>;
  onCreateDraft: (input: LocalDraftIssueInput) => void;
  onPersistedIssueCreated: (issue: IssueSummary) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const defaultProjectKey =
    selectedProjectKey === 'all'
      ? (projects[0]?.key ?? '')
      : selectedProjectKey;
  const [projectKey, setProjectKey] = useState(defaultProjectKey);
  const wasOpenRef = useRef(open);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('mittel');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPersistPending, startPersistTransition] = useTransition();
  const canCreateDraft = title.trim().length > 0 && projectKey.length > 0;
  const canSaveToDatabase =
    canPersistToDatabase &&
    Boolean(createIssueAction) &&
    canCreateDraft &&
    !isPersistPending;

  const draftInput = {
    description,
    priority,
    projectKey,
    title,
  } satisfies PersistedIssueInput;

  useEffect(() => {
    const wasOpen = wasOpenRef.current;

    wasOpenRef.current = open;

    if (open && !wasOpen) {
      setProjectKey(defaultProjectKey);
    }
  }, [defaultProjectKey, open]);

  const handleLocalDraftCreate = () => {
    if (!canCreateDraft || isPersistPending) {
      return;
    }

    setActionError(null);
    onCreateDraft(draftInput);
  };

  const handleDatabaseSave = () => {
    if (!canSaveToDatabase || !createIssueAction) {
      return;
    }

    setActionError(null);
    startPersistTransition(async () => {
      let result: CreateBubblophyIssueActionResult;

      try {
        result = await createIssueAction(draftInput);
      } catch {
        setActionError(
          'Das Issue konnte gerade nicht gespeichert werden. Prüfe die Verbindung und versuche es erneut.'
        );
        return;
      }

      if (result.status === 'created') {
        onPersistedIssueCreated(result.issue);
        return;
      }

      setActionError(getCreateIssueActionErrorMessage(result));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90svh,42rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {canPersistToDatabase ? 'Neues Issue' : 'Neues Issue als Draft'}
          </DialogTitle>
          <DialogDescription>
            {canPersistToDatabase
              ? 'Erstelle ein echtes Issue im ausgewählten Projekt. Lokale Drafts sind nur eine kurzfristige Arbeitshilfe.'
              : 'Datenbank nicht aktiv, Draft bleibt lokal und wird nicht in Supabase oder Postgres gespeichert.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();

            if (canPersistToDatabase) {
              handleDatabaseSave();
            } else {
              handleLocalDraftCreate();
            }
          }}>
          <label className="grid gap-1.5 text-sm font-medium">
            Projekt
            <select
              name="project"
              value={projectKey}
              onChange={(event) => setProjectKey(event.currentTarget.value)}
              className="h-8 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30">
              {projects.map((project) => (
                <option key={project.id} value={project.key}>
                  {project.key} · {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Titel
            <Input
              name="title"
              placeholder="Kurzer Issue-Titel"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Beschreibung
            <Textarea
              name="description"
              placeholder="Was soll menschlich entschieden oder agentisch vorbereitet werden?"
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Priorität
            <select
              name="priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.currentTarget.value as IssuePriority)
              }
              className="h-8 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30">
              <option value="niedrig">Niedrig</option>
              <option value="mittel">Mittel</option>
              <option value="hoch">Hoch</option>
            </select>
          </label>

          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            {canPersistToDatabase
              ? 'Issue erstellen speichert in der Datenbank. Lokale Drafts bleiben nur in dieser Oberfläche und werden nicht mit dem Projekt geteilt.'
              : 'Datenbank nicht aktiv. Lokale Drafts bleiben nur in dieser Oberfläche und werden nicht mit dem Projekt geteilt.'}
          </div>

          {actionError ? (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPersistPending}
              onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            {canPersistToDatabase ? (
              <Button
                type="button"
                variant="outline"
                disabled={!canCreateDraft || isPersistPending}
                onClick={handleLocalDraftCreate}>
                Nur lokal vormerken
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={
                canPersistToDatabase ? !canSaveToDatabase : !canCreateDraft
              }>
              {canPersistToDatabase
                ? isPersistPending
                  ? 'Erstellt...'
                  : 'Issue erstellen'
                : 'Draft anlegen'}
            </Button>
          </DialogFooter>
          {!canCreateDraft ? (
            <p className="text-xs text-muted-foreground">
              Titel und Projekt sind nötig, bevor ein Issue angelegt wird.
            </p>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Converts server action outcomes into quiet dialog feedback.
 *
 * @param result Result returned by the persisted issue action.
 * @returns Human-readable error message for the dialog.
 */
function getCreateIssueActionErrorMessage(
  result: Exclude<CreateBubblophyIssueActionResult, { status: 'created' }>
) {
  if (result.status === 'forbidden') {
    return 'Du bist kein Mitglied dieses Projekts. Das Issue wurde nicht gespeichert.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Lege den Draft lokal an oder versuche es später erneut.';
  }

  if (result.reason === 'empty_project') {
    return 'Wähle ein Projekt aus, bevor du speicherst.';
  }

  if (result.reason === 'invalid_priority') {
    return 'Die gewählte Priorität ist nicht gültig.';
  }

  return 'Gib einen Titel ein, bevor du speicherst.';
}

/**
 * Converts issue plan action outcomes into quiet dialog feedback.
 *
 * @param result Result returned by the persisted plan action.
 * @returns Human-readable error message for the plan dialog.
 */
function getIssuePlanActionErrorMessage(
  result: Exclude<CreateBubblophyIssuePlanActionResult, { status: 'created' }>
) {
  if (result.status === 'not_found') {
    return 'Dieses Issue wurde nicht gefunden. Der Plan wurde nicht gespeichert.';
  }

  if (result.status === 'forbidden') {
    return 'Du bist kein Mitglied dieses Projekts. Der Plan wurde nicht gespeichert.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Der Plan wurde nicht gespeichert.';
  }

  if (result.reason === 'empty_issue') {
    return 'Wähle ein Issue aus, bevor du den Plan speicherst.';
  }

  if (result.reason === 'summary_too_long') {
    return 'Die Plan-Zusammenfassung ist zu lang.';
  }

  if (result.reason === 'too_many_steps') {
    return 'Der Plan darf höchstens 12 Schritte enthalten.';
  }

  if (result.reason === 'step_too_long') {
    return 'Ein Plan-Schritt ist zu lang.';
  }

  return 'Mindestens ein nicht-leerer Schritt ist nötig.';
}

/**
 * Converts issue note action outcomes into quiet inline feedback.
 *
 * @param result Result returned by the persisted issue note action.
 * @returns Human-readable error message for the detail panel.
 */
function getIssueNoteActionErrorMessage(
  result: Exclude<CreateBubblophyIssueNoteActionResult, { status: 'created' }>
) {
  if (result.status === 'not_found') {
    return 'Dieses Issue wurde nicht gefunden. Die Notiz wurde nicht gespeichert.';
  }

  if (result.status === 'forbidden') {
    return 'Du darfst für dieses Issue keine Notiz schreiben.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Die Notiz wurde nicht gespeichert.';
  }

  if (result.reason === 'empty_issue') {
    return 'Wähle ein Issue aus, bevor du die Notiz speicherst.';
  }

  if (result.reason === 'note_too_long') {
    return 'Die Notiz darf höchstens 2.000 Zeichen lang sein.';
  }

  return 'Gib eine Notiz ein, bevor du speicherst.';
}

/**
 * Converts issue content action outcomes into quiet inline feedback.
 *
 * @param result Result returned by the persisted issue edit action.
 * @returns Human-readable error message for the detail editor.
 */
function getIssueContentActionErrorMessage(
  result: Exclude<
    UpdateBubblophyIssueContentActionResult,
    { status: 'updated' }
  >
) {
  if (result.status === 'unchanged') {
    return 'Titel und Beschreibung sind unverändert. Es wurde kein Audit-Event geschrieben.';
  }

  if (result.status === 'not_found') {
    return 'Dieses Issue wurde nicht gefunden. Die Änderung wurde nicht gespeichert.';
  }

  if (result.status === 'forbidden') {
    return 'Du darfst dieses Issue nicht bearbeiten. Die Änderung wurde nicht gespeichert.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Die Änderung wurde nicht gespeichert.';
  }

  if (result.reason === 'empty_issue') {
    return 'Wähle ein Issue aus, bevor du Änderungen speicherst.';
  }

  if (result.reason === 'title_too_long') {
    return 'Der Titel ist zu lang.';
  }

  if (result.reason === 'description_too_long') {
    return 'Die Beschreibung ist zu lang.';
  }

  return 'Gib einen Titel ein, bevor du speicherst.';
}

/**
 * Converts issue assignee action outcomes into quiet inline feedback.
 *
 * @param result Result returned by the persisted issue assignment action.
 * @returns Human-readable error message for the detail panel.
 */
function getIssueAssigneeActionErrorMessage(
  result: Exclude<
    UpdateBubblophyIssueAssigneeActionResult,
    { status: 'updated' } | { status: 'unchanged' }
  >
) {
  if (result.status === 'not_found') {
    return 'Dieses Issue wurde nicht gefunden. Die Zuweisung wurde nicht geändert.';
  }

  if (result.status === 'forbidden') {
    return 'Du darfst dieses Issue nicht zuweisen. Die Zuweisung wurde nicht geändert.';
  }

  if (result.status === 'invalid_assignee') {
    return 'Wähle ein Mitglied dieses Projekts aus.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Die Zuweisung wurde nicht geändert.';
  }

  if (result.reason === 'empty_issue') {
    return 'Wähle ein Issue aus, bevor du die Zuweisung speicherst.';
  }

  return 'Die gewählte Zuweisung ist zu lang.';
}

/**
 * Converts issue status action outcomes into quiet inline feedback.
 *
 * @param result Result returned by the persisted issue status action.
 * @returns Human-readable error message for the detail panel.
 */
function getIssueStatusActionErrorMessage(
  result: Exclude<UpdateBubblophyIssueStatusActionResult, { status: 'updated' }>
) {
  if (result.status === 'unchanged') {
    return 'Dieser Status ist bereits gesetzt. Es wurde kein Audit-Event geschrieben.';
  }

  if (result.status === 'conflict') {
    return 'Der Status wurde zwischenzeitlich geändert. Lade das Issue neu und versuche es erneut.';
  }

  if (result.status === 'not_found') {
    return 'Dieses Issue wurde nicht gefunden. Der Status wurde nicht geändert.';
  }

  if (result.status === 'forbidden') {
    return 'Du bist kein Mitglied dieses Projekts. Der Status wurde nicht geändert.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Der Status wurde nicht geändert.';
  }

  if (result.reason === 'empty_issue') {
    return 'Wähle ein Issue aus, bevor du den Status speicherst.';
  }

  if (result.reason === 'reason_too_long') {
    return 'Der Statusgrund ist zu lang.';
  }

  return 'Der gewählte Status ist nicht gültig.';
}

/**
 * Converts issue priority action outcomes into quiet inline feedback.
 *
 * @param result Result returned by the persisted issue priority action.
 * @returns Human-readable error message for the detail panel.
 */
function getIssuePriorityActionErrorMessage(
  result: Exclude<
    UpdateBubblophyIssuePriorityActionResult,
    { status: 'updated' } | { status: 'unchanged' }
  >
) {
  if (result.status === 'not_found') {
    return 'Dieses Issue wurde nicht gefunden. Die Priorität wurde nicht geändert.';
  }

  if (result.status === 'forbidden') {
    return 'Du bist kein Mitglied dieses Projekts. Die Priorität wurde nicht geändert.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Die Priorität wurde nicht geändert.';
  }

  if (result.reason === 'empty_issue') {
    return 'Wähle ein Issue aus, bevor du die Priorität speicherst.';
  }

  return 'Die gewählte Priorität ist nicht gültig.';
}

/**
 * Converts run request action outcomes into quiet inline feedback.
 *
 * @param result Result returned by the persisted run request action.
 * @returns Human-readable error message for the detail panel.
 */
function getAgentRunRequestActionErrorMessage(
  result: Exclude<RequestBubblophyAgentRunActionResult, { status: 'requested' }>
) {
  if (result.status === 'not_found') {
    return 'Dieses Issue wurde nicht gefunden. Es wurde kein Run angefragt.';
  }

  if (result.status === 'forbidden') {
    return 'Du bist kein Mitglied dieses Projekts. Es wurde kein Run angefragt.';
  }

  if (result.status === 'token_unavailable') {
    return 'Dieses Agent-Token ist nicht ausführbar. Prüfe Projekt, Status, Ablaufdatum sowie die Scopes issues:read und runs:update.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Es wurde kein Run angefragt.';
  }

  if (result.reason === 'empty_issue') {
    return 'Wähle ein Issue aus, bevor du einen Run anfragst.';
  }

  if (result.reason === 'empty_agent_token') {
    return 'Wähle ein aktives Agent-Token aus.';
  }

  return 'Der Auftrag ist zu lang. Maximal 500 Zeichen sind erlaubt.';
}

/**
 * Converts human run transition outcomes into quiet inline feedback.
 *
 * @param result Result returned by the transition action.
 * @returns Human-readable error message for the run queue.
 */
function getAgentRunTransitionActionErrorMessage(
  result: Exclude<
    TransitionBubblophyAgentRunActionResult,
    { status: 'updated' }
  >
) {
  if (result.status === 'not_found') {
    return 'Dieser Run wurde nicht gefunden.';
  }

  if (result.status === 'forbidden') {
    return 'Du bist kein Mitglied dieses Projekts. Der Run wurde nicht geändert.';
  }

  if (result.status === 'invalid_transition') {
    return 'Nur angefragte Runs können freigegeben oder abgebrochen werden.';
  }

  if (result.status === 'token_unavailable') {
    return 'Das zugeordnete Agent-Token ist nicht ausführbar. Der Run wurde nicht freigegeben.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Der Run wurde nicht geändert.';
  }

  if (result.reason === 'empty_run') {
    return 'Wähle einen Run aus.';
  }

  return 'Diese Run-Entscheidung ist nicht gültig.';
}

/**
 * Returns available lifecycle decisions for a public token state.
 *
 * Revoked and expired tokens intentionally expose no further actions because
 * they must not be resumed and revoke is already terminal for the UI.
 *
 * @param token Public token summary.
 * @returns Ordered lifecycle decisions for inline controls.
 */
function getAvailableAgentTokenLifecycleDecisions(
  token: AgentTokenSummary
): UpdateBubblophyAgentTokenLifecycleActionInput['decision'][] {
  if (token.state === 'widerrufen' || token.state === 'abgelaufen') {
    return [];
  }

  if (token.state === 'pausiert') {
    return ['resume', 'revoke'];
  }

  return ['pause', 'revoke'];
}

/**
 * Labels lifecycle decisions for human-facing token controls.
 *
 * @param decision Lifecycle decision sent to the server action.
 * @returns Button label.
 */
function getAgentTokenLifecycleDecisionLabel(
  decision: UpdateBubblophyAgentTokenLifecycleActionInput['decision']
) {
  if (decision === 'pause') {
    return 'Pausieren';
  }

  if (decision === 'resume') {
    return 'Fortsetzen';
  }

  return 'Widerrufen';
}

/**
 * Converts token lifecycle action outcomes into quiet inline feedback.
 *
 * @param result Result returned by the persisted token lifecycle action.
 * @returns Human-readable error message for the token panel.
 */
function getAgentTokenLifecycleActionErrorMessage(
  result: Exclude<
    UpdateBubblophyAgentTokenLifecycleActionResult,
    { status: 'updated' } | { status: 'unchanged' }
  >
) {
  if (result.status === 'not_found') {
    return 'Dieses Agent-Token wurde nicht gefunden.';
  }

  if (result.status === 'forbidden') {
    return 'Nur Owner und Maintainer können Agent-Tokens ändern.';
  }

  if (result.status === 'invalid_transition') {
    return result.reason === 'expired'
      ? 'Abgelaufene Tokens können nicht fortgesetzt oder pausiert werden.'
      : 'Widerrufene Tokens können nicht erneut aktiviert werden.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Das Token wurde nicht geändert.';
  }

  if (result.reason === 'empty_token') {
    return 'Wähle ein Agent-Token aus.';
  }

  return 'Diese Token-Aktion ist nicht gültig.';
}

/**
 * Explains why a persisted run request is not available.
 *
 * @param props Current data source, selected issue, and required actions.
 * @returns Short non-operative helper copy.
 */
function getAgentRunRequestUnavailableMessage({
  dataSource,
  issue,
  readRunTargetOptionsAction,
  requestAgentRunAction,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  issue: DashboardIssue;
  readRunTargetOptionsAction?: (
    input: ReadBubblophyRunTargetOptionsActionInput
  ) => Promise<ReadBubblophyRunTargetOptionsActionResult>;
  requestAgentRunAction?: (
    input: RequestBubblophyAgentRunActionInput
  ) => Promise<RequestBubblophyAgentRunActionResult>;
}) {
  if (isLocalDraftIssue(issue)) {
    return 'Lokale Drafts können keinen Agent-Run anfragen, solange sie nicht gespeichert sind.';
  }

  if (dataSource === 'sample') {
    return 'Sample-Daten erlauben keine Run-Anfrage. Echte Requests erscheinen erst mit Datenbankdaten.';
  }

  if (dataSource === 'database_unavailable') {
    return 'Die Datenbank ist nicht bereit. Bubblophy zeigt deshalb keine persistente Run-Anfrage.';
  }

  if (!readRunTargetOptionsAction) {
    return 'Die begrenzte Token-Auswahl ist in dieser Oberfläche nicht aktiv.';
  }

  if (!requestAgentRunAction) {
    return 'Die Server-Action für Run-Anfragen ist in dieser Oberfläche nicht aktiv.';
  }

  return 'Run-Anfragen sind gerade nicht verfügbar.';
}

/**
 * Converts project create outcomes into quiet dialog feedback.
 *
 * @param result Result returned by the persisted project action.
 * @returns Human-readable error message for the project dialog.
 */
function getCreateProjectActionErrorMessage(
  result: Exclude<CreateBubblophyProjectActionResult, { status: 'created' }>
) {
  if (result.status === 'duplicate') {
    return 'Dieser Projekt-Key ist schon vergeben. Wähle einen anderen Key.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Das Projekt wurde nicht erstellt.';
  }

  if (result.reason === 'empty_name') {
    return 'Gib einen Projektnamen ein.';
  }

  if (result.reason === 'empty_key') {
    return 'Gib einen Projekt-Key ein.';
  }

  if (result.reason === 'invalid_repository_url') {
    return 'Die Repository URL muss leer sein oder mit https:// beginnen.';
  }

  return 'Der Projekt-Key darf nur A-Z, 0-9 und 2 bis 8 Zeichen enthalten.';
}

function getProjectManagementActionErrorMessage(
  result: Exclude<
    UpdateBubblophyProjectContentActionResult,
    { status: 'updated' }
  >
) {
  if (result.status === 'unchanged') {
    return 'Name und Beschreibung sind unverändert. Es wurde kein Audit-Event geschrieben.';
  }

  if (result.status === 'not_found') {
    return 'Dieses Projekt wurde nicht gefunden. Die Änderung wurde nicht gespeichert.';
  }

  if (result.status === 'forbidden') {
    return 'Nur Owner und Maintainer können Projekte verwalten.';
  }

  if (result.status === 'archived_project') {
    return 'Archivierte Projekte müssen vor Inhaltsänderungen wiederhergestellt werden.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Die Änderung wurde nicht gespeichert.';
  }

  if (result.reason === 'empty_project') {
    return 'Wähle ein Projekt aus, bevor du speicherst.';
  }

  if (result.reason === 'name_too_long') {
    return 'Der Projektname ist zu lang.';
  }

  if (result.reason === 'description_too_long') {
    return 'Die Projektbeschreibung ist zu lang.';
  }

  return 'Gib einen Projektnamen ein, bevor du speicherst.';
}

function getProjectArchiveActionErrorMessage(
  result: Exclude<
    TransitionBubblophyProjectArchiveActionResult,
    { status: 'updated' }
  >
) {
  if (result.status === 'unchanged') {
    return 'Dieses Projekt ist bereits in diesem Archivzustand.';
  }

  if (result.status === 'not_found') {
    return 'Dieses Projekt wurde nicht gefunden. Der Archivstatus wurde nicht geändert.';
  }

  if (result.status === 'forbidden') {
    return 'Nur Owner und Maintainer können Projekte archivieren oder wiederherstellen.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Der Archivstatus wurde nicht geändert.';
  }

  if (result.reason === 'empty_project') {
    return 'Wähle ein Projekt aus, bevor du den Archivstatus änderst.';
  }

  return 'Die Archiventscheidung ist nicht gültig.';
}

/**
 * Converts project member role outcomes into quiet inline feedback.
 *
 * @param result Result returned by the persisted member role action.
 * @returns Human-readable error message for the members panel.
 */
function getProjectMemberRoleActionErrorMessage(
  result: Exclude<
    UpdateBubblophyProjectMemberRoleActionResult,
    { status: 'updated' } | { status: 'unchanged' }
  >
) {
  if (result.status === 'not_found') {
    return 'Projekt oder Mitglied wurde nicht gefunden.';
  }

  if (result.status === 'conflict') {
    return 'Die Rolle wurde zwischenzeitlich geändert. Lade die aktuellen Projektdaten neu.';
  }

  if (result.status === 'forbidden') {
    return 'Nur Owner und Maintainer können Rollen verwalten.';
  }

  if (result.status === 'archived_project') {
    return 'Archivierte Projekte erlauben keine Rollenänderungen.';
  }

  if (result.status === 'owner_protected') {
    return 'Owner-Rollen werden in diesem MVP nicht über die Oberfläche geändert.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Die Rolle wurde nicht geändert.';
  }

  if (result.reason === 'empty_project') {
    return 'Wähle ein Projekt aus.';
  }

  if (result.reason === 'empty_member') {
    return 'Wähle ein Mitglied aus.';
  }

  return 'Diese Rolle ist nicht gültig.';
}

/**
 * Converts project member removal outcomes into quiet inline feedback.
 *
 * @param result Result returned by the persisted member removal action.
 * @returns Human-readable error message for the members panel.
 */
function getProjectMemberRemovalActionErrorMessage(
  result: Exclude<
    RemoveBubblophyProjectMemberActionResult,
    { status: 'removed' }
  >
) {
  if (result.status === 'not_found') {
    return 'Projekt oder Mitglied wurde nicht gefunden.';
  }

  if (result.status === 'conflict') {
    return 'Das Mitglied wurde zwischenzeitlich geändert. Lade die aktuellen Projektdaten neu.';
  }

  if (result.status === 'forbidden') {
    return 'Nur Owner und Maintainer können Mitglieder entfernen.';
  }

  if (result.status === 'archived_project') {
    return 'Archivierte Projekte erlauben keine Mitgliederänderungen.';
  }

  if (result.status === 'owner_protected') {
    return 'Owner können in diesem MVP nicht entfernt werden.';
  }

  if (result.status === 'self_removal') {
    return 'Selbst-Entfernung ist in diesem MVP gesperrt.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Das Mitglied wurde nicht entfernt.';
  }

  if (result.reason === 'empty_project') {
    return 'Wähle ein Projekt aus.';
  }

  if (result.reason === 'empty_member') {
    return 'Wähle ein Mitglied aus.';
  }

  return 'Die erwartete Rolle ist nicht gültig.';
}

/**
 * Converts agent token create outcomes into quiet dialog feedback.
 *
 * @param result Result returned by the persisted token action.
 * @returns Human-readable error message for the token dialog.
 */
function getAgentTokenActionErrorMessage(
  result: Exclude<CreateBubblophyAgentTokenActionResult, { status: 'created' }>
) {
  if (result.status === 'forbidden') {
    return 'Nur Owner und Maintainer können Agent-Tokens für dieses Projekt erstellen.';
  }

  if (result.status === 'duplicate') {
    return 'Dieses Token kollidiert mit einem bestehenden Hash. Bitte erneut versuchen.';
  }

  if (result.status === 'database_unavailable') {
    return 'Die Datenbank ist gerade nicht verfügbar. Es wurde kein Token erstellt.';
  }

  if (result.reason === 'empty_project') {
    return 'Wähle ein Projekt aus.';
  }

  if (result.reason === 'invalid_project_key') {
    return 'Der Projekt-Key ist nicht gültig.';
  }

  if (result.reason === 'label_too_long') {
    return 'Das Token-Label ist zu lang.';
  }

  if (result.reason === 'empty_scopes') {
    return 'Wähle mindestens einen Scope aus.';
  }

  if (result.reason === 'invalid_scope') {
    return 'Mindestens ein Scope ist nicht erlaubt.';
  }

  if (result.reason === 'invalid_expires_at') {
    return 'Das Ablaufdatum ist nicht gültig.';
  }

  return 'Gib ein Label ein.';
}
