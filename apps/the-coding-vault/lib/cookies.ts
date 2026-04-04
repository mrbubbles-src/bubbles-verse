'use server';

import { cookies } from 'next/headers';

const createCookie = async (token?: string, theme?: string): Promise<void> => {
  const cookie = await cookies();

  if (token) {
    cookie.set('token', token, {
      httpOnly: true,
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
  }

  if (theme) {
    cookie.set('theme', theme, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }
};
const getCookie = async (cookieName: string): Promise<string | undefined> => {
  const cookie = await cookies();
  const cookieResponse = cookie.get(cookieName);
  return cookieResponse?.value;
};

export { createCookie, getCookie };
