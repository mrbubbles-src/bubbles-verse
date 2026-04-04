import { eq } from 'drizzle-orm';
import { users } from '@/drizzle/db/schema';
import bcrypt from 'bcryptjs';
import { isDatabaseFallbackEnabled } from '@/lib/runtime-fallbacks';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (isDatabaseFallbackEnabled) {
    // FALLBACK(no-db): Registration stays unavailable until the DB is wired up.
    return NextResponse.json(
      { msg: 'Registrierung ist im Monorepo-Fallback aktuell deaktiviert.' },
      { status: 503, statusText: 'Service Unavailable' }
    );
  }

  const { db } = await import('@/drizzle/db');
  const body = await req.json();
  const { username, email, password, role } = body;

  const [usernameTaken] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  const [emailTaken] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (usernameTaken)
    return NextResponse.json(
      { msg: 'Der Username ist bereits vergeben.' },
      {
        status: 400,
        statusText: 'Bad Request',
      },
    );

  if (emailTaken)
    return NextResponse.json(
      { msg: 'Die E-Mail ist bereits registriert.' },
      {
        status: 400,
        statusText: 'Bad Request',
      },
    );
  try {
    const hashedPw = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      username,
      password: hashedPw,
      email,
      role,
    });
    return NextResponse.json(
      { msg: 'Neuer User erstellt.' },
      { status: 201, statusText: 'Created' },
    );
  } catch (error) {
    return NextResponse.json(
      {
        msg: 'Fehler beim erstellen des neuen Users.',
        error,
      },
      { status: 422, statusText: 'Unprocessable Content' },
    );
  }
}
