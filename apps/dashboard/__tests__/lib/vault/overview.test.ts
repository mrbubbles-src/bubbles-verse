import { buildVaultOverviewModel } from '@/lib/vault/overview';

import { describe, expect, it } from 'vitest';

describe('buildVaultOverviewModel', () => {
  it('returns stable stats, actions, and a capped recent-entry list', () => {
    const model = buildVaultOverviewModel({
      totalEntries: 8,
      draftEntries: 3,
      publishedEntries: 5,
      totalCategories: 6,
      topLevelCategories: 2,
      childCategories: 4,
      recentEntries: [
        {
          id: 'entry-1',
          title: 'One',
          slug: 'one',
          status: 'draft',
          categoryLabel: 'Guides',
          updatedAtLabel: '18. Apr. 2026, 10:00',
        },
        {
          id: 'entry-2',
          title: 'Two',
          slug: 'two',
          status: 'published',
          categoryLabel: 'Guides',
          updatedAtLabel: '18. Apr. 2026, 10:05',
        },
        {
          id: 'entry-3',
          title: 'Three',
          slug: 'three',
          status: 'published',
          categoryLabel: 'Guides',
          updatedAtLabel: '18. Apr. 2026, 10:10',
        },
        {
          id: 'entry-4',
          title: 'Four',
          slug: 'four',
          status: 'published',
          categoryLabel: 'Guides',
          updatedAtLabel: '18. Apr. 2026, 10:15',
        },
        {
          id: 'entry-5',
          title: 'Five',
          slug: 'five',
          status: 'published',
          categoryLabel: 'Guides',
          updatedAtLabel: '18. Apr. 2026, 10:20',
        },
        {
          id: 'entry-6',
          title: 'Six',
          slug: 'six',
          status: 'published',
          categoryLabel: 'Guides',
          updatedAtLabel: '18. Apr. 2026, 10:25',
        },
      ],
    });

    expect(model.quickActions).toHaveLength(3);
    expect(model.stats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Einträge gesamt', value: '8' }),
        expect.objectContaining({ label: 'Entwürfe', value: '3' }),
        expect.objectContaining({ label: 'Veröffentlicht', value: '5' }),
        expect.objectContaining({
          label: 'Kategorien',
          detail: '2 Oberkategorien, 4 Unterkategorien.',
        }),
      ])
    );
    expect(model.recentEntries).toHaveLength(5);
    expect(model.recentEntries.at(-1)?.id).toBe('entry-5');
  });
});
