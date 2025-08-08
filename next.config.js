/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        // You can add a pathname prefix if all images share a common path
        // pathname: '/flutterflow-io-6f20.appspot.com/projects/square-picks-vpbb8d/assets/**',
      },
      // Add other hostnames here if needed
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* other config options can go here */
};

module.exports = nextConfig; 