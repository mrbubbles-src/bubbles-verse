import type { Metadata } from 'next';

import './it-counts.css';

import { ThemeProvider } from '@bubbles/theme';
import { firaCode, montserrat, poppins } from '@bubbles/ui/fonts';
import { ServiceWorkerRegistration } from '@/components/shared/service-worker-registration';
import { StoreHydrator } from '@/components/shared/store-hydrator';

export const metadata: Metadata = {
  title: {
    default: 'It Counts',
    template: '%s · It Counts',
  },
  description: 'Track your movement and watch your level grow — one walk at a time.',
  metadataBase: new URL('https://it-counts.vercel.app'),
  openGraph: {
    title: 'It Counts',
    description: 'Track your movement and watch your level grow — one walk at a time.',
    type: 'website',
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
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
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${poppins.variable} ${firaCode.variable} antialiased`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ServiceWorkerRegistration />
          <StoreHydrator />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
