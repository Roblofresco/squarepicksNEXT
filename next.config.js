/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/flutterflow-io-6f20.appspot.com/projects/square-picks-vpbb8d/assets/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* other config options can go here */
};

module.exports = nextConfig; 