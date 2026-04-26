import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ManagementActionButton } from '../src/components/management-action-button';
import {
  ManagementTable,
  ManagementTableBody,
  ManagementTableCell,
  ManagementTableHead,
  ManagementTableHeader,
  ManagementTableHeaderRow,
  ManagementTableRow,
} from '../src/components/management-table';
import { Badge } from '../src/components/shadcn/badge';

describe('ManagementTable', () => {
  it('renders the shared shadcn table primitive with management defaults', () => {
    render(
      <ManagementTable>
        <ManagementTableHeader>
          <ManagementTableHeaderRow>
            <ManagementTableHead>Titel</ManagementTableHead>
            <ManagementTableHead>Status</ManagementTableHead>
          </ManagementTableHeaderRow>
        </ManagementTableHeader>
        <ManagementTableBody>
          <ManagementTableRow>
            <ManagementTableCell>Eintrag A</ManagementTableCell>
            <ManagementTableCell>Entwurf</ManagementTableCell>
          </ManagementTableRow>
        </ManagementTableBody>
      </ManagementTable>
    );

    expect(screen.getByRole('table')).toHaveClass('w-full', 'text-base');
    expect(screen.getByRole('columnheader', { name: 'Titel' })).toHaveClass(
      'uppercase',
      'whitespace-normal'
    );
    expect(screen.getByRole('cell', { name: 'Eintrag A' })).toHaveClass(
      'align-top',
      'whitespace-normal'
    );
  });

  it('renders semantic management action and status styles', () => {
    render(
      <div>
        <ManagementActionButton tone="delete" aria-label="Löschen" />
        <Badge variant="draft">Entwurf</Badge>
        <Badge variant="published">Veröffentlicht</Badge>
      </div>
    );

    expect(screen.getByRole('button', { name: 'Löschen' })).toHaveClass(
      'text-ctp-latte-red'
    );
    expect(screen.getByText('Entwurf')).toHaveClass('bg-ctp-latte-yellow/35');
    expect(screen.getByText('Veröffentlicht')).toHaveClass(
      'bg-ctp-latte-green/25'
    );
  });
});
