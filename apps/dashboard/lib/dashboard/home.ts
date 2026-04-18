type DashboardHomeRecentItem = {
  id: string
  title: string
  appSlug: string
  status: 'draft' | 'published'
  updatedAt: string
}

type DashboardHomeSummary = {
  appSlug: string
  appName: string
  draftCount: number
  publishedCount: number
}

type DashboardHomeInput = {
  recentItems: DashboardHomeRecentItem[]
  appSummaries: DashboardHomeSummary[]
}

type DashboardHomeQuickAction = {
  label: string
  href: string
}

type DashboardHomeModel = {
  quickActions: DashboardHomeQuickAction[]
  recentDrafts: DashboardHomeRecentItem[]
  recentUpdates: DashboardHomeRecentItem[]
  appSummaries: DashboardHomeSummary[]
}

/**
 * Builds the dashboard home model from recent items and app summaries.
 *
 * Use this in the home route to keep section ordering and quick actions stable.
 * It expects dashboard query results and returns a UI-ready view model.
 */
export function buildDashboardHomeModel(
  input: DashboardHomeInput,
): DashboardHomeModel {
  return {
    quickActions: [
      { label: 'Neuer Vault-Eintrag', href: '/vault/entries/new' },
      { label: 'Kategorien verwalten', href: '/vault/categories' },
    ],
    recentDrafts: input.recentItems.filter((item) => item.status === 'draft'),
    recentUpdates: input.recentItems,
    appSummaries: input.appSummaries,
  }
}
