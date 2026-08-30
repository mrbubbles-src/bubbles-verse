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
  ReadBubblophyIssueAssigneeOptionsActionResult,
  ReadBubblophyProjectInvitationManagerSnapshotActionResult,
  ReadBubblophyRunTargetOptionsActionInput,
  ReadBubblophyRunTargetOptionsActionResult,
  RemoveBubblophyProjectMemberActionInput,
  RemoveBubblophyProjectMemberActionResult,
  RequestBubblophyAgentRunActionInput,
  RequestBubblophyAgentRunActionResult,
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
import type { ReadDashboardAllIssuePageResult } from '@/lib/dashboard/all-issues';
import type {
  ReadDashboardIssueDetailResult,
  ReadDashboardIssuePageResult,
} from '@/lib/dashboard/issues';
import type { ReadDashboardMemberPageResult } from '@/lib/dashboard/members';
import type {
  AgentTokenSummary,
  DashboardSnapshot,
  IssuePriority,
  IssueStatus,
  IssueSummary,
} from '@/lib/dashboard/types';

import { parseDashboardActivityQuery } from '@/lib/dashboard/activity-query';
import {
  normalizeDashboardAgentTokenQuery,
  parseDashboardAgentTokenCursor,
} from '@/lib/dashboard/agent-token-query';
import { parseDashboardAllIssueQuery } from '@/lib/dashboard/all-issue-query';
import { parseDashboardIssueQuery } from '@/lib/dashboard/issue-query';
import {
  dashboardAgentTokenFixtures,
  dashboardIssueFixtures,
  dashboardSnapshot,
} from '@/lib/dashboard/sample-data';
import { bubblophySidebarData } from '@/lib/sidebar';

import React from 'react';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BubblophyDashboard as ProductionBubblophyDashboard } from '@/components/dashboard/bubblophy-dashboard';

const navigationListeners = new Set<() => void>();
let autoCommitMockNavigation = true;

function commitMockNavigation(href: string) {
  const url = new URL(href, 'https://bubblophy.example.test');

  navigationMocks.searchParams.mockReturnValue(url.searchParams);
  navigationListeners.forEach((listener) => listener());
}

function subscribeToMockNavigation(listener: () => void) {
  navigationListeners.add(listener);

  return () => navigationListeners.delete(listener);
}

const navigationMocks = {
  routerPush: vi.fn((href: string) => {
    if (autoCommitMockNavigation) {
      commitMockNavigation(href);
    }
  }),
  routerReplace: vi.fn((href: string) => {
    if (autoCommitMockNavigation) {
      commitMockNavigation(href);
    }
  }),
  routerRefresh: vi.fn(),
  searchParams: vi.fn(() => new URLSearchParams()),
};

function getBubblophySidebarSectionIds() {
  return bubblophySidebarData.sections
    .flatMap((section) => section.items)
    .flatMap((item) => [item.navigateHref, item.href])
    .filter((href): href is string => Boolean(href?.startsWith('/#')))
    .map((href) => href.slice(2));
}

const issueFixturesBySnapshot = new WeakMap<
  DashboardSnapshot,
  IssueSummary[]
>();
const agentTokenFixturesBySnapshot = new WeakMap<
  DashboardSnapshot,
  AgentTokenSummary[]
>();

/** Associates page/detail fixtures without putting issues back into snapshots. */
function withIssueFixtures<T extends DashboardSnapshot>(
  snapshot: T,
  issues: IssueSummary[] = dashboardIssueFixtures
) {
  issueFixturesBySnapshot.set(snapshot, issues);
  return snapshot;
}

/** Associates token-page fixtures without putting tokens back into snapshots. */
function withAgentTokenFixtures<T extends DashboardSnapshot>(
  snapshot: T,
  tokens: AgentTokenSummary[] = dashboardAgentTokenFixtures
) {
  agentTokenFixturesBySnapshot.set(snapshot, tokens);
  return snapshot;
}

withIssueFixtures(dashboardSnapshot);
withAgentTokenFixtures(dashboardSnapshot);

const databaseSnapshot = withAgentTokenFixtures(
  withIssueFixtures({
    ...dashboardSnapshot,
    projects: dashboardSnapshot.projects.map((project) => ({
      ...project,
      currentUserRole: 'owner' as const,
    })),
    meta: {
      dataSource: 'database',
      label: 'Datenbankdaten',
      description: 'Read-only Testdaten.',
    },
  } satisfies DashboardSnapshot)
);

const bvIssuePageResult = {
  status: 'success',
  project: {
    key: 'BV',
    name: 'Bubblesverse',
    isArchived: false,
    currentUserRole: 'owner',
  },
  sort: 'newest',
  filters: { query: null, status: null, priority: null },
  items: [
    {
      key: 'BV-14',
      issueNumber: 14,
      title: 'Serverseitige Queue anbinden',
      status: 'in_progress',
      priority: 'high',
      requiresHumanApproval: true,
      assignedAuthUserId: null,
      assigneeLabel: 'Nicht zugewiesen',
      latestPlan: { version: 2, stepCount: 3 },
    },
  ],
  nextAfterIssueNumber: 14,
} satisfies ReadDashboardIssuePageResult;

const bvIssuePageRequest = {
  projectKey: 'BV',
  sort: 'newest',
  filters: { query: null, status: null, priority: null },
  afterIssueNumber: null,
} as const;

const allIssuePageRequest = {
  sort: 'newest',
  filters: { query: null, status: null, priority: null },
  after: null,
} as const;

const allIssuePageResult = {
  status: 'success',
  sort: 'newest',
  filters: allIssuePageRequest.filters,
  items: [
    {
      ...bvIssuePageResult.items[0]!,
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        currentUserRole: 'owner',
      },
      updatedAt: '2026-07-19T12:00:00.000Z',
    },
    {
      project: {
        key: 'NO',
        name: 'Novari',
        currentUserRole: 'member',
      },
      key: 'NO-08',
      issueNumber: 8,
      title: 'Projektübergreifende Queue prüfen',
      status: 'ready',
      priority: 'medium',
      requiresHumanApproval: false,
      assignedAuthUserId: null,
      assigneeLabel: 'Nicht zugewiesen',
      latestPlan: null,
      updatedAt: '2026-07-19T11:00:00.000Z',
    },
  ],
  nextAfter: {
    updatedAt: '2026-07-19T11:00:00.000Z',
    projectKey: 'NO',
    issueNumber: 8,
  },
} satisfies ReadDashboardAllIssuePageResult;

const bvOffPageIssueDetailResult = {
  status: 'success',
  project: bvIssuePageResult.project,
  issue: {
    key: 'BV-99',
    issueNumber: 99,
    title: 'Direktes Detail außerhalb der Seite',
    description: 'Dieses Issue steht nicht in der aktuellen 25er-Seite.',
    status: 'ready',
    priority: 'medium',
    requiresHumanApproval: false,
    assignedAuthUserId: null,
    assigneeLabel: 'Nicht zugewiesen',
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-19T10:00:00.000Z',
    latestPlan: null,
    notes: [],
    hasMoreNotes: false,
  },
} satisfies ReadDashboardIssueDetailResult;

const databaseSnapshotWithManageableMembers = withIssueFixtures({
  ...databaseSnapshot,
  projects: databaseSnapshot.projects.map((project) =>
    project.key === 'BV'
      ? {
          ...project,
          currentUserRole: 'owner',
        }
      : project
  ),
  projectMembers: [
    {
      id: 'BV:user_owner',
      projectKey: 'BV',
      authUserId: 'user_owner',
      label: 'Mara Owner',
      email: 'owner@example.test',
      role: 'owner',
      createdAt: '2026-06-13T10:00:00.000Z',
    },
    {
      id: 'BV:user_martin',
      projectKey: 'BV',
      authUserId: 'user_martin',
      label: 'Martin',
      email: 'martin@example.test',
      role: 'member',
      createdAt: '2026-06-13T11:00:00.000Z',
    },
    {
      id: 'BV:user_viewer',
      projectKey: 'BV',
      authUserId: 'user_viewer',
      label: 'Viewer',
      email: null,
      role: 'viewer',
      createdAt: '2026-06-13T12:00:00.000Z',
    },
  ],
} satisfies DashboardSnapshot);

const databaseSnapshotWithViewerAccess = withIssueFixtures({
  ...databaseSnapshot,
  projects: databaseSnapshot.projects.map((project) => ({
    ...project,
    currentUserRole: 'viewer',
  })),
} satisfies DashboardSnapshot);

const databaseSnapshotWithIssueDescription = withIssueFixtures(
  { ...databaseSnapshot } satisfies DashboardSnapshot,
  dashboardIssueFixtures.map((issue, index) =>
    index === 0
      ? {
          ...issue,
          description: 'Beschreibung aus dem Dashboard-Snapshot.',
        }
      : issue
  )
);

const databaseSnapshotWithReloadedPlan = withIssueFixtures(
  { ...databaseSnapshot } satisfies DashboardSnapshot,
  dashboardIssueFixtures.map((issue) =>
    issue.id === 'BV-12'
      ? {
          ...issue,
          planSteps: 2,
          latestPlan: {
            version: 4,
            summary: 'Reload zeigt den gespeicherten Plan.',
            steps: [
              { id: 'step_1', text: 'Persistierten Plan lesen' },
              { id: 'step_2', text: 'Detailpanel verifizieren' },
            ],
          },
        }
      : issue
  )
);

const databaseSnapshotWithIssueNote = withIssueFixtures(
  { ...databaseSnapshot } satisfies DashboardSnapshot,
  dashboardIssueFixtures.map((issue) =>
    issue.id === 'BV-12'
      ? {
          ...issue,
          notes: [
            {
              id: 'event_note_existing',
              note: 'Bestehende Review-Notiz aus dem Reload.',
              actor: 'Mensch',
              createdAt: '2026-06-14T09:00:00.000Z',
            },
          ],
        }
      : issue
  )
);

const databaseSnapshotWithIssueNoteActivity = withIssueFixtures(
  {
    ...databaseSnapshotWithIssueNote,
    activity: [
      {
        id: 'event_issue_note',
        label: 'Plan-Review als Issue-Notiz festgehalten.',
        actor: 'Mensch',
        occurredAt: '2026-06-14T10:00:00.000Z',
        projectKey: 'BV',
        issueId: 'BV-12',
      },
      ...databaseSnapshot.activity,
    ],
  } satisfies DashboardSnapshot,
  issueFixturesBySnapshot.get(databaseSnapshotWithIssueNote)
);

const databaseSnapshotWithDoneIssue = withIssueFixtures(
  { ...databaseSnapshot } satisfies DashboardSnapshot,
  dashboardIssueFixtures.map((issue) =>
    issue.id === 'BV-12'
      ? {
          ...issue,
          status: 'erledigt',
        }
      : issue
  )
);

const emptyDatabaseSnapshot = {
  ...databaseSnapshot,
  meta: {
    dataSource: 'empty_database',
    label: 'Leere Datenbank',
    description:
      'Datenbank erreichbar, aber für diesen User gibt es noch keine Projekte.',
  },
  projects: [],
  projectMembers: [],
  agentRuns: [],
  activity: [],
} satisfies DashboardSnapshot;

const databaseUnavailableSnapshot = {
  ...emptyDatabaseSnapshot,
  meta: {
    dataSource: 'database_unavailable',
    label: 'Datenbank nicht bereit',
    description:
      'Bubblophy kann die Datenbank oder Tabellen gerade nicht lesen.',
    reason: 'schema_missing',
    hint: 'Die Bubblophy-Tabellen scheinen zu fehlen. Prüfe die lokale Strukturmigration.',
  },
} satisfies DashboardSnapshot;

const databaseSnapshotWithEmptyRuns = {
  ...databaseSnapshot,
  agentRuns: [],
} satisfies DashboardSnapshot;

/** Builds the issue-bound run-target action used by dashboard integration tests. */
function createRunTargetOptionsAction(
  items: Array<{ id: string; label: string }> = [
    { id: 'token_codex_bv', label: 'codex-local-lio' },
  ]
) {
  return vi.fn(
    async (
      input: ReadBubblophyRunTargetOptionsActionInput
    ): Promise<ReadBubblophyRunTargetOptionsActionResult> => ({
      status: 'success',
      project: {
        key: input.issueKey.split('-')[0] ?? 'BV',
        name: 'Bubblesverse',
        currentUserRole: 'member',
      },
      issueKey: input.issueKey,
      query: input.query?.trim() || null,
      after: input.after ?? null,
      items,
      nextAfter: null,
    })
  );
}

const databaseSnapshotWithoutAgentTokens = withAgentTokenFixtures(
  { ...databaseSnapshotWithEmptyRuns } satisfies DashboardSnapshot,
  []
);

const runUpdateTokenFixtures = [
  {
    id: 'token_runner',
    label: 'Codex Runner',
    projectKey: 'BV',
    scopes: ['runs:update'],
    state: 'aktiv',
    lastUsedAt: 'noch nie verwendet',
    expiresAt: 'läuft nicht automatisch ab',
  },
] satisfies AgentTokenSummary[];

const databaseSnapshotWithRunUpdateToken = withAgentTokenFixtures(
  {
    ...databaseSnapshot,
    agentRuns: databaseSnapshot.agentRuns.map((run) =>
      run.id === 'run_bv_14' ? { ...run, canAgentReportStatus: true } : run
    ),
  } satisfies DashboardSnapshot,
  runUpdateTokenFixtures
);

const issueReadTokenFixtures = [
  {
    id: 'token_reader',
    label: 'Claude Reader',
    projectKey: 'BV',
    scopes: ['issues:read'],
    state: 'aktiv',
    lastUsedAt: 'noch nie verwendet',
    expiresAt: 'läuft nicht automatisch ab',
  },
] satisfies AgentTokenSummary[];

const unresolvedIssueReadTokenFixtures = [
  {
    id: 'token_unknown_project',
    label: 'Reader ohne Projektauflösung',
    projectKey: 'ZZ',
    scopes: ['issues:read'],
    state: 'aktiv',
    lastUsedAt: 'noch nie verwendet',
    expiresAt: 'läuft nicht automatisch ab',
  },
] satisfies AgentTokenSummary[];

const writeOnlyTokenFixtures = [
  {
    id: 'token_writer',
    label: 'Writer ohne Handoff',
    projectKey: 'BV',
    scopes: ['issues:write'],
    state: 'aktiv',
    lastUsedAt: 'noch nie verwendet',
    expiresAt: 'läuft nicht automatisch ab',
  },
] satisfies AgentTokenSummary[];

const databaseSnapshotWithIssueReadToken = withAgentTokenFixtures(
  { ...databaseSnapshot } satisfies DashboardSnapshot,
  issueReadTokenFixtures
);

const databaseSnapshotWithUnresolvedIssueReadToken = withAgentTokenFixtures(
  { ...databaseSnapshot } satisfies DashboardSnapshot,
  unresolvedIssueReadTokenFixtures
);

const databaseSnapshotWithWriteOnlyToken = withAgentTokenFixtures(
  { ...databaseSnapshot } satisfies DashboardSnapshot,
  writeOnlyTokenFixtures
);

const databaseSnapshotWithApprovedRunUpdateToken = {
  ...databaseSnapshotWithRunUpdateToken,
  agentRuns: databaseSnapshotWithRunUpdateToken.agentRuns.map((run) =>
    run.id === 'run_bv_14'
      ? {
          ...run,
          state: 'freigegeben',
          lastEvent: 'Run BV-14 wurde menschlich freigegeben.',
        }
      : run
  ),
} satisfies DashboardSnapshot;

const databaseSnapshotWithReviewRun = {
  ...databaseSnapshotWithRunUpdateToken,
  agentRuns: databaseSnapshotWithRunUpdateToken.agentRuns.map((run) =>
    run.id === 'run_bv_14'
      ? {
          ...run,
          state: 'review',
          lastEvent: 'Agent hat Review für BV-14 angefordert.',
          resultSummary: 'Diff ist bereit für menschliche Prüfung.',
        }
      : run
  ),
} satisfies DashboardSnapshot;

const databaseSnapshotWithFailedRunResult = {
  ...databaseSnapshotWithRunUpdateToken,
  agentRuns: databaseSnapshotWithRunUpdateToken.agentRuns.map((run) =>
    run.id === 'run_bv_14'
      ? {
          ...run,
          state: 'fehlgeschlagen',
          lastEvent: 'Agent-Run für BV-14 ist fehlgeschlagen.',
          resultSummary: 'Checkout konnte nicht vorbereitet werden.',
        }
      : run
  ),
} satisfies DashboardSnapshot;

const databaseSnapshotWithUnresolvedRun = {
  ...databaseSnapshotWithRunUpdateToken,
  agentRuns: [
    {
      id: 'run_missing_issue',
      issueId: 'BV-404',
      agentLabel: 'codex-local-lio',
      state: 'review',
      requestedBy: 'Mensch',
      lastEvent: 'Run verweist auf ein nicht geladenes Issue.',
    },
  ],
} satisfies DashboardSnapshot;

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: navigationMocks.routerPush,
    replace: navigationMocks.routerReplace,
    refresh: navigationMocks.routerRefresh,
  }),
  useSearchParams: () => {
    React.useSyncExternalStore(
      subscribeToMockNavigation,
      () => navigationMocks.searchParams().toString(),
      () => navigationMocks.searchParams().toString()
    );

    return navigationMocks.searchParams();
  },
}));

vi.mock('@bubbles/ui/shadcn/badge', () => ({
  Badge: ({
    children,
    className,
  }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

vi.mock('@bubbles/ui/shadcn/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: string;
    variant?: string;
  }) => <button {...props}>{children}</button>,
}));

vi.mock('@bubbles/ui/shadcn/card', () => ({
  Card: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { size?: string }) => (
    <section {...props}>{children}</section>
  ),
  CardAction: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} />
  ),
  CardContent: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} />
  ),
  CardDescription: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} />
  ),
  CardHeader: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} />
  ),
  CardTitle: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} />
  ),
}));

vi.mock('@bubbles/ui/shadcn/dialog', () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <>{children}</> : null),
  DialogContent: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div role="dialog" {...props} />
  ),
  DialogDescription: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} />
  ),
  DialogFooter: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <footer {...props} />
  ),
  DialogHeader: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} />
  ),
  DialogTitle: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} />
  ),
}));

vi.mock('@bubbles/ui/shadcn/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('@bubbles/ui/shadcn/table', () => ({
  Table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <table {...props} />
  ),
  TableBody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody {...props} />
  ),
  TableCell: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td {...props} />
  ),
  TableHead: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th {...props} />
  ),
  TableHeader: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead {...props} />
  ),
  TableRow: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr {...props} />
  ),
}));

