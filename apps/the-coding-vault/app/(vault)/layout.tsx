import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Fira_Code, Fira_Mono, Montserrat, Poppins } from 'next/font/google';
import { SidebarProvider } from '@bubbles/ui/shadcn/sidebar';
import { Toaster } from '@bubbles/ui/shadcn/sonner';
import { ThemeProvider } from '@/context/theme-provider';
import VaultSidebar from '@/components/layout/vault/sidebar/vault-sidebar';
import Navbar from '@/components/layout/general/navbar';
import Footer from '@/components/layout/general/footer';
import '@bubbles/ui/globals.css';
import '@/app/globals.css';
import { ICategories } from '@/types/types';
import { getCachedCategories } from '@/lib/cache';

export const dynamic = 'force-static';
export const revalidate = 3600;

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
  description: 'Ein Ort für alle deine Coding-Fragen!',
  openGraph: {
    title: 'The Coding Vault',
    description: 'Ein Ort für alle deine Coding-Fragen!',
    images: [
      {
        url: 'https://thecodingvault.mrbubbles-src.dev/api/og',
        width: 1200,
        height: 630,
        alt: 'The Coding Vault Logo',
      },
    ],
    type: 'website',
    locale: 'de_DE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Coding Vault',
    description: 'Ein Ort für alle deine Coding-Fragen!',
    images: ['https://thecodingvault.mrbubbles-src.dev/api/og'],
    creator: '@_MstrBubbles',
  },
  other: { 'apple-mobile-web-app-title': 'thecodingvault.mrbubbles-src.dev' },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  const categories: Array<ICategories> = await getCachedCategories();
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
            <VaultSidebar categories={categories} />
            <div className="flex w-full flex-col px-2 py-2 md:px-0 md:pr-2">
              <Navbar />
              <main className="flex w-full flex-1 flex-col place-self-center px-1 pt-2 md:px-0">
                {children}
                <Toaster position="top-right" richColors />
              </main>
              <Footer />
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
