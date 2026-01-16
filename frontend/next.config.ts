import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    // Define explicit workspace root to silence multiple lockfiles warning
    root: __dirname,
  },
};

export default nextConfig;
