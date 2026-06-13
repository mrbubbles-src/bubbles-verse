'use client';

import type {
  CreateBubblophyAgentTokenActionInput,
  CreateBubblophyAgentTokenActionResult,
  CreateBubblophyIssueActionInput,
  CreateBubblophyIssueActionResult,
  CreateBubblophyIssuePlanActionInput,
  CreateBubblophyIssuePlanActionResult,
  CreateBubblophyProjectActionInput,
  CreateBubblophyProjectActionResult,
} from '@/app/actions';
import type {
  AgentRunState,
  AgentTokenState,
  AgentTokenSummary,
  DashboardSnapshot,
  IssuePriority,
  IssueStatus,
  IssueSummary,
  ProjectHealth,
  ProjectSummary,
} from '@/lib/dashboard/types';

import {
  agentRunStateLabels,
  agentTokenStateLabels,
  issuePriorityLabels,
  issueStatusLabels,
  projectHealthLabels,
} from '@/lib/dashboard/labels';
import { getIssueReadinessPercent } from '@/lib/dashboard/metrics';
import { bubblophySidebarData, getBubblophyBreadcrumbs } from '@/lib/sidebar';

import { useMemo, useState, useTransition } from 'react';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bubbles/ui/shadcn/table';
import { Textarea } from '@bubbles/ui/shadcn/textarea';

interface BubblophyDashboardProps {
  snapshot: DashboardSnapshot;
  createIssueAction?: (
    input: CreateBubblophyIssueActionInput
  ) => Promise<CreateBubblophyIssueActionResult>;
  createIssuePlanAction?: (
    input: CreateBubblophyIssuePlanActionInput
  ) => Promise<CreateBubblophyIssuePlanActionResult>;
  createProjectAction?: (
    input: CreateBubblophyProjectActionInput
  ) => Promise<CreateBubblophyProjectActionResult>;
  createAgentTokenAction?: (
    input: CreateBubblophyAgentTokenActionInput
  ) => Promise<CreateBubblophyAgentTokenActionResult>;
}

const issueStatusVariant = {
  triage: 'outline',
  geplant: 'secondary',
  bereit: 'published',
  in_arbeit: 'default',
  review: 'draft',
  blockiert: 'destructive',
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
} satisfies Record<
  AgentTokenState,
  React.ComponentProps<typeof Badge>['variant']
>;

const runVariant = {
  wartet: 'draft',
  freigegeben: 'published',
  läuft: 'default',
  review: 'secondary',
} satisfies Record<
  AgentRunState,
  React.ComponentProps<typeof Badge>['variant']
>;

type ProjectFilterKey = 'all' | string;

type SnapshotIssue = DashboardSnapshot['issues'][number];

type DashboardIssue = SnapshotIssue | LocalDraftIssue;

