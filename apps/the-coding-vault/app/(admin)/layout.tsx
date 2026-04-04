import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Fira_Code, Fira_Mono, Montserrat, Poppins } from 'next/font/google';
import { SidebarProvider } from '@bubbles/ui/shadcn/sidebar';
import { Toaster } from '@bubbles/ui/shadcn/sonner';
import { ThemeProvider } from '@/context/theme-provider';
import AdminSidebar from '@/components/layout/admin/sidebar/admin-sidebar';
import Navbar from '@/components/layout/general/navbar';
import Footer from '@/components/layout/general/footer';
import '@bubbles/ui/globals.css';
import '@/app/globals.css';

export const dynamic = 'force-dynamic';

const firaCode = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});
const firaCodeMono = Fira_Mono({
  variable: '--font-fira-code-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ),
  title: 'The Coding Vault',
  description: 'Work in progress. Stay tuned.',
  openGraph: {
    title: 'The Coding Vault',
    description: 'Work in progress. Stay tuned.',
    images: [
      {
        url: '/images/homelogo.svg',
        width: 600,
        height: 600,
        alt: 'The Coding Vault Hero',
      },
    ],
    type: 'website',
    locale: 'de_DE',
  },
  other: {
    'apple-mobile-web-app-title': 'The Coding Vault',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${firaCode.variable} ${firaCodeMono.variable} ${montserrat.variable} ${poppins.variable} flex min-h-screen flex-col scroll-smooth antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AdminSidebar />
            <div className="flex w-full flex-col px-2 py-2 md:px-0 md:pr-2">
              <Navbar />
              <main className="flex flex-1 flex-col px-1 pt-2 md:px-0">
                {children}
              </main>
              <Footer />
            </div>
          </SidebarProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