vi.mock('@bubbles/ui/shadcn/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

function getMetricSection(label: string) {
  const heading = screen.getByRole('heading', { name: label });
  const section = heading.closest('section');

  expect(section).toBeInstanceOf(HTMLElement);

  if (!section) {
    throw new Error(`Expected metric section for ${label}.`);
  }

  return section;
}

function getMetricValue(label: string) {
  return within(getMetricSection(label)).getByText(/\d+%?$/);
}

function getMetricCaption(label: string) {
  return within(getMetricSection(label)).getByText(/bereit|lokal|Blocker/i);
}

const rawIssueStatus = {
  triage: 'triage',
  geplant: 'planned',
  bereit: 'ready',
  in_arbeit: 'in_progress',
  review: 'review',
  blockiert: 'blocked',
  erledigt: 'done',
} satisfies Record<
  IssueStatus,
  'triage' | 'planned' | 'ready' | 'in_progress' | 'review' | 'blocked' | 'done'
>;

const rawIssuePriority = {
  niedrig: 'low',
  mittel: 'medium',
  hoch: 'high',
} satisfies Record<IssuePriority, 'low' | 'medium' | 'high'>;

type TestDashboardProps = React.ComponentProps<
  typeof ProductionBubblophyDashboard
>;

/** Supplies explicit page/detail fixtures to tests without snapshot issues. */
function BubblophyDashboard(props: TestDashboardProps) {
  React.useSyncExternalStore(
    subscribeToMockNavigation,
    () => navigationMocks.searchParams().toString(),
    () => navigationMocks.searchParams().toString()
  );
  const params = navigationMocks.searchParams();
  const requestedProjectKey = params.get('project')?.trim().toUpperCase();
  const selectedProject = props.snapshot.projects.find(
    (project) => project.key === requestedProjectKey
  );
  const issues =
    issueFixturesBySnapshot.get(props.snapshot) ?? dashboardIssueFixtures;
  const selectedIssues = selectedProject
    ? issues.filter((issue) => issue.projectKey === selectedProject.key)
    : issues.filter((issue) =>
        props.snapshot.projects.some(
          (project) => project.key === issue.projectKey && !project.isArchived
        )
      );
  const hasExplicitPage = selectedProject
    ? Object.hasOwn(props, 'issuePageRequest') ||
      Object.hasOwn(props, 'issuePageResult')
    : Object.hasOwn(props, 'allIssuePageRequest') ||
      Object.hasOwn(props, 'allIssuePageResult');
  const pageProps = hasExplicitPage
    ? {}
    : selectedProject
      ? buildConcreteIssuePageTestProps(params, selectedProject, selectedIssues)
      : buildAllIssuePageTestProps(params, props.snapshot, selectedIssues);
  const requestedIssueKey = params.get('issue')?.trim().toUpperCase() ?? null;
  const detailIssue = requestedIssueKey
    ? issues.find((issue) => issue.id === requestedIssueKey)
    : hasExplicitPage
      ? null
      : selectedIssues[0];
  const detailProps =
    Object.hasOwn(props, 'issueDetailResult') ||
    Object.hasOwn(props, 'issueDetailRequestKey') ||
    !detailIssue
      ? {}
      : buildIssueDetailTestProps(props.snapshot, detailIssue);
  const hasExplicitActivityPage =
    Object.hasOwn(props, 'activityPageRequest') ||
    Object.hasOwn(props, 'activityPageResult');
  const activityProps =
    props.snapshot.meta.dataSource === 'database' && !hasExplicitActivityPage
      ? buildActivityPageTestProps(params, props.snapshot, selectedProject)
      : {};
  const hasExplicitAgentTokenPage =
    Object.hasOwn(props, 'agentTokenPageRequest') ||
    Object.hasOwn(props, 'agentTokenPageResult');
  const agentTokenProps = hasExplicitAgentTokenPage
    ? {}
    : buildAgentTokenPageTestProps(
        params,
        props.snapshot,
        selectedProject,
        agentTokenFixturesBySnapshot.get(props.snapshot) ?? []
      );

  return (
    <ProductionBubblophyDashboard
      {...pageProps}
      {...detailProps}
      {...activityProps}
      {...agentTokenProps}
      {...props}
    />
  );
}

/** Builds one bounded token-page fixture without snapshot token data. */
function buildAgentTokenPageTestProps(
  params: URLSearchParams,
  snapshot: DashboardSnapshot,
  selectedProject: DashboardSnapshot['projects'][number] | undefined,
  tokens: AgentTokenSummary[]
): Pick<TestDashboardProps, 'agentTokenPageRequest' | 'agentTokenPageResult'> {
  const after = parseDashboardAgentTokenCursor(
    params.get('tokenAfterProject'),
    params.get('tokenAfterLabel'),
    params.get('tokenAfterId')
  );
  const projectKey = selectedProject?.key ?? null;
  const query = normalizeDashboardAgentTokenQuery(params.get('tokenQ'));
  const sortedTokens = [...tokens]
    .filter((token) => !projectKey || token.projectKey === projectKey)
    .filter(
      (token) =>
        !query || token.label.toLowerCase().startsWith(query.toLowerCase())
    )
    .sort(
      (left, right) =>
        left.projectKey.localeCompare(right.projectKey) ||
        left.label.toLowerCase().localeCompare(right.label.toLowerCase()) ||
        left.id.localeCompare(right.id)
    )
    .filter(
      (token) =>
        !after ||
        token.projectKey > after.projectKey ||
        (token.projectKey === after.projectKey &&
          (token.label.toLowerCase() > after.normalizedLabel ||
            (token.label.toLowerCase() === after.normalizedLabel &&
              token.id > after.tokenId)))
    );
  const pageTokens = sortedTokens.slice(0, 20);
  const lastToken = pageTokens.at(-1);

  return {
    agentTokenPageRequest: { projectKey, query, after },
    agentTokenPageResult: {
      status: 'success',
      project: selectedProject
        ? {
            key: selectedProject.key,
            name: selectedProject.name,
            isArchived: selectedProject.isArchived,
            currentUserRole: selectedProject.currentUserRole ?? 'viewer',
          }
        : null,
      query,
      items: pageTokens.map((token) => {
        const project = snapshot.projects.find(
          (candidate) => candidate.key === token.projectKey
        );

        return {
          ...token,
          projectIsArchived: project?.isArchived ?? false,
          currentUserRole: project?.currentUserRole ?? 'owner',
        };
      }),
      nextAfter:
        sortedTokens.length > 20 && lastToken
          ? {
              projectKey: lastToken.projectKey,
              normalizedLabel: lastToken.label.toLowerCase(),
              tokenId: lastToken.id,
            }
          : null,
    },
  };
}

/** Builds a server activity-page fixture from legacy presentation fixtures. */
function buildActivityPageTestProps(
  params: URLSearchParams,
  snapshot: DashboardSnapshot,
  selectedProject: DashboardSnapshot['projects'][number] | undefined
): Pick<TestDashboardProps, 'activityPageRequest' | 'activityPageResult'> {
  const query = parseDashboardActivityQuery({
    kind: params.get('activityKind'),
    afterAt: params.get('activityAfterAt'),
    afterSource: params.get('activityAfterSource'),
    afterId: params.get('activityAfterId'),
  });
  const projectKey = selectedProject?.key ?? null;
  const items = snapshot.activity
    .filter((event) => !projectKey || event.projectKey === projectKey)
    .map((event) => ({
      id: `${event.issueId ? 'issue' : 'project'}:${event.id}`,
      source: event.issueId ? ('issue' as const) : ('project' as const),
      label: event.label,
      actor: event.actor,
      occurredAt: event.occurredAt,
      projectKey: event.projectKey ?? 'BV',
      issueKey: event.issueId ?? null,
    }))
    .filter((event) => query.kind === 'all' || event.source === query.kind);

  return {
    activityPageRequest: { projectKey, ...query },
    activityPageResult: {
      status: 'success',
      filters: {
        projectKey,
        kind: query.kind === 'all' ? null : query.kind,
      },
      items,
      nextAfter: null,
    },
  };
}

/** Builds one canonical concrete-project page fixture from presentation issues. */
function buildConcreteIssuePageTestProps(
  params: URLSearchParams,
  project: DashboardSnapshot['projects'][number],
  issues: IssueSummary[]
): Pick<TestDashboardProps, 'issuePageRequest' | 'issuePageResult'> {
  const query = parseDashboardIssueQuery({
    query: params.get('q'),
    status: params.get('status'),
    priority: params.get('priority'),
    sort: params.get('sort'),
    after: params.get('after'),
  });

  return {
    issuePageRequest: { projectKey: project.key, ...query },
    issuePageResult: {
      status: 'success',
      project: {
        key: project.key,
        name: project.name,
        isArchived: project.isArchived,
        currentUserRole: project.currentUserRole ?? 'viewer',
      },
      sort: query.sort,
      filters: query.filters,
      items: issues.map(mapIssueSummaryToPageItem),
      nextAfterIssueNumber: null,
    },
  };
}

/** Builds one canonical all-project page fixture from presentation issues. */
function buildAllIssuePageTestProps(
  params: URLSearchParams,
  snapshot: DashboardSnapshot,
  issues: IssueSummary[]
): Pick<TestDashboardProps, 'allIssuePageRequest' | 'allIssuePageResult'> {
  const query = parseDashboardAllIssueQuery({
    query: params.get('q'),
    status: params.get('status'),
    priority: params.get('priority'),
    sort: params.get('sort'),
    afterAt: params.get('allAfterAt'),
    afterProject: params.get('allAfterProject'),
    afterIssue: params.get('allAfterIssue'),
  });

  return {
    allIssuePageRequest: query,
    allIssuePageResult: {
      status: 'success',
      sort: query.sort,
      filters: query.filters,
      items: issues.flatMap((issue, index) => {
        const project = snapshot.projects.find(
          (candidate) => candidate.key === issue.projectKey
        );

        return project
          ? [
              {
                ...mapIssueSummaryToPageItem(issue),
                project: {
                  key: project.key,
                  name: project.name,
                  currentUserRole: project.currentUserRole ?? 'viewer',
                },
                updatedAt: `2026-07-19T${String(23 - index).padStart(2, '0')}:00:00.000Z`,
              },
            ]
          : [];
      }),
      nextAfter: null,
    },
  };
}

/** Maps one presentation issue into the bounded page DTO. */
function mapIssueSummaryToPageItem(issue: IssueSummary) {
  return {
    key: issue.id,
    issueNumber: Number(issue.id.slice(issue.projectKey.length + 1)),
    title: issue.title,
    status: rawIssueStatus[issue.status],
    priority: rawIssuePriority[issue.priority],
    requiresHumanApproval: issue.approvalRequired,
    assignedAuthUserId: issue.assigneeAuthUserId,
    assigneeLabel: issue.assigneeLabel,
    latestPlan: issue.latestPlan
      ? {
          version: issue.latestPlan.version,
          stepCount: issue.latestPlan.steps.length,
        }
      : null,
  } as const;
}

/** Builds a direct detail fixture for one public issue summary. */
function buildIssueDetailTestProps(
  snapshot: DashboardSnapshot,
  issue: IssueSummary
): Pick<TestDashboardProps, 'issueDetailRequestKey' | 'issueDetailResult'> {
  const project = snapshot.projects.find(
    (candidate) => candidate.key === issue.projectKey
  );

  if (!project) {
    return { issueDetailRequestKey: null, issueDetailResult: null };
  }

  return {
    issueDetailRequestKey: issue.id,
    issueDetailResult: {
      status: 'success',
      project: {
        key: project.key,
        name: project.name,
        isArchived: project.isArchived,
        currentUserRole: project.currentUserRole ?? 'viewer',
      },
      issue: {
        key: issue.id,
        issueNumber: Number(issue.id.slice(issue.projectKey.length + 1)),
        title: issue.title,
        description: issue.description ?? '',
        status: rawIssueStatus[issue.status],
        priority: rawIssuePriority[issue.priority],
        requiresHumanApproval: issue.approvalRequired,
        assignedAuthUserId: issue.assigneeAuthUserId,
        assigneeLabel: issue.assigneeLabel,
        createdAt: '2026-07-18T10:00:00.000Z',
        updatedAt: '2026-07-19T10:00:00.000Z',
        latestPlan: issue.latestPlan ?? null,
        notes: issue.notes ?? [],
        hasMoreNotes: issue.hasMoreNotes ?? false,
      },
    },
  };
}

describe('BubblophyDashboard interactions', () => {
  beforeEach(() => {
    autoCommitMockNavigation = true;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(async () => undefined),
      },
    });
    navigationMocks.routerPush.mockClear();
    navigationMocks.routerReplace.mockClear();
    navigationMocks.routerRefresh.mockClear();
    navigationMocks.searchParams.mockReset();
    navigationMocks.searchParams.mockReturnValue(new URLSearchParams());
  });

  it('uses the domain term for issue responsibility', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    expect(
      screen.getByRole('columnheader', { name: 'Zuständig' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Owner' })
    ).not.toBeInTheDocument();
  });

  it('keeps viewer issue and run controls read-only', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithViewerAccess}
        createIssueAction={async () => ({
          status: 'invalid',
          reason: 'empty_title',
        })}
        createIssuePlanAction={async () => ({
          status: 'invalid',
          reason: 'empty_issue',
        })}
        updateIssueContentAction={async () => ({ status: 'forbidden' })}
        updateIssueStatusAction={async () => ({ status: 'forbidden' })}
        requestAgentRunAction={async () => ({ status: 'forbidden' })}
        transitionAgentRunAction={async () => ({ status: 'forbidden' })}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).queryByRole('button', { name: 'Bearbeiten' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Status speichern' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Freigeben' })
    ).not.toBeInTheDocument();
  });

  it.each(['member', 'viewer'] as const)(
    'hides project and token management from %s roles',
    (role) => {
      const restrictedSnapshot = {
        ...databaseSnapshot,
        projects: databaseSnapshot.projects.map((project) => ({
          ...project,
          currentUserRole: role,
        })),
      } satisfies DashboardSnapshot;

      render(
        <BubblophyDashboard
          snapshot={restrictedSnapshot}
          updateProjectContentAction={async () => ({ status: 'forbidden' })}
          transitionProjectArchiveAction={async () => ({
            status: 'forbidden',
          })}
          createAgentTokenAction={async () => ({ status: 'forbidden' })}
          updateAgentTokenLifecycleAction={async () => ({
            status: 'forbidden',
          })}
        />
      );

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Projekt Bubblesverse (BV) auswählen',
        })
      );

      const projectsSection = document.getElementById('projects');
      const agentSection = document.getElementById('agents');

      expect(projectsSection).toBeInstanceOf(HTMLElement);
      expect(agentSection).toBeInstanceOf(HTMLElement);

      if (!projectsSection || !agentSection) {
        throw new Error('Expected project and token sections to render.');
      }

      expect(
        within(projectsSection).queryByLabelText('Name')
      ).not.toBeInTheDocument();
      expect(
        within(projectsSection).queryByRole('button', {
          name: 'Projekt archivieren',
        })
      ).not.toBeInTheDocument();
      expect(
        within(agentSection).queryByRole('button', {
          name: 'Agent-Token erstellen',
        })
      ).not.toBeInTheDocument();
      expect(
        within(agentSection).queryByRole('button', { name: 'Pausieren' })
      ).not.toBeInTheDocument();
      expect(
        within(agentSection).queryByRole('button', { name: 'Fortsetzen' })
      ).not.toBeInTheDocument();
      expect(
        within(agentSection).queryByRole('button', { name: 'Widerrufen' })
      ).not.toBeInTheDocument();
    }
  );

  it('scopes token creation and lifecycle controls to managed projects', () => {
    const mixedRoleSnapshot = withAgentTokenFixtures({
      ...databaseSnapshot,
      projects: databaseSnapshot.projects.map((project) => ({
        ...project,
        currentUserRole:
          project.key === 'NO'
            ? ('maintainer' as const)
            : project.key === 'BV'
              ? ('viewer' as const)
              : ('member' as const),
      })),
    } satisfies DashboardSnapshot);

    render(
      <BubblophyDashboard
        snapshot={mixedRoleSnapshot}
        createAgentTokenAction={async () => ({ status: 'forbidden' })}
        updateAgentTokenLifecycleAction={async () => ({
          status: 'forbidden',
        })}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );

    const dialog = screen.getByRole('dialog');
    const projectSelect = within(dialog).getByLabelText('Projekt');

    expect(within(projectSelect).getAllByRole('option')).toHaveLength(1);
    expect(within(projectSelect).getByRole('option')).toHaveTextContent(
      'NO · Novari'
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Schließen' }));

    expect(
      within(agentSection).getAllByRole('button', { name: 'Pausieren' })
    ).toHaveLength(1);
    expect(
      within(agentSection).queryByRole('button', { name: 'Fortsetzen' })
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).getAllByRole('button', { name: 'Widerrufen' })
    ).toHaveLength(1);
  });

  it('filters the issue queue when a project is selected', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const novariProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Novari (NO) auswählen',
    });

    fireEvent.click(novariProjectButton);

    expect(screen.getByText('Gefiltert auf Projekt NO.')).toBeInTheDocument();
    expect(navigationMocks.routerPush).toHaveBeenCalledWith('/?project=NO');
    expect(novariProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('NO-08');
    expect(
      screen.getByRole('button', {
        name: 'Novari-Projekte für externe Mitarbeit freigeben',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Agent-Zugriff mit projektbezogenen Tokens',
      })
    ).not.toBeInTheDocument();
  });

  it('restores project and issue selection from query parameters', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=NO&issue=NO-08')
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Novari (NO) auswählen',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gefiltert auf Projekt NO.')).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('NO-08');
    expect(screen.getAllByText('claude-code-martin').length).toBeGreaterThan(0);
    expect(screen.queryByText('codex-local-lio')).not.toBeInTheDocument();
    expect(screen.getAllByText('NO-08').length).toBeGreaterThan(0);
    expect(screen.queryByText('BV-14')).not.toBeInTheDocument();
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();
    expect(
      screen.getByText('Novari-Run in Review verschoben')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Plan für BV-12 aktualisiert')
    ).not.toBeInTheDocument();
  });

  it('keeps the activity kind but clears its cursor on project changes', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams(
        'activityKind=issue&activityAfterAt=2026-07-19T10%3A00%3A00.000Z&activityAfterSource=issue&activityAfterId=event-20&memberAfterAt=2026-07-01T09%3A00%3A00.000Z&memberAfterAuthUserId=user-20'
      )
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Projekt Novari (NO) auswählen',
      })
    );

    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?activityKind=issue&project=NO'
    );
  });

  it('renders the bounded all-project page and keeps a direct detail open', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('issue=NO-08')
    );
    const noIssueDetail = {
      status: 'success',
      project: {
        key: 'NO',
        name: 'Novari',
        isArchived: false,
        currentUserRole: 'member',
      },
      issue: {
        key: 'NO-08',
        issueNumber: 8,
        title: 'Projektübergreifende Queue prüfen',
        description: 'Direktes Detail aus einem anderen Projekt.',
        status: 'ready',
        priority: 'medium',
        requiresHumanApproval: false,
        assignedAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        createdAt: '2026-07-18T10:00:00.000Z',
        updatedAt: '2026-07-19T11:00:00.000Z',
        latestPlan: null,
        notes: [],
        hasMoreNotes: false,
      },
    } satisfies ReadDashboardIssueDetailResult;

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        allIssuePageRequest={allIssuePageRequest}
        allIssuePageResult={allIssuePageResult}
        issueDetailRequestKey="NO-08"
        issueDetailResult={noIssueDetail}
      />
    );

    const issueSection = document.getElementById('issues');

    expect(issueSection).toBeInstanceOf(HTMLElement);

    if (!issueSection) {
      throw new Error('Expected issue queue section to render.');
    }

    expect(
      within(issueSection).getByRole('row', {
        name: /Issue BV-14: Serverseitige Queue anbinden auswählen/,
      })
    ).toBeInTheDocument();
    expect(
      within(issueSection).getByRole('row', {
        name: /Issue NO-08: Projektübergreifende Queue prüfen auswählen/,
      })
    ).toBeInTheDocument();
    expect(
      within(issueSection).queryByRole('row', { name: /Issue BV-12:/ })
    ).not.toBeInTheDocument();
    expect(
      within(issueSection).getByLabelText('Issue-Details')
    ).toHaveTextContent('Direktes Detail aus einem anderen Projekt.');
    expect(screen.getByLabelText('Issues durchsuchen')).toBeInTheDocument();
  });

  it('advances the all-project queue with its public three-part cursor', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('q=Queue&tab=audit')
    );
    autoCommitMockNavigation = false;
    const filteredRequest = {
      ...allIssuePageRequest,
      filters: { ...allIssuePageRequest.filters, query: 'Queue' },
    };
    const filteredResult = {
      ...allIssuePageResult,
      filters: filteredRequest.filters,
    };

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        allIssuePageRequest={filteredRequest}
        allIssuePageResult={filteredResult}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Weitere 25' }));

    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?q=Queue&tab=audit&allAfterAt=2026-07-19T11%3A00%3A00.000Z&allAfterProject=NO&allAfterIssue=8'
    );
  });

  it('resets the all-project cursor and detail when filters change', () => {
    const cursor = allIssuePageResult.nextAfter;

    if (!cursor) {
      throw new Error('Expected the all-project fixture cursor.');
    }

    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams(
        'issue=NO-08&q=Alt&allAfterAt=2026-07-19T11%3A00%3A00.000Z&allAfterProject=NO&allAfterIssue=8&tab=audit'
      )
    );
    autoCommitMockNavigation = false;
    const pagedRequest = {
      ...allIssuePageRequest,
      filters: { ...allIssuePageRequest.filters, query: 'Alt' },
      after: cursor,
    };

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        allIssuePageRequest={pagedRequest}
        allIssuePageResult={{
          ...allIssuePageResult,
          filters: pagedRequest.filters,
        }}
      />
    );

    fireEvent.change(screen.getByLabelText('Issue-Suche'), {
      target: { value: 'Neu' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Anwenden' }));

    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?q=Neu&tab=audit'
    );
  });

  it('uses an all-project role recheck for selected issue write gates', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('issue=BV-14')
    );
    const viewerResult = {
      ...allIssuePageResult,
      items: allIssuePageResult.items.map((item) =>
        item.project.key === 'BV'
          ? {
              ...item,
              project: { ...item.project, currentUserRole: 'viewer' as const },
            }
          : item
      ),
    };

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        allIssuePageRequest={allIssuePageRequest}
        allIssuePageResult={viewerResult}
        createIssueNoteAction={async () => ({
          status: 'invalid',
          reason: 'empty_note',
        })}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Notiz speichern' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Notizen können nur für gespeicherte Issues in aktiven Projekten mit Datenbankzugriff angelegt werden.'
      )
    ).toBeInTheDocument();
  });

  it('fails closed for snapshot project roles absent from the all-project page', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        allIssuePageRequest={allIssuePageRequest}
        allIssuePageResult={allIssuePageResult}
        createIssueAction={async () => ({
          status: 'invalid',
          reason: 'empty_title',
        })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    const projectSelect = screen.getByLabelText('Projekt');

    expect(
      within(projectSelect).getByRole('option', { name: 'BV · Bubblesverse' })
    ).toBeInTheDocument();
    expect(
      within(projectSelect).getByRole('option', { name: 'NO · Novari' })
    ).toBeInTheDocument();
    expect(
      within(projectSelect).queryByRole('option', { name: 'YK · Yoink' })
    ).not.toBeInTheDocument();
  });

  it('does not fall back to snapshot issues when the all-project read fails', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        allIssuePageRequest={allIssuePageRequest}
        allIssuePageResult={{ status: 'database_unavailable' }}
      />
    );

    expect(
      screen.getByText(
        'Die Issue-Liste ist gerade nicht verfügbar. Andere Dashboard-Bereiche bleiben nutzbar.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: /Issue BV-12:/ })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent(
      'Kein Issue ausgewählt.'
    );
  });

  it('ignores stale all-project page props until the URL request arrives', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('q=Andere')
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        allIssuePageRequest={allIssuePageRequest}
        allIssuePageResult={allIssuePageResult}
      />
    );

    expect(
      screen.getByText('Die Issue-Liste wird für diese URL geladen.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('row', {
        name: /Issue BV-14: Serverseitige Queue anbinden auswählen/,
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: /Issue BV-12:/ })
    ).not.toBeInTheDocument();
  });

  it('renders the bounded server page while keeping an off-page detail open', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-99"
        issueDetailResult={bvOffPageIssueDetailResult}
      />
    );

    const issueSection = document.getElementById('issues');

    expect(issueSection).toBeInstanceOf(HTMLElement);

    if (!issueSection) {
      throw new Error('Expected issue queue section to render.');
    }

    expect(
      within(issueSection).getByRole('row', {
        name: /Issue BV-14: Serverseitige Queue anbinden auswählen/,
      })
    ).toBeInTheDocument();
    expect(
      within(issueSection).queryByRole('row', {
        name: /Issue BV-12:/,
      })
    ).not.toBeInTheDocument();
    expect(
      within(issueSection).getByLabelText('Issue-Details')
    ).toHaveTextContent('BV-99');
    expect(
      within(issueSection).getByLabelText('Issue-Details')
    ).toHaveTextContent(
      'Dieses Issue steht nicht in der aktuellen 25er-Seite.'
    );
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();
  });

  it('marks bounded issue-note history without hiding current notes', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-99"
        issueDetailResult={{
          ...bvOffPageIssueDetailResult,
          issue: {
            ...bvOffPageIssueDetailResult.issue,
            notes: [
              {
                id: 'note-recent',
                note: 'Neueste begrenzte Notiz',
                actor: 'Mensch',
                createdAt: '2026-07-19T12:00:00.000Z',
              },
            ],
            hasMoreNotes: true,
          },
        }}
      />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(detailPanel).toHaveTextContent('Neueste begrenzte Notiz');
    expect(detailPanel).toHaveTextContent(
      'Ältere Notizen sind in dieser Ansicht noch nicht geladen.'
    );
  });

  it('keeps a created note bounded across the confirming detail refresh', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );
    const serverNotes = Array.from({ length: 50 }, (_, index) => ({
      id: `note-${index + 1}`,
      note: `Servernotiz ${index + 1}`,
      actor: 'Mensch' as const,
      createdAt: `2026-07-19T${String(23 - (index % 24)).padStart(2, '0')}:00:00.000Z`,
    }));
    const createdNote = {
      id: 'note-created',
      note: 'Frisch gespeicherte Notiz',
      actor: 'Mensch' as const,
      createdAt: '2026-07-19T23:30:00.000Z',
    };
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async () => ({ status: 'created', note: createdNote }));
    const initialDetailResult = {
      ...bvOffPageIssueDetailResult,
      issue: {
        ...bvOffPageIssueDetailResult.issue,
        notes: serverNotes,
        hasMoreNotes: false,
      },
    } satisfies ReadDashboardIssueDetailResult;
    const { rerender } = render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-99"
        issueDetailResult={initialDetailResult}
        createIssueNoteAction={createIssueNoteAction}
      />
    );
    const notesRegion = screen.getByLabelText('Notizen für BV-99');

    fireEvent.change(within(notesRegion).getByLabelText('Neue Notiz'), {
      target: { value: createdNote.note },
    });
    fireEvent.click(
      within(notesRegion).getByRole('button', { name: 'Notiz speichern' })
    );

    expect(
      await within(notesRegion).findByText(createdNote.note)
    ).toBeInTheDocument();
    expect(within(notesRegion).getAllByRole('listitem')).toHaveLength(50);
    expect(within(notesRegion).queryByText('Servernotiz 50')).toBeNull();

    rerender(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-99"
        issueDetailResult={{
          ...initialDetailResult,
          issue: {
            ...initialDetailResult.issue,
            notes: [createdNote, ...serverNotes.slice(0, 49)],
            hasMoreNotes: true,
          },
        }}
        createIssueNoteAction={createIssueNoteAction}
      />
    );

    const refreshedNotesRegion = screen.getByLabelText('Notizen für BV-99');

    expect(
      within(refreshedNotesRegion).getAllByText(createdNote.note)
    ).toHaveLength(1);
    expect(within(refreshedNotesRegion).getAllByRole('listitem')).toHaveLength(
      50
    );
    expect(refreshedNotesRegion).toHaveTextContent(
      'Ältere Notizen sind in dieser Ansicht noch nicht geladen.'
    );
  });

  it('preserves the older-history marker after pending notes overflow', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );
    let createdNoteSequence = 0;
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async (input) => {
      createdNoteSequence += 1;

      return {
        status: 'created',
        note: {
          id: `pending-${createdNoteSequence}`,
          note: input.note,
          actor: 'Mensch',
          createdAt: `2026-07-19T12:00:${String(createdNoteSequence).padStart(2, '0')}.000Z`,
        },
      };
    });
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-99"
        issueDetailResult={bvOffPageIssueDetailResult}
        createIssueNoteAction={createIssueNoteAction}
      />
    );
    const notesRegion = screen.getByLabelText('Notizen für BV-99');

    for (let index = 1; index <= 51; index += 1) {
      const noteInput = within(notesRegion).getByLabelText('Neue Notiz');

      fireEvent.change(noteInput, {
        target: { value: `Pending-Notiz ${index}` },
      });
      fireEvent.click(
        within(notesRegion).getByRole('button', { name: 'Notiz speichern' })
      );

      await waitFor(() => {
        expect(createIssueNoteAction).toHaveBeenCalledTimes(index);
        expect(noteInput).toHaveValue('');
      });
    }

    expect(within(notesRegion).getAllByRole('listitem')).toHaveLength(50);
    expect(
      within(notesRegion).getByText('Pending-Notiz 51')
    ).toBeInTheDocument();
    expect(within(notesRegion).queryByText('Pending-Notiz 1')).toBeNull();
    expect(notesRegion).toHaveTextContent(
      'Ältere Notizen sind in dieser Ansicht noch nicht geladen.'
    );
  });

  it('submits project search without preserving cursor or detail selection', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99&after=42&tab=audit')
    );
    autoCommitMockNavigation = false;

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={{
          ...bvIssuePageRequest,
          afterIssueNumber: 42,
        }}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-99"
        issueDetailResult={bvOffPageIssueDetailResult}
      />
    );

    fireEvent.change(screen.getByLabelText('Issue-Suche'), {
      target: { value: ' OAuth ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Anwenden' }));

    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?project=BV&tab=audit&q=OAuth'
    );
  });

  it('advances the concrete queue with its opaque forward cursor', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99&q=Queue&tab=audit')
    );
    autoCommitMockNavigation = false;

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={{
          ...bvIssuePageRequest,
          filters: {
            ...bvIssuePageRequest.filters,
            query: 'Queue',
          },
        }}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-99"
        issueDetailResult={bvOffPageIssueDetailResult}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Weitere 25' }));

    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?project=BV&q=Queue&tab=audit&after=14'
    );
  });

  it('does not fall back to snapshot issues when the page read fails', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-12')
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={{ status: 'database_unavailable' }}
        issueDetailResult={null}
      />
    );

    expect(
      screen.getByText(
        'Die Issue-Liste ist gerade nicht verfügbar. Andere Dashboard-Bereiche bleiben nutzbar.'
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent(
      'Kein Issue ausgewählt.'
    );
    expect(
      screen.queryByRole('row', { name: /Issue BV-12:/ })
    ).not.toBeInTheDocument();
  });

  it('keeps an unavailable off-page deep link without rewriting its URL', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-99"
        issueDetailResult={{ status: 'database_unavailable' }}
      />
    );

    expect(
      screen.getByText(
        'Die vollständigen Issue-Details sind gerade nicht verfügbar. Die Queue bleibt nutzbar.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('row', {
        name: /Issue BV-14: Serverseitige Queue anbinden auswählen/,
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent(
      'Kein Issue ausgewählt.'
    );
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();
  });

  it('ignores stale same-project page props until the URL request arrives', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&q=Andere')
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={bvIssuePageResult}
      />
    );

    expect(
      screen.getByText('Die Issue-Liste wird für diese URL geladen.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('row', {
        name: /Issue BV-14: Serverseitige Queue anbinden auswählen/,
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: /Issue BV-12:/ })
    ).not.toBeInTheDocument();
  });

  it('uses revalidated viewer and archive state for issue write gates', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );
    const archivedViewerPage = {
      ...bvIssuePageResult,
      project: {
        ...bvIssuePageResult.project,
        isArchived: true,
        currentUserRole: 'viewer',
      },
    } satisfies ReadDashboardIssuePageResult;
    const archivedViewerDetail = {
      ...bvOffPageIssueDetailResult,
      project: archivedViewerPage.project,
    } satisfies ReadDashboardIssueDetailResult;

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={archivedViewerPage}
        issueDetailRequestKey="BV-99"
        issueDetailResult={archivedViewerDetail}
        updateIssueContentAction={async () => ({ status: 'forbidden' })}
        updateIssueStatusAction={async () => ({ status: 'forbidden' })}
        createIssuePlanAction={async () => ({ status: 'forbidden' })}
        requestAgentRunAction={async () => ({ status: 'forbidden' })}
      />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(detailPanel).toHaveTextContent('BV-99');
    expect(
      within(detailPanel).queryByRole('button', { name: 'Bearbeiten' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Status speichern' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
  });

  it('uses the restrictive result when page and detail access disagree', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );
    const archivedViewerPage = {
      ...bvIssuePageResult,
      project: {
        ...bvIssuePageResult.project,
        isArchived: true,
        currentUserRole: 'viewer',
      },
    } satisfies ReadDashboardIssuePageResult;

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={archivedViewerPage}
        issueDetailRequestKey="BV-99"
        issueDetailResult={bvOffPageIssueDetailResult}
        updateIssueContentAction={async () => ({ status: 'forbidden' })}
        updateIssueStatusAction={async () => ({ status: 'forbidden' })}
        createIssuePlanAction={async () => ({ status: 'forbidden' })}
        requestAgentRunAction={async () => ({ status: 'forbidden' })}
      />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(detailPanel).toHaveTextContent('BV-99');
    expect(
      within(detailPanel).queryByRole('button', { name: 'Bearbeiten' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Status speichern' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
  });

  it('keeps missing deep-link feedback while selecting a queue fallback', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );
    autoCommitMockNavigation = false;

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-14"
        issueDetailResult={{
          status: 'success',
          project: bvIssuePageResult.project,
          issue: {
            ...bvOffPageIssueDetailResult.issue,
            key: 'BV-14',
            issueNumber: 14,
          },
        }}
        missingRequestedIssueKey="BV-99"
      />
    );

    expect(
      screen.getByText(
        'Das direkt verlinkte Issue ist nicht mehr verfügbar. Bubblophy zeigt stattdessen die aktuelle Queue-Auswahl.'
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
  });

  it('removes a locally persisted issue after authoritative not-found', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV')
    );
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-99',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: 'mittel',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: 'Veralteter lokaler Vollinhalt.',
      },
    }));
    const fallbackDetail = {
      status: 'success',
      project: bvIssuePageResult.project,
      issue: {
        ...bvOffPageIssueDetailResult.issue,
        key: 'BV-14',
        issueNumber: 14,
        title: 'Aktuelles Fallback-Detail',
      },
    } satisfies ReadDashboardIssueDetailResult;
    const { rerender } = render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Nicht mehr vorhandenes Issue' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-99');

    autoCommitMockNavigation = false;
    rerender(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={bvIssuePageResult}
        issueDetailRequestKey="BV-14"
        issueDetailResult={fallbackDetail}
        missingRequestedIssueKey="BV-99"
        createIssueAction={createIssueAction}
      />
    );

    expect(
      screen.queryByText('Nicht mehr vorhandenes Issue')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Veralteter lokaler Vollinhalt.')
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent(
      'Aktuelles Fallback-Detail'
    );
  });

  it('ignores stale missing-detail props after an issue-only URL change', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );
    autoCommitMockNavigation = false;
    const pageWithMissingRow = {
      ...bvIssuePageResult,
      items: [
        {
          ...bvIssuePageResult.items[0]!,
          key: 'BV-99',
          issueNumber: 99,
          title: 'Andere aktuelle Auswahl',
        },
        bvIssuePageResult.items[0]!,
      ],
    } satisfies ReadDashboardIssuePageResult;

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={pageWithMissingRow}
        issueDetailRequestKey="BV-14"
        issueDetailResult={{
          status: 'success',
          project: bvIssuePageResult.project,
          issue: {
            ...bvOffPageIssueDetailResult.issue,
            key: 'BV-14',
            issueNumber: 14,
          },
        }}
        missingRequestedIssueKey="BV-99"
      />
    );

    expect(
      screen.getByText(/Das direkt verlinkte Issue ist nicht mehr verfügbar/)
    ).toBeInTheDocument();

    act(() => {
      commitMockNavigation('/?project=BV&issue=BV-14');
    });

    expect(
      screen.queryByText(/Das direkt verlinkte Issue ist nicht mehr verfügbar/)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('row', {
        name: /Issue BV-99: Andere aktuelle Auswahl auswählen/,
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
  });

  it('hides local issue overlays when project access is denied', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV')
    );
    const { rerender } = render(
      <BubblophyDashboard snapshot={databaseSnapshot} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Vertraulicher lokaler Draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Draft anlegen' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(
      screen.getAllByText('Vertraulicher lokaler Draft').length
    ).toBeGreaterThan(0);

    const redactedSnapshot = {
      ...databaseSnapshot,
      projects: databaseSnapshot.projects.filter(
        (project) => project.key !== 'BV'
      ),
      projectMembers: databaseSnapshot.projectMembers.filter(
        (member) => member.projectKey !== 'BV'
      ),
      agentRuns: databaseSnapshot.agentRuns.filter(
        (run) => !run.issueId.startsWith('BV-')
      ),
      activity: databaseSnapshot.activity.filter(
        (event) => event.projectKey !== 'BV'
      ),
    } satisfies DashboardSnapshot;

    rerender(
      <BubblophyDashboard snapshot={redactedSnapshot} deniedProjectKey="BV" />
    );

    expect(
      screen.queryByText('Vertraulicher lokaler Draft')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('codex-local-lio')).not.toBeInTheDocument();
    expect(screen.queryByText('run_bv_14')).not.toBeInTheDocument();
  });

  it('discards a successful detail when the page membership gate is not found', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-99')
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issuePageRequest={bvIssuePageRequest}
        issuePageResult={{ status: 'not_found' }}
        issueDetailRequestKey="BV-99"
        issueDetailResult={bvOffPageIssueDetailResult}
      />
    );

    expect(screen.getByLabelText('Issue-Details')).not.toHaveTextContent(
      'BV-99'
    );
    expect(
      screen.queryByText(
        'Dieses Issue steht nicht in der aktuellen 25er-Seite.'
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: /Issue BV-12:/ })
    ).not.toBeInTheDocument();
  });

  it('follows browser history changes without restoring stale selection', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=BV-12')
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');

    autoCommitMockNavigation = false;
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Projekt Novari (NO) auswählen',
      })
    );

    expect(screen.getByText('Gefiltert auf Projekt BV.')).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
    expect(navigationMocks.routerPush).toHaveBeenCalledWith('/?project=NO');
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();

    commitMockNavigation('/?project=NO&issue=NO-08');

    await waitFor(() => {
      expect(screen.getByText('Gefiltert auf Projekt NO.')).toBeInTheDocument();
      expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('NO-08');
    });
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();

    commitMockNavigation('/?project=BV&issue=BV-12');

    await waitFor(() => {
      expect(screen.getByText('Gefiltert auf Projekt BV.')).toBeInTheDocument();
      expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
    });
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();
  });

  it('normalizes an invalid selection reached through browser history', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=NO&issue=NO-08')
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    commitMockNavigation('/?project=BV&issue=NO-08');

    await waitFor(() => {
      expect(screen.getByText('Gefiltert auf Projekt BV.')).toBeInTheDocument();
      expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
      expect(navigationMocks.routerReplace).toHaveBeenCalledWith(
        '/?project=BV&issue=BV-14'
      );
    });
  });

  it('normalizes invalid deep-link selection to the rendered fallback issue', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&issue=NO-08')
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gefiltert auf Projekt BV.')).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
    expect(screen.queryByText('NO-08')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(navigationMocks.routerReplace).toHaveBeenCalledWith(
        '/?project=BV&issue=BV-14'
      );
    });
    expect(navigationMocks.routerPush).not.toHaveBeenCalled();
  });

  it('falls back from unknown selection params while preserving other query params', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=ZZ&issue=ZZ-99&tab=runs')
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getByRole('button', {
        name: 'Alle Projekte auswählen, 29% bereit',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');

    await waitFor(() => {
      expect(navigationMocks.routerReplace).toHaveBeenCalledWith(
        '/?issue=BV-14&tab=runs'
      );
    });
    expect(navigationMocks.routerPush).not.toHaveBeenCalled();
  });

  it('keeps the default first visit URL untouched', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();
    expect(navigationMocks.routerPush).not.toHaveBeenCalled();
  });

  it('filters projects from the keyboard and restores all projects', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const yoinkProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Yoink (YK) auswählen',
    });

    fireEvent.keyDown(yoinkProjectButton, { key: 'Enter' });

    expect(yoinkProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gefiltert auf Projekt YK.')).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('YK-03');
    expect(
      screen.queryByRole('button', {
        name: 'Agent-Zugriff mit projektbezogenen Tokens',
      })
    ).not.toBeInTheDocument();

    const allProjectsButton = within(projectsSection).getByRole('button', {
      name: 'Alle Projekte auswählen, 29% bereit',
    });

    fireEvent.keyDown(allProjectsButton, { key: ' ' });

    expect(allProjectsButton).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('Projektübergreifende, zugriffsgeprüfte Übersicht.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
  });

  it('shows issue details when an issue is clicked', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const issueButton = screen.getByRole('button', {
      name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
    });

    fireEvent.click(issueButton);

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(issueButton).toHaveAttribute('aria-pressed', 'true');
    expect(within(detailPanel).getByText('BV-12')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Projekt BV · Zuständig mrbubbles')
    ).toBeInTheDocument();
    expect(navigationMocks.routerPush).toHaveBeenCalledWith('/?issue=BV-12');
  });

  it('selects an issue when its table row is clicked', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const issueButton = screen.getByRole('button', {
      name: 'Novari-Projekte für externe Mitarbeit freigeben',
    });
    const issueRow = issueButton.closest('tr');

    expect(issueRow).toBeInstanceOf(HTMLTableRowElement);

    if (!(issueRow instanceof HTMLTableRowElement)) {
      throw new Error('Expected issue row to render.');
    }

    fireEvent.click(issueRow);

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(issueRow).toHaveAttribute('aria-selected', 'true');
    expect(within(detailPanel).getByText('NO-08')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Projekt NO · Zuständig Martin')
    ).toBeInTheDocument();
  });

  it('selects an issue from the keyboard-focused table row', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const issueButton = screen.getByRole('button', {
      name: 'Novari-Projekte für externe Mitarbeit freigeben',
    });
    const issueRow = issueButton.closest('tr');

    expect(issueRow).toBeInstanceOf(HTMLTableRowElement);

    if (!(issueRow instanceof HTMLTableRowElement)) {
      throw new Error('Expected issue row to render.');
    }

    expect(
      screen.getByRole('row', {
        name: 'Issue NO-08: Novari-Projekte für externe Mitarbeit freigeben auswählen',
      })
    ).toBe(issueRow);

    fireEvent.keyDown(issueRow, { key: 'Enter' });

    expect(issueRow).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('NO-08');

    const firstIssueRow = screen.getByRole('row', {
      name: 'Issue BV-14: Agent-Zugriff mit projektbezogenen Tokens auswählen',
    });

    fireEvent.keyDown(firstIssueRow, { key: ' ' });

    expect(firstIssueRow).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
  });

  it('does not expose fake plan persistence for sample snapshots', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).queryByRole('button', { name: /Plan entwerfen/i })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Sample-Daten enthalten aktuell/i)
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Status speichern' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Bearbeiten' })
    ).not.toBeInTheDocument();
  });

  it('persists human issue edits and keeps the selected issue stable', async () => {
    const updateIssueContentAction = vi.fn<
      (
        input: UpdateBubblophyIssueContentActionInput
      ) => Promise<UpdateBubblophyIssueContentActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Plan-Notiz persistent nachschärfen',
        description: 'Beschreibung wurde über die Server-Action gespeichert.',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'hoch',
        assigneeAuthUserId: 'user_mrbubbles',
        assigneeLabel: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueContentAction={updateIssueContentAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Bearbeiten' })
    );
    fireEvent.change(within(detailPanel).getByLabelText('Titel'), {
      target: { value: 'Plan-Notiz persistent nachschärfen' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Beschreibung'), {
      target: {
        value: 'Beschreibung wurde über die Server-Action gespeichert.',
      },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateIssueContentAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        title: 'Plan-Notiz persistent nachschärfen',
        description: 'Beschreibung wurde über die Server-Action gespeichert.',
      });
    });
    expect(updateIssueContentAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(
        within(detailPanel).getByText('Plan-Notiz persistent nachschärfen')
      ).toBeInTheDocument();
    });
    expect(
      within(detailPanel).getByText(
        'Beschreibung wurde über die Server-Action gespeichert.'
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
    expect(
      screen.getByRole('button', { name: 'Plan-Notiz persistent nachschärfen' })
    ).toBeInTheDocument();
  });

  it('cancels human issue edits without calling the server action', () => {
    const updateIssueContentAction =
      vi.fn<
        (
          input: UpdateBubblophyIssueContentActionInput
        ) => Promise<UpdateBubblophyIssueContentActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithIssueDescription}
        updateIssueContentAction={updateIssueContentAction}
      />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Bearbeiten' })
    );
    fireEvent.change(within(detailPanel).getByLabelText('Titel'), {
      target: { value: 'Nicht speichern' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Beschreibung'), {
      target: { value: 'Wird verworfen.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Abbrechen' })
    );

    expect(updateIssueContentAction).not.toHaveBeenCalled();
    expect(
      within(detailPanel).queryByText('Nicht speichern')
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Beschreibung aus dem Dashboard-Snapshot.')
    ).toBeInTheDocument();
  });

  it('shows forbidden issue edit errors without discarding the edit state', async () => {
    const updateIssueContentAction = vi.fn<
      (
        input: UpdateBubblophyIssueContentActionInput
      ) => Promise<UpdateBubblophyIssueContentActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueContentAction={updateIssueContentAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Bearbeiten' })
    );
    fireEvent.change(within(detailPanel).getByLabelText('Titel'), {
      target: { value: 'Nicht erlaubt' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateIssueContentAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        title: 'Nicht erlaubt',
        description: '',
      });
    });
    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Du darfst dieses Issue nicht bearbeiten'
    );
    expect(within(detailPanel).getByLabelText('Titel')).toHaveValue(
      'Nicht erlaubt'
    );
  });

  it('shows issue edit action exceptions without discarding the edit state', async () => {
    const updateIssueContentAction = vi.fn<
      (
        input: UpdateBubblophyIssueContentActionInput
      ) => Promise<UpdateBubblophyIssueContentActionResult>
    >(async () => {
      throw new Error('server action failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueContentAction={updateIssueContentAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Bearbeiten' })
    );
    fireEvent.change(within(detailPanel).getByLabelText('Titel'), {
      target: { value: 'Nicht gespeichert' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Beschreibung'), {
      target: { value: 'Dieser Entwurf bleibt im Formular.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateIssueContentAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        title: 'Nicht gespeichert',
        description: 'Dieser Entwurf bleibt im Formular.',
      });
    });
    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Die Änderung konnte gerade nicht gespeichert werden'
    );
    expect(within(detailPanel).getByLabelText('Titel')).toHaveValue(
      'Nicht gespeichert'
    );
    expect(within(detailPanel).getByLabelText('Beschreibung')).toHaveValue(
      'Dieser Entwurf bleibt im Formular.'
    );
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
  });

  it('persists a human issue status transition and resets the target state', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        assigneeAuthUserId: 'user_mrbubbles',
        assigneeLabel: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const statusSelect = within(detailPanel).getByLabelText('Neuer Status');

    expect(statusSelect).toBeInstanceOf(HTMLSelectElement);

    if (!(statusSelect instanceof HTMLSelectElement)) {
      throw new Error('Expected the status select to render.');
    }

    fireEvent.change(statusSelect, {
      target: { value: 'bereit' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Grund'), {
      target: { value: 'Plan ist bereit zur Prüfung.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'geplant',
        status: 'bereit',
        reason: 'Plan ist bereit zur Prüfung.',
      });
    });
    expect(updateIssueStatusAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(within(detailPanel).getByText('Bereit')).toBeInTheDocument();
    });

    const resetStatusSelect =
      within(detailPanel).getByLabelText('Neuer Status');

    expect(resetStatusSelect).toBeInstanceOf(HTMLSelectElement);

    if (!(resetStatusSelect instanceof HTMLSelectElement)) {
      throw new Error('Expected the reset status select to render.');
    }

    expect(resetStatusSelect.value).not.toBe('bereit');
    expect(getMetricValue('Offene Issues')).toHaveTextContent('24');
    expect(getMetricValue('Readiness')).toHaveTextContent('33%');
    expect(getMetricCaption('Offene Issues')).toHaveTextContent(
      '8 bereit für Freigabe'
    );
    expect(
      screen.getByRole('progressbar', { name: '5 bereit, 12 offen' })
    ).toBeInTheDocument();
  });

  it('shows a stale-write conflict without changing local issue status', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({ status: 'conflict' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    fireEvent.change(within(detailPanel).getByLabelText('Neuer Status'), {
      target: { value: 'bereit' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'zwischenzeitlich geändert'
    );
    expect(within(detailPanel).getByText('Geplant')).toBeInTheDocument();
  });

  it('does not expose unsupported issue archive or delete controls', () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({ status: 'unchanged' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByLabelText('Neuer Status')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: /archivieren/i })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', {
        name: /löschen|entfernen/i,
      })
    ).not.toBeInTheDocument();
  });

  it('persists a human issue priority update and keeps list and detail state consistent', async () => {
    const updateIssuePriorityAction = vi.fn<
      (
        input: UpdateBubblophyIssuePriorityActionInput
      ) => Promise<UpdateBubblophyIssuePriorityActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'mittel',
        assigneeAuthUserId: 'user_mrbubbles',
        assigneeLabel: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssuePriorityAction={updateIssuePriorityAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const prioritySelect = within(detailPanel).getByLabelText('Neue Priorität');

    expect(prioritySelect).toBeInstanceOf(HTMLSelectElement);

    if (!(prioritySelect instanceof HTMLSelectElement)) {
      throw new Error('Expected the priority select to render.');
    }

    fireEvent.change(prioritySelect, {
      target: { value: 'mittel' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Priorität speichern' })
    );

    await waitFor(() => {
      expect(updateIssuePriorityAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        priority: 'mittel',
      });
    });
    expect(updateIssuePriorityAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    expect(
      await within(detailPanel).findByText('Priorität gespeichert.')
    ).toBeInTheDocument();
    expect(within(detailPanel).getByText('Mittel')).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('row', {
          name: 'Issue BV-12: Issue-Plan als strukturierte Arbeitsnotiz speichern auswählen',
        })
      ).getByText('Mittel')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
  });

  it('shows priority action exceptions without changing the selected issue', async () => {
    const updateIssuePriorityAction = vi.fn<
      (
        input: UpdateBubblophyIssuePriorityActionInput
      ) => Promise<UpdateBubblophyIssuePriorityActionResult>
    >(async () => {
      throw new Error('server action failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssuePriorityAction={updateIssuePriorityAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Neue Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Priorität speichern' })
    );

    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Die Priorität konnte gerade nicht gespeichert werden'
    );
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
  });

  it('assigns an issue to a project member and keeps list and detail state consistent', async () => {
    const updateIssueAssigneeAction = vi.fn<
      (
        input: UpdateBubblophyIssueAssigneeActionInput
      ) => Promise<UpdateBubblophyIssueAssigneeActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'hoch',
        assigneeAuthUserId: 'user_martin',
        assigneeLabel: 'user_martin',
        planSteps: 3,
        approvalRequired: true,
      },
    }));
    const requestAgentRunAction =
      vi.fn<
        (
          input: RequestBubblophyAgentRunActionInput
        ) => Promise<RequestBubblophyAgentRunActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const assigneeSelect = within(detailPanel).getByLabelText('Zuständig');

    fireEvent.change(assigneeSelect, {
      target: { value: 'user_martin' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Zuweisung speichern' })
    );

    await waitFor(() => {
      expect(updateIssueAssigneeAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        assigneeAuthUserId: 'user_martin',
      });
    });
    expect(updateIssueAssigneeAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(
        within(detailPanel).getByText(/Zuständig Martin/i)
      ).toBeInTheDocument();
    });
    expect(
      within(detailPanel).getByText(/Zuständig Martin/i)
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('row', {
          name: 'Issue BV-12: Issue-Plan als strukturierte Arbeitsnotiz speichern auswählen',
        })
      ).getByText('Martin')
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('removes an issue assignment through the persisted assignment action', async () => {
    const assignedSnapshot = withIssueFixtures(
      { ...databaseSnapshotWithManageableMembers } satisfies DashboardSnapshot,
      dashboardIssueFixtures.map((issue) =>
        issue.id === 'BV-12'
          ? {
              ...issue,
              assigneeAuthUserId: 'user_martin',
              assigneeLabel: 'user_martin',
            }
          : issue
      )
    );
    const updateIssueAssigneeAction = vi.fn<
      (
        input: UpdateBubblophyIssueAssigneeActionInput
      ) => Promise<UpdateBubblophyIssueAssigneeActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'hoch',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 3,
        approvalRequired: true,
      },
    }));
    const requestAgentRunAction =
      vi.fn<
        (
          input: RequestBubblophyAgentRunActionInput
        ) => Promise<RequestBubblophyAgentRunActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={assignedSnapshot}
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Zuständig'), {
      target: { value: '' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Zuweisung speichern' })
    );

    await waitFor(() => {
      expect(updateIssueAssigneeAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        assigneeAuthUserId: null,
      });
    });
    expect(
      await within(detailPanel).findByText(/Zuständig Nicht zugewiesen/i)
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('reloads options after replacing a former dangling assignee', async () => {
    const danglingSnapshot = withIssueFixtures(
      { ...databaseSnapshot } satisfies DashboardSnapshot,
      dashboardIssueFixtures.map((issue) =>
        issue.id === 'BV-12'
          ? {
              ...issue,
              assigneeAuthUserId: 'user_former',
              assigneeLabel: 'Ehemaliges Projektmitglied',
            }
          : issue
      )
    );
    let assigneeOptionsReadCount = 0;
    const readIssueAssigneeOptionsAction = vi.fn<
      () => Promise<ReadBubblophyIssueAssigneeOptionsActionResult>
    >(async () => {
      assigneeOptionsReadCount += 1;
      return {
        status: 'success',
        project: {
          key: 'BV',
          name: 'Bubblesverse',
          currentUserRole: 'owner',
        },
        issueKey: 'BV-12',
        query: null,
        after: null,
        currentAssignee:
          assigneeOptionsReadCount === 1
            ? {
                authUserId: 'user_former',
                label: 'Ehemaliges Projektmitglied',
                role: null,
                isCurrentMember: false,
              }
            : {
                authUserId: 'user_martin',
                label: 'Martin',
                role: 'member',
                isCurrentMember: true,
              },
        items: [{ authUserId: 'user_martin', label: 'Martin', role: 'member' }],
        nextAfter: null,
      };
    });
    const updateIssueAssigneeAction = vi.fn<
      () => Promise<UpdateBubblophyIssueAssigneeActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'hoch',
        assigneeAuthUserId: 'user_martin',
        assigneeLabel: 'Martin',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={danglingSnapshot}
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        readIssueAssigneeOptionsAction={readIssueAssigneeOptionsAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );
    const detailPanel = screen.getByLabelText('Issue-Details');
    const selector = await within(detailPanel).findByRole('combobox', {
      name: 'Zuständig',
    });
    fireEvent.click(selector);
    fireEvent.click(await screen.findByText(/Martin · Member/));
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Zuweisung speichern' })
    );

    await waitFor(() => {
      expect(readIssueAssigneeOptionsAction).toHaveBeenCalledTimes(2);
    });
    fireEvent.click(
      within(screen.getByLabelText('Issue-Details')).getByRole('combobox', {
        name: 'Zuständig',
      })
    );
    expect(
      screen.queryByRole('option', { name: 'Ehemaliges Projektmitglied' })
    ).not.toBeInTheDocument();
  });

  it('shows assignee action failures without leaking details or discarding the selection', async () => {
    const updateIssueAssigneeAction = vi.fn<
      (
        input: UpdateBubblophyIssueAssigneeActionInput
      ) => Promise<UpdateBubblophyIssueAssigneeActionResult>
    >(async () => {
      throw new Error('internal project id or membership SQL');
    });
    const requestAgentRunAction =
      vi.fn<
        (
          input: RequestBubblophyAgentRunActionInput
        ) => Promise<RequestBubblophyAgentRunActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const assigneeSelect = within(detailPanel).getByLabelText('Zuständig');

    fireEvent.change(assigneeSelect, {
      target: { value: 'user_martin' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Zuweisung speichern' })
    );

    const alert = await within(detailPanel).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Die Zuweisung konnte gerade nicht gespeichert werden'
    );
    expect(alert.textContent).not.toContain('internal project id');
    expect(alert.textContent).not.toContain('membership SQL');
    expect(assigneeSelect).toHaveValue('user_martin');
    expect(
      within(detailPanel).getByText(/Zuständig mrbubbles/i)
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('shows denied assignee results without discarding the selected member', async () => {
    const updateIssueAssigneeAction = vi.fn<
      (
        input: UpdateBubblophyIssueAssigneeActionInput
      ) => Promise<UpdateBubblophyIssueAssigneeActionResult>
    >(async () => ({
      status: 'forbidden',
    }));
    const requestAgentRunAction =
      vi.fn<
        (
          input: RequestBubblophyAgentRunActionInput
        ) => Promise<RequestBubblophyAgentRunActionResult>
      >();

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateIssueAssigneeAction={updateIssueAssigneeAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const assigneeSelect = within(detailPanel).getByLabelText('Zuständig');

    fireEvent.change(assigneeSelect, {
      target: { value: 'user_martin' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Zuweisung speichern' })
    );

    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Du darfst dieses Issue nicht zuweisen'
    );
    expect(assigneeSelect).toHaveValue('user_martin');
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('shows status action exceptions without changing the selected issue', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => {
      throw new Error('server action failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const statusSelect = within(detailPanel).getByLabelText('Neuer Status');

    fireEvent.change(statusSelect, {
      target: { value: 'erledigt' },
    });
    fireEvent.change(within(detailPanel).getByLabelText('Grund'), {
      target: { value: 'Soll abgeschlossen werden.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'geplant',
        status: 'erledigt',
        reason: 'Soll abgeschlossen werden.',
      });
    });
    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Der Status konnte gerade nicht gespeichert werden'
    );
    expect(statusSelect).toHaveValue('erledigt');
    expect(within(detailPanel).getByLabelText('Grund')).toHaveValue(
      'Soll abgeschlossen werden.'
    );
    expect(within(detailPanel).getByText('Geplant')).toBeInTheDocument();
    expect(getMetricValue('Offene Issues')).toHaveTextContent('24');
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-12');
  });

  it('updates project blocker metrics after a human status transition', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'blockiert',
        priority: 'hoch',
        assigneeAuthUserId: 'user_mrbubbles',
        assigneeLabel: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Neuer Status'), {
      target: { value: 'blockiert' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'geplant',
        status: 'blockiert',
        reason: '',
      });
    });
    await waitFor(() => {
      expect(getMetricValue('Blocker')).toHaveTextContent('4');
    });
    expect(getMetricValue('Offene Issues')).toHaveTextContent('24');
    expect(
      screen.getByRole('progressbar', { name: '4 bereit, 12 offen' })
    ).toBeInTheDocument();
  });

  it('closes an issue through the persisted status action', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'erledigt',
        priority: 'hoch',
        assigneeAuthUserId: 'user_mrbubbles',
        assigneeLabel: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateIssueStatusAction={updateIssueStatusAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.change(within(detailPanel).getByLabelText('Neuer Status'), {
      target: { value: 'erledigt' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'geplant',
        status: 'erledigt',
        reason: '',
      });
    });
    await waitFor(() => {
      expect(within(detailPanel).getByText('Erledigt')).toBeInTheDocument();
    });
    expect(getMetricValue('Offene Issues')).toHaveTextContent('23');
  });

  it('reopens a done issue through the persisted status action', async () => {
    const updateIssueStatusAction = vi.fn<
      (
        input: UpdateBubblophyIssueStatusActionInput
      ) => Promise<UpdateBubblophyIssueStatusActionResult>
    >(async () => ({
      status: 'updated',
      issue: {
        id: 'BV-12',
        title: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
        projectKey: 'BV',
        status: 'triage',
        priority: 'hoch',
        assigneeAuthUserId: 'user_mrbubbles',
        assigneeLabel: 'mrbubbles',
        planSteps: 3,
        approvalRequired: true,
      },
    }));
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => {
      throw new Error('Run should not be requested by status changes.');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithDoneIssue}
        updateIssueStatusAction={updateIssueStatusAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('Erledigt')).toBeInTheDocument();
    fireEvent.change(within(detailPanel).getByLabelText('Neuer Status'), {
      target: { value: 'triage' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Status speichern' })
    );

    await waitFor(() => {
      expect(updateIssueStatusAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        expectedStatus: 'erledigt',
        status: 'triage',
        reason: '',
      });
    });
    await waitFor(() => {
      expect(within(detailPanel).getByText('Triage')).toBeInTheDocument();
    });
    expect(screen.getByRole('row', { name: /BV-12/ })).toHaveTextContent(
      'Triage'
    );
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('persists a human issue plan and renders it in the detail panel', async () => {
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async () => ({
      status: 'created',
      plan: {
        issueId: 'BV-12',
        version: 2,
        summary: 'Kontext sichern und Review vorbereiten.',
        steps: [
          { id: 'step_1', text: 'Bestehenden Snapshot lesen' },
          { id: 'step_2', text: 'Plan-Notiz prüfen' },
        ],
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssuePlanAction={createIssuePlanAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan entwerfen' })
    );
    expect(screen.getByRole('dialog')).toHaveClass(
      'max-h-[min(90svh,42rem)]',
      'overflow-y-auto'
    );
    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Kontext sichern und Review vorbereiten.' },
    });
    fireEvent.change(screen.getByLabelText('Schritt 1'), {
      target: { value: 'Bestehenden Snapshot lesen' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Schritt hinzufügen' }));
    fireEvent.change(screen.getByLabelText('Schritt 2'), {
      target: { value: 'Plan-Notiz prüfen' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        summary: 'Kontext sichern und Review vorbereiten.',
        steps: ['Bestehenden Snapshot lesen', 'Plan-Notiz prüfen'],
      });
    });
    expect(createIssuePlanAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const updatedDetailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(updatedDetailPanel).getByText(
        'Kontext sichern und Review vorbereiten.'
      )
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('Bestehenden Snapshot lesen')
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('Plan-Notiz prüfen')
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText(
        'Plan v2, menschlich gespeichert. Es wurde kein Agent-Run gestartet.'
      )
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('2 Schritte')
    ).toBeInTheDocument();
    expect(screen.getAllByText('2 Schritte').length).toBeGreaterThanOrEqual(2);
  });

  it('renders reloaded latest plan content for persisted issues', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReloadedPlan} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Reload zeigt den gespeicherten Plan.')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Persistierten Plan lesen')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Detailpanel verifizieren')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText(
        'Plan v4, menschlich gespeichert. Es wurde kein Agent-Run gestartet.'
      )
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByText(/Plan-Schritte sind noch nicht/i)
    ).not.toBeInTheDocument();
  });

  it('edits a reloaded latest plan as a new persisted plan version', async () => {
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async () => ({
      status: 'created',
      plan: {
        issueId: 'BV-12',
        version: 5,
        summary: 'Reload-Plan wurde nachgeschärft.',
        steps: [
          { id: 'step_1', text: 'Persistierten Plan lesen' },
          { id: 'step_2', text: 'Detailpanel verifizieren' },
          { id: 'step_3', text: 'Neue Planversion speichern' },
        ],
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithReloadedPlan}
        createIssuePlanAction={createIssuePlanAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan bearbeiten' })
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Plan-Zusammenfassung')).toHaveValue(
      'Reload zeigt den gespeicherten Plan.'
    );
    expect(screen.getByLabelText('Schritt 1')).toHaveValue(
      'Persistierten Plan lesen'
    );
    expect(screen.getByLabelText('Schritt 2')).toHaveValue(
      'Detailpanel verifizieren'
    );

    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Reload-Plan wurde nachgeschärft.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Schritt hinzufügen' }));
    fireEvent.change(screen.getByLabelText('Schritt 3'), {
      target: { value: 'Neue Planversion speichern' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        summary: 'Reload-Plan wurde nachgeschärft.',
        steps: [
          'Persistierten Plan lesen',
          'Detailpanel verifizieren',
          'Neue Planversion speichern',
        ],
      });
    });
    expect(createIssuePlanAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const updatedDetailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(updatedDetailPanel).getByText('Reload-Plan wurde nachgeschärft.')
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('Neue Planversion speichern')
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText(
        'Plan v5, menschlich gespeichert. Es wurde kein Agent-Run gestartet.'
      )
    ).toBeInTheDocument();
    expect(
      within(updatedDetailPanel).getByText('3 Schritte')
    ).toBeInTheDocument();
    expect(screen.getAllByText('3 Schritte').length).toBeGreaterThanOrEqual(2);
  });

  it('copies issue agent briefing with persisted plan context', async () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReloadedPlan} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Lokaler Agent-Auftrag')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Startet keinen Agenten/i)
    ).toBeInTheDocument();

    fireEvent.click(
      within(detailPanel).getByRole('button', {
        name: 'Agent-Auftrag kopieren',
      })
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Bubblophy lokaler Agent-Auftrag')
      );
    });

    const copiedBriefing = vi.mocked(navigator.clipboard.writeText).mock
      .calls[0]?.[0];

    expect(copiedBriefing).toContain('Projekt: BV');
    expect(copiedBriefing).toContain('Issue: BV-12');
    expect(copiedBriefing).toContain(
      'Titel: Issue-Plan als strukturierte Arbeitsnotiz speichern'
    );
    expect(copiedBriefing).toContain('Status: Geplant');
    expect(copiedBriefing).toContain('Priorität: Hoch');
    expect(copiedBriefing).toContain(
      'Summary: Reload zeigt den gespeicherten Plan.'
    );
    expect(copiedBriefing).toContain('1. Persistierten Plan lesen');
    expect(copiedBriefing).toContain('2. Detailpanel verifizieren');
    expect(copiedBriefing).toContain('Kein Agent wurde gestartet.');
    expect(copiedBriefing).toContain(
      'Der Mensch entscheidet bewusst, ob ein neuer Run angefragt wird.'
    );
  });

  it('does not expose agent briefing for local draft issues', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Lokaler Agent-Draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Draft anlegen/i }));

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Lokal / nicht gespeichert')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByText('Lokaler Agent-Auftrag')
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', {
        name: 'Agent-Auftrag kopieren',
      })
    ).not.toBeInTheDocument();
  });

  it('keeps agent briefing free of token secrets and autostart language', async () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReloadedPlan} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', {
        name: 'Agent-Auftrag kopieren',
      })
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    const copiedBriefing = vi.mocked(navigator.clipboard.writeText).mock
      .calls[0]?.[0];

    expect(copiedBriefing).not.toMatch(/token|secret|hash/i);
    expect(copiedBriefing).not.toMatch(/supabase/i);
    expect(copiedBriefing).not.toMatch(/Agent gestartet/i);
    expect(copiedBriefing).not.toMatch(/Run wird ausgeführt/i);
    expect(copiedBriefing).not.toMatch(/automatisch fortsetzen/i);
  });

  it('keeps the plan dialog open and shows denied plan save errors', async () => {
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssuePlanAction={createIssuePlanAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan entwerfen' })
    );
    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Nicht erlaubter Plan.' },
    });
    fireEvent.change(screen.getByLabelText('Schritt 1'), {
      target: { value: 'Darf nicht gespeichert werden' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        summary: 'Nicht erlaubter Plan.',
        steps: ['Darf nicht gespeichert werden'],
      });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Du bist kein Mitglied dieses Projekts. Der Plan wurde nicht gespeichert.'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.queryByText('Plan v2, menschlich gespeichert')
    ).not.toBeInTheDocument();
  });

  it('keeps the plan dialog open when the plan action throws', async () => {
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async () => {
      throw new Error('plan action failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithReloadedPlan}
        createIssuePlanAction={createIssuePlanAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan bearbeiten' })
    );
    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Plan bleibt im Dialog.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        summary: 'Plan bleibt im Dialog.',
        steps: ['Persistierten Plan lesen', 'Detailpanel verifizieren'],
      });
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Der Plan konnte gerade nicht gespeichert werden'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Plan-Zusammenfassung')).toHaveValue(
      'Plan bleibt im Dialog.'
    );
  });

  it('renders reloaded issue notes in the selected issue detail', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithIssueNote} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-12');

    expect(
      within(notesRegion).getByText('Bestehende Review-Notiz aus dem Reload.')
    ).toBeInTheDocument();
    expect(
      within(notesRegion).getByText(/Mensch · 2026-06-14/)
    ).toBeInTheDocument();
  });

  it('shows issue note events in activity without duplicating audit events as notes', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithIssueNoteActivity} />
    );

    const activitySection = document.getElementById('activity');

    expect(activitySection).toBeInstanceOf(HTMLElement);

    if (!activitySection) {
      throw new Error('Expected the activity section to render.');
    }

    expect(
      within(activitySection).getByText(
        'Plan-Review als Issue-Notiz festgehalten.'
      )
    ).toBeInTheDocument();
    expect(
      within(activitySection).getAllByText('Mensch').length
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-12');

    expect(
      within(notesRegion).getByText('Bestehende Review-Notiz aus dem Reload.')
    ).toBeInTheDocument();
    expect(
      within(notesRegion).queryByText('Plan für BV-12 aktualisiert')
    ).not.toBeInTheDocument();
  });

  it('does not fall back to snapshot activity when the server page fails', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithIssueNoteActivity}
        activityPageRequest={{ projectKey: null, kind: 'all', after: null }}
        activityPageResult={{ status: 'database_unavailable' }}
      />
    );

    const activitySection = document.getElementById('activity');

    expect(activitySection).toBeInstanceOf(HTMLElement);

    if (!activitySection) {
      throw new Error('Expected the activity section to render.');
    }

    expect(within(activitySection).getByRole('alert')).toHaveTextContent(
      'Audit-Aktivität konnte nicht geladen werden'
    );
    expect(
      within(activitySection).queryByText(
        'Plan-Review als Issue-Notiz festgehalten.'
      )
    ).not.toBeInTheDocument();
  });

  it('writes the complete activity cursor when paging forward', () => {
    const nextAfter = {
      occurredAt: '2026-07-19T10:00:00.000Z',
      source: 'project' as const,
      eventId: 'event-20',
    };

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        activityPageRequest={{ projectKey: null, kind: 'all', after: null }}
        activityPageResult={{
          status: 'success',
          filters: { projectKey: null, kind: null },
          items: [],
          nextAfter,
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));

    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?activityAfterAt=2026-07-19T10%3A00%3A00.000Z&activityAfterSource=project&activityAfterId=event-20'
    );
  });

  it('appends a human issue note without starting an agent run', async () => {
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async (input) => ({
      status: 'created',
      note: {
        id: 'event_note_new',
        note: input.note,
        actor: 'Mensch',
        createdAt: '2026-06-14T10:00:00.000Z',
      },
    }));
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => {
      throw new Error('Run should not be requested by notes.');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueNoteAction={createIssueNoteAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-12');
    const noteInput = within(notesRegion).getByLabelText('Neue Notiz');

    fireEvent.change(noteInput, {
      target: { value: '<strong>Plan bleibt menschlich.</strong>' },
    });
    fireEvent.click(
      within(notesRegion).getByRole('button', { name: 'Notiz speichern' })
    );

    await waitFor(() => {
      expect(createIssueNoteAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        note: '<strong>Plan bleibt menschlich.</strong>',
      });
    });
    expect(createIssueNoteAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(
        within(notesRegion).getByText(
          '<strong>Plan bleibt menschlich.</strong>'
        )
      ).toBeInTheDocument();
    });
    expect(notesRegion.querySelector('strong')).toBeNull();
    expect(noteInput).toHaveValue('');
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('keeps note input when the issue note action is denied', async () => {
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async () => ({ status: 'forbidden' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueNoteAction={createIssueNoteAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');
    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-12');
    const noteInput = within(notesRegion).getByLabelText('Neue Notiz');

    fireEvent.change(noteInput, {
      target: { value: 'Viewer darf nicht speichern.' },
    });
    fireEvent.click(
      within(notesRegion).getByRole('button', { name: 'Notiz speichern' })
    );

    await waitFor(() => {
      expect(createIssueNoteAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        note: 'Viewer darf nicht speichern.',
      });
    });

    expect(await within(notesRegion).findByRole('alert')).toHaveTextContent(
      'Du darfst für dieses Issue keine Notiz schreiben.'
    );
    expect(noteInput).toHaveValue('Viewer darf nicht speichern.');
    expect(
      within(notesRegion).queryByText('Notiz gespeichert.')
    ).not.toBeInTheDocument();
  });

  it('opens a local draft dialog from the new issue action', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Neues Issue als Draft')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Issue erstellen' })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/Datenbank nicht aktiv, Draft bleibt lokal/i).length
    ).toBeGreaterThan(0);
  });

  it('creates, selects, and discards a local draft issue without persistence', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    const createButton = screen.getByRole('button', { name: 'Draft anlegen' });

    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Lokaler Test-Draft' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Diese Notiz bleibt nur lokal.' },
    });
    fireEvent.change(screen.getByLabelText('Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(createButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Lokaler Test-Draft' })
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('BV-DRAFT-01')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Lokal / nicht gespeichert')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Diese Notiz bleibt nur lokal.')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: 'Status speichern' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByRole('button', { name: /Plan entwerfen/i })
    ).not.toBeInTheDocument();

    navigationMocks.routerPush.mockClear();
    navigationMocks.routerReplace.mockClear();
    autoCommitMockNavigation = false;
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Draft verwerfen' })
    );

    expect(
      screen.queryByRole('button', { name: 'Lokaler Test-Draft' })
    ).not.toBeInTheDocument();
    expect(navigationMocks.routerPush).toHaveBeenCalledTimes(1);
    expect(navigationMocks.routerPush).toHaveBeenCalledWith('/');
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();

    commitMockNavigation('/');

    expect(navigationMocks.searchParams().get('issue')).toBeNull();
  });

  it('returns to the first queue page when a local draft is created', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV&sort=oldest&after=42')
    );

    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    navigationMocks.routerPush.mockClear();
    autoCommitMockNavigation = false;
    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Draft von einer Folgeseite' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Draft anlegen' }));

    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?project=BV&sort=oldest&issue=BV-DRAFT-01'
    );
  });

  it('does not show the database project create action for sample snapshots', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    expect(
      screen.queryByRole('button', { name: 'Neues Projekt' })
    ).not.toBeInTheDocument();
  });

  it('shows a database setup state without project creation when the database is unavailable', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseUnavailableSnapshot}
        createProjectAction={async () => ({
          status: 'database_unavailable',
        })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getByText('Datenbank-Setup erforderlich.')
    ).toBeInTheDocument();
    expect(
      within(projectsSection).getByText(
        /Bubblophy-Tabellen scheinen zu fehlen/i
      )
    ).toBeInTheDocument();
    expect(
      within(projectsSection).queryByRole('button', { name: 'Neues Projekt' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Agent-Token erstellen' })
    ).not.toBeInTheDocument();
  });

  it('does not expose fake agent token creation for sample snapshots', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    expect(
      screen.queryByRole('button', { name: 'Agent-Token erstellen' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Beispielhafte Agent-Token-Vorschau/i)
    ).toBeInTheDocument();
  });

  it('writes the complete cursor when opening the next token page', () => {
    const nextAfter = {
      projectKey: 'NO',
      normalizedLabel: 'token 20',
      tokenId: 'token-20',
    } as const;

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        agentTokenPageRequest={{ projectKey: null, query: null, after: null }}
        agentTokenPageResult={{
          status: 'success',
          project: null,
          query: null,
          items: [],
          nextAfter,
        }}
      />
    );
    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    navigationMocks.routerPush.mockClear();
    autoCommitMockNavigation = false;
    fireEvent.click(
      within(agentSection).getByRole('button', { name: 'Weitere 20 Tokens' })
    );

    const pushedHref = navigationMocks.routerPush.mock.calls[0]?.[0];

    expect(pushedHref).toBeTruthy();
    const pushedUrl = new URL(
      pushedHref ?? '/',
      'https://bubblophy.example.test'
    );
    expect(pushedUrl.searchParams.get('tokenAfterProject')).toBe('NO');
    expect(pushedUrl.searchParams.get('tokenAfterLabel')).toBe('token 20');
    expect(pushedUrl.searchParams.get('tokenAfterId')).toBe('token-20');
  });

  it('starts a literal token-label search and clears the old cursor', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams(
        'tokenAfterProject=NO&tokenAfterLabel=token-20&tokenAfterId=token-20'
      )
    );

    render(<BubblophyDashboard snapshot={databaseSnapshot} />);
    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.change(
      within(agentSection).getByLabelText(
        'Agent-Tokens nach Label durchsuchen'
      ),
      { target: { value: '%_\\Codex' } }
    );
    navigationMocks.routerPush.mockClear();
    autoCommitMockNavigation = false;
    fireEvent.click(
      within(agentSection).getByRole('button', { name: 'Suchen' })
    );

    const pushedHref = navigationMocks.routerPush.mock.calls[0]?.[0];
    const pushedUrl = new URL(
      pushedHref ?? '/',
      'https://bubblophy.example.test'
    );

    expect(pushedUrl.searchParams.get('tokenQ')).toBe('%_\\Codex');
    expect(pushedUrl.searchParams.has('tokenAfterProject')).toBe(false);
    expect(pushedUrl.searchParams.has('tokenAfterLabel')).toBe(false);
    expect(pushedUrl.searchParams.has('tokenAfterId')).toBe(false);
  });

  it('keeps the token query while paginating search results', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('tokenQ=Codex')
    );
    const nextAfter = {
      projectKey: 'BV',
      normalizedLabel: 'codex 20',
      tokenId: 'token-20',
    } as const;

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        agentTokenPageRequest={{
          projectKey: null,
          query: 'Codex',
          after: null,
        }}
        agentTokenPageResult={{
          status: 'success',
          project: null,
          query: 'Codex',
          items: [],
          nextAfter,
        }}
      />
    );
    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(agentSection).getByText(
        'Keine Agent-Tokens mit dem Label-Präfix „Codex“ gefunden.'
      )
    ).toBeInTheDocument();
    navigationMocks.routerPush.mockClear();
    autoCommitMockNavigation = false;
    fireEvent.click(
      within(agentSection).getByRole('button', { name: 'Weitere 20 Tokens' })
    );

    const pushedHref = navigationMocks.routerPush.mock.calls[0]?.[0];
    const pushedUrl = new URL(
      pushedHref ?? '/',
      'https://bubblophy.example.test'
    );

    expect(pushedUrl.searchParams.get('tokenQ')).toBe('Codex');
    expect(pushedUrl.searchParams.get('tokenAfterProject')).toBe('BV');
    expect(pushedUrl.searchParams.get('tokenAfterId')).toBe('token-20');
  });

  it('rejects a one-character token search before navigation', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshot} />);
    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.change(
      within(agentSection).getByLabelText(
        'Agent-Tokens nach Label durchsuchen'
      ),
      { target: { value: 'x' } }
    );
    navigationMocks.routerPush.mockClear();
    fireEvent.click(
      within(agentSection).getByRole('button', { name: 'Suchen' })
    );

    expect(within(agentSection).getByRole('alert')).toHaveTextContent(
      'Gib mindestens zwei Zeichen ein'
    );
    expect(navigationMocks.routerPush).not.toHaveBeenCalled();
  });

  it('does not show a created token inside an invalid search result', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('tokenQ=x')
    );
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'created',
      token: {
        id: 'token_xylophon_local',
        label: 'Xylophon lokal',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: 'läuft nicht automatisch ab',
        plaintextToken: 'test_plaintext_token_once',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
        agentTokenPageRequest={{ projectKey: null, query: 'x', after: null }}
        agentTokenPageResult={{
          status: 'invalid',
          reason: 'query_too_short',
        }}
      />
    );
    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(within(agentSection).getByRole('alert')).toHaveTextContent(
      'Die Agent-Token-Suche oder Seitenposition ist ungültig.'
    );

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Xylophon lokal' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    const dialog = await screen.findByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Fertig' }));

    expect(createAgentTokenAction).toHaveBeenCalledOnce();
    expect(within(agentSection).queryByText('Xylophon lokal')).toBeNull();
    expect(within(agentSection).getByRole('alert')).toHaveTextContent(
      'Die Agent-Token-Suche oder Seitenposition ist ungültig.'
    );
  });

  it('shows token loading while URL and server page fingerprints differ', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams(
        'tokenAfterProject=BV&tokenAfterLabel=codex&tokenAfterId=token-20'
      )
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        agentTokenPageRequest={{ projectKey: null, query: null, after: null }}
        agentTokenPageResult={{
          status: 'success',
          project: null,
          query: null,
          items: [],
          nextAfter: null,
        }}
      />
    );
    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(within(agentSection).getByRole('status')).toHaveTextContent(
      'Agent-Token-Liste wird geladen.'
    );
    expect(within(agentSection).queryByText('codex-local-lio')).toBeNull();
    expect(
      within(agentSection).queryByText(/Noch keine Agent-Tokens/i)
    ).toBeNull();
  });

  it('shows token loading while the URL and server search differ', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('tokenQ=Claude')
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        agentTokenPageRequest={{
          projectKey: null,
          query: 'Codex',
          after: null,
        }}
        agentTokenPageResult={{
          status: 'success',
          project: null,
          query: 'Codex',
          items: [],
          nextAfter: null,
        }}
      />
    );
    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(within(agentSection).getByRole('status')).toHaveTextContent(
      'Agent-Token-Liste wird geladen.'
    );
    expect(within(agentSection).queryByText('codex-local-lio')).toBeNull();
  });

  it('offers a first-page reset for an invalid token cursor', () => {
    const foreignCursor = {
      projectKey: 'NO',
      normalizedLabel: 'token-20',
      tokenId: 'token-20',
    } as const;
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams(
        'project=BV&tokenAfterProject=NO&tokenAfterLabel=token-20&tokenAfterId=token-20'
      )
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        agentTokenPageRequest={{
          projectKey: 'BV',
          query: null,
          after: foreignCursor,
        }}
        agentTokenPageResult={{
          status: 'invalid',
          reason: 'invalid_cursor',
        }}
      />
    );
    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    navigationMocks.routerPush.mockClear();
    autoCommitMockNavigation = false;
    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Zur ersten Token-Seite',
      })
    );

    const pushedHref = navigationMocks.routerPush.mock.calls[0]?.[0];
    const pushedUrl = new URL(
      pushedHref ?? '/',
      'https://bubblophy.example.test'
    );

    expect(pushedUrl.searchParams.get('project')).toBe('BV');
    expect(pushedUrl.searchParams.has('tokenAfterProject')).toBe(false);
    expect(pushedUrl.searchParams.has('tokenAfterLabel')).toBe(false);
    expect(pushedUrl.searchParams.has('tokenAfterId')).toBe(false);
  });

  it.each([
    {
      accessState: 'viewer role',
      currentUserRole: 'viewer' as const,
      projectIsArchived: false,
    },
    {
      accessState: 'archived project',
      currentUserRole: 'owner' as const,
      projectIsArchived: true,
    },
  ])(
    'hides token lifecycle controls for final $accessState metadata',
    ({ currentUserRole, projectIsArchived }) => {
      render(
        <BubblophyDashboard
          snapshot={databaseSnapshot}
          agentTokenPageRequest={{ projectKey: null, query: null, after: null }}
          agentTokenPageResult={{
            status: 'success',
            project: null,
            query: null,
            items: [
              {
                ...dashboardAgentTokenFixtures[0]!,
                currentUserRole,
                projectIsArchived,
              },
            ],
            nextAfter: null,
          }}
          updateAgentTokenLifecycleAction={async () => ({
            status: 'forbidden',
          })}
        />
      );
      const agentSection = document.getElementById('agents');

      expect(agentSection).toBeInstanceOf(HTMLElement);

      if (!agentSection) {
        throw new Error('Expected the agent token section to render.');
      }

      expect(within(agentSection).getByText('codex-local-lio')).toBeVisible();
      expect(
        within(agentSection).queryByRole('button', { name: 'Pausieren' })
      ).toBeNull();
      expect(
        within(agentSection).queryByRole('button', { name: 'Widerrufen' })
      ).toBeNull();
    }
  );

  it('creates and selects a database project from the projects panel', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams(
        'tokenAfterProject=NO&tokenAfterLabel=token-20&tokenAfterId=token-20'
      )
    );
    const createProjectAction = vi.fn<
      (
        input: CreateBubblophyProjectActionInput
      ) => Promise<CreateBubblophyProjectActionResult>
    >(async () => ({
      status: 'created',
      project: {
        id: 'project_zen',
        name: 'Zentrum',
        key: 'ZEN',
        description: 'Neue Projektarbeit.',
        isArchived: false,
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 1,
        agentTokenCount: 0,
        currentUserRole: 'owner',
      },
    }));

    const { rerender } = render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createProjectAction={createProjectAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(
      within(projectsSection).getAllByRole('button', { name: 'Neues Projekt' })
    ).toHaveLength(1);
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Neues Projekt' })
    );
    expect(
      screen.getByRole('dialog', { name: 'Projekt erstellen' })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Zentrum' },
    });
    fireEvent.change(screen.getByLabelText('Key'), {
      target: { value: 'zen' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Neue Projektarbeit.' },
    });
    fireEvent.change(screen.getByLabelText('Repository URL'), {
      target: { value: 'https://github.com/mrbubbles/zentrum' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Projekt erstellen' }));

    await waitFor(() => {
      expect(createProjectAction).toHaveBeenCalledWith({
        name: 'Zentrum',
        key: 'zen',
        description: 'Neue Projektarbeit.',
        repositoryUrl: 'https://github.com/mrbubbles/zentrum',
      });
    });
    expect(createProjectAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );
    const projectSelectionHref =
      navigationMocks.routerPush.mock.calls.at(-1)?.[0];

    expect(projectSelectionHref).toBeTruthy();
    const projectSelectionUrl = new URL(
      projectSelectionHref ?? '/',
      'https://bubblophy.example.test'
    );
    expect(projectSelectionUrl.searchParams.get('project')).toBe('ZEN');
    expect(projectSelectionUrl.searchParams.has('tokenAfterProject')).toBe(
      false
    );
    expect(projectSelectionUrl.searchParams.has('tokenAfterLabel')).toBe(false);
    expect(projectSelectionUrl.searchParams.has('tokenAfterId')).toBe(false);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const createdProject = within(projectsSection).getByRole('button', {
      name: 'Projekt Zentrum (ZEN) auswählen',
    });

    expect(createdProject).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Gefiltert auf Projekt ZEN.')).toBeInTheDocument();
    expect(
      screen.getByText('Noch keine Issues für diesen Filter.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent(
      'Kein Issue ausgewählt.'
    );

    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=ZEN')
    );
    rerender(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createProjectAction={createProjectAction}
      />
    );

    await waitFor(() => {
      expect(createdProject).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByText('Gefiltert auf Projekt ZEN.')
      ).toBeInTheDocument();
    });
    expect(navigationMocks.routerReplace).not.toHaveBeenCalled();
  });

  it('edits the selected project through server-backed management controls', async () => {
    const updateProjectContentAction = vi.fn<
      (
        input: UpdateBubblophyProjectContentActionInput
      ) => Promise<UpdateBubblophyProjectContentActionResult>
    >(async () => ({
      status: 'updated',
      project: {
        id: 'project_bubblesverse',
        name: 'Bubblesverse lokal',
        key: 'BV',
        description: 'Projektsteuerung geschärft.',
        isArchived: false,
        health: 'stabil',
        openIssues: 12,
        readyIssues: 4,
        blockedIssues: 2,
        memberCount: 3,
        agentTokenCount: 1,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={updateProjectContentAction}
        transitionProjectArchiveAction={async () => ({ status: 'unchanged' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    fireEvent.change(within(projectsSection).getByLabelText('Name'), {
      target: { value: 'Bubblesverse lokal' },
    });
    fireEvent.change(within(projectsSection).getByLabelText('Beschreibung'), {
      target: { value: 'Projektsteuerung geschärft.' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateProjectContentAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        name: 'Bubblesverse lokal',
        description: 'Projektsteuerung geschärft.',
      });
    });
    expect(updateProjectContentAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );
    await waitFor(() => {
      expect(
        within(projectsSection).getByText('Bubblesverse lokal')
      ).toBeInTheDocument();
    });
    expect(
      within(projectsSection).getByText('Projektsteuerung geschärft.')
    ).toBeInTheDocument();
    expect(screen.getByText('Gefiltert auf Projekt BV.')).toBeInTheDocument();
  });

  it('requires confirmation before archiving and blocks archived project actions', async () => {
    const transitionProjectArchiveAction = vi.fn<
      (
        input: TransitionBubblophyProjectArchiveActionInput
      ) => Promise<TransitionBubblophyProjectArchiveActionResult>
    >(async () => ({
      status: 'updated',
      project: {
        id: 'project_bubblesverse',
        name: 'Bubblesverse',
        key: 'BV',
        description: 'Projektbeschreibung aus der Datenbank.',
        isArchived: true,
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 3,
        agentTokenCount: 1,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={async () => ({ status: 'unchanged' })}
        transitionProjectArchiveAction={transitionProjectArchiveAction}
        createIssueAction={async () => ({ status: 'forbidden' })}
        createAgentTokenAction={async () => ({ status: 'forbidden' })}
        updateAgentTokenLifecycleAction={async () => ({ status: 'forbidden' })}
        transitionAgentRunAction={async () => ({ status: 'forbidden' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const selectedProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Bubblesverse (BV) auswählen',
    });

    fireEvent.click(selectedProjectButton);
    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt archivieren',
      })
    );

    expect(transitionProjectArchiveAction).not.toHaveBeenCalled();
    expect(
      within(projectsSection).getByRole('button', {
        name: 'Endgültig archivieren',
      })
    ).toBeInTheDocument();

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Endgültig archivieren',
      })
    );

    await waitFor(() => {
      expect(transitionProjectArchiveAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        decision: 'archive',
      });
    });
    expect(
      transitionProjectArchiveAction.mock.calls[0]?.[0]
    ).not.toHaveProperty('authUserId');
    await waitFor(() => {
      expect(
        within(projectsSection).getAllByText('Archiviert').length
      ).toBeGreaterThan(0);
    });
    expect(selectedProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Neues Issue/i })).toBeDisabled();
    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
    expect(
      screen.queryByRole('button', { name: 'Agent-Token erstellen' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pausieren' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Freigeben' })
    ).not.toBeInTheDocument();
  });

  it('shows project archive action exceptions without changing archive state', async () => {
    const transitionProjectArchiveAction = vi.fn<
      (
        input: TransitionBubblophyProjectArchiveActionInput
      ) => Promise<TransitionBubblophyProjectArchiveActionResult>
    >(async () => {
      throw new Error('internal archive project trace');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={async () => ({ status: 'unchanged' })}
        transitionProjectArchiveAction={transitionProjectArchiveAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const selectedProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Bubblesverse (BV) auswählen',
    });

    fireEvent.click(selectedProjectButton);
    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt archivieren',
      })
    );
    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Endgültig archivieren',
      })
    );

    await waitFor(() => {
      expect(transitionProjectArchiveAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        decision: 'archive',
      });
    });

    const alert = await within(projectsSection).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Der Projektstatus konnte gerade nicht geändert werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('archive project');
    expect(selectedProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(projectsSection).getByRole('button', {
        name: 'Endgültig archivieren',
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neues Issue/i })).toBeEnabled();
  });

  it('restores an archived project without changing the selected project', async () => {
    const archivedSnapshot = {
      ...databaseSnapshot,
      projects: databaseSnapshot.projects.map((project) =>
        project.key === 'BV'
          ? {
              ...project,
              isArchived: true,
              health: 'stabil',
              openIssues: 0,
              readyIssues: 0,
              blockedIssues: 0,
            }
          : project
      ),
    } satisfies DashboardSnapshot;
    const transitionProjectArchiveAction = vi.fn<
      (
        input: TransitionBubblophyProjectArchiveActionInput
      ) => Promise<TransitionBubblophyProjectArchiveActionResult>
    >(async () => ({
      status: 'updated',
      project: {
        id: 'project_bubblesverse',
        name: 'Bubblesverse',
        key: 'BV',
        description: 'Projektbeschreibung aus der Datenbank.',
        isArchived: false,
        health: 'aufmerksam',
        openIssues: 12,
        readyIssues: 4,
        blockedIssues: 2,
        memberCount: 3,
        agentTokenCount: 1,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={archivedSnapshot}
        updateProjectContentAction={async () => ({ status: 'unchanged' })}
        transitionProjectArchiveAction={transitionProjectArchiveAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    const selectedProjectButton = within(projectsSection).getByRole('button', {
      name: 'Projekt Bubblesverse (BV) auswählen',
    });

    fireEvent.click(selectedProjectButton);
    expect(screen.getByRole('button', { name: /Neues Issue/i })).toBeDisabled();

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt wiederherstellen',
      })
    );

    await waitFor(() => {
      expect(transitionProjectArchiveAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        decision: 'restore',
      });
    });
    await waitFor(() => {
      expect(within(projectsSection).getByText('Aktiv')).toBeInTheDocument();
    });
    expect(selectedProjectButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Neues Issue/i })).toBeEnabled();
  });

  it('shows project management denials without mutating local project state', async () => {
    const updateProjectContentAction = vi.fn<
      (
        input: UpdateBubblophyProjectContentActionInput
      ) => Promise<UpdateBubblophyProjectContentActionResult>
    >(async () => ({ status: 'forbidden' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={updateProjectContentAction}
        transitionProjectArchiveAction={async () => ({ status: 'unchanged' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    fireEvent.change(within(projectsSection).getByLabelText('Name'), {
      target: { value: 'Verbotene Änderung' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Speichern' })
    );

    expect(await within(projectsSection).findByRole('alert')).toHaveTextContent(
      'Nur Owner und Maintainer können Projekte verwalten.'
    );
    expect(within(projectsSection).getByLabelText('Name')).toHaveValue(
      'Verbotene Änderung'
    );
    expect(
      within(projectsSection).queryByText('Verbotene Änderung')
    ).not.toBeInTheDocument();
  });

  it('shows project content action exceptions without mutating local project state', async () => {
    const updateProjectContentAction = vi.fn<
      (
        input: UpdateBubblophyProjectContentActionInput
      ) => Promise<UpdateBubblophyProjectContentActionResult>
    >(async () => {
      throw new Error('internal project update trace');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateProjectContentAction={updateProjectContentAction}
        transitionProjectArchiveAction={async () => ({ status: 'unchanged' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    fireEvent.change(within(projectsSection).getByLabelText('Name'), {
      target: { value: 'Bubblesverse nicht gespeichert' },
    });
    fireEvent.change(within(projectsSection).getByLabelText('Beschreibung'), {
      target: { value: 'Bleibt nur im Formular.' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(updateProjectContentAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        name: 'Bubblesverse nicht gespeichert',
        description: 'Bleibt nur im Formular.',
      });
    });

    const alert = await within(projectsSection).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Die Projektänderung konnte gerade nicht gespeichert werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('project update');
    expect(within(projectsSection).getByLabelText('Name')).toHaveValue(
      'Bubblesverse nicht gespeichert'
    );
    expect(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    ).toBeInTheDocument();
    expect(
      within(projectsSection).queryByText('Bleibt nur im Formular.')
    ).not.toBeInTheDocument();
  });

  it('lists project members and updates non-owner roles through the server action', async () => {
    const updateProjectMemberRoleAction = vi.fn<
      (
        input: UpdateBubblophyProjectMemberRoleActionInput
      ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>
    >(async () => ({
      status: 'updated',
      member: {
        id: 'BV:user_martin',
        projectKey: 'BV',
        authUserId: 'user_martin',
        label: 'user_martin',
        role: 'viewer',
        createdAt: '2026-06-13T11:00:00.000Z',
      },
      memberCount: 3,
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateProjectMemberRoleAction={updateProjectMemberRoleAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    expect(within(projectsSection).getByText('Mitglieder')).toBeInTheDocument();
    expect(within(projectsSection).getByText('Mara Owner')).toBeInTheDocument();
    expect(
      within(projectsSection).getByText('owner@example.test')
    ).toBeInTheDocument();
    expect(
      within(projectsSection).getByText('Owner geschützt')
    ).toBeInTheDocument();
    expect(
      within(projectsSection).getByText(/Teamzugang per E-Mail-Einladung/)
    ).toBeInTheDocument();
    expect(
      within(projectsSection).getByText('Deine Rolle')
    ).toBeInTheDocument();
    expect(
      within(projectsSection).getByText(
        'Verwaltet Projekt, Team, Einladungen und Tokens und arbeitet an Issues und Runs.'
      )
    ).toBeInTheDocument();
    expect(
      within(projectsSection)
        .getByText('Deine Rolle')
        .compareDocumentPosition(
          within(projectsSection).getByRole('heading', {
            name: 'Einladungen',
          })
        ) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.change(
      within(projectsSection).getByLabelText('Rolle für Martin'),
      {
        target: { value: 'viewer' },
      }
    );

    await waitFor(() => {
      expect(updateProjectMemberRoleAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: 'user_martin',
        expectedRole: 'member',
        role: 'viewer',
      });
    });
    expect(updateProjectMemberRoleAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );
    await waitFor(() => {
      expect(
        within(projectsSection).getAllByText('Viewer').length
      ).toBeGreaterThan(0);
    });
    expect(within(projectsSection).getByText('Martin')).toBeInTheDocument();
    expect(
      within(projectsSection).getByText('martin@example.test')
    ).toBeInTheDocument();
  });

  it('renders the bounded member page and writes its stable next cursor', () => {
    const nextAfter = {
      createdAt: '2026-06-13T10:00:00.000Z',
      authUserId: 'user_owner',
    };
    const memberPageResult = {
      status: 'success',
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        isArchived: false,
        currentUserRole: 'owner',
      },
      items: [databaseSnapshotWithManageableMembers.projectMembers[0]!],
      nextAfter,
    } satisfies ReadDashboardMemberPageResult;

    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV')
    );
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        memberPageRequest={{ projectKey: 'BV', after: null }}
        memberPageResult={memberPageResult}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    expect(within(projectsSection).getByText('Mara Owner')).toBeInTheDocument();
    expect(within(projectsSection).queryByText('Martin')).toBeNull();
    expect(
      within(projectsSection).getByText('1 von 3 sichtbar')
    ).toBeInTheDocument();

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Weitere 20 Mitglieder',
      })
    );

    const pushedHref = navigationMocks.routerPush.mock.lastCall?.[0];

    expect(pushedHref).toBeTruthy();

    if (!pushedHref) {
      throw new Error('Expected member pagination to push a URL.');
    }

    const pushedUrl = new URL(pushedHref, 'https://bubblophy.example.test');

    expect(pushedUrl.searchParams.get('project')).toBe('BV');
    expect(pushedUrl.searchParams.get('memberAfterAt')).toBe(
      nextAfter.createdAt
    );
    expect(pushedUrl.searchParams.get('memberAfterAuthUserId')).toBe(
      nextAfter.authUserId
    );
  });

  it('keeps redacted page identity authoritative after a local role overlay', async () => {
    const martin = databaseSnapshotWithManageableMembers.projectMembers[1]!;
    const updateProjectMemberRoleAction = vi.fn<
      (
        input: UpdateBubblophyProjectMemberRoleActionInput
      ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>
    >(async () => ({
      status: 'updated',
      member: { ...martin, role: 'viewer' },
      memberCount: 3,
    }));
    const ownerPage = {
      status: 'success',
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        isArchived: false,
        currentUserRole: 'owner',
      },
      items: [martin],
      nextAfter: null,
    } satisfies ReadDashboardMemberPageResult;
    const viewerPage = {
      ...ownerPage,
      project: { ...ownerPage.project, currentUserRole: 'viewer' },
      items: [{ ...martin, email: null }],
    } satisfies ReadDashboardMemberPageResult;

    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV')
    );
    const { rerender } = render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        memberPageRequest={{ projectKey: 'BV', after: null }}
        memberPageResult={ownerPage}
        updateProjectMemberRoleAction={updateProjectMemberRoleAction}
      />
    );

    fireEvent.change(screen.getByLabelText('Rolle für Martin'), {
      target: { value: 'viewer' },
    });
    await waitFor(() =>
      expect(updateProjectMemberRoleAction).toHaveBeenCalled()
    );

    rerender(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        memberPageRequest={{ projectKey: 'BV', after: null }}
        memberPageResult={viewerPage}
        updateProjectMemberRoleAction={updateProjectMemberRoleAction}
      />
    );

    expect(screen.getByText('Martin')).toBeInTheDocument();
    expect(screen.queryByText('martin@example.test')).toBeNull();
    expect(screen.getAllByText('Viewer').length).toBeGreaterThan(0);
  });

  it('uses the current member page identity for update and removal feedback', async () => {
    const pageMember = {
      id: 'BV:user_page_only',
      projectKey: 'BV',
      authUserId: 'user_page_only',
      label: 'Neue Person',
      email: 'neu@example.test',
      role: 'member',
      createdAt: '2026-07-01T09:00:00.000Z',
    } as const;
    const memberPage = {
      status: 'success',
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        isArchived: false,
        currentUserRole: 'owner',
      },
      items: [pageMember],
      nextAfter: null,
    } satisfies ReadDashboardMemberPageResult;
    const updateProjectMemberRoleAction = vi.fn<
      (
        input: UpdateBubblophyProjectMemberRoleActionInput
      ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>
    >(async () => ({
      status: 'updated',
      member: { ...pageMember, label: pageMember.authUserId, role: 'viewer' },
      memberCount: 4,
    }));
    const removeProjectMemberAction = vi.fn<
      (
        input: RemoveBubblophyProjectMemberActionInput
      ) => Promise<RemoveBubblophyProjectMemberActionResult>
    >(async () => ({
      status: 'removed',
      projectKey: 'BV',
      memberAuthUserId: pageMember.authUserId,
      memberCount: 3,
    }));

    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV')
    );
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        memberPageRequest={{ projectKey: 'BV', after: null }}
        memberPageResult={memberPage}
        updateProjectMemberRoleAction={updateProjectMemberRoleAction}
        removeProjectMemberAction={removeProjectMemberAction}
      />
    );

    fireEvent.change(screen.getByLabelText('Rolle für Neue Person'), {
      target: { value: 'viewer' },
    });
    expect(
      await screen.findByText('Mitglied Neue Person wurde in BV aktualisiert.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Entfernen' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Endgültig entfernen' })
    );
    expect(
      await screen.findByText('Mitglied Neue Person wurde aus BV entfernt.')
    ).toBeInTheDocument();
  });

  it('loads the email invitation manager without exposing technical member handoff', async () => {
    const readProjectInvitationsAction = vi.fn<
      (input: {
        projectKey: string;
      }) => Promise<ReadBubblophyProjectInvitationManagerSnapshotActionResult>
    >(async () => ({
      status: 'found',
      snapshot: {
        projectKey: 'BV',
        managerRole: 'owner',
        isArchived: false,
        invitations: [],
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        readProjectInvitationsAction={readProjectInvitationsAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    await waitFor(() => {
      expect(readProjectInvitationsAction).toHaveBeenCalledWith({
        projectKey: 'BV',
      });
    });
    expect(
      within(projectsSection).getByText(/Teamzugang per E-Mail-Einladung/)
    ).toBeInTheDocument();
    expect(
      within(projectsSection).queryByLabelText('Auth-User-ID')
    ).not.toBeInTheDocument();
    expect(
      within(projectsSection).queryByLabelText(
        'Eigene Auth-ID für Mitglieder-Handoff'
      )
    ).not.toBeInTheDocument();
    expect(
      await within(projectsSection).findByText(
        'Für dieses Projekt gibt es noch keine Einladungen.'
      )
    ).toBeInTheDocument();
  });

  it('shows role action exceptions without changing the member row', async () => {
    const updateProjectMemberRoleAction = vi.fn<
      (
        input: UpdateBubblophyProjectMemberRoleActionInput
      ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>
    >(async () => {
      throw new Error('internal membership mutation stack');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateProjectMemberRoleAction={updateProjectMemberRoleAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    const martinRoleSelect =
      within(projectsSection).getByLabelText('Rolle für Martin');

    fireEvent.change(martinRoleSelect, {
      target: { value: 'viewer' },
    });

    await waitFor(() => {
      expect(updateProjectMemberRoleAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: 'user_martin',
        expectedRole: 'member',
        role: 'viewer',
      });
    });

    const alert = await within(projectsSection).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Die Rolle konnte gerade nicht geändert werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('membership mutation');
    expect(
      within(projectsSection).getByLabelText('Rolle für Martin')
    ).toHaveValue('member');
    expect(within(projectsSection).getByText('Martin')).toBeInTheDocument();
  });

  it('shows a stale member-role conflict and keeps the visible role unchanged', async () => {
    const updateProjectMemberRoleAction = vi.fn<
      (
        input: UpdateBubblophyProjectMemberRoleActionInput
      ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>
    >(async () => ({ status: 'conflict' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateProjectMemberRoleAction={updateProjectMemberRoleAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    fireEvent.change(
      within(projectsSection).getByLabelText('Rolle für Martin'),
      { target: { value: 'viewer' } }
    );

    expect(await within(projectsSection).findByRole('alert')).toHaveTextContent(
      'Die Rolle wurde zwischenzeitlich geändert. Lade die aktuellen Projektdaten neu.'
    );
    expect(
      within(projectsSection).getByLabelText('Rolle für Martin')
    ).toHaveValue('member');
  });

  it('keeps member management available after project content updates', async () => {
    const updateProjectContentAction = vi.fn<
      (
        input: UpdateBubblophyProjectContentActionInput
      ) => Promise<UpdateBubblophyProjectContentActionResult>
    >(async () => ({
      status: 'updated',
      project: {
        id: 'project_bubblesverse',
        name: 'Bubblesverse lokal',
        key: 'BV',
        description: 'Projektsteuerung geschärft.',
        isArchived: false,
        health: 'stabil',
        openIssues: 12,
        readyIssues: 4,
        blockedIssues: 2,
        memberCount: 3,
        agentTokenCount: 1,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateProjectContentAction={updateProjectContentAction}
        transitionProjectArchiveAction={async () => ({ status: 'unchanged' })}
        updateProjectMemberRoleAction={async () => ({ status: 'unchanged' })}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );
    expect(
      within(projectsSection).getByLabelText('Rolle für Martin')
    ).toBeInTheDocument();

    fireEvent.change(within(projectsSection).getByLabelText('Name'), {
      target: { value: 'Bubblesverse lokal' },
    });
    fireEvent.click(
      within(projectsSection).getByRole('button', { name: 'Speichern' })
    );

    await waitFor(() => {
      expect(
        within(projectsSection).getByText('Bubblesverse lokal')
      ).toBeInTheDocument();
    });
    expect(
      within(projectsSection).getByLabelText('Rolle für Martin')
    ).toBeInTheDocument();
  });

  it('requires confirmation before removing a project member', async () => {
    const removeProjectMemberAction = vi.fn<
      (
        input: RemoveBubblophyProjectMemberActionInput
      ) => Promise<RemoveBubblophyProjectMemberActionResult>
    >(async () => ({
      status: 'removed',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      memberCount: 2,
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        removeProjectMemberAction={removeProjectMemberAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    const martinRow = screen.getByText('Martin').closest('tr');

    expect(martinRow).toBeInstanceOf(HTMLTableRowElement);

    if (!martinRow) {
      throw new Error('Expected Martin member row.');
    }

    fireEvent.click(
      within(martinRow).getByRole('button', { name: 'Entfernen' })
    );
    expect(removeProjectMemberAction).not.toHaveBeenCalled();
    fireEvent.click(
      within(martinRow).getByRole('button', {
        name: 'Endgültig entfernen',
      })
    );

    await waitFor(() => {
      expect(removeProjectMemberAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: 'user_martin',
        expectedRole: 'member',
      });
    });
    await waitFor(() => {
      expect(screen.queryByText('Martin')).not.toBeInTheDocument();
    });
    expect(
      screen.getByText('Mitglied Martin wurde aus BV entfernt.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/user_martin wurde/)).not.toBeInTheDocument();
  });

  it('keeps technical fallback labels out of member removal feedback', async () => {
    const technicalFallbackSnapshot = {
      ...databaseSnapshotWithManageableMembers,
      projectMembers: databaseSnapshotWithManageableMembers.projectMembers.map(
        (member) =>
          member.authUserId === 'user_martin'
            ? { ...member, label: member.authUserId }
            : member
      ),
    } satisfies DashboardSnapshot;
    const removeProjectMemberAction = vi.fn<
      (
        input: RemoveBubblophyProjectMemberActionInput
      ) => Promise<RemoveBubblophyProjectMemberActionResult>
    >(async () => ({
      status: 'removed',
      projectKey: 'BV',
      memberAuthUserId: 'user_martin',
      memberCount: 2,
    }));

    render(
      <BubblophyDashboard
        snapshot={technicalFallbackSnapshot}
        removeProjectMemberAction={removeProjectMemberAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    const memberRow = screen.getByText('user_martin').closest('tr');

    if (!(memberRow instanceof HTMLTableRowElement)) {
      throw new Error('Expected the technical fallback member row.');
    }

    fireEvent.click(
      within(memberRow).getByRole('button', { name: 'Entfernen' })
    );
    fireEvent.click(
      within(memberRow).getByRole('button', { name: 'Endgültig entfernen' })
    );

    expect(
      await screen.findByText('Ein Mitglied wurde aus BV entfernt.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Mitglied user_martin wurde aus BV entfernt.')
    ).not.toBeInTheDocument();
  });

  it('shows removal action exceptions without removing the member row', async () => {
    const removeProjectMemberAction = vi.fn<
      (
        input: RemoveBubblophyProjectMemberActionInput
      ) => Promise<RemoveBubblophyProjectMemberActionResult>
    >(async () => {
      throw new Error('internal member delete trace');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        removeProjectMemberAction={removeProjectMemberAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    const martinRow = screen.getByText('Martin').closest('tr');

    expect(martinRow).toBeInstanceOf(HTMLTableRowElement);

    if (!martinRow) {
      throw new Error('Expected Martin member row.');
    }

    fireEvent.click(
      within(martinRow).getByRole('button', { name: 'Entfernen' })
    );
    fireEvent.click(
      within(martinRow).getByRole('button', {
        name: 'Endgültig entfernen',
      })
    );

    await waitFor(() => {
      expect(removeProjectMemberAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        memberAuthUserId: 'user_martin',
        expectedRole: 'member',
      });
    });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(
      'Das Mitglied konnte gerade nicht entfernt werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('member delete');
    expect(screen.getByText('Martin')).toBeInTheDocument();
    expect(
      within(martinRow).getByRole('button', {
        name: 'Endgültig entfernen',
      })
    ).toBeInTheDocument();
  });

  it('shows project member forbidden and archived states without fake controls', async () => {
    const forbiddenRoleAction = vi.fn<
      (
        input: UpdateBubblophyProjectMemberRoleActionInput
      ) => Promise<UpdateBubblophyProjectMemberRoleActionResult>
    >(async () => ({ status: 'forbidden' }));

    const { unmount } = render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithManageableMembers}
        updateProjectMemberRoleAction={forbiddenRoleAction}
      />
    );

    const projectsSection = document.getElementById('projects');

    expect(projectsSection).toBeInstanceOf(HTMLElement);

    if (!projectsSection) {
      throw new Error('Expected the projects section to render.');
    }

    fireEvent.click(
      within(projectsSection).getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    fireEvent.change(
      within(projectsSection).getByLabelText('Rolle für Martin'),
      {
        target: { value: 'viewer' },
      }
    );

    expect(await within(projectsSection).findByRole('alert')).toHaveTextContent(
      'Nur Owner und Maintainer können Rollen verwalten.'
    );

    const archivedSnapshot = {
      ...databaseSnapshotWithManageableMembers,
      projects: databaseSnapshotWithManageableMembers.projects.map((project) =>
        project.key === 'BV'
          ? {
              ...project,
              isArchived: true,
            }
          : project
      ),
    } satisfies DashboardSnapshot;

    unmount();
    render(<BubblophyDashboard snapshot={archivedSnapshot} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Projekt Bubblesverse (BV) auswählen',
      })
    );

    expect(
      screen.getByText('Archivierte Projekte zeigen Mitglieder nur lesend an.')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Rolle für Martin')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Entfernen' })
    ).not.toBeInTheDocument();
  });

  it('keeps the project dialog open and shows duplicate errors', async () => {
    const createProjectAction = vi.fn<
      (
        input: CreateBubblophyProjectActionInput
      ) => Promise<CreateBubblophyProjectActionResult>
    >(async () => ({
      status: 'duplicate',
    }));

    render(
      <BubblophyDashboard
        snapshot={emptyDatabaseSnapshot}
        createProjectAction={createProjectAction}
      />
    );

    const projectCreateButtons = screen.getAllByRole('button', {
      name: 'Neues Projekt',
    });

    expect(projectCreateButtons).toHaveLength(2);
    const projectCreateButton = projectCreateButtons[0];

    if (!projectCreateButton) {
      throw new Error('Expected a project create button.');
    }

    fireEvent.click(projectCreateButton);
    expect(
      screen.getByRole('dialog', { name: 'Projekt erstellen' })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Doppeltes Projekt' },
    });
    fireEvent.change(screen.getByLabelText('Key'), {
      target: { value: 'DP' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Projekt erstellen' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Dieser Projekt-Key ist schon vergeben.'
    );
    expect(
      screen.getByRole('dialog', { name: 'Projekt erstellen' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Doppeltes Projekt\s+DP/i })
    ).not.toBeInTheDocument();
  });

  it('shows project create action exceptions without losing dialog input', async () => {
    const createProjectAction = vi.fn<
      (
        input: CreateBubblophyProjectActionInput
      ) => Promise<CreateBubblophyProjectActionResult>
    >(async () => {
      throw new Error('internal create project trace');
    });

    render(
      <BubblophyDashboard
        snapshot={emptyDatabaseSnapshot}
        createProjectAction={createProjectAction}
      />
    );

    const projectCreateButton = screen.getAllByRole('button', {
      name: 'Neues Projekt',
    })[0];

    if (!projectCreateButton) {
      throw new Error('Expected a project create button.');
    }

    fireEvent.click(projectCreateButton);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Fehlerfestes Projekt' },
    });
    fireEvent.change(screen.getByLabelText('Key'), {
      target: { value: 'FF' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Eingaben bleiben erhalten.' },
    });
    fireEvent.change(screen.getByLabelText('Repository URL'), {
      target: { value: 'https://github.com/mrbubbles/fehlerfest' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Projekt erstellen' }));

    await waitFor(() => {
      expect(createProjectAction).toHaveBeenCalledWith({
        name: 'Fehlerfestes Projekt',
        key: 'FF',
        description: 'Eingaben bleiben erhalten.',
        repositoryUrl: 'https://github.com/mrbubbles/fehlerfest',
      });
    });

    const dialog = screen.getByRole('dialog', { name: 'Projekt erstellen' });
    const alert = await within(dialog).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Das Projekt konnte gerade nicht erstellt werden. Versuche es erneut.'
    );
    expect(alert.textContent).not.toContain('create project');
    expect(within(dialog).getByLabelText('Name')).toHaveValue(
      'Fehlerfestes Projekt'
    );
    expect(within(dialog).getByLabelText('Key')).toHaveValue('FF');
    expect(within(dialog).getByLabelText('Beschreibung')).toHaveValue(
      'Eingaben bleiben erhalten.'
    );
    expect(within(dialog).getByLabelText('Repository URL')).toHaveValue(
      'https://github.com/mrbubbles/fehlerfest'
    );
    expect(
      screen.queryByRole('button', { name: /^Fehlerfestes Projekt\s+FF/i })
    ).not.toBeInTheDocument();
  });

  it('guides an empty database from project creation to the first persisted issue', async () => {
    const createProjectAction = vi.fn<
      (
        input: CreateBubblophyProjectActionInput
      ) => Promise<CreateBubblophyProjectActionResult>
    >(async () => ({
      status: 'created',
      project: {
        id: 'project_zen',
        name: 'Zentrum',
        key: 'ZEN',
        description: '',
        isArchived: false,
        health: 'stabil',
        openIssues: 0,
        readyIssues: 0,
        blockedIssues: 0,
        memberCount: 1,
        agentTokenCount: 0,
        currentUserRole: 'owner',
      },
    }));
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async () => ({
      status: 'created',
      issue: {
        id: 'ZEN-1',
        title: 'Erstes echtes Issue',
        projectKey: 'ZEN',
        status: 'triage',
        priority: 'hoch',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: 'Direkt aus dem neuen Projekt angelegt.',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={emptyDatabaseSnapshot}
        createProjectAction={createProjectAction}
        createIssueAction={createIssueAction}
      />
    );

    expect(
      screen.queryByRole('button', { name: /Neues Issue/i })
    ).not.toBeInTheDocument();

    const projectCreateButtons = screen.getAllByRole('button', {
      name: 'Neues Projekt',
    });
    expect(projectCreateButtons).toHaveLength(2);
    const projectCreateButton = projectCreateButtons[0];

    if (!projectCreateButton) {
      throw new Error('Expected a project create button.');
    }

    fireEvent.click(projectCreateButton);
    expect(
      screen.getByRole('dialog', { name: 'Projekt erstellen' })
    ).toHaveClass('max-h-[min(90svh,42rem)]', 'overflow-y-auto');
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Zentrum' },
    });
    fireEvent.change(screen.getByLabelText('Key'), {
      target: { value: 'zen' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Projekt erstellen' }));

    await waitFor(() => {
      expect(createProjectAction).toHaveBeenCalledWith({
        name: 'Zentrum',
        key: 'zen',
        description: '',
        repositoryUrl: '',
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Gefiltert auf Projekt ZEN.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Issue für ZEN anlegen' })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Issue für ZEN anlegen' })
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Neues Issue');
    expect(screen.getByLabelText('Projekt')).toHaveValue('ZEN');
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Erstes echtes Issue' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Direkt aus dem neuen Projekt angelegt.' },
    });
    fireEvent.change(screen.getByLabelText('Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    await waitFor(() => {
      expect(createIssueAction).toHaveBeenCalledWith({
        projectKey: 'ZEN',
        title: 'Erstes echtes Issue',
        description: 'Direkt aus dem neuen Projekt angelegt.',
        priority: 'hoch',
      });
    });
    expect(createIssueAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(navigationMocks.routerPush).toHaveBeenLastCalledWith(
      '/?project=ZEN&issue=ZEN-1'
    );
    expect(
      screen.getByRole('button', { name: 'Erstes echtes Issue' })
    ).toHaveAttribute('aria-pressed', 'true');

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('ZEN-1')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Erstes echtes Issue')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Direkt aus dem neuen Projekt angelegt.')
    ).toBeInTheDocument();
  });

  it('shows recent successful mutation feedback after issue creation', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Feedback sichtbarer machen' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    await waitFor(() => {
      expect(createIssueAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        title: 'Feedback sichtbarer machen',
        description: '',
        priority: 'mittel',
      });
    });

    const recentFeedback = await screen.findByRole('status', {
      name: 'Letzte bestätigte Aktion',
    });

    expect(recentFeedback).toHaveTextContent('Zuletzt lokal bestätigt:');
    expect(recentFeedback).toHaveTextContent('Issue BV-15 wurde erstellt.');
    expect(recentFeedback).toHaveTextContent(
      'Temporäres Feedback aus dieser Sitzung; gespeicherte Daten bleiben die Quelle der Wahrheit.'
    );
    expect(navigationMocks.routerRefresh).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText(/persistente Aktivität erscheint/i)
    ).not.toBeInTheDocument();

    const activitySection = document.getElementById('activity');

    expect(activitySection).toBeInstanceOf(HTMLElement);

    if (!activitySection) {
      throw new Error('Expected the activity section to render.');
    }

    expect(
      within(activitySection).queryByText(/Issue BV-15 wurde erstellt/i)
    ).not.toBeInTheDocument();
  });

  it('updates recent mutation feedback after a later successful action', async () => {
    const readRunTargetOptionsAction = createRunTargetOptionsAction();
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description,
      },
    }));
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'requested',
      run: {
        id: 'run_bv_15_requested',
        issueId: 'BV-15',
        agentLabel: 'codex-local-lio',
        state: 'wartet',
        requestedBy: 'Mensch',
        lastEvent: 'Anfrage gespeichert: Feedback-Flow prüfen.',
      },
      createdAt: '2026-07-18T12:00:00.000Z',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
        readRunTargetOptionsAction={readRunTargetOptionsAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Feedback später überschreiben' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    expect(
      await screen.findByText('Issue BV-15 wurde erstellt.')
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    await waitFor(() => {
      expect(
        within(detailPanel).getByRole('button', { name: 'Run anfragen' })
      ).toBeEnabled();
    });
    fireEvent.change(within(detailPanel).getByLabelText('Auftrag'), {
      target: { value: 'Bitte nur lokal prüfen.' },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Run anfragen' })
    );

    await waitFor(() => {
      expect(requestAgentRunAction).toHaveBeenCalledWith({
        issueId: 'BV-15',
        agentTokenId: 'token_codex_bv',
        instructions: 'Bitte nur lokal prüfen.',
      });
    });

    const recentFeedback = await screen.findByRole('status', {
      name: 'Letzte bestätigte Aktion',
    });

    await waitFor(() => {
      expect(recentFeedback).toHaveTextContent(
        'Run run_bv_15_requested wurde angefragt.'
      );
    });
    expect(recentFeedback).not.toHaveTextContent('Issue BV-15 wurde erstellt.');
    expect(navigationMocks.routerRefresh).toHaveBeenCalledTimes(2);
  });

  it('plans a newly created title-only database issue without starting a run', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description,
      },
    }));
    const createIssuePlanAction = vi.fn<
      (
        input: CreateBubblophyIssuePlanActionInput
      ) => Promise<CreateBubblophyIssuePlanActionResult>
    >(async (input) => ({
      status: 'created',
      plan: {
        issueId: input.issueId,
        version: 1,
        summary: input.summary ?? '',
        steps: input.steps.map((step, index) => ({
          id: `step_${index + 1}`,
          text: step,
        })),
      },
    }));
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'token_unavailable',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
        createIssuePlanAction={createIssuePlanAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Neues Issue');
    expect(screen.getByLabelText('Projekt')).toHaveValue('BV');
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Frisches Plan-Issue' },
    });
    fireEvent.change(screen.getByLabelText('Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    await waitFor(() => {
      expect(createIssueAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        title: 'Frisches Plan-Issue',
        description: '',
        priority: 'hoch',
      });
    });
    expect(createIssueAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(navigationMocks.routerPush).toHaveBeenLastCalledWith(
      '/?project=BV&issue=BV-15'
    );
    expect(
      screen.getByRole('button', { name: 'Frisches Plan-Issue' })
    ).toHaveAttribute('aria-pressed', 'true');

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('BV-15')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Frisches Plan-Issue')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Nutze „Plan entwerfen“/i)
    ).toBeInTheDocument();

    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Plan entwerfen' })
    );
    fireEvent.change(screen.getByLabelText('Plan-Zusammenfassung'), {
      target: { value: 'Frisches Issue ruhig planen.' },
    });
    fireEvent.change(screen.getByLabelText('Schritt 1'), {
      target: { value: 'Kontext sammeln' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Schritt hinzufügen' }));
    fireEvent.change(screen.getByLabelText('Schritt 2'), {
      target: { value: 'Nächste menschliche Entscheidung festhalten' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Plan speichern' }));

    await waitFor(() => {
      expect(createIssuePlanAction).toHaveBeenCalledWith({
        issueId: 'BV-15',
        summary: 'Frisches Issue ruhig planen.',
        steps: [
          'Kontext sammeln',
          'Nächste menschliche Entscheidung festhalten',
        ],
      });
    });
    expect(createIssuePlanAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const plannedDetailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(plannedDetailPanel).getByText('Frisches Issue ruhig planen.')
    ).toBeInTheDocument();
    expect(
      within(plannedDetailPanel).getByText('Kontext sammeln')
    ).toBeInTheDocument();
    expect(
      within(plannedDetailPanel).getByText(
        'Nächste menschliche Entscheidung festhalten'
      )
    ).toBeInTheDocument();
    expect(
      within(plannedDetailPanel).getByText(
        'Plan v1, menschlich gespeichert. Es wurde kein Agent-Run gestartet.'
      )
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('creates an agent token and shows the plaintext only in the dialog', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'created',
      token: {
        id: 'token_codex_local',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: 'läuft nicht automatisch ab',
        plaintextToken: 'test_plaintext_token_once',
      },
    }));

    const updateAgentTokenLifecycleAction = vi.fn(async () => ({
      status: 'forbidden' as const,
    }));
    const { rerender } = render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex lokal' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex lokal',
        scopes: ['projects:read', 'issues:read'],
      });
    });
    expect(createAgentTokenAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText('test_plaintext_token_once')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-projects\/<project-id>\/issues/
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/später nicht wieder sichtbar/i)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Ablauf: läuft nicht automatisch ab')
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Token kopieren' })
    );
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'test_plaintext_token_once'
      );
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Issue-Kontext kopieren' })
    );
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/api/agent-projects/<project-id>/issues')
      );
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Authorization: Bearer <agent-token>')
    );
    expect(within(agentSection).getByText('Codex lokal')).toBeInTheDocument();
    expect(
      within(agentSection).queryByText('test_plaintext_token_once')
    ).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Fertig' }));

    expect(
      screen.queryByText('test_plaintext_token_once')
    ).not.toBeInTheDocument();
    expect(within(agentSection).getByText('Codex lokal')).toBeInTheDocument();

    fireEvent.change(
      within(agentSection).getByLabelText(
        'Agent-Tokens nach Label durchsuchen'
      ),
      { target: { value: 'Codex' } }
    );
    fireEvent.click(
      within(agentSection).getByRole('button', { name: 'Suchen' })
    );
    await waitFor(() => {
      const currentAgentSection = document.getElementById('agents');

      expect(currentAgentSection).toBeInstanceOf(HTMLElement);

      if (!currentAgentSection) {
        throw new Error('Expected the agent token section to render.');
      }

      expect(within(currentAgentSection).queryByText('Codex lokal')).toBeNull();
      expect(
        within(currentAgentSection).getByText('codex-local-lio')
      ).toBeVisible();
    });
    act(() => commitMockNavigation('/'));

    rerender(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
        agentTokenPageRequest={{ projectKey: null, query: null, after: null }}
        agentTokenPageResult={{
          status: 'success',
          project: null,
          query: null,
          items: [
            {
              id: 'token_codex_local',
              label: 'Codex lokal',
              projectKey: 'BV',
              scopes: ['projects:read', 'issues:read'],
              state: 'aktiv',
              lastUsedAt: 'noch nie verwendet',
              expiresAt: 'läuft nicht automatisch ab',
              projectIsArchived: true,
              currentUserRole: 'viewer',
            },
          ],
          nextAfter: null,
        }}
      />
    );

    const confirmedAgentSection = document.getElementById('agents');

    expect(confirmedAgentSection).toBeInstanceOf(HTMLElement);

    if (!confirmedAgentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(confirmedAgentSection).getByText('Codex lokal')
    ).toBeInTheDocument();
    expect(
      within(confirmedAgentSection).queryByRole('button', {
        name: 'Pausieren',
      })
    ).toBeNull();
    expect(
      within(confirmedAgentSection).queryByRole('button', {
        name: 'Widerrufen',
      })
    ).toBeNull();
  });

  it('creates agent token with optional expiry', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'created',
      token: {
        id: 'token_codex_expiring',
        label: 'Codex mit Ablauf',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: '2026-07-01T09:30',
        plaintextToken: 'test_plaintext_token_expiring',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex mit Ablauf' },
    });
    fireEvent.change(screen.getByLabelText(/^Ablauf/), {
      target: { value: '2026-07-01T09:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex mit Ablauf',
        scopes: ['projects:read', 'issues:read'],
        expiresAt: '2026-07-01T09:30',
      });
    });
    expect(createAgentTokenAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText('Ablauf: 2026-07-01T09:30')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('test_plaintext_token_expiring')
    ).toBeInTheDocument();
  });

  it('creates agent token without expiry when expiry field is empty', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'created',
      token: {
        id: 'token_codex_no_expiry',
        label: 'Codex ohne Ablauf',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: 'läuft nicht automatisch ab',
        plaintextToken: 'test_plaintext_token_no_expiry',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex ohne Ablauf' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex ohne Ablauf',
        scopes: ['projects:read', 'issues:read'],
      });
    });
    expect(createAgentTokenAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'expiresAt'
    );
  });

  it('shows invalid expiry feedback from the server action', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'invalid',
      reason: 'invalid_expires_at',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex mit falschem Ablauf' },
    });
    fireEvent.change(screen.getByLabelText(/^Ablauf/), {
      target: { value: '2000-01-01T00:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex mit falschem Ablauf',
        scopes: ['projects:read', 'issues:read'],
        expiresAt: '2000-01-01T00:00',
      });
    });

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'Das Ablaufdatum ist nicht gültig.'
    );
    expect(
      within(dialog).queryByText(/Token jetzt kopieren/i)
    ).not.toBeInTheDocument();
  });

  it('shows PATCH handoff only for active runs:update tokens', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithRunUpdateToken} />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(agentSection).getByText('Lokaler Agent-Handoff')
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByText('/api/agent-runs/<run-id>')
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByText(/Authorization: Bearer <agent-token>/)
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByRole('button', {
        name: 'PATCH-Beispiel kopieren',
      })
    ).toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-projects\/<project-id>\/issues/
      )
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByText(/test_plaintext_token/)
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).getByText(/offene Issues eines Projekts lesen/)
    ).toBeInTheDocument();
  });

  it('shows project issue context handoff only for active issues:read tokens', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithIssueReadToken} />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(agentSection).getByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByText(
        '/api/agent-projects/project_bubblesverse/issues'
      )
    ).toBeInTheDocument();
    expect(
      within(agentSection).getByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-projects\/project_bubblesverse\/issues/
      )
    ).toBeInTheDocument();
    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/api/agent-projects/project_bubblesverse/issues')
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Authorization: Bearer <agent-token>')
    );
    expect(
      within(agentSection).queryByRole('button', {
        name: 'PATCH-Beispiel kopieren',
      })
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).getByText(/kann keine Agent-Run-Statusupdates/)
    ).toBeInTheDocument();
  });

  it('keeps the project issue handoff placeholder when the token project is missing', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithUnresolvedIssueReadToken}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(agentSection).getByText('/api/agent-projects/<project-id>/issues')
    ).toBeInTheDocument();
    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/api/agent-projects/<project-id>/issues')
    );
    expect(
      within(agentSection).queryByText(
        '/api/agent-projects/project_bubblesverse/issues'
      )
    ).not.toBeInTheDocument();
  });

  it('does not offer examples for tokens without operative read or update scopes', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithWriteOnlyToken} />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(
      within(agentSection).getAllByText('Lokaler Agent-Handoff').length
    ).toBeGreaterThan(0);
    expect(
      within(agentSection).getAllByText(/kann keine Agent-Run-Statusupdates/)
        .length
    ).toBeGreaterThan(0);
    expect(
      within(agentSection).getAllByText(/kann keine Projekt-Issues lesen/)
        .length
    ).toBeGreaterThan(0);
    expect(
      within(agentSection).getAllByText('runs:update').length
    ).toBeGreaterThan(0);
    expect(
      within(agentSection).queryByText(/Authorization: Bearer <agent-token>/)
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', {
        name: 'Issue-Kontext kopieren',
      })
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', {
        name: 'PATCH-Beispiel kopieren',
      })
    ).not.toBeInTheDocument();
  });

  it('keeps the token dialog open on denied agent token creation', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Codex lokal' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Codex lokal',
        scopes: ['projects:read', 'issues:read'],
      });
    });
    expect(createAgentTokenAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      /Nur Owner und Maintainer/i
    );
    expect(
      within(dialog).queryByText(/Token jetzt kopieren/i)
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByText('Codex lokal')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/bubblophy_agent_/i)).not.toBeInTheDocument();
  });

  it('keeps token draft state when agent token creation throws', async () => {
    const createAgentTokenAction = vi.fn<
      (
        input: CreateBubblophyAgentTokenActionInput
      ) => Promise<CreateBubblophyAgentTokenActionResult>
    >(async () => {
      throw new Error('internal token_hash header leaked');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createAgentTokenAction={createAgentTokenAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Agent-Token erstellen',
      })
    );
    fireEvent.change(screen.getByLabelText('Label'), {
      target: { value: 'Token wirft nicht speichern' },
    });
    fireEvent.click(screen.getByLabelText('runs:update'));
    fireEvent.click(screen.getByRole('button', { name: 'Token erstellen' }));

    await waitFor(() => {
      expect(createAgentTokenAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        label: 'Token wirft nicht speichern',
        scopes: ['projects:read', 'issues:read', 'runs:update'],
      });
    });

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      /konnte gerade nicht erstellt werden/i
    );
    expect(within(dialog).getByLabelText('Label')).toHaveValue(
      'Token wirft nicht speichern'
    );
    expect(within(dialog).getByLabelText('projects:read')).toBeChecked();
    expect(within(dialog).getByLabelText('issues:read')).toBeChecked();
    expect(within(dialog).getByLabelText('runs:update')).toBeChecked();
    expect(within(dialog).queryByText(/internal/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/token_hash/i)).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(/Token jetzt kopieren/i)
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByText('Token wirft nicht speichern')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/bubblophy_agent_/i)).not.toBeInTheDocument();
  });

  it('pauses an active agent token through the lifecycle action', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => ({
      status: 'updated',
      token: {
        id: 'token_codex_bv',
        label: 'codex-local-lio',
        projectKey: 'BV',
        scopes: ['issues:read', 'issues:write', 'runs:create'],
        state: 'pausiert',
        lastUsedAt: 'vor 12 Min.',
        expiresAt: 'läuft nicht automatisch ab',
      },
    }));
    const firstToken = dashboardAgentTokenFixtures[0];

    if (!firstToken) {
      throw new Error('Expected a token fixture.');
    }

    const singleTokenSnapshot = withAgentTokenFixtures(
      { ...databaseSnapshot } satisfies DashboardSnapshot,
      [firstToken]
    );

    render(
      <BubblophyDashboard
        snapshot={singleTokenSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    const pauseButton = within(agentSection).getAllByRole('button', {
      name: 'Pausieren',
    })[0];

    if (!pauseButton) {
      throw new Error('Expected a pause button.');
    }

    fireEvent.click(pauseButton);

    await waitFor(() => {
      expect(updateAgentTokenLifecycleAction).toHaveBeenCalledWith({
        tokenId: 'token_codex_bv',
        decision: 'pause',
      });
    });
    expect(
      updateAgentTokenLifecycleAction.mock.calls[0]?.[0]
    ).not.toHaveProperty('authUserId');
    await waitFor(() => {
      expect(
        within(agentSection).getAllByText('Pausiert').length
      ).toBeGreaterThan(0);
    });
    expect(navigationMocks.routerRefresh).toHaveBeenCalledTimes(1);
  });

  it('resumes a paused agent token through the lifecycle action', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => ({
      status: 'updated',
      token: {
        id: 'token_codex_bv',
        label: 'codex-local-lio',
        projectKey: 'BV',
        scopes: ['issues:read', 'issues:write', 'runs:create'],
        state: 'aktiv',
        lastUsedAt: 'vor 12 Min.',
        expiresAt: 'läuft nicht automatisch ab',
      },
    }));
    const firstToken = dashboardAgentTokenFixtures[0];

    if (!firstToken) {
      throw new Error('Expected a token fixture.');
    }

    const pausedTokenSnapshot = withAgentTokenFixtures(
      { ...databaseSnapshot } satisfies DashboardSnapshot,
      [
        {
          ...firstToken,
          state: 'pausiert',
        },
      ]
    );

    render(
      <BubblophyDashboard
        snapshot={pausedTokenSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(within(agentSection).getByText('Pausiert')).toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', { name: 'Pausieren' })
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(agentSection).getByRole('button', { name: 'Fortsetzen' })
    );

    await waitFor(() => {
      expect(updateAgentTokenLifecycleAction).toHaveBeenCalledWith({
        tokenId: 'token_codex_bv',
        decision: 'resume',
      });
    });
    expect(
      updateAgentTokenLifecycleAction.mock.calls[0]?.[0]
    ).not.toHaveProperty('authUserId');
    await waitFor(() => {
      expect(within(agentSection).getAllByText('Aktiv').length).toBeGreaterThan(
        0
      );
    });
  });

  it('requires explicit confirmation before revoking an agent token', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => ({
      status: 'updated',
      token: {
        id: 'token_codex_bv',
        label: 'codex-local-lio',
        projectKey: 'BV',
        scopes: ['issues:read', 'issues:write', 'runs:create'],
        state: 'widerrufen',
        lastUsedAt: 'vor 12 Min.',
        expiresAt: 'läuft nicht automatisch ab',
      },
    }));
    const firstToken = dashboardAgentTokenFixtures[0];

    if (!firstToken) {
      throw new Error('Expected a token fixture.');
    }

    const singleTokenSnapshot = withAgentTokenFixtures(
      { ...databaseSnapshot } satisfies DashboardSnapshot,
      [firstToken]
    );

    render(
      <BubblophyDashboard
        snapshot={singleTokenSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    const revokeButton = within(agentSection).getAllByRole('button', {
      name: 'Widerrufen',
    })[0];

    if (!revokeButton) {
      throw new Error('Expected a revoke button.');
    }

    fireEvent.click(revokeButton);

    expect(updateAgentTokenLifecycleAction).not.toHaveBeenCalled();
    expect(
      within(agentSection).getByText(/Widerruf ist endgültig/i)
    ).toBeInTheDocument();

    fireEvent.click(
      within(agentSection).getByRole('button', {
        name: 'Endgültig widerrufen',
      })
    );

    await waitFor(() => {
      expect(updateAgentTokenLifecycleAction).toHaveBeenCalledWith({
        tokenId: 'token_codex_bv',
        decision: 'revoke',
      });
    });
    await waitFor(() => {
      expect(
        within(agentSection).getAllByText('Widerrufen').length
      ).toBeGreaterThan(0);
    });
    expect(
      within(agentSection).queryByRole('button', { name: 'Fortsetzen' })
    ).not.toBeInTheDocument();
  });

  it('does not show lifecycle actions for revoked or expired tokens', () => {
    const tokenLifecycleSnapshot = withAgentTokenFixtures(
      { ...databaseSnapshot } satisfies DashboardSnapshot,
      [
        {
          id: 'token_revoked',
          label: 'Widerrufenes Token',
          projectKey: 'BV',
          scopes: ['issues:read'],
          state: 'widerrufen',
          lastUsedAt: 'gestern',
          expiresAt: 'läuft nicht automatisch ab',
        },
        {
          id: 'token_expired',
          label: 'Abgelaufenes Token',
          projectKey: 'BV',
          scopes: ['issues:read'],
          state: 'abgelaufen',
          lastUsedAt: 'noch nie verwendet',
          expiresAt: '2000-01-01T00:00:00.000Z',
        },
      ]
    );

    render(
      <BubblophyDashboard
        snapshot={tokenLifecycleSnapshot}
        updateAgentTokenLifecycleAction={async () => ({
          status: 'database_unavailable',
        })}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    expect(within(agentSection).getByText('Widerrufen')).toBeInTheDocument();
    expect(within(agentSection).getByText('Abgelaufen')).toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', { name: 'Fortsetzen' })
    ).not.toBeInTheDocument();
    expect(
      within(agentSection).queryByRole('button', { name: 'Widerrufen' })
    ).not.toBeInTheDocument();
  });

  it('shows forbidden lifecycle errors without changing the token state', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => ({ status: 'forbidden' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    const pauseButton = within(agentSection).getAllByRole('button', {
      name: 'Pausieren',
    })[0];

    if (!pauseButton) {
      throw new Error('Expected a pause button.');
    }

    fireEvent.click(pauseButton);

    expect(await within(agentSection).findByRole('alert')).toHaveTextContent(
      'Nur Owner und Maintainer können Agent-Tokens ändern.'
    );
    expect(within(agentSection).getAllByText('Aktiv').length).toBeGreaterThan(
      0
    );
  });

  it('shows lifecycle action exceptions without leaking token data', async () => {
    const updateAgentTokenLifecycleAction = vi.fn<
      (
        input: UpdateBubblophyAgentTokenLifecycleActionInput
      ) => Promise<UpdateBubblophyAgentTokenLifecycleActionResult>
    >(async () => {
      throw new Error(
        'tokenHash=<token-hash> Authorization: Bearer <agent-token>'
      );
    });
    const firstToken = dashboardAgentTokenFixtures[0];

    if (!firstToken) {
      throw new Error('Expected a token fixture.');
    }

    const singleTokenSnapshot = withAgentTokenFixtures(
      { ...databaseSnapshot } satisfies DashboardSnapshot,
      [firstToken]
    );

    render(
      <BubblophyDashboard
        snapshot={singleTokenSnapshot}
        updateAgentTokenLifecycleAction={updateAgentTokenLifecycleAction}
      />
    );

    const agentSection = document.getElementById('agents');

    expect(agentSection).toBeInstanceOf(HTMLElement);

    if (!agentSection) {
      throw new Error('Expected the agent token section to render.');
    }

    const pauseButton = within(agentSection).getByRole('button', {
      name: 'Pausieren',
    });

    fireEvent.click(pauseButton);

    await waitFor(() => {
      expect(updateAgentTokenLifecycleAction).toHaveBeenCalledWith({
        tokenId: 'token_codex_bv',
        decision: 'pause',
      });
    });
    const alert = await within(agentSection).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Das Agent-Token konnte gerade nicht geändert werden'
    );
    expect(within(agentSection).getAllByText('Aktiv').length).toBeGreaterThan(
      0
    );
    expect(
      within(agentSection).getByRole('button', { name: 'Pausieren' })
    ).toBeInTheDocument();
    expect(agentSection.textContent).not.toContain('<token-hash>');
    expect(alert.textContent).not.toContain('<agent-token>');
  });

  it('persists a title-only issue from the dialog when database data and an action are available', async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('sort=oldest')
    );
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-15',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description || 'Lokale Beschreibung vor Reload.',
      },
    }));

    const { rerender } = render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    expect(screen.getByRole('dialog')).toHaveClass(
      'max-h-[min(90svh,42rem)]',
      'overflow-y-auto'
    );

    expect(
      screen.getByRole('button', { name: 'Issue erstellen' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Nur lokal vormerken' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Als lokalen Draft anlegen' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Lokale Drafts bleiben nur in dieser Oberfläche und werden nicht mit dem Projekt geteilt/i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Planungsansicht folgt/i)
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Persistiertes Test-Issue' },
    });
    fireEvent.change(screen.getByLabelText('Priorität'), {
      target: { value: 'hoch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    await waitFor(() => {
      expect(createIssueAction).toHaveBeenCalledWith({
        projectKey: 'BV',
        title: 'Persistiertes Test-Issue',
        description: '',
        priority: 'hoch',
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(navigationMocks.routerPush).toHaveBeenCalledWith(
      '/?sort=oldest&project=BV&issue=BV-15'
    );
    expect(
      screen.getByRole('button', { name: 'Persistiertes Test-Issue' })
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(within(detailPanel).getByText('BV-15')).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Persistiertes Test-Issue')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).queryByText('Lokal / nicht gespeichert')
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).queryByText(/Sample-Daten enthalten/i)
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Nutze „Plan entwerfen“/i)
    ).toBeInTheDocument();

    const reloadedSnapshot = withIssueFixtures({ ...databaseSnapshot }, [
      {
        id: 'BV-14',
        title: 'Server-Reihenfolge zuerst',
        description: 'Älteres Issue in der autoritativen Serverreihenfolge.',
        projectKey: 'BV',
        status: 'bereit',
        priority: 'hoch',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
      },
      {
        id: 'BV-15',
        title: 'Server-Detail nach Reload',
        description: 'Autoritative Beschreibung vom Server.',
        projectKey: 'BV',
        status: 'geplant',
        priority: 'mittel',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
      },
    ]);

    rerender(
      <BubblophyDashboard
        snapshot={reloadedSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent(
      'Server-Detail nach Reload'
    );
    expect(screen.getByLabelText('Issue-Details')).not.toHaveTextContent(
      'Persistiertes Test-Issue'
    );
    expect(
      screen
        .getAllByRole('button', { name: /Server-(Reihenfolge|Detail)/ })
        .map((button) => button.textContent)
    ).toEqual(['Server-Reihenfolge zuerst', 'Server-Detail nach Reload']);

    rerender(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        issueDetailRequestKey="BV-15"
        issueDetailResult={{ status: 'database_unavailable' }}
        createIssueAction={createIssueAction}
      />
    );

    expect(screen.getByLabelText('Issue-Details')).not.toHaveTextContent(
      'Persistiertes Test-Issue'
    );
    expect(screen.getByLabelText('Issue-Details')).not.toHaveTextContent(
      'Lokale Beschreibung vor Reload.'
    );
  });

  it('labels local issue drafts as not persisted', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async (input) => ({
      status: 'created',
      issue: {
        id: 'BV-LOCAL-SHOULD-NOT-PERSIST',
        title: input.title,
        projectKey: input.projectKey,
        status: 'triage',
        priority: input.priority ?? 'mittel',
        assigneeAuthUserId: null,
        assigneeLabel: 'Nicht zugewiesen',
        planSteps: 0,
        approvalRequired: true,
        description: input.description,
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    expect(
      screen.getByText(
        /Lokale Drafts bleiben nur in dieser Oberfläche und werden nicht mit dem Projekt geteilt/i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Als lokalen Draft anlegen' })
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Nur lokal geprüfter Draft' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Soll nicht an die Server Action gehen.' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Nur lokal vormerken' })
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(createIssueAction).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Nur lokal geprüfter Draft' })
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Lokal / nicht gespeichert')
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByText('Soll nicht an die Server Action gehen.')
    ).toBeInTheDocument();
  });

  it('keeps the issue dialog open when the create action throws', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async () => {
      throw new Error('database stack trace with internal details');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Bleibt nach Fehler erhalten' },
    });
    fireEvent.change(screen.getByLabelText('Beschreibung'), {
      target: { value: 'Beschreibung bleibt ebenfalls erhalten.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(
      'Das Issue konnte gerade nicht gespeichert werden'
    );
    expect(alert.textContent).not.toContain('database stack trace');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Titel')).toHaveValue(
      'Bleibt nach Fehler erhalten'
    );
    expect(screen.getByLabelText('Beschreibung')).toHaveValue(
      'Beschreibung bleibt ebenfalls erhalten.'
    );
    expect(
      screen.queryByRole('button', { name: 'Bleibt nach Fehler erhalten' })
    ).not.toBeInTheDocument();
  });

  it('shows descriptions for existing database snapshot issues', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithIssueDescription} />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText('Beschreibung aus dem Dashboard-Snapshot.')
    ).toBeInTheDocument();
  });

  it('keeps the dialog open and shows action errors for denied database writes', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Nicht erlaubtes Issue' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue erstellen' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Du bist kein Mitglied dieses Projekts.'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Nicht erlaubtes Issue' })
    ).not.toBeInTheDocument();
  });

  it('keeps sample and fallback snapshots on the local draft path', async () => {
    const createIssueAction = vi.fn<
      (
        input: CreateBubblophyIssueActionInput
      ) => Promise<CreateBubblophyIssueActionResult>
    >(async () => ({
      status: 'database_unavailable',
    }));

    render(
      <BubblophyDashboard
        snapshot={dashboardSnapshot}
        createIssueAction={createIssueAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Neues Issue/i }));

    expect(
      screen.queryByRole('button', { name: 'Issue erstellen' })
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Titel'), {
      target: { value: 'Lokaler Fallback-Draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Draft anlegen' }));

    expect(createIssueAction).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Lokaler Fallback-Draft' })
    ).toBeInTheDocument();

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Lokale Drafts können keinen Agent-Run/i)
    ).toBeInTheDocument();
  });

  it('requests a human-only agent run and adds it to the run queue', async () => {
    const readRunTargetOptionsAction = createRunTargetOptionsAction();
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'requested',
      run: {
        id: 'run_bv_12_requested',
        issueId: 'BV-12',
        agentLabel: 'codex-local-lio',
        state: 'wartet',
        requestedBy: 'Mensch',
        lastEvent:
          'Anfrage gespeichert: Bitte nur die Planung prüfen, nichts ausführen.',
      },
      createdAt: '2026-07-18T12:00:00.000Z',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithEmptyRuns}
        readRunTargetOptionsAction={readRunTargetOptionsAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).getByText(/kein Agent gestartet/i)
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        within(detailPanel).getByRole('button', { name: 'Run anfragen' })
      ).toBeEnabled();
    });
    fireEvent.change(within(detailPanel).getByLabelText('Auftrag'), {
      target: {
        value: 'Bitte nur die Planung prüfen, nichts ausführen.',
      },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Run anfragen' })
    );

    await waitFor(() => {
      expect(requestAgentRunAction).toHaveBeenCalledWith({
        issueId: 'BV-12',
        agentTokenId: 'token_codex_bv',
        instructions: 'Bitte nur die Planung prüfen, nichts ausführen.',
      });
    });
    expect(requestAgentRunAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    await waitFor(() => {
      expect(within(runsSection).getByText('BV-12')).toBeInTheDocument();
    });
    expect(
      within(runsSection).getByText(/codex-local-lio · angefragt von Mensch/i)
    ).toBeInTheDocument();
    expect(within(runsSection).getByText('Wartet')).toBeInTheDocument();
    expect(
      within(runsSection).getByText(
        /Anfrage gespeichert: Bitte nur die Planung prüfen/i
      )
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/gestartet/i)
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/ausgeführt/i)
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/Noch keine Runs/i)
    ).not.toBeInTheDocument();
  });

  it('explains every executable-token requirement after a denied run request', async () => {
    const readRunTargetOptionsAction = createRunTargetOptionsAction();
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({ status: 'token_unavailable' }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithEmptyRuns}
        readRunTargetOptionsAction={readRunTargetOptionsAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );
    const detailPanel = screen.getByLabelText('Issue-Details');
    await waitFor(() => {
      expect(
        within(detailPanel).getByRole('button', { name: 'Run anfragen' })
      ).toBeEnabled();
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Run anfragen' })
    );

    expect(await within(detailPanel).findByRole('alert')).toHaveTextContent(
      'Prüfe Projekt, Status, Ablaufdatum sowie die Scopes issues:read und runs:update.'
    );
  });

  it('keeps the run request form usable when the action throws', async () => {
    const readRunTargetOptionsAction = createRunTargetOptionsAction();
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => {
      throw new Error('internal token hash or database stack trace');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithEmptyRuns}
        readRunTargetOptionsAction={readRunTargetOptionsAction}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    await waitFor(() => {
      expect(
        within(detailPanel).getByRole('button', { name: 'Run anfragen' })
      ).toBeEnabled();
    });
    fireEvent.change(within(detailPanel).getByLabelText('Auftrag'), {
      target: {
        value: 'Bitte lokal prüfen und keine Ausführung starten.',
      },
    });
    fireEvent.click(
      within(detailPanel).getByRole('button', { name: 'Run anfragen' })
    );

    const alert = await within(detailPanel).findByRole('alert');

    expect(alert).toHaveTextContent(
      'Der Run konnte gerade nicht angefragt werden'
    );
    expect(alert.textContent).not.toContain('internal token hash');
    expect(alert.textContent).not.toContain('database stack trace');
    expect(within(detailPanel).getByLabelText('Auftrag')).toHaveValue(
      'Bitte lokal prüfen und keine Ausführung starten.'
    );
    expect(requestAgentRunAction).toHaveBeenCalledWith({
      issueId: 'BV-12',
      agentTokenId: 'token_codex_bv',
      instructions: 'Bitte lokal prüfen und keine Ausführung starten.',
    });

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(
      within(runsSection).getByText(/Noch keine Runs/i)
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText('Bitte lokal prüfen')
    ).not.toBeInTheDocument();
  });

  it('does not expose human run decisions without the transition server action', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(within(runsSection).getByText('BV-14')).toBeInTheDocument();
    expect(within(runsSection).getByText('run_bv_14')).toBeInTheDocument();
    expect(
      within(runsSection).queryByRole('button', { name: 'Freigeben' })
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByRole('button', { name: 'Abbrechen' })
    ).not.toBeInTheDocument();
  });

  it('uses the project-bound run page and writes its stable next cursor', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV')
    );
    const nextAfter = {
      updatedAt: '2026-07-19T11:00:00.000Z',
      id: 'run-page-20',
    };

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        runPageRequest={{ projectKey: 'BV', after: null }}
        runPageResult={{
          status: 'success',
          project: {
            key: 'BV',
            name: 'Bubblesverse',
            isArchived: false,
            currentUserRole: 'owner',
          },
          items: [
            {
              id: 'run-page-1',
              issueKey: 'BV-12',
              agentLabel: 'Codex Page',
              state: 'needs_review',
              updatedAt: '2026-07-19T12:00:00.000Z',
              resultSummary: 'Serverseitig paginiert.',
              canAgentReportStatus: true,
            },
          ],
          nextAfter,
        }}
      />
    );
    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(within(runsSection).getByText('run-page-1')).toBeInTheDocument();
    expect(within(runsSection).queryByText('run_bv_14')).toBeNull();
    expect(
      within(runsSection).getByText('Serverseitig paginiert.')
    ).toBeInTheDocument();

    navigationMocks.routerPush.mockClear();
    autoCommitMockNavigation = false;
    fireEvent.click(
      within(runsSection).getByRole('button', { name: 'Weitere 20 Runs' })
    );

    const pushedHref = navigationMocks.routerPush.mock.calls[0]?.[0];

    expect(pushedHref).toBeTruthy();
    const pushedUrl = new URL(
      pushedHref ?? '/',
      'https://bubblophy.example.test'
    );
    expect(pushedUrl.searchParams.get('runAfterAt')).toBe(nextAfter.updatedAt);
    expect(pushedUrl.searchParams.get('runAfterId')).toBe(nextAfter.id);
  });

  it('keeps run decisions available for paginated issues outside the issue page', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams('project=BV')
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithRunUpdateToken}
        runPageRequest={{ projectKey: 'BV', after: null }}
        runPageResult={{
          status: 'success',
          project: {
            key: 'BV',
            name: 'Bubblesverse',
            isArchived: false,
            currentUserRole: 'member',
          },
          items: [
            {
              id: 'run-page-unloaded-issue',
              issueKey: 'BV-99',
              agentLabel: 'Codex Page',
              state: 'requested',
              updatedAt: '2026-07-19T12:00:00.000Z',
              resultSummary: null,
              canAgentReportStatus: true,
            },
          ],
          nextAfter: null,
        }}
        transitionAgentRunAction={async () => ({ status: 'forbidden' })}
      />
    );
    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(within(runsSection).getByText('BV-99')).toBeInTheDocument();
    expect(
      within(runsSection).getByRole('button', { name: 'Freigeben' })
    ).toBeInTheDocument();
    expect(
      within(runsSection).getByRole('button', { name: 'Abbrechen' })
    ).toBeInTheDocument();
  });

  it.each([
    {
      accessState: 'viewer role',
      currentUserRole: 'viewer' as const,
      isArchived: false,
    },
    {
      accessState: 'archived project',
      currentUserRole: 'owner' as const,
      isArchived: true,
    },
  ])(
    'hides stale run decisions for a RunPage with $accessState',
    ({ currentUserRole, isArchived }) => {
      navigationMocks.searchParams.mockReturnValue(
        new URLSearchParams('project=BV')
      );

      render(
        <BubblophyDashboard
          snapshot={databaseSnapshotWithRunUpdateToken}
          runPageRequest={{ projectKey: 'BV', after: null }}
          runPageResult={{
            status: 'success',
            project: {
              key: 'BV',
              name: 'Bubblesverse',
              isArchived,
              currentUserRole,
            },
            items: [
              {
                id: 'run-page-stale-permission',
                issueKey: 'BV-12',
                agentLabel: 'Codex Page',
                state: 'requested',
                updatedAt: '2026-07-19T12:00:00.000Z',
                resultSummary: null,
                canAgentReportStatus: true,
              },
            ],
            nextAfter: null,
          }}
          transitionAgentRunAction={async () => ({ status: 'forbidden' })}
        />
      );
      const runsSection = document.getElementById('runs');

      expect(runsSection).toBeInstanceOf(HTMLElement);

      if (!runsSection) {
        throw new Error('Expected the runs section to render.');
      }

      expect(
        within(runsSection).queryByRole('button', { name: 'Freigeben' })
      ).toBeNull();
      expect(
        within(runsSection).queryByRole('button', { name: 'Abbrechen' })
      ).toBeNull();
    }
  );

  it('shows a run loading state while URL and server page differ', () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams(
        'project=BV&runAfterAt=2026-07-19T11%3A00%3A00.000Z&runAfterId=run-page-20'
      )
    );

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        runPageRequest={{ projectKey: 'BV', after: null }}
        runPageResult={{
          status: 'success',
          project: {
            key: 'BV',
            name: 'Bubblesverse',
            isArchived: false,
            currentUserRole: 'owner',
          },
          items: [],
          nextAfter: null,
        }}
      />
    );
    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(within(runsSection).getByRole('status')).toHaveTextContent(
      'Run-Liste wird geladen.'
    );
    expect(within(runsSection).queryByText(/Noch keine Runs/i)).toBeNull();
    expect(within(runsSection).queryByText('run_bv_14')).toBeNull();
  });

  it('copies a concrete run PATCH handoff for approved runs with an active update token', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithApprovedRunUpdateToken}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(within(runsSection).getByText('run_bv_14')).toBeInTheDocument();
    expect(
      within(runsSection).getByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-runs\/run_bv_14/
      )
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-runs\/<run-id>/
      )
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).getByText(/Authorization: Bearer <agent-token>/)
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/test_plaintext_token/)
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByText(/tokenHash/)
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(runsSection).getByRole('button', {
        name: 'PATCH für run_bv_14 kopieren',
      })
    );

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/api/agent-runs/run_bv_14')
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Authorization: Bearer <agent-token>')
    );
    expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith(
      expect.stringContaining('<run-id>')
    );
  });

  it('explains human review resolution for runs needing review', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    expect(within(runCard).getByText('Review nötig')).toBeInTheDocument();
    expect(
      within(runCard).getByText(/Prüfe das Ergebnis im Issue BV-14/i)
    ).toBeInTheDocument();
    expect(
      within(runCard).getByText(/Status, Notiz oder Plan/i)
    ).toBeInTheDocument();
    expect(
      within(runCard).getByText(/bewusst einen neuen Run/i)
    ).toBeInTheDocument();
    expect(
      within(runCard).queryByRole('button', {
        name: /Review abschließen/i,
      })
    ).not.toBeInTheDocument();
    expect(
      within(runCard).queryByRole('button', { name: /Agent fortsetzen/i })
    ).not.toBeInTheDocument();
    expect(
      within(runCard).queryByRole('button', {
        name: /Automatisch weiterarbeiten/i,
      })
    ).not.toBeInTheDocument();
  });

  it('shows agent run result details for review runs', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    expect(within(runCard).getByText('Agent-Ergebnis')).toBeInTheDocument();
    expect(
      within(runCard).getByText('Diff ist bereit für menschliche Prüfung.')
    ).toBeInTheDocument();
  });

  it('keeps agent run result summaries within responsive run cards', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    const resultText = within(runCard).getByText(
      'Diff ist bereit für menschliche Prüfung.'
    );
    const resultBlock = resultText.closest('div');

    expect(resultBlock).toBeInstanceOf(HTMLElement);

    if (!resultBlock) {
      throw new Error('Expected the run result block to render.');
    }

    expect(runCard).toHaveClass('min-w-0');
    expect(resultBlock).toHaveClass('min-w-0');
    expect(resultText).toHaveClass('break-words');
  });

  it('shows failure run result message', () => {
    render(
      <BubblophyDashboard snapshot={databaseSnapshotWithFailedRunResult} />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    expect(within(runCard).getByText('Fehlgeschlagen')).toBeInTheDocument();
    expect(within(runCard).getByText('Agent-Ergebnis')).toBeInTheDocument();
    expect(
      within(runCard).getByText('Checkout konnte nicht vorbereitet werden.')
    ).toBeInTheDocument();
  });

  it('does not render raw JSON secrets in run result details', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const resultBlock = within(runsSection)
      .getByText('Diff ist bereit für menschliche Prüfung.')
      .closest('div');

    expect(resultBlock).toBeInstanceOf(HTMLElement);

    if (!resultBlock) {
      throw new Error('Expected the run result block to render.');
    }

    expect(within(resultBlock).getByText('Agent-Ergebnis')).toBeInTheDocument();
    expect(within(resultBlock).queryByText(/token/i)).not.toBeInTheDocument();
    expect(within(resultBlock).queryByText(/secret/i)).not.toBeInTheDocument();
    expect(
      within(resultBlock).queryByText(/authorization/i)
    ).not.toBeInTheDocument();
    expect(within(resultBlock).queryByText(/[{}"]/)).not.toBeInTheDocument();
  });

  it('saves agent run result as an issue review note', async () => {
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async (input) => ({
      status: 'created',
      note: {
        id: 'event_note_run_result',
        note: input.note,
        actor: 'Mensch',
        createdAt: '2026-06-14T11:00:00.000Z',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithReviewRun}
        createIssueNoteAction={createIssueNoteAction}
      />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(detailPanel).toHaveTextContent('BV-14');

    fireEvent.click(
      within(detailPanel).getByRole('button', {
        name: 'Als Notiz übernehmen',
      })
    );

    await waitFor(() => {
      expect(createIssueNoteAction).toHaveBeenCalledWith({
        issueId: 'BV-14',
        note: 'Agent-Ergebnis aus Run run_bv_14:\n\nDiff ist bereit für menschliche Prüfung.',
      });
    });

    expect(createIssueNoteAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(
        within(detailPanel).getByText(
          'Agent-Ergebnis aus Run run_bv_14 wurde als Notiz gespeichert.'
        )
      ).toBeInTheDocument();
    });

    const notesRegion = within(detailPanel).getByLabelText('Notizen für BV-14');

    expect(notesRegion).toHaveTextContent('Agent-Ergebnis aus Run run_bv_14:');
    expect(notesRegion).toHaveTextContent(
      'Diff ist bereit für menschliche Prüfung.'
    );
  });

  it('does not offer run result note persistence without note permission', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(detailPanel).toHaveTextContent(
      'Diff ist bereit für menschliche Prüfung.'
    );
    expect(
      within(detailPanel).queryByRole('button', {
        name: 'Als Notiz übernehmen',
      })
    ).not.toBeInTheDocument();
  });

  it('does not claim review completion when saving run result note', async () => {
    const createIssueNoteAction = vi.fn<
      (
        input: CreateBubblophyIssueNoteActionInput
      ) => Promise<CreateBubblophyIssueNoteActionResult>
    >(async (input) => ({
      status: 'created',
      note: {
        id: 'event_note_run_result',
        note: input.note,
        actor: 'Mensch',
        createdAt: '2026-06-14T11:00:00.000Z',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithReviewRun}
        createIssueNoteAction={createIssueNoteAction}
      />
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    fireEvent.click(
      within(detailPanel).getByRole('button', {
        name: 'Als Notiz übernehmen',
      })
    );

    await waitFor(() => {
      expect(createIssueNoteAction).toHaveBeenCalled();
    });

    expect(screen.queryByText(/Review abgeschlossen/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Review freigegeben/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Run freigegeben/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Agent fortsetzen/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Automatisch weiterarbeiten/i)
    ).not.toBeInTheDocument();
  });

  it('opens linked issue from run queue', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithReviewRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    fireEvent.click(
      within(runCard).getByRole('button', { name: 'Issue öffnen' })
    );

    expect(screen.getByLabelText('Issue-Details')).toHaveTextContent('BV-14');
    expect(navigationMocks.routerPush).toHaveBeenLastCalledWith(
      '/?issue=BV-14'
    );
  });

  it('opens an off-page run issue through its direct detail URL', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithUnresolvedRun} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_missing_issue')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the unresolved run card to render.');
    }

    fireEvent.click(
      within(runCard).getByRole('button', { name: 'Issue öffnen' })
    );

    expect(navigationMocks.routerPush).toHaveBeenLastCalledWith(
      '/?issue=BV-404'
    );
  });

  it('does not show human review resolution guidance for non-review runs', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithApprovedRunUpdateToken}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const runCard = within(runsSection)
      .getByText('run_bv_14')
      .closest('dl')?.parentElement;

    expect(runCard).toBeInstanceOf(HTMLElement);

    if (!runCard) {
      throw new Error('Expected the BV run card to render.');
    }

    expect(within(runCard).queryByText('Review nötig')).not.toBeInTheDocument();
  });

  it('keeps agent handoff commands horizontally scrollable', () => {
    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithApprovedRunUpdateToken}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    const commandText = within(runsSection).getByText(
      /\$BUBBLOPHY_BASE_URL\/api\/agent-runs\/run_bv_14/
    );
    const commandBlock = commandText.closest('pre');

    expect(commandBlock).toBeInstanceOf(HTMLElement);
    expect(commandBlock).toHaveClass('min-w-0', 'overflow-x-auto');
    expect(commandBlock?.parentElement).toHaveClass('min-w-0');
  });

  it('does not show concrete run PATCH handoff without a matching active update token', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshot} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(within(runsSection).getByText('run_no_08')).toBeInTheDocument();
    expect(
      within(runsSection).queryByRole('button', {
        name: 'PATCH für run_no_08 kopieren',
      })
    ).not.toBeInTheDocument();
    expect(
      within(runsSection).queryByText(
        /\$BUBBLOPHY_BASE_URL\/api\/agent-runs\/run_no_08/
      )
    ).not.toBeInTheDocument();
  });

  it('does not use a different update token from the same project for run handoff', () => {
    render(
      <BubblophyDashboard
        snapshot={{
          ...databaseSnapshotWithApprovedRunUpdateToken,
          agentRuns: databaseSnapshotWithApprovedRunUpdateToken.agentRuns.map(
            (run) =>
              run.id === 'run_bv_14'
                ? { ...run, canAgentReportStatus: false }
                : run
          ),
        }}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(
      within(runsSection).queryByRole('button', {
        name: 'PATCH für run_bv_14 kopieren',
      })
    ).not.toBeInTheDocument();
  });

  it('approves a requested run through a real server action', async () => {
    const transitionAgentRunAction = vi.fn<
      (
        input: TransitionBubblophyAgentRunActionInput
      ) => Promise<TransitionBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'updated',
      run: {
        id: 'run_bv_14',
        issueId: 'BV-14',
        agentLabel: 'codex-local-lio',
        state: 'freigegeben',
        requestedBy: 'Mensch',
        lastEvent: 'Run BV-14 wurde menschlich freigegeben.',
      },
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        transitionAgentRunAction={transitionAgentRunAction}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    fireEvent.click(
      within(runsSection).getByRole('button', { name: 'Freigeben' })
    );

    await waitFor(() => {
      expect(transitionAgentRunAction).toHaveBeenCalledWith({
        runId: 'run_bv_14',
        decision: 'approve',
      });
    });
    expect(transitionAgentRunAction.mock.calls[0]?.[0]).not.toHaveProperty(
      'authUserId'
    );

    await waitFor(() => {
      expect(within(runsSection).getByText('Freigegeben')).toBeInTheDocument();
    });
    expect(
      within(runsSection).getByText('Run BV-14 wurde menschlich freigegeben.')
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByRole('button', { name: 'Freigeben' })
    ).not.toBeInTheDocument();
  });

  it('keeps run decision buttons visible and shows denied membership errors', async () => {
    const transitionAgentRunAction = vi.fn<
      (
        input: TransitionBubblophyAgentRunActionInput
      ) => Promise<TransitionBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'forbidden',
    }));

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        transitionAgentRunAction={transitionAgentRunAction}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    fireEvent.click(
      within(runsSection).getByRole('button', { name: 'Abbrechen' })
    );

    await waitFor(() => {
      expect(transitionAgentRunAction).toHaveBeenCalledWith({
        runId: 'run_bv_14',
        decision: 'cancel',
      });
    });
    expect(await within(runsSection).findByRole('alert')).toHaveTextContent(
      'Du bist kein Mitglied dieses Projekts.'
    );
    await waitFor(() => {
      expect(
        within(runsSection).getByRole('button', { name: 'Freigeben' })
      ).toBeInTheDocument();
    });
  });

  it('keeps run decision buttons visible when the transition action throws', async () => {
    const transitionAgentRunAction = vi.fn<
      (
        input: TransitionBubblophyAgentRunActionInput
      ) => Promise<TransitionBubblophyAgentRunActionResult>
    >(async () => {
      throw new Error('run transition failed');
    });

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshot}
        transitionAgentRunAction={transitionAgentRunAction}
      />
    );

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    fireEvent.click(
      within(runsSection).getByRole('button', { name: 'Freigeben' })
    );

    await waitFor(() => {
      expect(transitionAgentRunAction).toHaveBeenCalledWith({
        runId: 'run_bv_14',
        decision: 'approve',
      });
    });
    expect(await within(runsSection).findByRole('alert')).toHaveTextContent(
      'Die Run-Entscheidung konnte gerade nicht gespeichert werden'
    );
    expect(
      within(runsSection).getByRole('button', { name: 'Freigeben' })
    ).toBeInTheDocument();
    expect(
      within(runsSection).getByRole('button', { name: 'Abbrechen' })
    ).toBeInTheDocument();
  });

  it('blocks run requests for database issues without executable project tokens', async () => {
    const readRunTargetOptionsAction = createRunTargetOptionsAction([]);

    render(
      <BubblophyDashboard
        snapshot={databaseSnapshotWithoutAgentTokens}
        readRunTargetOptionsAction={readRunTargetOptionsAction}
        requestAgentRunAction={async () => ({
          status: 'database_unavailable',
        })}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      await within(detailPanel).findByText(
        /Keine passenden ausführbaren Agent-Tokens gefunden/i
      )
    ).toBeInTheDocument();
    expect(
      within(detailPanel).getByRole('button', { name: 'Run anfragen' })
    ).toBeDisabled();
  });

  it('does not expose persistent run requests when the database is unavailable', () => {
    const requestAgentRunAction = vi.fn<
      (
        input: RequestBubblophyAgentRunActionInput
      ) => Promise<RequestBubblophyAgentRunActionResult>
    >(async () => ({
      status: 'database_unavailable',
    }));
    const unavailableWithIssueAndToken = {
      ...databaseUnavailableSnapshot,
      projects: databaseSnapshot.projects,
    } satisfies DashboardSnapshot;

    withIssueFixtures(unavailableWithIssueAndToken);

    render(
      <BubblophyDashboard
        snapshot={unavailableWithIssueAndToken}
        requestAgentRunAction={requestAgentRunAction}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Issue-Plan als strukturierte Arbeitsnotiz speichern',
      })
    );

    const detailPanel = screen.getByLabelText('Issue-Details');

    expect(
      within(detailPanel).queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
    expect(
      within(detailPanel).getByText(/Datenbank ist nicht bereit/i)
    ).toBeInTheDocument();
    expect(requestAgentRunAction).not.toHaveBeenCalled();
  });

  it('does not expose operative run actions for sample snapshots', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(
      screen.queryByRole('button', { name: /Run-Queue öffnen/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Run prüfen|Run starten/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Run anfragen' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Sample-Daten erlauben keine Run-Anfrage/i)
    ).toBeInTheDocument();
    expect(
      within(runsSection).getByText(/Sample\/Fallback zeigt keine operative/i)
    ).toBeInTheDocument();
    expect(
      within(runsSection).queryByText('Plan wartet auf Freigabe')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Beispielhafte Audit-Vorschau/i)
    ).toBeInTheDocument();
  });

  it('shows an honest empty run state for database snapshots without runs', () => {
    render(<BubblophyDashboard snapshot={databaseSnapshotWithEmptyRuns} />);

    const runsSection = document.getElementById('runs');

    expect(runsSection).toBeInstanceOf(HTMLElement);

    if (!runsSection) {
      throw new Error('Expected the runs section to render.');
    }

    expect(
      within(runsSection).getByText(/Noch keine Runs/i)
    ).toBeInTheDocument();
    expect(
      within(runsSection).getByText(/explizite menschliche Freigabe/i)
    ).toBeInTheDocument();
  });

  it('passes real section links into the shared sidebar shell', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const navigation = screen.getByLabelText('Bubblophy Navigation');

    expect(
      within(navigation).getByRole('link', { name: 'Projekte' })
    ).toHaveAttribute('href', '/#projects');
    expect(
      within(navigation).getByRole('link', { name: 'Issues' })
    ).toHaveAttribute('href', '/#issues');
    expect(
      within(navigation).getByRole('link', { name: 'Agent-Tokens' })
    ).toHaveAttribute('href', '/#agents');
    expect(
      within(navigation).getByRole('link', { name: 'Runs' })
    ).toHaveAttribute('href', '/#runs');
    expect(
      within(navigation).getByRole('link', { name: 'Audit' })
    ).toHaveAttribute('href', '/#activity');
  });

  it('points shared sidebar links at rendered dashboard sections', () => {
    render(<BubblophyDashboard snapshot={dashboardSnapshot} />);

    const sectionIds = getBubblophySidebarSectionIds();

    expect(sectionIds).toEqual([
      'overview',
      'projects',
      'issues',
      'agents',
      'runs',
      'activity',
    ]);

    for (const sectionId of sectionIds) {
      expect(document.getElementById(sectionId)).toBeInstanceOf(HTMLElement);
    }
  });
});
