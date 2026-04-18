'use client';

import type { BubblesSidebarUser } from '@bubbles/ui/lib/bubbles-sidebar';

import { getDashboardPageInfoByPath } from '@/lib/page-meta';
import { dashboardSidebarData, getDashboardBreadcrumbs } from '@/lib/sidebar';

import { usePathname } from 'next/navigation';

import { Footer } from '@bubbles/footer';
import { ThemeToggle } from '@bubbles/theme';
import { BubblesAppHeader } from '@bubbles/ui/components/bubbles-app-header';
import { BubblesSidebarLayout } from '@bubbles/ui/components/bubbles-sidebar-layout';
import { Separator } from '@bubbles/ui/shadcn/separator';

/**
 * Renders the authenticated dashboard shell with sidebar, header, and footer.
 *
 * Use this for all private dashboard routes so navigation, account actions,
 * and the top-level editorial framing stay consistent across app sections.
 */
export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: BubblesSidebarUser;
}) {
  const pathname = usePathname();
  const pageInfo = getDashboardPageInfoByPath(pathname);
  const breadcrumbs = getDashboardBreadcrumbs(pathname);

  return (
    <BubblesSidebarLayout
      sidebarData={dashboardSidebarData}
      user={user}
      header={
        <BubblesAppHeader
          breadcrumbs={breadcrumbs}
          subtitle={pageInfo.description}
          mobileTopActions={<ThemeToggle />}
          actions={
            <div className="flex items-center gap-4">
              <Separator
                orientation="vertical"
                className="hidden md:block data-vertical:h-8"
              />
              <ThemeToggle />
            </div>
          }
        />
      }>
      <div className="flex min-h-dvh flex-1 flex-col">
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
        <Footer
          author="mrbubbles-src"
          authorHref="https://mrbubbles-src.dev"
          hideCatppuccinCredit
          className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        />
      </div>
    </BubblesSidebarLayout>
  );
}
