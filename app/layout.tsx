import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1E3A8A',
}

export const metadata: Metadata = {
  title: 'VCバー - コミュニティアプリ',
  description: '学生起業家とVCをつなぐコミュニティアプリ。リアルタイムで在館者を確認し、ネットワーキングを促進します。',
  keywords: ['VC', '起業家', 'スタートアップ', 'コミュニティ', 'ネットワーキング'],
  authors: [{ name: 'VCバー' }],
  creator: 'VCバー',
  publisher: 'VCバー',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    title: 'VCバー - コミュニティアプリ',
    description: '学生起業家とVCをつなぐコミュニティアプリ',
    siteName: 'VCバー',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
