import type {
  BubblesBreadcrumb,
  BubblesSidebarData,
  BubblesSidebarItem,
} from '@bubbles/ui/lib/bubbles-sidebar';

import {
  getDashboardRoutePath,
  ROUTE_PAGE_META_BY_PATH,
} from '@/lib/page-meta';
import { clearVaultEntryDraft } from '@/lib/vault/entry-drafts';

import {
  BookOpen01Icon,
  Cancel01Icon,
  DashboardSquare01Icon,
  Files02Icon,
  TagsIcon,
  UserGroupIcon,
} from '@bubbles/ui/lib/hugeicons';

import Icon from '@/public/images/icon/bubbles-verse-dashboard-icon.webp';
import Logo from '@/public/images/logo/bubbles-verse-dashboard-logo-full.webp';

export type DashboardDraftNavigationItem = {
  key: string;
  kind: 'create' | 'edit';
  href: '/vault/entries/new' | `/vault/entries/${string}`;
  navigateHref?: string;
};

/**
 * Returns the sidebar label for one temporary Vault draft entry.
 *
 * @param draft - Draft navigation item emitted by the shell.
 * @returns Human-readable sidebar label for the temporary draft item.
 */
function getDashboardDraftLabel(draft: DashboardDraftNavigationItem): string {
  if (draft.kind === 'create') {
    return 'Neuer Eintrag (Draft)';
  }

  return 'Eintrag bearbeiten (Draft)';
}

/**
 * Converts temporary editor drafts into recursive sidebar child items.
 *
 * @param drafts - Draft routes currently known to the shell.
 * @returns Sidebar child items inserted below `Einträge`.
 */
function getDashboardDraftSidebarItems(
  drafts: DashboardDraftNavigationItem[]
): BubblesSidebarItem[] {
  return drafts.map((draft) => ({
    id: `vault-entry-draft-${draft.key}`,
    title: getDashboardDraftLabel(draft),
    href: draft.href,
    navigateHref: draft.navigateHref,
    action: {
      ariaLabel: 'Draft verwerfen',
      className:
        'ring-0 peer-hover/menu-sub-button:text-sidebar-accent-foreground peer-data-active/menu-sub-button:text-sidebar-accent-foreground aria-expanded:text-sidebar-accent-foreground',
      href: '/vault/entries',
      icon: Cancel01Icon,
      navigateOnItemActiveOnly: true,
      confirm: {
        title: 'Entwurf verwerfen?',
        description:
          'Nicht gespeicherte Änderungen an diesem lokalen Entwurf gehen verloren.',
        confirmLabel: 'Weiter',
        cancelLabel: 'Behalten',
        variant: 'destructive',
        size: 'sm',
        secondStep: {
          title: 'Wirklich endgültig verwerfen?',
          description:
            'Der lokale Entwurf wird sofort entfernt und lässt sich nicht wiederherstellen.',
          confirmLabel: 'Ja, verwerfen',
          cancelLabel: 'Zurück',
        },
      },
      onSelect: () => {
        clearVaultEntryDraft({
          id:
            draft.kind === 'edit'
              ? draft.href.replace('/vault/entries/', '')
              : undefined,
          mode: draft.kind,
        });
      },
      showOnHover: false,
    },
  }));
}

/**
 * Builds the current dashboard sidebar data from the active route.
 *
 * The shared shell keeps the primary navigation intentionally small and only
 * injects temporary draft children below `Einträge` while draft work exists.
 *
 * @param drafts - Optional temporary entry drafts from local storage.
 * @returns Sidebar structure for the current shell render.
 */
export function getDashboardSidebarData(
  drafts: DashboardDraftNavigationItem[] = []
): BubblesSidebarData {
  const draftItems = getDashboardDraftSidebarItems(drafts);

  return {
    brand: {
      href: '/',
      compactLogo: {
        src: Icon.src,
        alt: 'BubblesVerse Dashboard icon',
      },
      fullLogo: {
        src: Logo.src,
        alt: 'BubblesVerse Dashboard logo',
      },
    },
    sections: [
      {
        id: 'overview',
        title: 'Übersicht',
        items: [
          {
            id: 'dashboard',
            title: 'Dashboard',
            href: '/',
            icon: DashboardSquare01Icon,
          },
          {
            id: 'account',
            title: 'Zugangsverwaltung',
            href: '/account',
            icon: UserGroupIcon,
          },
        ],
      },
      {
        id: 'coding-vault',
        title: 'Coding Vault',
        items: [
          {
            id: 'vault-overview',
            title: 'Übersicht',
            href: '/vault',
            icon: BookOpen01Icon,
          },
          {
            id: 'vault-entries',
            title: 'Einträge',
            href: '/vault/entries',
            match: 'prefix',
            icon: Files02Icon,
          },
          ...(draftItems.length > 0
            ? [
                {
                  id: 'vault-entry-drafts',
                  title: 'Entwürfe',
                  children: draftItems,
                } satisfies BubblesSidebarItem,
              ]
            : []),
          {
            id: 'vault-categories',
            title: 'Kategorien',
            href: '/vault/categories',
            icon: TagsIcon,
          },
        ],
      },
    ],
  };
}

/**
 * Builds the breadcrumb trail for the dashboard shell header.
 *
 * Vault routes include the module label plus the concrete child page so the
 * shared shell gives context without repeating large in-page headings.
 *
 * @param pathname - Active dashboard pathname.
 * @returns Ordered breadcrumb segments for the shared app header.
 */
export function getDashboardBreadcrumbs(pathname: string): BubblesBreadcrumb[] {
  const routePath = getDashboardRoutePath(pathname);
  const currentPage = ROUTE_PAGE_META_BY_PATH[routePath];

  if (routePath === '/') {
    return [{ label: 'Dashboard' }];
  }

  if (routePath === '/profile' || routePath === '/account') {
    return [{ label: 'Dashboard', href: '/' }, { label: currentPage.title }];
  }

  const vaultBreadcrumbs: BubblesBreadcrumb[] = [
    { label: 'Dashboard', href: '/' },
    { label: 'Coding Vault', href: '/vault' },
  ];

  if (routePath === '/vault') {
    return vaultBreadcrumbs;
  }

  if (routePath === '/vault/categories') {
    return [...vaultBreadcrumbs, { label: currentPage.title }];
  }

  const entryBreadcrumbs = [
    ...vaultBreadcrumbs,
    {
      label: ROUTE_PAGE_META_BY_PATH['/vault/entries'].title,
      href: '/vault/entries',
    },
  ];

  if (routePath === '/vault/entries') {
    return entryBreadcrumbs;
  }

  if (
    routePath === '/vault/preview/new' ||
    routePath === '/vault/preview/[id]'
  ) {
    return [...entryBreadcrumbs, { label: currentPage.title }];
  }

  return [...entryBreadcrumbs, { label: currentPage.title }];
}

/**
 * Returns whether one pathname points to a concrete Vault entry edit screen.
 *
 * @param pathname - Active dashboard pathname.
 * @returns `true` when the pathname targets `/vault/entries/[id]`.
 */
export function isDashboardVaultEntryEditPath(pathname: string): boolean {
  return (
    pathname.startsWith('/vault/entries/') && pathname !== '/vault/entries/new'
  );
}

/**
 * Builds one draft-navigation descriptor for the current edit route.
 *
 * @param pathname - Active dashboard pathname.
 * @returns Draft item for the edit route or `null`.
 */
export function getDashboardCurrentDraftItem(
  pathname: string
): DashboardDraftNavigationItem | null {
  if (pathname === '/vault/entries/new') {
    return {
      key: 'current-create',
      kind: 'create',
      href: '/vault/entries/new',
      navigateHref: '/vault/entries/new?draft=resume',
    };
  }

  if (isDashboardVaultEntryEditPath(pathname)) {
    return {
      key: `current-edit:${pathname}`,
      kind: 'edit',
      href: pathname as `/vault/entries/${string}`,
    };
  }

  return null;
}
