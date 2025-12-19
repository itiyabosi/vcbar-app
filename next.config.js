/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 画像最適化
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // コンパイル最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // パフォーマンス最適化
  compress: true,
  poweredByHeader: false,

  // 実験的機能
  experimental: {
    optimizePackageImports: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/database', 'firebase/storage'],
  },
}

module.exports = nextConfig
