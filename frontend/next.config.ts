import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: any = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/ryhthm_test' : undefined, // Repository name
};

export default nextConfig;
