'use client';

import { getPageInfoByPath, PAGE_INFOS } from '@/lib/page-info';
import {
  getTeacherBuddyBreadcrumbs,
  teacherBuddySidebarData,
} from '@/lib/sidebar';

import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@bubbles/theme';
import { BubblesSidebarLayout } from '@bubbles/ui/components/bubbles-sidebar-layout';
import { Separator } from '@bubbles/ui/shadcn/separator';

import QuizTimerCard from './play/quiz-timer-card';
import PageInfoDialog from './utility/page-info-dialog';

/**
 * Global app shell that renders the sidebar, header, and page content.
 * Composes the shared sidebar layout with TeacherBuddy-specific page meta,
 * description, and header actions.
 * Provide `defaultSidebarOpen` from server cookie state so refreshes preserve sidebar preference.
 */
export default function AppShell({
  defaultSidebarOpen,
  children,
  footer,
}: {
  defaultSidebarOpen: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentPage = getPageInfoByPath(pathname);
  const meta = currentPage ?? {
    title: 'TeacherBuddy',
    description: '',
  };
  const breadcrumbs = getTeacherBuddyBreadcrumbs(pathname);

  return (
    <BubblesSidebarLayout
      sidebarData={teacherBuddySidebarData}
      breadcrumbs={breadcrumbs}
      defaultOpen={defaultSidebarOpen}
      description={meta.description}
      descriptionAction={
        <PageInfoDialog currentPath={pathname} pages={PAGE_INFOS} />
      }
      mobileHeaderActions={
        <>
          <Separator
            orientation="vertical"
            className="data-vertical:h-8 data-vertical:self-auto"
          />
          <ThemeToggle />
        </>
      }
      headerActions={
        <div className="flex w-full justify-center md:w-auto md:items-center md:gap-5">
          <div className="flex w-full justify-center md:w-auto md:justify-start">
            <QuizTimerCard />
          </div>
          <Separator
            orientation="vertical"
            className="hidden md:block data-vertical:h-8 data-vertical:self-auto"
          />
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      }>
      <main className="container mx-auto h-dvh flex-1 px-4 py-6 md:px-6 lg:px-8">
        {children}
      </main>
      {footer ?? null}
    </BubblesSidebarLayout>
  );
}
