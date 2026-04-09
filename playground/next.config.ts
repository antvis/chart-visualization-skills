import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile the workspace package
  transpilePackages: ['chart-visualization-skills'],
  // Experimental features for server components
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  }
};

export default nextConfig;