type LocalDraftIssue = SnapshotIssue & {
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
  createIssueAction,
  createIssuePlanAction,
  createProjectAction,
  createAgentTokenAction,
}: BubblophyDashboardProps) {
  const [selectedProjectKey, setSelectedProjectKey] =
    useState<ProjectFilterKey>('all');
  const [selectedIssueId, setSelectedIssueId] = useState(
    snapshot.issues[0]?.id ?? ''
  );
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isAgentTokenDialogOpen, setIsAgentTokenDialogOpen] = useState(false);
  const [localDrafts, setLocalDrafts] = useState<LocalDraftIssue[]>([]);
  const [persistedIssues, setPersistedIssues] = useState<IssueSummary[]>([]);
  const [issuePlansById, setIssuePlansById] = useState<
    Record<string, IssuePlanDraft>
  >({});
  const [persistedProjects, setPersistedProjects] = useState<ProjectSummary[]>(
    []
  );
  const [persistedAgentTokens, setPersistedAgentTokens] = useState<
    AgentTokenSummary[]
  >([]);
  const [draftSequence, setDraftSequence] = useState(1);

  const allProjects = useMemo(
    () => [...persistedProjects, ...snapshot.projects],
    [persistedProjects, snapshot.projects]
  );
  const allAgentTokens = useMemo(
    () => [...persistedAgentTokens, ...snapshot.agentTokens],
    [persistedAgentTokens, snapshot.agentTokens]
  );

  const allIssues = useMemo<DashboardIssue[]>(
    () =>
      [...localDrafts, ...persistedIssues, ...snapshot.issues].map((issue) => {
        const plan = issuePlansById[issue.id];

        if (!plan) {
          return issue;
        }

        return {
          ...issue,
          planSteps: plan.steps.length,
        };
      }),
    [issuePlansById, localDrafts, persistedIssues, snapshot.issues]
  );

  const filteredIssues = useMemo(() => {
    if (selectedProjectKey === 'all') {
      return allIssues;
    }

    return allIssues.filter((issue) => issue.projectKey === selectedProjectKey);
  }, [allIssues, selectedProjectKey]);

  const selectedIssue =
    filteredIssues.find((issue) => issue.id === selectedIssueId) ??
    filteredIssues[0] ??
    null;
  const selectedIssuePlan = selectedIssue
    ? issuePlansById[selectedIssue.id]
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
  const totalOpenIssues = openIssues + localDrafts.length;
  const readiness = getIssueReadinessPercent({
    readyIssues,
    openIssues: totalOpenIssues,
  });

  const handleProjectSelect = (projectKey: ProjectFilterKey) => {
    setSelectedProjectKey(projectKey);
    setSelectedIssueId(
      projectKey === 'all'
        ? (allIssues[0]?.id ?? '')
        : (allIssues.find((issue) => issue.projectKey === projectKey)?.id ?? '')
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
      owner: 'Lokaler Draft',
      planSteps: 0,
      approvalRequired: true,
      createdLabel: 'gerade eben',
      description:
        input.description.trim() || 'Noch keine Beschreibung erfasst.',
      isLocalDraft: true,
    };

    setDraftSequence((currentSequence) => currentSequence + 1);
    setLocalDrafts((currentDrafts) => [draft, ...currentDrafts]);
    setSelectedProjectKey(input.projectKey);
    setSelectedIssueId(draftId);
    setIsDraftDialogOpen(false);
  };

  const handlePersistedIssueCreated = (issue: IssueSummary) => {
    setPersistedIssues((currentIssues) => [issue, ...currentIssues]);
    setSelectedProjectKey(issue.projectKey);
    setSelectedIssueId(issue.id);
    setIsDraftDialogOpen(false);
  };

  const handlePersistedProjectCreated = (project: ProjectSummary) => {
    setPersistedProjects((currentProjects) => [project, ...currentProjects]);
    setSelectedProjectKey(project.key);
    setSelectedIssueId('');
    setIsProjectDialogOpen(false);
  };

  const handleIssuePlanSaved = (plan: IssuePlanDraft) => {
    setIssuePlansById((currentPlans) => ({
      ...currentPlans,
      [plan.issueId]: plan,
    }));
  };

  const handleAgentTokenCreated = (token: CreatedAgentToken) => {
    const summary: AgentTokenSummary = {
      id: token.id,
      label: token.label,
      projectKey: token.projectKey,
      scopes: token.scopes,
      state: token.state,
      lastUsedAt: token.lastUsedAt,
    };

    setPersistedAgentTokens((currentTokens) => [summary, ...currentTokens]);
  };

  const handleDeleteDraft = (issueId: string) => {
    setLocalDrafts((currentDrafts) =>
      currentDrafts.filter((draft) => draft.id !== issueId)
    );
    setSelectedProjectKey('all');
    setSelectedIssueId(snapshot.issues[0]?.id ?? '');
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
              onCreateIssue={() => setIsDraftDialogOpen(true)}
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
                localDrafts.length > 0
                  ? `${readyIssues} bereit · ${localDrafts.length} lokal`
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

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="grid gap-5">
              <ProjectOverview
                projects={allProjects}
                canCreateProject={
                  snapshot.meta.dataSource === 'database' &&
                  Boolean(createProjectAction)
                }
                readiness={readiness}
                selectedProjectKey={selectedProjectKey}
                onCreateProject={() => setIsProjectDialogOpen(true)}
                onProjectSelect={handleProjectSelect}
              />
              <IssueQueue
                dataSource={snapshot.meta.dataSource}
                issues={filteredIssues}
                issuePlan={selectedIssuePlan}
                selectedIssue={selectedIssue}
                selectedProjectKey={selectedProjectKey}
                canPersistIssuePlans={
                  snapshot.meta.dataSource === 'database' &&
                  Boolean(createIssuePlanAction)
                }
                createIssuePlanAction={createIssuePlanAction}
                onProjectSelect={handleProjectSelect}
                onDraftDelete={handleDeleteDraft}
                onIssuePlanSaved={handleIssuePlanSaved}
                onIssueSelect={setSelectedIssueId}
              />
            </div>

            <aside className="grid content-start gap-5">
              <AgentAccess
                dataSource={snapshot.meta.dataSource}
                agentTokens={allAgentTokens}
                canCreateAgentToken={
                  snapshot.meta.dataSource === 'database' &&
                  Boolean(createAgentTokenAction)
                }
                onCreateAgentToken={() => setIsAgentTokenDialogOpen(true)}
              />
              <RunQueue snapshot={snapshot} />
              <ActivityFeed snapshot={snapshot} />
            </aside>
          </div>
        </section>
      </main>
      {isDraftDialogOpen ? (
        <NewIssueDraftDialog
          projects={allProjects}
          open={isDraftDialogOpen}
          selectedProjectKey={selectedProjectKey}
          canPersistToDatabase={
            snapshot.meta.dataSource === 'database' &&
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
          projects={allProjects}
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
    </div>
  );
}

/**
 * Renders dashboard-level actions with clear local behavior.
 *
 * @param props Handler for local draft creation.
 * @returns Primary toolbar controls.
 */
function DashboardToolbar({ onCreateIssue }: { onCreateIssue: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="lg" type="button" onClick={onCreateIssue}>
        <HugeiconsIcon
          aria-hidden
          data-icon="inline-start"
          icon={Add01Icon}
          strokeWidth={2}
        />
        Neues Issue
      </Button>
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
  projects,
  canCreateProject,
  readiness,
  selectedProjectKey,
  onCreateProject,
  onProjectSelect,
}: {
  projects: ProjectSummary[];
  canCreateProject: boolean;
  readiness: number;
  selectedProjectKey: ProjectFilterKey;
  onCreateProject: () => void;
  onProjectSelect: (projectKey: ProjectFilterKey) => void;
}) {
  return (
    <Card id="projects" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Projekte</CardTitle>
        <CardDescription>
          Arbeitslast, Blocker und begrenzte Agent-Zugänge pro Projekt.
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
              onClick={() => onProjectSelect('all')}>
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
            Noch keine Projekte für diesen User.
            {canCreateProject ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={onCreateProject}>
                Neues Projekt
              </Button>
            ) : null}
          </div>
        ) : null}
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            aria-pressed={selectedProjectKey === project.key}
            onClick={() => onProjectSelect(project.key)}
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
              <Badge variant={healthVariant[project.health]}>
                {projectHealthLabels[project.health]}
              </Badge>
            </div>

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
      const result = await createProjectAction(projectInput);

      if (result.status === 'created') {
        onPersistedProjectCreated(result.project);
        return;
      }

      setActionError(getCreateProjectActionErrorMessage(result));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neues Projekt</DialogTitle>
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
  issuePlan,
  selectedIssue,
  selectedProjectKey,
  canPersistIssuePlans,
  createIssuePlanAction,
  onProjectSelect,
  onDraftDelete,
  onIssuePlanSaved,
  onIssueSelect,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  issues: DashboardIssue[];
  issuePlan?: IssuePlanDraft;
  selectedIssue: DashboardIssue | null;
  selectedProjectKey: ProjectFilterKey;
  canPersistIssuePlans: boolean;
  createIssuePlanAction?: (
    input: CreateBubblophyIssuePlanActionInput
  ) => Promise<CreateBubblophyIssuePlanActionResult>;
  onProjectSelect: (projectKey: ProjectFilterKey) => void;
  onDraftDelete: (issueId: string) => void;
  onIssuePlanSaved: (plan: IssuePlanDraft) => void;
  onIssueSelect: (issueId: string) => void;
}) {
  return (
    <Card id="issues" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Issue-Queue</CardTitle>
        <CardDescription>
          {selectedProjectKey === 'all'
            ? 'Alle Projekte, priorisiert nach Freigabe, Planstand und Blockern.'
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
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priorität</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-sm text-muted-foreground">
                    Noch keine Issues für diesen Filter.
                  </TableCell>
                </TableRow>
              ) : null}
              {issues.map((issue) => (
                <TableRow
                  key={issue.id}
                  data-state={selectedIssue?.id === issue.id ? 'selected' : ''}
                  className="data-[state=selected]:bg-muted/40">
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
                  <TableCell>{issue.owner}</TableCell>
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
          createIssuePlanAction={createIssuePlanAction}
          onDraftDelete={onDraftDelete}
          onIssuePlanSaved={onIssuePlanSaved}
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
  createIssuePlanAction,
  onDraftDelete,
  onIssuePlanSaved,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  issue: DashboardIssue | null;
  issuePlan?: IssuePlanDraft;
  canPersistIssuePlans: boolean;
  createIssuePlanAction?: (
    input: CreateBubblophyIssuePlanActionInput
  ) => Promise<CreateBubblophyIssuePlanActionResult>;
  onDraftDelete: (issueId: string) => void;
  onIssuePlanSaved: (plan: IssuePlanDraft) => void;
}) {
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  if (!issue) {
    return (
      <aside className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
        Keine Issues für diesen Filter.
      </aside>
    );
  }

  return (
    <aside
      aria-label="Issue-Details"
      className="grid content-start gap-4 rounded-md border border-border bg-muted/20 p-4">
      <div className="grid gap-2">
        <Badge variant="outline" className="w-fit font-mono">
          {issue.id}
        </Badge>
        {isLocalDraftIssue(issue) ? (
          <Badge variant="draft" className="w-fit">
            Lokal / nicht gespeichert
          </Badge>
        ) : null}
        <h3 className="text-base font-semibold text-pretty">{issue.title}</h3>
        <p className="text-sm text-muted-foreground">
          Projekt {issue.projectKey} · Owner {issue.owner}
        </p>
      </div>

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
            {dataSource === 'database'
              ? 'Plan-Schritte sind noch nicht ausformuliert. Die Planungsansicht folgt als nächster Schritt.'
              : `Sample-Daten enthalten aktuell ${issue.planSteps} Plan-Schritte als Zähler. Die ausformulierten Schritte folgen mit der Datenanbindung.`}
          </p>
        )}
      </div>

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
      const result = await createIssuePlanAction({
        issueId: issue.id,
        summary,
        steps,
      });

      if (result.status === 'created') {
        onIssuePlanSaved(result.plan);
        onOpenChange(false);
        return;
      }

      setActionError(getIssuePlanActionErrorMessage(result));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
  canCreateAgentToken,
  onCreateAgentToken,
}: {
  dataSource: DashboardSnapshot['meta']['dataSource'];
  agentTokens: AgentTokenSummary[];
  canCreateAgentToken: boolean;
  onCreateAgentToken: () => void;
}) {
  const isDatabaseSource = dataSource === 'database';

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
          </div>
        ))}
      </CardContent>
    </Card>
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
      const result = await createAgentTokenAction({
        projectKey,
        label,
        scopes,
      });

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
      <DialogContent className="sm:max-w-lg">
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
              <code className="mt-3 block rounded-md bg-background p-3 text-xs break-all">
                {createdToken.plaintextToken}
              </code>
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
 * @param props Dashboard snapshot with agent run summaries.
 * @returns Run queue panel.
 */
