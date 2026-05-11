import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@brandflow/ui', '@brandflow/shared'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
};

export default nextConfig;
