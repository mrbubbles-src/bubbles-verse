import {
  parseUpdateDashboardProfile,
  slugifyDashboardProfile,
} from '@/lib/profile/profile';
import {
  getDashboardProfileFeedbackHref,
  getDashboardProfileFeedbackMessage,
} from '@/lib/profile/profile-feedback';

import { describe, expect, it } from 'vitest';

describe('dashboard profile helpers', () => {
  it('slugifies and normalizes profile payloads', () => {
    const formData = new FormData();
    formData.set('displayName', '  Manuel Fahrenholz  ');
    formData.set('avatarUrl', 'https://res.cloudinary.com/example/image.png');
    formData.set('bio', '  Building bubbles.  ');
    formData.set('websiteUrl', 'https://mrbubbles-src.dev');
    formData.set('githubUrl', 'https://github.com/mrbubbles-src');
    formData.set('linkedinUrl', '');
    formData.set('twitterUrl', '');

    const parsedProfile = parseUpdateDashboardProfile(formData);

    expect(slugifyDashboardProfile('Manuel Fahrenholz')).toBe(
      'manuel-fahrenholz'
    );
    expect(parsedProfile.success).toBe(true);

    if (!parsedProfile.success) {
      throw new Error('Expected the payload to parse successfully.');
    }

    expect(parsedProfile.data).toMatchObject({
      displayName: 'Manuel Fahrenholz',
      bio: 'Building bubbles.',
      websiteUrl: 'https://mrbubbles-src.dev',
      githubUrl: 'https://github.com/mrbubbles-src',
      linkedinUrl: null,
      twitterUrl: null,
    });
  });

  it('maps supported profile feedback codes to user-facing copy', () => {
    expect(getDashboardProfileFeedbackMessage('?profile=updated')).toBe(
      'Profil aktualisiert.'
    );
    expect(getDashboardProfileFeedbackMessage('?profile=missing')).toBeNull();
    expect(getDashboardProfileFeedbackHref('duplicate')).toBe(
      '/profile?profile=duplicate'
    );
  });
});
