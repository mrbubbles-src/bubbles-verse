import type { Metadata } from 'next';

import { ThemeProvider } from '@bubbles/theme';
import { firaCode, montserrat, poppins } from '@bubbles/ui/fonts';
import { Toaster } from '@bubbles/ui/shadcn/sonner';

import '@bubbles/ui/globals.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Bubblophy',
    template: '%s | Bubblophy',
  },
  description:
    'Project-aware issue orchestration for human-guided local agent work.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${montserrat.variable} ${poppins.variable} ${firaCode.variable} antialiased`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
          <Toaster closeButton position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
