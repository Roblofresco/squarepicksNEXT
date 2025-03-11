/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com', 'squarepicks.com'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig