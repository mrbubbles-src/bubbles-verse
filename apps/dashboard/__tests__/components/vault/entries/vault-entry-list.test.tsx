import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VaultEntryList } from '@/components/vault/entries/vault-entry-list';

describe('VaultEntryList', () => {
  it('renders editorial rows with status and category context', () => {
    render(
      <VaultEntryList
        entries={[
          {
            id: 'entry-1',
            title: 'React Rendering',
            slug: 'react/rendering',
            status: 'published',
            categoryId: 'react-rendering',
            categoryLabel: 'React / Rendering',
            updatedAtLabel: '18.04.2026, 18:00',
          },
        ]}
      />
    );

    expect(screen.getByText('React Rendering')).toBeInTheDocument();
    expect(screen.getByText('/react/rendering')).toBeInTheDocument();
    expect(screen.getByText('React / Rendering')).toBeInTheDocument();
    expect(screen.getByText('Veröffentlicht')).toBeInTheDocument();
  });

  it('renders a custom empty state when filters return no results', () => {
    render(
      <VaultEntryList
        entries={[]}
        emptyState="Keine Vault-Einträge passen gerade zu diesen Filtern."
      />
    );

    expect(
      screen.getByText('Keine Vault-Einträge passen gerade zu diesen Filtern.')
    ).toBeInTheDocument();
  });
});
