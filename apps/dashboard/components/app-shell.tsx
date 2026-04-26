'use client';

import type { DashboardDraftNavigationItem } from '@/lib/sidebar';
import type { BubblesSidebarUser } from '@bubbles/ui/lib/bubbles-sidebar';
import type { FormEvent } from 'react';

import { getDashboardPageInfoByPath } from '@/lib/page-meta';
import {
  getDashboardBreadcrumbs,
  getDashboardCurrentDraftItem,
  getDashboardSidebarData,
} from '@/lib/sidebar';

import { useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { Footer } from '@bubbles/footer';
import { peekCreateDraft, peekEditDraft } from '@bubbles/markdown-editor';
import { ThemeToggle } from '@bubbles/theme';
import { BubblesAppHeader } from '@bubbles/ui/components/bubbles-app-header';
import { BubblesSidebarLayout } from '@bubbles/ui/components/bubbles-sidebar-layout';
import { HugeiconsIcon, SparklesIcon } from '@bubbles/ui/lib/hugeicons';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@bubbles/ui/shadcn/input-group';
import { Separator } from '@bubbles/ui/shadcn/separator';
import { SidebarTrigger } from '@bubbles/ui/shadcn/sidebar';

const DASHBOARD_CREATE_DRAFT_SCOPE = 'vault-entry:create';
const DASHBOARD_EDIT_DRAFT_SCOPE_PREFIX = 'vault-entry:';
const DASHBOARD_CREATE_DRAFT_UPDATED_EVENT = 'create-draft-updated';
const DASHBOARD_EDIT_DRAFT_UPDATED_EVENT = 'edit-draft-updated';

/**
 * Renders the dashboard landing topbar from the command-center mockup.
 *
 * Use this only on `/` so the dashboard home can center the command input while
 * deeper routes keep breadcrumbs and contextual subtitles.
 */
function DashboardHomeHeader() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim();
    const params = new URLSearchParams();

    if (normalizedQuery) {
      params.set('query', normalizedQuery);
    }

    const nextHref = params.toString()
      ? `/vault/entries?${params.toString()}`
      : '/vault/entries';

    router.push(nextHref);
  };

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-border/35 bg-background/80 shadow-sm shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5 lg:px-7 xl:px-9 2xl:px-10">
        <SidebarTrigger
          size="icon"
          className="-ml-1 size-11 rounded-full [&>svg]:size-6"
        />
        <form
          role="search"
          className="mx-auto w-full max-w-xl"
          onSubmit={handleSearchSubmit}>
          <InputGroup className="min-h-10 rounded-lg border-border/45 bg-background/70 shadow-sm shadow-black/5 dark:bg-background/40 dark:shadow-black/20">
            <InputGroupAddon>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Dashboard suchen oder erstellen"
              placeholder="Suchen oder erstellen"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="text-base"
            />
          </InputGroup>
        </form>
        <ThemeToggle />
      </div>
    </header>
  );
}

/**
 * Reads temporary Vault draft routes from localStorage for sidebar navigation.
 *
 * The shared shell keeps this client-side so editor work can appear in the
 * sidebar without adding server state just for transient draft affordances.
 *
 * @param pathname - Active dashboard pathname used for current-route fallback.
 * @returns Temporary draft items that should appear below `Einträge`.
 */
