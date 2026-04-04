import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { i18n } from './i18n-config';

import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

function getLocale(request: NextRequest): string | undefined {
  // Negotiator expects plain object so we need to transform headers
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  // @ts-expect-error locales are readonly
  const locales: string[] = i18n.locales;

  // Use negotiator and intl-localematcher to get best locale
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(
    locales,
  );

  const locale = matchLocale(languages, locales, i18n.defaultLocale);

  return locale;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // `/_next/` and `/api/` are ignored by the watcher, but we need to ignore files in `public` manually.
  // If you have one
  // Ignore known public files
  if (
    [
      '/favicon.ico',
      '/manifest.json',
      '/robots.txt',
      '/sitemap.xml',
      '/sitemap-0.xml',
      '/site.webmanifest',
      '/apple-icon.png',
      '/icon0.svg',
      '/icon1.png',
      '/cv_manuel_fahrenholz_de_download.pdf',
      '/cv_manuel_fahrenholz_de_view.pdf',
      '/cv_manuel_fahrenholz_en_download.pdf',
      '/cv_manuel_fahrenholz_en_view.pdf',
      '/datenschutzerklaerung_www_mrbubbles_src_dev_de.pdf',
      '/impressum_www_mrbubbles_src_dev_de.pdf',
      '/logo-og.png',
      '/logo-og.svg',
      '/logo.svg',
      '/profile.jpeg',
      '/web-app-manifest-192x192.png',
      '/web-app-manifest-512x512.png',
      '/blur/blur-placeholder.jpeg',
      '/screenshots/book-nook.jpeg',
      '/screenshots/placeholder.jpeg',
      '/screenshots/redacted.jpeg',
      '/screenshots/teacherbuddy.png',
      '/screenshots/vet-clinic.png',
      '/srcicon.png',
    ].includes(pathname)
  ) {
    return;
  }

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);

    // e.g. incoming request is /products
    // The new URL is now /en-US/products
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
        request.url,
      ),
    );
  }
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
