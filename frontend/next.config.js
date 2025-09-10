/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Remove rewrites for production - we'll use environment variables instead
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://localhost:8000/:path*',
  //     },
  //   ]
  // },
}

module.exports = nextConfig
