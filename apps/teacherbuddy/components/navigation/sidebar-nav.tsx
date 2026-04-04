'use client';

import Link from 'next/link';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@bubbles/ui/shadcn/sidebar';
import {
  CheckListIcon,
  DashboardSquare01Icon,
  Folder01Icon,
  HugeiconsIcon,
  PlayCircle02Icon,
  ShuffleIcon,
  UserGroupIcon,
} from '@bubbles/ui/lib/hugeicons';

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: DashboardSquare01Icon,
    accentColor: 'var(--primary)',
  },
  {
    title: 'Students',
    href: '/students',
    icon: UserGroupIcon,
    accentColor: 'var(--chart-1)',
  },
  {
    title: 'Generator',
    href: '/generator',
    icon: ShuffleIcon,
    accentColor: 'var(--chart-2)',
  },
  {
    title: 'Breakout Rooms',
    href: '/breakout-rooms',
    icon: UserGroupIcon,
    accentColor: 'var(--chart-4)',
  },
  {
    title: 'Quizzes',
    href: '/quizzes',
    icon: CheckListIcon,
    accentColor: 'var(--chart-3)',
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: Folder01Icon,
    accentColor: 'var(--chart-5)',
  },
  {
    title: 'Play',
    href: '/play',
    icon: PlayCircle02Icon,
    accentColor: 'var(--chart-4)',
  },
];

/**
 * Renders primary app navigation links with phase-colored active indicators.
 * Each route has a distinct accent color matching the design-6 phase system.
 */
export function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <SidebarMenu className="gap-1.5 px-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              render={<Link href={item.href} />}
              isActive={isActive}
              title={item.title}
              className="relative overflow-hidden [&>span]:group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:justify-center [&_svg]:group-data-[collapsible=icon]:size-5"
              style={
                isActive
                  ? {
                      borderLeft: `3px solid ${item.accentColor}`,
                      backgroundColor: `color-mix(in oklch, ${item.accentColor} 8%, var(--sidebar-background, var(--background)))`,
                      color: item.accentColor,
                    }
                  : undefined
              }>
              <HugeiconsIcon
                icon={item.icon}
                strokeWidth={2}
                className="size-4"
                style={isActive ? { color: item.accentColor } : undefined}
              />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
