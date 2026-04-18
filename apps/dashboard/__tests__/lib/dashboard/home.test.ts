import { describe, expect, it } from 'vitest'

import { buildDashboardHomeModel } from '@/lib/dashboard/home'

describe('buildDashboardHomeModel', () => {
  it('returns the dashboard home model with stable quick actions and passthrough summaries', () => {
    const recentItems = [
      {
        id: 'entry-1',
        title: 'Async rendering notes',
        appSlug: 'vault',
        status: 'draft' as const,
        updatedAt: '2026-04-18T08:00:00.000Z',
      },
      {
        id: 'entry-2',
        title: 'Published design review',
        appSlug: 'vault',
        status: 'published' as const,
        updatedAt: '2026-04-18T09:00:00.000Z',
      },
    ]

    const appSummaries = [
      {
        appSlug: 'vault',
        appName: 'Coding Vault',
        draftCount: 1,
        publishedCount: 4,
      },
    ]

    const model = buildDashboardHomeModel({
      recentItems,
      appSummaries,
    })

    expect(model.quickActions).toEqual([
      { label: 'Neuer Vault-Eintrag', href: '/vault/entries/new' },
      { label: 'Kategorien verwalten', href: '/vault/categories' },
    ])
    expect(model.recentDrafts).toEqual([
      {
        id: 'entry-1',
        title: 'Async rendering notes',
        appSlug: 'vault',
        status: 'draft',
        updatedAt: '2026-04-18T08:00:00.000Z',
      },
    ])
    expect(model.recentUpdates).toBe(recentItems)
    expect(model.appSummaries).toBe(appSummaries)
  })
})
