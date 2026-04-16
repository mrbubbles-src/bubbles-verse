'use client';

import type {
  BubblesSidebarData,
  BubblesSidebarLayoutClassNames,
  BubblesSidebarUser,
} from '@bubbles/ui/lib/bubbles-sidebar';
import type { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@bubbles/ui/lib/utils';
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

import { BubblesSidebarNav } from './bubbles-sidebar-nav';
import { BubblesSidebarUserMenu } from './bubbles-sidebar-user-menu';

type BubblesSidebarLayoutProps = {
  sidebarData: BubblesSidebarData;
  user?: BubblesSidebarUser;
  defaultOpen?: boolean;
  header?: ReactNode;
  children: ReactNode;
  classNames?: BubblesSidebarLayoutClassNames;
};

/**
 * Renders the shared inset app shell built on top of the shadcn sidebar
 * primitives and accepts an injected header so each app can compose its own
 * top bar without changing the shared sidebar package.
 */
export function BubblesSidebarLayout({
  sidebarData,
  user,
  defaultOpen = true,
  header,
  children,
  classNames,
}: BubblesSidebarLayoutProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen} className={classNames?.root}>
      <Sidebar
        variant="inset"
        collapsible="icon"
        className={classNames?.sidebar}>
        <SidebarHeader className={classNames?.sidebarHeader}>
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
        {/* <SidebarSeparator /> */}
        <SidebarContent className={classNames?.sidebarContent}>
          <BubblesSidebarNav sections={sidebarData.sections} />
        </SidebarContent>
        {user ? (
          <>
            <SidebarSeparator />
            <SidebarFooter className={classNames?.sidebarFooter}>
              <BubblesSidebarUserMenu user={user} />
            </SidebarFooter>
          </>
        ) : null}
        <SidebarRail />
      </Sidebar>
      <SidebarInset className={classNames?.sidebarInset}>
        {header}
        <div
          className={cn('flex min-h-0 flex-1 flex-col', classNames?.content)}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
