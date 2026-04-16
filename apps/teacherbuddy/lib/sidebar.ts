import type { RoutePath } from '@/lib/page-meta';
import type {
  BubblesBreadcrumb,
  BubblesSidebarData,
} from '@bubbles/ui/lib/bubbles-sidebar';

import { ROUTE_PAGE_META_BY_PATH } from '@/lib/page-meta';

import {
  CheckListIcon,
  DashboardSquare01Icon,
  Folder01Icon,
  PlayCircle02Icon,
  ShuffleIcon,
  UserGroupIcon,
} from '@bubbles/ui/lib/hugeicons';

import Icon from '@/public/images/teacherbuddy-icon-transparent.png';
import Logo from '@/public/images/teacherbuddy-logo.png';

/**
 * Shared sidebar data for the TeacherBuddy app shell.
 */
export const teacherBuddySidebarData: BubblesSidebarData = {
  brand: {
    href: '/',
    compactLogo: {
      src: Icon.src,
      alt: 'TeacherBuddy icon',
    },
    fullLogo: {
      src: Logo.src,
      alt: 'TeacherBuddy logo',
    },
  },
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          href: '/',
          icon: DashboardSquare01Icon,
        },
      ],
    },
    {
      id: 'prepare',
      title: 'Prepare',
      items: [
        {
          id: 'students',
          title: 'Students',
          href: '/students',
          icon: UserGroupIcon,
        },
        {
          id: 'quizzes',
          title: 'Quizzes',
          href: '/quizzes',
          icon: CheckListIcon,
        },
      ],
    },
    {
      id: 'start',
      title: 'Start',
      items: [
        {
          id: 'generator',
          title: 'Generator',
          href: '/generator',
          icon: ShuffleIcon,
        },
      ],
    },
    {
      id: 'engage',
      title: 'Engage',
      items: [
        {
          id: 'breakout-rooms',
          title: 'Breakout Rooms',
          href: '/breakout-rooms',
          icon: UserGroupIcon,
        },
        {
          id: 'play',
          title: 'Play',
          href: '/play',
          icon: PlayCircle02Icon,
        },
      ],
    },
    {
      id: 'review',
      title: 'Review',
      items: [
        {
          id: 'projects',
          title: 'Projects',
          href: '/projects',
          icon: Folder01Icon,
        },
      ],
    },
  ],
};

/**
 * Returns explicit breadcrumb data for the shared TeacherBuddy shell header.
 */
export function getTeacherBuddyBreadcrumbs(
  pathname: string
): BubblesBreadcrumb[] {
  if (pathname === '/') {
    return [{ label: 'Dashboard' }];
  }

  const currentPage = ROUTE_PAGE_META_BY_PATH[pathname as RoutePath];

  if (!currentPage) {
    return [{ label: 'Dashboard', href: '/' }];
  }

  return [{ label: 'Dashboard', href: '/' }, { label: currentPage.title }];
}
