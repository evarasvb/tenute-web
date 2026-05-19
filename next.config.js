/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['p-limit', 'yocto-queue'],
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
