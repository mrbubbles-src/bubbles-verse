import { verifyJWT } from '@/lib/auth';
import { getCookie } from '@/lib/cookies';
import { isAuthFallbackEnabled } from '@/lib/runtime-fallbacks';
import { NextResponse } from 'next/server';

export async function GET() {
  if (isAuthFallbackEnabled) {
    // FALLBACK(no-db): No authenticated user can be resolved without secrets.
    return NextResponse.json(null);
  }

  const token = await getCookie('token');
  if (!token) {
    return NextResponse.json(null);
  }

  let user = null;
  try {
    user = await verifyJWT(token);
  } catch {
    return NextResponse.json(null);
  }

  if (!user) {
    return NextResponse.json(null);
  }
  return NextResponse.json({
    username: user.username,
    id: user.id,
    role: user.role,
  });
}