function RunQueue({ snapshot }: BubblophyDashboardProps) {
  const isDatabaseSource = snapshot.meta.dataSource === 'database';

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
          Agent-Runs entstehen später nur nach expliziter menschlicher Freigabe.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {!isDatabaseSource ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Sample/Fallback zeigt keine operative Run-Queue. Echte Runs werden
            erst angezeigt, wenn ein gespeicherter, menschlich freigegebener
            Run-Workflow existiert.
          </div>
        ) : null}
        {isDatabaseSource && snapshot.agentRuns.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Noch keine Runs. Bubblophy startet keine Agenten automatisch; ein
            späterer Run-Request braucht eine explizite menschliche Freigabe.
          </div>
        ) : null}
        {isDatabaseSource
          ? snapshot.agentRuns.map((run) => (
              <div
                key={run.id}
                className="grid gap-2 rounded-md bg-muted/30 p-3">
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
                <p className="text-xs text-muted-foreground">{run.lastEvent}</p>
              </div>
            ))
          : null}
      </CardContent>
    </Card>
  );
}

/**
 * Renders recent audit-visible activity.
 *
 * @param props Dashboard snapshot with activity events.
 * @returns Activity timeline panel.
 */
function ActivityFeed({ snapshot }: BubblophyDashboardProps) {
  const isDatabaseSource = snapshot.meta.dataSource === 'database';

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
      </CardHeader>
      <CardContent className="grid gap-3">
        {!isDatabaseSource && snapshot.activity.length > 0 ? (
          <p className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Beispielhafte Audit-Vorschau aus Sample/Fallback-Daten. Echte
            Projekt-Events werden nur im Datenbankmodus geladen.
          </p>
        ) : null}
        {snapshot.activity.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Noch keine Audit-Aktivität für diese Datenquelle.
          </p>
        ) : null}
        <ol className="grid gap-3">
          {snapshot.activity.map((event) => (
            <li
              key={event.id}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 text-sm">
              <time className="font-mono text-xs text-muted-foreground">
                {event.occurredAt}
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
      </CardContent>
    </Card>
  );
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
      const result = await createIssueAction(draftInput);

      if (result.status === 'created') {
        onPersistedIssueCreated(result.issue);
        return;
      }

      setActionError(getCreateIssueActionErrorMessage(result));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neues Issue als Draft</DialogTitle>
          <DialogDescription>
            {canPersistToDatabase
              ? 'Speichere ein menschlich angelegtes Issue in der Datenbank oder halte es bewusst nur lokal.'
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
              ? 'Datenbank-Speichern prüft die menschliche Session und Projektmitgliedschaft serverseitig. Es startet keinen Agent-Run.'
              : 'Datenbank nicht aktiv, Draft bleibt lokal.'}
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
                Nur lokal anlegen
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={
                canPersistToDatabase ? !canSaveToDatabase : !canCreateDraft
              }>
              {canPersistToDatabase
                ? isPersistPending
                  ? 'Speichert...'
                  : 'In Datenbank speichern'
                : 'Draft anlegen'}
            </Button>
          </DialogFooter>
          {!canCreateDraft ? (
            <p className="text-xs text-muted-foreground">
              Titel und Projekt sind nötig, bevor ein lokaler Draft angelegt
              wird.
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
