import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A', // ネイビーブルー
        accent: '#F97316',  // オレンジ
        success: '#10B981', // グリーン
        background: '#1F2937', // ダークグレー
      },
    },
  },
  plugins: [],
}
export default config
