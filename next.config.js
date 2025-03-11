/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/login': { page: '/login' },
      '/signup': { page: '/signup' },
    };
  },
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig

