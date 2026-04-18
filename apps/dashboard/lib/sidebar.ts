import type { RoutePath } from '@/lib/page-meta';
import type {
  BubblesBreadcrumb,
  BubblesSidebarData,
} from '@bubbles/ui/lib/bubbles-sidebar';

import { ROUTE_PAGE_META_BY_PATH } from '@/lib/page-meta';

import {
  BookOpen01Icon,
  DashboardSquare01Icon,
  Folder01Icon,
  Home01Icon,
  User02Icon,
} from '@bubbles/ui/lib/hugeicons';

import Icon from '@/public/images/icon/bubbles-verse-dashboard-icon.webp';
import Logo from '@/public/images/logo/bubbles-verse-dashboard-logo-full.webp';

/**
 * Shared navigation data for the dashboard shell.
 *
 * The dashboard is organized by app area first, starting with the Coding Vault
 * as the first real content module in V1.
 */
export const dashboardSidebarData: BubblesSidebarData = {
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
          id: 'profile',
          title: 'Profil',
          href: '/profile',
          icon: User02Icon,
        },
        {
          id: 'account',
          title: 'Account',
          href: '/account',
          icon: Home01Icon,
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
          icon: Folder01Icon,
        },
        {
          id: 'vault-categories',
          title: 'Kategorien',
          href: '/vault/categories',
          icon: Folder01Icon,
        },
      ],
    },
  ],
};

/**
 * Builds the breadcrumb trail for the dashboard shell header.
 *
 * Root keeps a single label, while nested routes add the current page behind
 * the dashboard entry.
 */
export function getDashboardBreadcrumbs(pathname: string): BubblesBreadcrumb[] {
  if (pathname === '/') {
    return [{ label: 'Dashboard' }];
  }

  const currentPage = ROUTE_PAGE_META_BY_PATH[pathname as RoutePath];

  if (!currentPage) {
    return [{ label: 'Dashboard', href: '/' }];
  }

  return [{ label: 'Dashboard', href: '/' }, { label: currentPage.title }];
}
