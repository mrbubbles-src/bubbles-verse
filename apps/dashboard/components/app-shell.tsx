'use client';

import type { DashboardDraftNavigationItem } from '@/lib/sidebar';
import type { BubblesSidebarUser } from '@bubbles/ui/lib/bubbles-sidebar';

import { getDashboardPageInfoByPath } from '@/lib/page-meta';
import {
  getDashboardBreadcrumbs,
  getDashboardCurrentDraftItem,
  getDashboardSidebarData,
} from '@/lib/sidebar';

import { useEffect, useMemo, useState } from 'react';

import { usePathname } from 'next/navigation';

import { Footer } from '@bubbles/footer';
import { ThemeToggle } from '@bubbles/theme';
import { BubblesAppHeader } from '@bubbles/ui/components/bubbles-app-header';
import { BubblesSidebarLayout } from '@bubbles/ui/components/bubbles-sidebar-layout';
import { Separator } from '@bubbles/ui/shadcn/separator';

const DASHBOARD_CREATE_DRAFT_SCOPE = 'vault-entry:create';
const DASHBOARD_EDIT_DRAFT_SCOPE_PREFIX = 'vault-entry:';
const DASHBOARD_CREATE_DRAFT_STORAGE_KEY = 'topic-editor-create-draft';
const DASHBOARD_EDIT_DRAFT_STORAGE_KEY = 'topic-editor-edit-draft';
const DASHBOARD_CREATE_DRAFT_UPDATED_EVENT = 'create-draft-updated';
const DASHBOARD_EDIT_DRAFT_UPDATED_EVENT = 'edit-draft-updated';

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

  const createDraftKey = `${DASHBOARD_CREATE_DRAFT_STORAGE_KEY}:${DASHBOARD_CREATE_DRAFT_SCOPE}`;

  if (!createDraftItem && window.localStorage.getItem(createDraftKey)) {
    createDraftItem = {
      key: createDraftKey,
      kind: 'create',
      href: '/vault/entries/new',
    };
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    if (editDraftItem) {
      break;
    }

    const storageKey = window.localStorage.key(index);

    if (
      !storageKey?.startsWith(
        `${DASHBOARD_EDIT_DRAFT_STORAGE_KEY}:${DASHBOARD_EDIT_DRAFT_SCOPE_PREFIX}`
      )
    ) {
      continue;
    }

    const entryId = storageKey.slice(
      `${DASHBOARD_EDIT_DRAFT_STORAGE_KEY}:${DASHBOARD_EDIT_DRAFT_SCOPE_PREFIX}`
        .length
    );

    if (!entryId) {
      continue;
    }

    const href = `/vault/entries/${entryId}` as const;

    editDraftItem = {
      key: storageKey,
      kind: 'edit',
      href,
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
      header={
        <BubblesAppHeader
          breadcrumbs={breadcrumbs}
          subtitle={pageInfo.description}
          mobileTopActions={<ThemeToggle />}
          actions={
            <div className="hidden items-center gap-4 md:flex">
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
        <main className="flex w-full flex-1 flex-col px-5 py-6 sm:px-6 sm:py-7 xl:px-8 2xl:px-10">
          {children}
        </main>
        <Footer
          author="mrbubbles-src"
          authorHref="https://mrbubbles-src.dev"
          hideCatppuccinCredit
          className="w-full px-5 sm:px-6 xl:px-8 2xl:px-10"
        />
      </div>
    </BubblesSidebarLayout>
  );
}
