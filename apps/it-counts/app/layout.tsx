import type { Metadata } from 'next';

import './it-counts.css';

import { ThemeProvider } from '@bubbles/theme';
import { firaCode, montserrat, poppins } from '@bubbles/ui/fonts';
import { StoreHydrator } from '@/components/shared/store-hydrator';

export const metadata: Metadata = {
  title: 'It Counts',
  description:
    'Monorepo-aligned Next.js app scaffold for the It Counts habit tracking experience.',
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
          <StoreHydrator />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
