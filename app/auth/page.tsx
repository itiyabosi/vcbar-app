'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 事前登録フォーム
  const [preRegName, setPreRegName] = useState('');
  const [preRegEmail, setPreRegEmail] = useState('');
  const [preRegType, setPreRegType] = useState<'Student' | 'VC'>('Student');
  const [preRegSubmitting, setPreRegSubmitting] = useState(false);
  const [preRegMessage, setPreRegMessage] = useState('');

  // URLクエリパラメータに基づいて初期表示を設定
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    } else if (mode === 'login') {
      setIsSignUp(false);
    }
  }, [searchParams]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[DEBUG] メール認証開始:', { isSignUp, email });

    try {
      if (isSignUp) {
        console.log('[DEBUG] 新規登録処理');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('[SUCCESS] 新規登録成功:', userCredential.user.email);
      } else {
        console.log('[DEBUG] ログイン処理');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('[SUCCESS] ログイン成功:', userCredential.user.email);
      }

      // プロフィール作成画面へ遷移（新規登録の場合）
      if (isSignUp) {
        router.push('/profile/create');
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      console.error('[ERROR] 認証エラー:', err.code, err.message);

      // エラーメッセージを日本語化
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('このメールアドレスは既に使用されています');
          break;
        case 'auth/invalid-email':
          setError('無効なメールアドレスです');
          break;
        case 'auth/weak-password':
          setError('パスワードは6文字以上にしてください');
          break;
        case 'auth/user-not-found':
          setError('ユーザーが見つかりません');
          break;
        case 'auth/wrong-password':
          setError('パスワードが正しくありません');
          break;
        default:
          setError('認証エラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    console.log('[DEBUG] Google認証開始');

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      console.log('[SUCCESS] Google認証成功:', userCredential.user.email);
      router.push('/home');
    } catch (err: any) {
      console.error('[ERROR] Google認証エラー:', err.code, err.message);
      setError('Google認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePreRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreRegSubmitting(true);
    setPreRegMessage('');

    try {
      await addDoc(collection(db, 'preRegistrations'), {
        name: preRegName,
        email: preRegEmail,
        type: preRegType,
        createdAt: Timestamp.now()
      });

      setPreRegMessage('✓ 登録ありがとうございます！サービス開始時にご連絡します。');
      setPreRegName('');
      setPreRegEmail('');
      setPreRegType('Student');
    } catch (err) {
      console.error('[ERROR] 事前登録エラー:', err);
      setPreRegMessage('エラーが発生しました。もう一度お試しください。');
    } finally {
      setPreRegSubmitting(false);
    }
  };

  const scrollToLogin = () => {
    document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="bg-background">
      {/* ヒーロー + 事前登録セクション */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 py-12">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-background"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* 左側: ヒーローコンテンツ */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                学生起業家とVCが<br/>
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                  ブラッシュアップに
                </span>
                <br/>
                没入するBAR
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
                アイデアを磨き上げる、特別な空間
              </p>

              {/* 特徴 */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 text-left">
                  <div className="text-3xl">🍸</div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">Chill & Real</h3>
                    <p className="text-gray-400 text-sm">Barのようなアイデアに没入できる空間を。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <div className="text-3xl">⚡</div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">Spark Ideas</h3>
                    <p className="text-gray-400 text-sm">インタラクティブなセッションを。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <div className="text-3xl">🔋</div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">Recharge & Rise</h3>
                    <p className="text-gray-400 text-sm">終電で途切れない議論を。</p>
                  </div>
                </div>
              </div>

              <button
                onClick={scrollToLogin}
                className="text-gray-400 hover:text-white transition text-sm inline-flex items-center gap-2"
              >
                <span>すでにアカウントをお持ちの方</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* 右側: 事前登録フォーム */}
            <div>
              <div className="text-center mb-6">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  事前登録受付中
                </h2>
                <p className="text-gray-300">
                  サービス開始時に優先的にご案内します
                </p>
              </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50">
            <form onSubmit={handlePreRegistration} className="space-y-6">
              {/* 種別選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  あなたは？
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPreRegType('Student')}
                    className={`py-4 px-6 rounded-lg font-semibold transition ${
                      preRegType === 'Student'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    🎓 学生 / 起業家
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreRegType('VC')}
                    className={`py-4 px-6 rounded-lg font-semibold transition ${
                      preRegType === 'VC'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    💼 VC / 投資家
                  </button>
                </div>
              </div>

              {/* 名前 */}
              <div>
                <label htmlFor="pre-name" className="block text-sm font-medium text-gray-300 mb-2">
                  お名前
                </label>
                <input
                  id="pre-name"
                  type="text"
                  value={preRegName}
                  onChange={(e) => setPreRegName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  placeholder="山田 太郎"
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label htmlFor="pre-email" className="block text-sm font-medium text-gray-300 mb-2">
                  メールアドレス
                </label>
                <input
                  id="pre-email"
                  type="email"
                  value={preRegEmail}
                  onChange={(e) => setPreRegEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  placeholder="your@email.com"
                />
              </div>

              {preRegMessage && (
                <div className={`p-4 rounded-lg text-center ${
                  preRegMessage.includes('✓')
                    ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                    : 'bg-red-900/30 text-red-400 border border-red-700/50'
                }`}>
                  {preRegMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={preRegSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
              >
                {preRegSubmitting ? '送信中...' : '事前登録する'}
              </button>
            </form>
          </div>
            </div>
          </div>
        </div>
      </section>

      {/* ログインセクション */}
      <section id="login-section" className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-gray-900/50 to-background"></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">VCバー</h1>
            <p className="text-gray-400">ログイン / 新規登録</p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50">
            <div className="flex mb-6 gap-2">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  !isSignUp
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                ログイン
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  isSignUp
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                新規登録
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-900/30 p-3 rounded-lg border border-red-700/50">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
              >
                {loading ? '処理中...' : isSignUp ? '新規登録' : 'ログイン'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">または</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-4 w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleでログイン
              </button>
            </div>

            {/* 卓上モードへのリンク */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={() => router.push('/table/scan')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                🍽️ 卓上モードで入る
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                テーブルのQRコードをスキャンして参加
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
