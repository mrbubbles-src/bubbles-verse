import { Fira_Code, Montserrat, Poppins } from 'next/font/google';

/**
 * Shared heading font for apps consuming `@bubbles/ui`.
 * Apply `montserrat.variable` on the root element to expose `--font-heading`.
 */
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'sans-serif',
  ],
});

/**
 * Shared body font for apps consuming `@bubbles/ui`.
 * Apply `poppins.variable` on the root element to expose `--font-body`.
 */
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'sans-serif',
  ],
});

/**
 * Shared monospace font for code and technical UI.
 * Apply `firaCode.variable` on the root element to expose `--font-code`.
 */
export const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-code',
  display: 'swap',
  fallback: [
    'ui-monospace',
    'Cascadia Code',
    'Source Code Pro',
    'Menlo',
    'Consolas',
    'monospace',
  ],
});
