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
 * Renders the central home work area with the two editorial queue views.
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
    <section className="dashboard-studio-panel flex flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6 lg:px-7">
      <Tabs defaultValue="drafts" className="gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dashboard-kicker">Weiterarbeiten</p>
            <h2 className="dashboard-section-title mt-2">Weiterschreiben</h2>
          </div>

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
