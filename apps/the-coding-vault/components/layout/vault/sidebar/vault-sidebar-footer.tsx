'use client';
import {
  ArrowDown01Icon,
  HugeiconsIcon,
  User02Icon,
} from '@bubbles/ui/lib/hugeicons';
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@bubbles/ui/shadcn/sidebar';
import { LogoutButton } from '@/components/ui/user-logout';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@bubbles/ui/shadcn/dropdown-menu';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const VaultSidebarFooter = () => {
  const [loggedInUser, setLoggedInUser] = useState<{
    id: string;
    username: string;
    role: string;
  } | null>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/auth/user', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLoggedInUser(data);
      }
    };
    fetchUser();
  }, []);

  if (!loggedInUser) return null;

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuButton className="group" />}>
              <HugeiconsIcon icon={User02Icon} strokeWidth={2} />{' '}
              {loggedInUser.username}
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                strokeWidth={2}
                className="ml-auto transition-transform duration-500 ease-in-out group-data-[state=open]:rotate-180"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={'/admin/dashboard'} prefetch={false}>
                  Admin Panel
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive">
                <LogoutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

export default VaultSidebarFooter;
