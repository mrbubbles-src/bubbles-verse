import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './lib/auth';
import { getCookie } from './lib/cookies';

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/admin/login')) {
    const token = await getCookie('token');
    if (token) {
      const user = await verifyJWT(token);
      if (user)
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    } else return NextResponse.next();
  }

  const token = await getCookie('token');
  if (token) {
    const user = await verifyJWT(token);
    if (!user) return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
