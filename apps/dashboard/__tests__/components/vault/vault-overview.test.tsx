import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VaultOverview } from '@/components/vault/vault-overview';
import { buildVaultOverviewModel } from '@/lib/vault/overview';

describe('VaultOverview', () => {
  it('renders stats, quick links, and recent entry content', () => {
    const model = buildVaultOverviewModel({
      totalEntries: 4,
      draftEntries: 1,
      publishedEntries: 3,
      totalCategories: 3,
      topLevelCategories: 1,
      childCategories: 2,
      recentEntries: [
        {
          id: 'entry-1',
          title: 'Editor hints',
          slug: 'editor-hints',
          status: 'draft',
          categoryId: 'guides',
          categoryLabel: 'Guides',
          updatedAtLabel: '18. Apr. 2026, 09:40',
        },
      ],
    });

    render(<VaultOverview model={model} />);

    expect(
      screen.getByRole('heading', {
        name: 'Redaktion, Taxonomie und Schreibfluss an einem Ort.',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Neuer Eintrag' })
    ).toHaveAttribute('href', '/vault/entries/new');
    expect(screen.getByText('Einträge gesamt')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Editor hints')).toBeInTheDocument();
    expect(screen.getByText('Guides')).toBeInTheDocument();
  });
});
