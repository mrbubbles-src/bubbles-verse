import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from '../src/components/pagination';
import { getPaginationItems } from '../src/lib/pagination';

describe('getPaginationItems', () => {
  it('builds condensed page chips with boundary pages and ellipsis markers', () => {
    expect(
      getPaginationItems({
        page: 6,
        totalPages: 12,
      })
    ).toEqual([
      { type: 'page', key: 'page-1', page: 1, isCurrent: false },
      { type: 'ellipsis', key: 'ellipsis-start' },
      { type: 'page', key: 'page-5', page: 5, isCurrent: false },
      { type: 'page', key: 'page-6', page: 6, isCurrent: true },
      { type: 'page', key: 'page-7', page: 7, isCurrent: false },
      { type: 'ellipsis', key: 'ellipsis-end' },
      { type: 'page', key: 'page-12', page: 12, isCurrent: false },
    ]);
  });
});

describe('Pagination', () => {
  it('renders current state, condensed links, and prev/next navigation', () => {
    render(
      <Pagination
        page={6}
        totalPages={12}
        getPageHref={(page) => `/items?page=${page}`}
      />
    );

    expect(screen.getByText('Seite 6 von 12')).toBeInTheDocument();
    expect(screen.getAllByText('...')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Zurück' })).toHaveAttribute(
      'href',
      '/items?page=5'
    );
    expect(screen.getByRole('button', { name: 'Weiter' })).toHaveAttribute(
      'href',
      '/items?page=7'
    );
    expect(screen.getByRole('button', { name: 'Seite 5' })).toHaveAttribute(
      'href',
      '/items?page=5'
    );
    expect(screen.getByRole('button', { name: 'Seite 6' })).toBeDisabled();
  });

  it('calls page and page-size callbacks from the shared shell', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        page={3}
        totalPages={8}
        onPageChange={onPageChange}
        pageSize={25}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={onPageSizeChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Seite 4' }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('50'));

    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
