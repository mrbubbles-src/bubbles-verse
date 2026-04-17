import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@bubbles/ui', '@bubbles/theme'],
  reactCompiler: true,
};

export default nextConfig;
