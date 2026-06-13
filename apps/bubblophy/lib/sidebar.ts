import type {
  BubblesBreadcrumb,
  BubblesSidebarData,
} from '@bubbles/ui/lib/bubbles-sidebar';

import {
  CheckListIcon,
  DashboardSquare01Icon,
  FlashIcon,
  Folder01Icon,
  UserGroupIcon,
} from '@bubbles/ui/lib/hugeicons';

/**
 * Shared sidebar data for the Bubblophy app shell.
 *
 * The current app has one protected page, so items point to real section
 * anchors on `/` instead of placeholder links.
 */
export const bubblophySidebarData: BubblesSidebarData = {
  brand: {
    href: '/',
    compactLogo: {
      src: '/icon.svg',
      alt: 'Bubblophy Icon',
    },
    fullLogo: {
      src: '/icon.svg',
      alt: 'Bubblophy',
    },
  },
  sections: [
    {
      id: 'work',
      title: 'Arbeit',
      items: [
        {
          id: 'overview',
          title: 'Übersicht',
          href: '/',
          navigateHref: '/#overview',
          icon: DashboardSquare01Icon,
        },
        {
          id: 'projects',
          title: 'Projekte',
          href: '/#projects',
          icon: Folder01Icon,
        },
        {
          id: 'issues',
          title: 'Issues',
          href: '/#issues',
          icon: CheckListIcon,
        },
      ],
    },
    {
      id: 'control',
      title: 'Kontrolle',
      items: [
        {
          id: 'agents',
          title: 'Agent-Tokens',
          href: '/#agents',
          icon: UserGroupIcon,
        },
        {
          id: 'runs',
          title: 'Runs',
          href: '/#runs',
          icon: FlashIcon,
        },
        {
          id: 'activity',
          title: 'Audit',
          href: '/#activity',
          icon: DashboardSquare01Icon,
        },
      ],
    },
  ],
};

/**
 * Returns the stable breadcrumbs for the current single-page Bubblophy shell.
 *
 * @returns Breadcrumbs rendered in the shared app header.
 */
export function getBubblophyBreadcrumbs(): BubblesBreadcrumb[] {
  return [{ label: 'Bubblophy' }, { label: 'Dashboard' }];
}
