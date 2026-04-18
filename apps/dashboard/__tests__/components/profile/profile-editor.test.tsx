import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileEditor } from '@/components/profile/profile-editor';

describe('ProfileEditor', () => {
  it('renders editable profile fields and current identity info', () => {
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
          role: 'owner',
          githubUsername: 'mrbubbles-src',
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
      screen.getByRole('textbox', { name: 'Anzeigename' })
    ).toHaveValue('Manuel Fahrenholz');
    expect(screen.getByText('@mrbubbles-src')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Profil speichern' })
    ).toBeInTheDocument();
  });
});
