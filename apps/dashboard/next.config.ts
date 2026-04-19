import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    '@bubbles/markdown-editor',
    '@bubbles/markdown-renderer',
    '@bubbles/theme',
    '@bubbles/ui',
  ],
  reactCompiler: true,
};

export default nextConfig;
