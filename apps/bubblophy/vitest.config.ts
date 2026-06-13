import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@bubbles/ui/components/bubbles-app-header': path.resolve(
        __dirname,
        './__tests__/mocks/bubbles-app-header.tsx'
      ),
      '@bubbles/ui/components/bubbles-sidebar-layout': path.resolve(
        __dirname,
        './__tests__/mocks/bubbles-sidebar-layout.tsx'
      ),
      '@bubbles/ui/lib/hugeicons': path.resolve(
        __dirname,
        './__tests__/mocks/hugeicons.tsx'
      ),
      'server-only': path.resolve(
        __dirname,
        './__tests__/mocks/server-only.ts'
      ),
    },
  },
});
