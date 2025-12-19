'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // ログイン済みの場合は自動的にホーム画面へ
        setIsAuthenticated(true);
        router.push('/home');
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </main>
    );
  }

  // 未認証の場合のみランディングページを表示
  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-gray-900 to-background">
      {/* ヒーローセクション */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-12 sm:pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* ロゴ・タイトル */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-blue-500 to-accent bg-clip-text text-transparent">
            VCバー
          </h1>

          {/* キャッチコピー */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 mb-4">
            偶然の出会いから、未来を創る
          </p>

          <p className="text-base sm:text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            学生起業家とベンチャーキャピタリストが集まるコミュニティスペース。
            <br className="hidden sm:block" />
            「誰が今ここにいるか」をリアルタイムで可視化し、新しいつながりを生み出します。
          </p>

          {/* CTAボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/auth?mode=signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-center"
            >
              無料で新規登録
            </Link>
            <Link
              href="/auth?mode=login"
              className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border-2 border-gray-700 hover:border-gray-600 transition-all duration-200 text-center"
            >
              ログイン
            </Link>
          </div>
        </div>
      </section>

      {/* 主要機能 */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-white">
          主要機能
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* 機能1: リアルタイム在館者表示 */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-primary transition-colors">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">リアルタイム在館者</h3>
            <p className="text-gray-400 text-sm">
              今バーにいる人を一目で確認。役割や滞在目的でフィルター可能。
            </p>
          </div>

          {/* 機能2: チェックイン */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-primary transition-colors">
            <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">簡単チェックイン</h3>
            <p className="text-gray-400 text-sm">
              来館時にワンタップでチェックイン。滞在目的を共有して、話しかけやすく。
            </p>
          </div>

          {/* 機能3: プロフィール */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-primary transition-colors">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">詳細プロフィール</h3>
            <p className="text-gray-400 text-sm">
              スキル、興味、所属を共有。共通点を見つけて会話のきっかけに。
            </p>
          </div>

          {/* 機能4: 検索・マッチング */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-primary transition-colors">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">スマート検索</h3>
            <p className="text-gray-400 text-sm">
              名前、スキル、組織で検索。話したい人を素早く見つけられます。
            </p>
          </div>
        </div>
      </section>

      {/* CTA（再度） */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-8 sm:p-12 text-center max-w-4xl mx-auto border border-primary/30">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            今すぐ始めよう
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            アカウント登録は無料。数分で新しいつながりが始まります。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth?mode=signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-center"
            >
              無料で新規登録
            </Link>
            <Link
              href="/auth?mode=login"
              className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border-2 border-gray-700 hover:border-gray-600 transition-all duration-200 text-center"
            >
              ログイン
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 VCバー. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
