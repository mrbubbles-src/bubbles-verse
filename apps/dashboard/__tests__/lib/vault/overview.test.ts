import { buildVaultOverviewModel } from '@/lib/vault/overview';

import { describe, expect, it } from 'vitest';

describe('buildVaultOverviewModel', () => {
  it('returns capped work queues, top actions, and a compact status line', () => {
    const model = buildVaultOverviewModel({
      draftEntries: 3,
      publishedEntries: 5,
      totalCategories: 6,
      recentEntries: [
        {
          id: 'entry-1',
          title: 'One',
          slug: 'one',
          status: 'draft',
          categoryId: 'guides',
          categoryLabel: 'Guides',
          updatedAt: '2026-04-18T10:00:00.000Z',
          updatedAtLabel: '18. Apr. 2026, 10:00',
        },
        {
          id: 'entry-2',
          title: 'Two',
          slug: 'two',
          status: 'published',
          categoryId: 'guides',
          categoryLabel: 'Guides',
          updatedAt: '2026-04-18T10:05:00.000Z',
          updatedAtLabel: '18. Apr. 2026, 10:05',
        },
        {
          id: 'entry-3',
          title: 'Three',
          slug: 'three',
          status: 'published',
          categoryId: 'guides',
          categoryLabel: 'Guides',
          updatedAt: '2026-04-18T10:10:00.000Z',
          updatedAtLabel: '18. Apr. 2026, 10:10',
        },
        {
          id: 'entry-4',
          title: 'Four',
          slug: 'four',
          status: 'published',
          categoryId: 'guides',
          categoryLabel: 'Guides',
          updatedAt: '2026-04-18T10:15:00.000Z',
          updatedAtLabel: '18. Apr. 2026, 10:15',
        },
        {
          id: 'entry-5',
          title: 'Five',
          slug: 'five',
          status: 'published',
          categoryId: 'guides',
          categoryLabel: 'Guides',
          updatedAt: '2026-04-18T10:20:00.000Z',
          updatedAtLabel: '18. Apr. 2026, 10:20',
        },
        {
          id: 'entry-6',
          title: 'Six',
          slug: 'six',
          status: 'published',
          categoryId: 'guides',
          categoryLabel: 'Guides',
          updatedAt: '2026-04-18T10:25:00.000Z',
          updatedAtLabel: '18. Apr. 2026, 10:25',
        },
      ],
    });

    expect(model.quickActions).toEqual([
      { label: 'Neuer Eintrag', href: '/vault/entries/new' },
      { label: 'Neue Kategorie', href: '/vault/categories' },
    ]);
    expect(model.statusItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Entwürfe', value: '3' }),
        expect.objectContaining({ label: 'Veröffentlicht', value: '5' }),
        expect.objectContaining({ label: 'Kategorien', value: '6' }),
      ])
    );
    expect(model.recentDrafts).toHaveLength(1);
    expect(model.recentDrafts[0]?.id).toBe('entry-1');
    expect(model.recentUpdates).toHaveLength(5);
    expect(model.recentUpdates.at(-1)?.id).toBe('entry-5');
  });
});
