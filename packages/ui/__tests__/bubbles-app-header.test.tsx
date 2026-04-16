import type { ComponentProps, ReactNode } from 'react';

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BubblesAppHeader } from '../src/components/bubbles-sidebar/bubbles-app-header';
import { SidebarProvider } from '../src/components/shadcn/sidebar';

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

function renderHeader(component: ReactNode) {
  return render(<SidebarProvider>{component}</SidebarProvider>);
}

describe('BubblesAppHeader', () => {
  it('renders breadcrumbs, subtitle, and subtitle action', () => {
    renderHeader(
      <BubblesAppHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Students' }]}
        subtitle="Choose a workflow to get started."
        subtitleAction={<button type="button">Open page info</button>}
      />
    );

    const breadcrumb = screen.getByLabelText('breadcrumb');

    expect(
      document.querySelector('[data-sidebar="trigger"]')
    ).toBeInTheDocument();
    expect(
      within(breadcrumb).getByRole('link', { name: 'Dashboard' })
    ).toBeInTheDocument();
    expect(screen.getByText('Students')).toHaveClass('text-primary');
    expect(
      screen.getByText('Choose a workflow to get started.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open page info' })
    ).toBeVisible();
  });

  it('renders injected mobile top actions and shared actions', () => {
    renderHeader(
      <BubblesAppHeader
        mobileTopActions={<button type="button">Theme</button>}
        actions={<button type="button">Timer</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Timer' })).toHaveLength(2);
  });

  it('merges header class name hooks onto the expected wrappers', () => {
    renderHeader(
      <BubblesAppHeader
        actions={<button type="button">Timer</button>}
        mobileTopActions={<button type="button">Theme</button>}
        classNames={{
          root: 'header-root',
          inner: 'header-inner',
          leading: 'header-leading',
          triggerGroup: 'header-trigger-group',
          meta: 'header-meta',
          subtitleRow: 'header-subtitle-row',
          subtitle: 'header-subtitle',
          subtitleAction: 'header-subtitle-action',
          mobileTopActions: 'header-mobile-top-actions',
          actions: 'header-actions',
        }}
        subtitle={<span>Subtitle</span>}
        subtitleAction={<button type="button">Info</button>}
      />
    );

    expect(document.querySelector('.header-root')).toBeInTheDocument();
    expect(document.querySelector('.header-inner')).toBeInTheDocument();
    expect(document.querySelector('.header-leading')).toBeInTheDocument();
    expect(document.querySelector('.header-trigger-group')).toBeInTheDocument();
    expect(document.querySelector('.header-meta')).toBeInTheDocument();
    expect(document.querySelector('.header-subtitle-row')).toBeInTheDocument();
    expect(document.querySelector('.header-subtitle')).toBeInTheDocument();
    expect(
      document.querySelector('.header-subtitle-action')
    ).toBeInTheDocument();
    expect(
      document.querySelector('.header-mobile-top-actions')
    ).toBeInTheDocument();
    expect(document.querySelector('.header-actions')).toBeInTheDocument();
  });
});
