'use client';

import type { BubblesSidebarUser } from '@bubbles/ui/lib/bubbles-sidebar';

import Link from 'next/link';

import {
  DoorOpenIcon,
  Home01Icon,
  HugeiconsIcon,
  User02Icon,
} from '@bubbles/ui/lib/hugeicons';
import { Avatar, AvatarFallback, AvatarImage } from '@bubbles/ui/shadcn/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bubbles/ui/shadcn/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@bubbles/ui/shadcn/sidebar';

type BubblesSidebarUserMenuProps = {
  user: BubblesSidebarUser;
};

function getUserInitials(name: string): string {
  const segments = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (!segments.length) {
    return 'BU';
  }

  return segments.map((segment) => segment[0]?.toUpperCase() ?? '').join('');
}

/**
 * Renders the optional authenticated footer menu for the shared sidebar layout.
 */
export function BubblesSidebarUserMenu({ user }: BubblesSidebarUserMenuProps) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
              />
            }>
            <Avatar>
              <AvatarImage src={user.avatarSrc} alt={user.name} />
              <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {user.email}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatarSrc} alt={user.name} />
                    <AvatarFallback>
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="p-0">
                <Link
                  href={user.dashboardHref}
                  className="flex w-full items-center gap-2 px-2 py-1">
                  <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-0">
                <Link
                  href={user.settingsHref}
                  className="flex w-full items-center gap-2 px-2 py-1">
                  <HugeiconsIcon icon={User02Icon} strokeWidth={2} />
                  <span>Autorenprofil bearbeiten</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" className="p-0">
                <Link
                  href={user.logoutHref}
                  className="flex w-full items-center gap-2 px-2 py-1">
                  <HugeiconsIcon icon={DoorOpenIcon} strokeWidth={2} />
                  <span>Logout</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
