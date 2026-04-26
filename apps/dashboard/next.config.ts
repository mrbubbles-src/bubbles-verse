import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  cacheLife: {
    dashboard: {
      stale: 60,
      revalidate: 300,
      expire: 3600,
    },
  },
  transpilePackages: [
    '@bubbles/markdown-editor',
    '@bubbles/markdown-renderer',
    '@bubbles/theme',
    '@bubbles/ui',
  ],
  reactCompiler: true,
};

export default nextConfig;
