import {
  getDashboardBreadcrumbs,
  getDashboardSidebarData,
} from '@/lib/sidebar';

import { describe, expect, it } from 'vitest';

describe('dashboard sidebar helpers', () => {
  it('keeps profile out of the primary sidebar and renames account access', () => {
    const sidebarData = getDashboardSidebarData();
    const overviewSection = sidebarData.sections.find(
      (section) => section.id === 'overview'
    );

    expect(overviewSection?.items.map((item) => item.title)).toEqual([
      'Dashboard',
      'Zugangsverwaltung',
    ]);
  });

  it('injects draft children below the Vault entries item', () => {
    const sidebarData = getDashboardSidebarData([
      {
        key: 'create',
        kind: 'create',
        href: '/vault/entries/new',
      },
      {
        key: 'edit',
        kind: 'edit',
        href: '/vault/entries/entry-123',
      },
    ]);
    const vaultSection = sidebarData.sections.find(
      (section) => section.id === 'coding-vault'
    );
    const entriesItem = vaultSection?.items.find(
      (item) => item.id === 'vault-entries'
    );

    expect(entriesItem?.children?.map((item) => item.title)).toEqual([
      'Neuer Eintrag (Draft)',
      'Eintrag bearbeiten (Draft)',
    ]);
    expect(entriesItem?.children?.every((item) => item.action)).toBe(true);
  });

  it('builds nested Vault breadcrumbs for entry routes', () => {
    expect(getDashboardBreadcrumbs('/vault/entries/new')).toEqual([
      { label: 'Dashboard', href: '/' },
      { label: 'Coding Vault', href: '/vault' },
      { label: 'Einträge', href: '/vault/entries' },
      { label: 'Neuer Eintrag' },
    ]);
  });
});
