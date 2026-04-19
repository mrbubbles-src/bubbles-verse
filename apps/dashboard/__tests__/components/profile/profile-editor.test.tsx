import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileEditor } from '@/components/profile/profile-editor';

describe('ProfileEditor', () => {
  it('renders the profile view first and switches into edit mode on demand', async () => {
    render(
      <ProfileEditor
        model={{
          profile: {
            id: 'profile-id',
            authUserId: 'auth-user-id',
            displayName: 'Manuel Fahrenholz',
            slug: 'manuel-fahrenholz',
            email: 'manuel.fahrenholz@mrbubbles-src.dev',
            avatarUrl: 'https://res.cloudinary.com/example/image.png',
            bio: 'Builder',
            role: 'owner',
            createdAt: '2026-04-18T00:00:00.000Z',
            updatedAt: '2026-04-18T00:00:00.000Z',
          },
          socialLinks: {
            website: 'https://mrbubbles-src.dev',
            github: 'https://github.com/mrbubbles-src',
            linkedin: '',
            twitter: '',
          },
        }}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Autorenprofil' })
    ).toBeInTheDocument();
    expect(screen.getByText('Builder')).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Anzeigename' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('@mrbubbles-src')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));

    expect(screen.getByRole('textbox', { name: 'Anzeigename' })).toHaveValue(
      'Manuel Fahrenholz'
    );
    expect(
      screen.getByRole('button', { name: 'Speichern' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(
      screen.queryByRole('textbox', { name: 'Anzeigename' })
    ).not.toBeInTheDocument();
  });
});
