
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add webpack configuration to handle 'async_hooks'
  webpack: (config, { isServer }) => {
    // Exclude 'async_hooks' from client-side bundles
    if (!isServer) {
      // Ensure fallback object exists
      config.resolve.fallback = config.resolve.fallback || {};
      config.resolve.fallback.async_hooks = false;
    }
    return config;
  },
};

export default nextConfig;
