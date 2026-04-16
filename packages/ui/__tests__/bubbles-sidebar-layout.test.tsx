import type { ComponentProps } from 'react';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BubblesSidebarData } from '../src/lib/bubbles-sidebar';
import { BubblesSidebarLayout } from '../src/components/bubbles-sidebar-layout';

const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: (
    props: ComponentProps<'img'> & {
      src: string;
      alt: string;
      priority?: boolean;
    }
  ) => {
    const { priority, ...imageProps } = props;

    void priority;

    return <img {...imageProps} />;
  },
}));

const sidebarData: BubblesSidebarData = {
  brand: {
    href: '/',
    compactLogo: {
      src: '/compact-logo.png',
      alt: 'Compact logo',
    },
    fullLogo: {
      src: '/full-logo.png',
      alt: 'Full logo',
    },
  },
  sections: [
    {
      id: 'workspace',
      title: 'Workspace',
      items: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          href: '/',
        },
        {
          id: 'docs',
          title: 'Docs',
          match: 'prefix',
          children: [
            {
              id: 'guides',
              title: 'Guides',
              children: [
                {
                  id: 'intro',
                  title: 'Intro',
                  href: '/docs/guides/intro',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe('BubblesSidebarLayout', () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue('/');
  });

  it('renders the shared header without breadcrumbs', () => {
    render(
      <BubblesSidebarLayout sidebarData={sidebarData}>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    expect(
      document.querySelector('[data-sidebar="trigger"]')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('breadcrumb')).not.toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders breadcrumbs when they are provided', () => {
    render(
      <BubblesSidebarLayout
        sidebarData={sidebarData}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Students' },
        ]}>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    const breadcrumb = screen.getByLabelText('breadcrumb');

    expect(breadcrumb).toBeInTheDocument();
    expect(
      within(breadcrumb).getByRole('link', { name: 'Dashboard' })
    ).toBeInTheDocument();
    expect(screen.getByText('Students')).toHaveClass('text-primary');
  });

  it('renders description and custom header actions in the sticky header', () => {
    render(
      <BubblesSidebarLayout
        sidebarData={sidebarData}
        breadcrumbs={[{ label: 'Dashboard' }]}
        description="Choose a workflow to get started."
        descriptionAction={<button type="button">Open page info</button>}
        headerActions={
          <>
            <button type="button">Theme</button>
            <button type="button">Timer</button>
          </>
        }>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    const header = document.querySelector('header');

    expect(header).toHaveClass('sticky');
    expect(
      screen.getByText('Choose a workflow to get started.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open page info' })
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Theme' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Timer' })).toBeVisible();
  });

  it('auto-expands recursive groups for an active descendant', () => {
    usePathnameMock.mockReturnValue('/docs/guides/intro');

    render(
      <BubblesSidebarLayout sidebarData={sidebarData}>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    expect(screen.getByRole('link', { name: 'Intro' })).toBeVisible();
  });

  it('supports prefix route matching for parent items', () => {
    usePathnameMock.mockReturnValue('/docs/guides/intro');

    render(
      <BubblesSidebarLayout sidebarData={sidebarData}>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    expect(screen.getByRole('button', { name: /^docs$/i })).toHaveAttribute(
      'data-active'
    );
  });

  it('does not render the user footer menu without a user', () => {
    render(
      <BubblesSidebarLayout sidebarData={sidebarData}>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Accounteinstellungen')).not.toBeInTheDocument();
  });

  it('renders the user footer menu and its entries', async () => {
    const user = userEvent.setup();

    render(
      <BubblesSidebarLayout
        sidebarData={sidebarData}
        user={{
          name: 'Jane Doe',
          email: 'jane@example.com',
          dashboardHref: '/dashboard',
          settingsHref: '/settings',
          logoutHref: '/logout',
        }}>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    await user.click(screen.getByRole('button', { name: /jane doe/i }));

    expect(await screen.findByText('Accounteinstellungen')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(1);
  });
});
