import type { NextConfig } from 'next';
import { config as loadEnv } from 'dotenv';
import path from 'path';

// Load the root-level .env so the playground doesn't need its own copy.
// dotenv.config() is a no-op for keys already set in the environment,
// so shell exports and CI secrets always take precedence.
loadEnv({ path: path.resolve(__dirname, '../.env') });

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
