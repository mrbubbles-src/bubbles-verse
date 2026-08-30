import { bubblophySidebarData, getBubblophyBreadcrumbs } from '@/lib/sidebar';

import { describe, expect, it } from 'vitest';

describe('bubblophy sidebar', () => {
  it('uses real dashboard section anchors instead of dead links', () => {
    const hrefs = bubblophySidebarData.sections.flatMap((section) =>
      section.items.map((item) => item.href)
    );

    expect(hrefs).toEqual([
      '/',
      '/#projects',
      '/#issues',
      '/#notifications',
      '/#agents',
      '/#runs',
      '/#activity',
    ]);
    expect(hrefs).not.toContain('#');
  });

  it('exposes stable breadcrumbs for the shared app header', () => {
    expect(getBubblophyBreadcrumbs()).toEqual([
      { label: 'Bubblophy' },
      { label: 'Dashboard' },
    ]);
  });
});
