import type React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BubblophyInvitationAcceptanceCard } from '@/app/invitations/accept/invitation-acceptance-card';
import { BubblophyInvitationAcceptanceGate } from '@/app/invitations/accept/page';

const acceptInvitationActionMock = vi.fn();
const requireAuthenticatedBubblophyUserMock = vi.fn();
const getCookieMock = vi.fn();

vi.mock('@/app/actions', () => ({
  acceptBubblophyProjectInvitationAction: () => acceptInvitationActionMock(),
}));

vi.mock('@/lib/auth/session', () => ({
  requireAuthenticatedBubblophyUser: () =>
    requireAuthenticatedBubblophyUserMock(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: getCookieMock })),
}));

vi.mock('next/server', () => ({
  connection: vi.fn(async () => undefined),
}));

vi.mock('@bubbles/ui/shadcn/button', () => ({
  Button: (
    input: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: string }
  ) => {
    const { children, size, ...props } = input;
    void size;

    return (
      <button type="button" {...props}>
        {children}
      </button>
    );
  },
  buttonVariants: () => 'button-link',
}));

const token = `bubblophy_invite_${'a'.repeat(43)}`;

beforeEach(() => {
  acceptInvitationActionMock.mockReset();
  requireAuthenticatedBubblophyUserMock.mockReset();
  getCookieMock.mockReset();
  requireAuthenticatedBubblophyUserMock.mockResolvedValue({
    id: 'user_martin',
    email: 'martin@example.test',
  });
  getCookieMock.mockReturnValue({ value: token });
});

describe('/invitations/accept', () => {
  it('renders the verified account without exposing the staged token', async () => {
    const page = await BubblophyInvitationAcceptanceGate({
      searchParams: Promise.resolve({}),
    });
    const { container } = render(page);

    expect(requireAuthenticatedBubblophyUserMock).toHaveBeenCalledWith();
    expect(screen.getByText('martin@example.test')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Einladung annehmen' })
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(token);
  });

  it('fails closed for a malformed public link even if a cookie exists', async () => {
    const page = await BubblophyInvitationAcceptanceGate({
      searchParams: Promise.resolve({ error: 'invalid_link' }),
    });
    render(page);

    expect(
      screen.getByRole('heading', { name: 'Einladung nicht verfügbar' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Einladung annehmen' })
    ).not.toBeInTheDocument();
  });

  it('shows the project only after successful server-side acceptance', async () => {
    const action = vi.fn(async () => ({
      status: 'accepted' as const,
      projectKey: 'BV',
      role: 'member' as const,
      membershipCreated: true,
    }));
    render(
      <BubblophyInvitationAcceptanceCard
        acceptInvitationAction={action}
        email="martin@example.test"
        hasToken
        invalidLink={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Einladung annehmen' }));

    expect(
      await screen.findByRole('heading', { name: 'Einladung angenommen' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Einladung angenommen'
    );
    expect(screen.getByText(/Projekt BV/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zum Dashboard' })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('keeps a mismatched invitation available for an account switch', async () => {
    const action = vi.fn(async () => ({ status: 'email_mismatch' as const }));
    render(
      <BubblophyInvitationAcceptanceCard
        acceptInvitationAction={action}
        email="wrong@example.test"
        hasToken
        invalidLink={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Einladung annehmen' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Anderes Konto erforderlich' })
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: 'Anderes Konto verwenden' })
    ).toHaveAttribute('href', '/auth/logout?next=%2Finvitations%2Faccept');
  });

  it('offers an account switch when the current identity has no email', async () => {
    const action = vi.fn(async () => ({
      status: 'invalid' as const,
      reason: 'missing_email' as const,
    }));
    render(
      <BubblophyInvitationAcceptanceCard
        acceptInvitationAction={action}
        email="E-Mail-Adresse nicht verfügbar"
        hasToken
        invalidLink={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Einladung annehmen' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Anderes Konto erforderlich',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Dieses Konto besitzt keine bestätigte E-Mail-Adresse.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Anderes Konto verwenden' })
    ).toBeInTheDocument();
  });

  it('offers a retry after a transient persistence failure', async () => {
    const action = vi.fn(async () => ({
      status: 'database_unavailable' as const,
    }));
    render(
      <BubblophyInvitationAcceptanceCard
        acceptInvitationAction={action}
        email="martin@example.test"
        hasToken
        invalidLink={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Einladung annehmen' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Bitte versuche es erneut'
    );
    expect(
      screen.getByRole('button', { name: 'Einladung annehmen' })
    ).toBeEnabled();
  });
});
