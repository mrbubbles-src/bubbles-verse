import type { ReactNode } from 'react';

type TestSidebarItem = {
  id: string;
  title: string;
  href?: string;
  navigateHref?: string;
};

type TestSidebarData = {
  sections: {
    id: string;
    items: TestSidebarItem[];
  }[];
};

/**
 * Renders a shared-sidebar layout test double.
 *
 * The double keeps header actions and sidebar links visible while avoiding the
 * real Next/sidebar provider stack in Vitest.
 *
 * @param props Sidebar data, optional header, and page children.
 * @returns Test-safe layout markup.
 */
export function BubblesSidebarLayout({
  children,
  header,
  sidebarData,
}: {
  children: ReactNode;
  header?: ReactNode;
  sidebarData: TestSidebarData;
}) {
  return (
    <div>
      <nav aria-label="Bubblophy Navigation">
        {sidebarData.sections.flatMap((section) =>
          section.items.map((item) => (
            <a
              key={`${section.id}-${item.id}`}
              href={item.navigateHref ?? item.href}>
              {item.title}
            </a>
          ))
        )}
      </nav>
      {header}
      {children}
    </div>
  );
}
