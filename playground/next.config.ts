import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep the package as external so fs/path/__dirname work correctly at runtime
  serverExternalPackages: ['@antv/chart-visualization-skills'],
  // Force externalize the workspace package (serverExternalPackages alone doesn't work for workspace:* packages)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@antv/chart-visualization-skills');
    }
    return config;
  },
  // Experimental features for server components
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  }
};

export default nextConfig;
