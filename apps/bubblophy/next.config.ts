import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  transpilePackages: ['@bubbles/theme', '@bubbles/ui'],
};

export default nextConfig;
