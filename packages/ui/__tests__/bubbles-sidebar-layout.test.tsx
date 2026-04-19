import type { ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BubblesSidebarData } from '../src/lib/bubbles-sidebar';
import { BubblesSidebarLayout } from '../src/components/bubbles-sidebar/bubbles-sidebar-layout';

const usePathnameMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({
    push: pushMock,
  }),
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
    pushMock.mockReset();
  });

  it('renders the layout shell without an injected header', () => {
    render(
      <BubblesSidebarLayout sidebarData={sidebarData}>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    expect(
      document.querySelector('[data-sidebar="trigger"]')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders an injected header node above the content', () => {
    render(
      <BubblesSidebarLayout
        sidebarData={sidebarData}
        header={<header>Header</header>}>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
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
    expect(
      screen.queryByText('Autorenprofil bearbeiten')
    ).not.toBeInTheDocument();
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

    expect(
      await screen.findByText('Autorenprofil bearbeiten')
    ).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(1);
  });

  it('merges layout class name hooks onto the expected shell wrappers', () => {
    render(
      <BubblesSidebarLayout
        sidebarData={sidebarData}
        classNames={{
          root: 'layout-root',
          sidebar: 'layout-sidebar',
          sidebarHeader: 'layout-sidebar-header',
          sidebarContent: 'layout-sidebar-content',
          sidebarInset: 'layout-sidebar-inset',
          content: 'layout-content',
        }}>
        <div>Body content</div>
      </BubblesSidebarLayout>
    );

    expect(document.querySelector('.layout-root')).toBeInTheDocument();
    expect(document.querySelector('.layout-sidebar')).toBeInTheDocument();
    expect(
      document.querySelector('.layout-sidebar-header')
    ).toBeInTheDocument();
    expect(
      document.querySelector('.layout-sidebar-content')
    ).toBeInTheDocument();
    expect(document.querySelector('.layout-sidebar-inset')).toBeInTheDocument();
    expect(document.querySelector('.layout-content')).toBeInTheDocument();
  });
});
