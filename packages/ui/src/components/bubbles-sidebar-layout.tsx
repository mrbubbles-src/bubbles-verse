'use client';

import type {
  BubblesBreadcrumb,
  BubblesSidebarData,
  BubblesSidebarUser,
} from '@bubbles/ui/lib/bubbles-sidebar';
import type { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { BubblesSidebarHeader } from '@bubbles/ui/components/bubbles-sidebar-header';
import { BubblesSidebarNav } from '@bubbles/ui/components/bubbles-sidebar-nav';
import { BubblesSidebarUserMenu } from '@bubbles/ui/components/bubbles-sidebar-user-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
} from '@bubbles/ui/shadcn/sidebar';

type BubblesSidebarLayoutProps = {
  sidebarData: BubblesSidebarData;
  breadcrumbs?: BubblesBreadcrumb[];
  user?: BubblesSidebarUser;
  defaultOpen?: boolean;
  description?: ReactNode;
  descriptionAction?: ReactNode;
  mobileHeaderActions?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
};

/**
 * Renders the shared inset app shell built on top of the shadcn sidebar primitives.
 */
export function BubblesSidebarLayout({
  sidebarData,
  breadcrumbs = [],
  user,
  defaultOpen = true,
  description,
  descriptionAction,
  mobileHeaderActions,
  headerActions,
  children,
}: BubblesSidebarLayoutProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href={sidebarData.brand.href} />}
                size="lg"
                tooltip="Home"
                className="h-20 rounded-2xl px-4 text-sm font-semibold group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!">
                <span className="hidden shrink-0 items-center justify-center group-data-[collapsible=icon]:flex">
                  <Image
                    src={sidebarData.brand.compactLogo.src}
                    alt={sidebarData.brand.compactLogo.alt}
                    width={52}
                    height={52}
                    className="size-12 object-contain"
                    priority
                  />
                </span>
                <span className="flex min-w-0 flex-1 items-center justify-center group-data-[collapsible=icon]:hidden">
                  <Image
                    src={sidebarData.brand.fullLogo.src}
                    alt={sidebarData.brand.fullLogo.alt}
                    width={320}
                    height={96}
                    className="h-14 w-full max-w-[14.25rem] object-contain object-center"
                    priority
                  />
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <BubblesSidebarNav sections={sidebarData.sections} />
        </SidebarContent>
        {user ? (
          <>
            <SidebarSeparator />
            <SidebarFooter>
              <BubblesSidebarUserMenu user={user} />
            </SidebarFooter>
          </>
        ) : null}
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <BubblesSidebarHeader
          breadcrumbs={breadcrumbs}
          description={description}
          descriptionAction={descriptionAction}
          mobileActions={mobileHeaderActions}
          actions={headerActions}
        />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