function getDashboardDraftNavigationItems(
  pathname: string
): DashboardDraftNavigationItem[] {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return [];
  }

  const currentDraft = getDashboardCurrentDraftItem(pathname);
  let createDraftItem: DashboardDraftNavigationItem | null =
    currentDraft?.kind === 'create' ? currentDraft : null;
  let editDraftItem: DashboardDraftNavigationItem | null =
    currentDraft?.kind === 'edit' ? currentDraft : null;
  const activeCreateDraft = peekCreateDraft();
  const activeEditDraft = peekEditDraft();

  if (
    !createDraftItem &&
    activeCreateDraft?.scope === DASHBOARD_CREATE_DRAFT_SCOPE
  ) {
    createDraftItem = {
      key: DASHBOARD_CREATE_DRAFT_SCOPE,
      kind: 'create',
      href: '/vault/entries/new',
      navigateHref: '/vault/entries/new?draft=resume',
    };
  }

  if (
    !editDraftItem &&
    activeEditDraft?.scope?.startsWith(DASHBOARD_EDIT_DRAFT_SCOPE_PREFIX)
  ) {
    const entryId = activeEditDraft.scope.slice(
      DASHBOARD_EDIT_DRAFT_SCOPE_PREFIX.length
    );

    if (!entryId) {
      return [createDraftItem].filter(
        (draft): draft is DashboardDraftNavigationItem => draft !== null
      );
    }

    editDraftItem = {
      key: activeEditDraft.scope,
      kind: 'edit',
      href: `/vault/entries/${entryId}`,
    };
  }

  return [createDraftItem, editDraftItem].filter(
    (draft): draft is DashboardDraftNavigationItem => draft !== null
  );
}

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
  const [draftItems, setDraftItems] = useState<DashboardDraftNavigationItem[]>(
    []
  );
  const pageInfo = getDashboardPageInfoByPath(pathname);
  const breadcrumbs = getDashboardBreadcrumbs(pathname);
  const isDashboardHome = pathname === '/';
  const sidebarData = useMemo(
    () => getDashboardSidebarData(draftItems),
    [draftItems]
  );

  useEffect(() => {
    const syncDraftItems = () => {
      setDraftItems(getDashboardDraftNavigationItems(pathname));
    };

    syncDraftItems();

    window.addEventListener(
      DASHBOARD_CREATE_DRAFT_UPDATED_EVENT,
      syncDraftItems
    );
    window.addEventListener(DASHBOARD_EDIT_DRAFT_UPDATED_EVENT, syncDraftItems);
    window.addEventListener('storage', syncDraftItems);

    return () => {
      window.removeEventListener(
        DASHBOARD_CREATE_DRAFT_UPDATED_EVENT,
        syncDraftItems
      );
      window.removeEventListener(
        DASHBOARD_EDIT_DRAFT_UPDATED_EVENT,
        syncDraftItems
      );
      window.removeEventListener('storage', syncDraftItems);
    };
  }, [pathname]);

  return (
    <BubblesSidebarLayout
      sidebarData={sidebarData}
      user={user}
      classNames={{
        root: 'dashboard-shell-root',
        sidebar:
          'border-sidebar-border/50 bg-sidebar/95 shadow-xl shadow-black/5 dark:shadow-black/20 [&_[data-sidebar=separator]]:hidden',
        sidebarHeader:
          'px-2 pt-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:mx-auto group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:size-10',
        sidebarContent:
          'px-2 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:[&_[data-slot=sidebar-group]]:px-0 group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu]]:items-center group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:mx-auto group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:size-10',
        sidebarFooter:
          'px-2 pb-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu]]:items-center group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:mx-auto group-data-[collapsible=icon]:[&_[data-slot=sidebar-menu-button]]:size-10 group-data-[collapsible=icon]:[&_[data-slot=avatar]]:size-8',
        sidebarInset: 'dashboard-shell-inset',
        content: 'dashboard-shell-content',
      }}
      header={
        isDashboardHome ? (
          <DashboardHomeHeader />
        ) : (
          <BubblesAppHeader
            breadcrumbs={breadcrumbs}
            subtitle={pageInfo.description}
            classNames={{
              root: 'border-b border-border/35 bg-background/80 shadow-sm shadow-black/5 dark:shadow-black/20',
              inner: 'px-4 py-3 sm:px-5 lg:px-7 xl:px-9 2xl:px-10',
              subtitle: 'dashboard-meta',
            }}
            mobileTopActions={<ThemeToggle />}
            actions={
              <div className="hidden items-center gap-4 md:flex">
                <Separator
                  orientation="vertical"
                  className="data-vertical:h-8"
                />
                <ThemeToggle />
              </div>
            }
          />
        )
      }>
      <div className="flex min-h-dvh flex-1 flex-col">
        <main className="dashboard-main">{children}</main>
        <Footer
          author="mrbubbles-src"
          authorHref="https://mrbubbles-src.dev"
          hideCatppuccinCredit
          className="mx-auto w-full max-w-[112rem] px-4 sm:px-5 lg:px-7 xl:px-9 2xl:px-10"
        />
      </div>
    </BubblesSidebarLayout>
  );
}
