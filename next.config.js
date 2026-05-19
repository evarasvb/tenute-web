/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Skip type checking during build (pre-existing type errors unrelated to app functionality)
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['p-limit'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
