import type { Metadata } from 'next';

import './it-counts.css';

import { Footer } from '@bubbles/footer';
import { ThemeProvider } from '@bubbles/theme';
import { firaCode, montserrat, poppins } from '@bubbles/ui/fonts';

import { BottomNav } from '@/components/global/bottom-nav';
import Header from '@/components/global/header';
import { LogEntrySheet } from '@/components/logging/log-entry-sheet';
import { ServiceWorkerRegistration } from '@/components/shared/service-worker-registration';
import { StoreHydrator } from '@/components/shared/store-hydrator';
import { FOOTER_LINKS } from '@/constants/footer-links';

export const metadata: Metadata = {
  title: {
    default: 'It Counts',
    template: '%s · It Counts',
  },
  description:
    'Track your movement and watch your level grow — one walk at a time.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://it-counts.mrbubbles-src.dev'
  ),
  openGraph: {
    siteName: 'It Counts',
    title: 'It Counts',
    description:
      'Track your movement and watch your level grow — one walk at a time.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'It Counts — walk, log, level up',
      },
    ],
    type: 'website',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og'],
    creator: '@_MstrBubbles',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon1.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'It Counts',
  },
};

/**
 * Provides the shared document shell for the It Counts app.
 * Imports global and app-local styles, applies shared font variables, and wraps
 * all routes with the shared theme provider.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en_GB"
      suppressHydrationWarning
      className={`${montserrat.variable} ${poppins.variable} ${firaCode.variable} antialiased`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="It Counts" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ServiceWorkerRegistration />
          <StoreHydrator />
          <div className="flex min-h-svh flex-col bg-background">
            <Header />
            {children}
            <BottomNav />
            <Footer links={FOOTER_LINKS} className="w-full max-w-md mx-auto" />
            <LogEntrySheet />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
