export type ProjectHealth = 'stabil' | 'aufmerksam' | 'blockiert';

export type IssueStatus =
  | 'triage'
  | 'geplant'
  | 'bereit'
  | 'in_arbeit'
  | 'review'
  | 'blockiert'
  | 'erledigt';

export type IssuePriority = 'niedrig' | 'mittel' | 'hoch';

export type AgentRunState =
  | 'wartet'
  | 'freigegeben'
  | 'läuft'
  | 'review'
  | 'abgeschlossen'
  | 'abgebrochen'
  | 'fehlgeschlagen';

export type AgentTokenState =
  | 'aktiv'
  | 'pausiert'
  | 'widerrufen'
  | 'abgelaufen';

export type ProjectMemberRole = 'owner' | 'maintainer' | 'member' | 'viewer';

export const DASHBOARD_ISSUE_NOTE_LIMIT = 50;

export interface ProjectSummary {
  id: string;
  name: string;
  key: string;
  description?: string;
  isArchived: boolean;
  health: ProjectHealth;
  openIssues: number;
  readyIssues: number;
  blockedIssues: number;
  memberCount: number;
  agentTokenCount: number;
  currentUserRole?: ProjectMemberRole;
}

export interface IssueSummary {
  id: string;
  title: string;
  description?: string;
  projectKey: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeAuthUserId: string | null;
  assigneeLabel: string;
  planSteps: number;
  latestPlan?: IssuePlanSummary;
  notes?: IssueNoteSummary[];
  hasMoreNotes?: boolean;
  approvalRequired: boolean;
}

export interface IssueNoteSummary {
  id: string;
  note: string;
  actor: string;
  createdAt: string;
}

export interface IssuePlanStepSummary {
  id: string;
  text: string;
}

export interface IssuePlanSummary {
  version: number;
  summary: string;
  steps: IssuePlanStepSummary[];
}

export interface AgentTokenSummary {
  id: string;
  label: string;
  projectKey: string;
  scopes: string[];
  state: AgentTokenState;
  lastUsedAt: string;
  expiresAt: string;
}

export interface ProjectMemberSummary {
  id: string;
  projectKey: string;
  authUserId: string;
  label: string;
  email?: string | null;
  role: ProjectMemberRole;
  createdAt: string;
}

export interface AgentRunSummary {
  id: string;
  issueId: string;
  agentLabel: string;
  state: AgentRunState;
  requestedBy: string;
  lastEvent: string;
  canAgentReportStatus?: boolean;
  resultSummary?: string;
}

export interface ActivityEvent {
  id: string;
  label: string;
  actor: string;
  occurredAt: string;
  projectKey?: string;
  issueId?: string;
}

export type DashboardDataSource =
  | 'sample'
  | 'database'
  | 'empty_database'
  | 'database_unavailable';

export type DashboardUnavailableReason =
  | 'not_configured'
  | 'schema_missing'
  | 'connection_failed'
  | 'unknown';

export interface DashboardSnapshotMeta {
  dataSource: DashboardDataSource;
  label: string;
  description: string;
  reason?: DashboardUnavailableReason;
  hint?: string;
}

export interface DashboardSnapshot {
  meta: DashboardSnapshotMeta;
  currentUser: {
    authUserId: string;
  };
  projects: ProjectSummary[];
  projectMembers: ProjectMemberSummary[];
  agentRuns: AgentRunSummary[];
  activity: ActivityEvent[];
}
