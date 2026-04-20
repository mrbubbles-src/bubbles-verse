import type { DashboardHomeRecentItem } from '@/lib/dashboard/home';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@bubbles/ui/shadcn/tabs';

import { RecentContentList } from '@/components/home/recent-content-list';

type HomeWorkAreaProps = {
  recentDrafts: DashboardHomeRecentItem[];
  recentUpdates: DashboardHomeRecentItem[];
};

/**
 * Renders the central home work area with the two agreed queue views.
 *
 * Use this as the primary dashboard surface so people land on work first and
 * can switch between drafts and recent updates without another page hop.
 *
 * @param props Current draft and update items for the home work queues.
 * @returns Tabbed work area for the dashboard landing page.
 */
export function HomeWorkArea({
  recentDrafts,
  recentUpdates,
}: HomeWorkAreaProps) {
  return (
    <section className="flex flex-col gap-5 rounded-[2rem] bg-background/80 px-5 py-5 shadow-sm shadow-black/5 sm:px-7 sm:py-6">
      <Tabs defaultValue="drafts" className="gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Weiterschreiben
          </h2>

          <TabsList
            variant="line"
            aria-label="Home Arbeitslisten"
            className="h-auto w-full justify-start gap-5 p-0 sm:w-auto">
            <TabsTrigger value="drafts" className="px-0 py-2 text-base">
              Offene Entwürfe
            </TabsTrigger>
            <TabsTrigger value="updates" className="px-0 py-2 text-base">
              Zuletzt bearbeitet
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="drafts" className="mt-0">
          <RecentContentList
            items={recentDrafts}
            emptyState="Gerade liegen keine offenen Entwürfe an."
          />
        </TabsContent>

        <TabsContent value="updates" className="mt-0">
          <RecentContentList
            items={recentUpdates}
            emptyState="Sobald du Inhalte bearbeitest, tauchen sie hier auf."
            showStatus
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
