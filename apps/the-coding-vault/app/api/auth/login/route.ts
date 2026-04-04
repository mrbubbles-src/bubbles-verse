import { users } from '@/drizzle/db/schema';
import { eq } from 'drizzle-orm';
import { createJWT } from '@/lib/auth';
import {
  isAuthFallbackEnabled,
  isDatabaseFallbackEnabled,
} from '@/lib/runtime-fallbacks';
// import { createCookie } from '@/lib/cookies';

import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (isDatabaseFallbackEnabled || isAuthFallbackEnabled) {
    // FALLBACK(no-db): Disable login until DB + JWT secrets are available.
    return NextResponse.json(
      { msg: 'Login ist im Monorepo-Fallback aktuell deaktiviert.' },
      { status: 503, statusText: 'Service Unavailable' }
    );
  }

  const body = await req.json();
  const { username, password } = body;
  console.log('~ route.ts:13 ~ POST ~ password:', password);
  console.log('~ route.ts:13 ~ POST ~ username:', username);
  console.log('~ route.ts:13 ~ POST ~ body:', body);

  try {
    const { db } = await import('@/drizzle/db');
    console.log('fetch arrived in login route at ', new Date().toISOString());
    const currentUserRows = (await db.execute('SELECT current_user;')) as Array<{
      current_user?: string;
    }>;
    const current_user = currentUserRows[0]?.current_user ?? 'unknown';
    console.log('Aktueller DB-User:', current_user);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    console.log('Gefundener Benutzer:', user);
    if (!user)
      return NextResponse.json(
        { msg: 'Benutzername konnte nicht gefunden werden.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    const validatePassword = await bcrypt.compare(password, user.password);

    console.log('~ route.ts:29 ~ POST ~ validatePassword:', validatePassword);

    if (!validatePassword)
      return NextResponse.json(
        { msg: 'Das eingegebene Passwort ist nicht korrekt.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    const token = await createJWT({
      id: user.id,
      username: user.username,
      role: user.role,
    });
    console.log('JWT-Token erstellt:', token);

    const response = NextResponse.redirect(
      new URL('/admin/dashboard', req.url),
    );
    console.log('~ route.ts:46 ~ POST ~ response:', response);

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 Tage
    });
    console.log('~ route.ts:57 ~ POST ~ response w cookie:', response);
    console.log('login route completed at ', new Date().toISOString());
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        msg: 'Login fehlgeschlagen!',
        error,
      },
      { status: 401, statusText: 'Unauthorized' },
    );
  }
}
