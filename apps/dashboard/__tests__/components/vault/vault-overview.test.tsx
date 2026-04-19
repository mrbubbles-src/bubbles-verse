import { buildVaultOverviewModel } from '@/lib/vault/overview';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VaultOverview } from '@/components/vault/vault-overview';

describe('VaultOverview', () => {
  it('renders the flatter Vault work area with tabs and compact actions', () => {
    const model = buildVaultOverviewModel({
      draftEntries: 1,
      publishedEntries: 3,
      totalCategories: 3,
      recentEntries: [
        {
          id: 'entry-1',
          title: 'Editor hints',
          slug: 'editor-hints',
          status: 'draft',
          categoryId: 'guides',
          categoryLabel: 'Guides',
          updatedAt: '2026-04-18T09:40:00.000Z',
          updatedAtLabel: '18. Apr. 2026, 09:40',
        },
      ],
    });

    render(<VaultOverview model={model} />);

    expect(
      screen.getByRole('heading', { name: 'Weiterschreiben' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Neuer Eintrag' })
    ).toHaveAttribute('href', '/vault/entries/new');
    expect(
      screen.getByRole('button', { name: 'Neue Kategorie' })
    ).toHaveAttribute('href', '/vault/categories');
    expect(
      screen.getByRole('tab', { name: 'Offene Entwürfe' })
    ).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('entwürfe')).toBeInTheDocument();
    expect(screen.getByText('Editor hints')).toBeInTheDocument();
    expect(screen.getByText('Guides')).toBeInTheDocument();
  });
});
