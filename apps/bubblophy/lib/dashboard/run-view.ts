import type { DashboardRunPage } from '@/lib/dashboard/runs';
import type { AgentRunState, AgentRunSummary } from '@/lib/dashboard/types';

const runStateMap = {
  requested: 'wartet',
  approved: 'freigegeben',
  running: 'läuft',
  needs_review: 'review',
  completed: 'abgeschlossen',
  cancelled: 'abgebrochen',
  failed: 'fehlgeschlagen',
} satisfies Record<DashboardRunPage['items'][number]['state'], AgentRunState>;

/** Maps a raw server run page into the existing dashboard presentation model. */
export function mapDashboardRunPageToSummaries(
  page: DashboardRunPage
): AgentRunSummary[] {
  return page.items.map((item) => {
    const state = runStateMap[item.state];

    return {
      id: item.id,
      issueId: item.issueKey,
      agentLabel: item.agentLabel,
      state,
      requestedBy: 'Mensch',
      lastEvent: `Status ${state} · zuletzt ${item.updatedAt}`,
      resultSummary: item.resultSummary ?? undefined,
    };
  });
}
