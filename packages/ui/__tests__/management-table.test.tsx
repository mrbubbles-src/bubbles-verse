import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ManagementTable,
  ManagementTableBody,
  ManagementTableCell,
  ManagementTableHead,
  ManagementTableHeader,
  ManagementTableHeaderRow,
  ManagementTableRow,
} from '../src/components/management-table';

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
});
