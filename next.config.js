/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // GitHub Pages用の静的エクスポート設定
  output: 'export',
  basePath: '/vcbar-app',
  assetPrefix: '/vcbar-app/',

  // 画像最適化（静的エクスポート用）
  images: {
    unoptimized: true,
    domains: ['firebasestorage.googleapis.com'],
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
