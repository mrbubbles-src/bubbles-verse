import type { Metadata } from 'next';

import { ThemeProvider } from '@bubbles/theme';
import { firaCode, montserrat, poppins } from '@bubbles/ui/fonts';
import { Toaster } from '@bubbles/ui/shadcn/sonner';

import '@bubbles/ui/globals.css';
import './dashboard.css';

export const metadata: Metadata = {
  title: 'Dashboard | Bubbles Verse',
  description: 'Shared dashboard app scaffold for the Bubbles Verse monorepo.',
};

/**
 * Provides the shared document shell for the dashboard app.
 *
 * Use this layout for all routes under `app/`. It applies shared fonts, global
 * styles, theming, and toast support before rendering the active page.
 *
 * @param children Active route content rendered inside the app shell.
 * @returns The root HTML document for the dashboard app.
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
          {children}
          <Toaster closeButton position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
