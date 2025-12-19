'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TableSelectPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'display' | 'join'>('display');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // クイック選択用のテーブルリスト
  const tables = [
    { id: 'table-1', name: 'テーブル 1' },
    { id: 'table-2', name: 'テーブル 2' },
    { id: 'table-3', name: 'テーブル 3' },
    { id: 'table-4', name: 'テーブル 4' },
    { id: 'table-5', name: 'テーブル 5' },
  ];

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '0000') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('パスワードが正しくありません');
      setPassword('');
    }
  };

  const handleTableSelect = (tableId: string) => {
    if (mode === 'display') {
      // 卓上常設ディスプレイモード
      router.push(`/table/${tableId}`);
    } else {
      // ユーザー参加モード
      router.push(`/table/join/${tableId}`);
    }
  };

  // パスワード認証前の画面
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🔒 卓上モード</h1>
            <p className="text-gray-400">パスワードを入力してください</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary text-center text-2xl tracking-widest"
                  placeholder="0000"
                  maxLength={4}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded transition"
              >
                認証
              </button>

              <button
                type="button"
                onClick={() => router.push('/auth')}
                className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-4 rounded"
              >
                ← 戻る
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // 認証後の画面
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🍽️ 卓上モード</h1>
          <p className="text-gray-400">モードとテーブルを選択</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 shadow-xl mb-4">
          {/* モード選択 */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-300 mb-3">モード選択</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setMode('display')}
                className={`py-3 px-4 rounded font-semibold transition ${
                  mode === 'display'
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                📺 常設ディスプレイ
              </button>
              <button
                onClick={() => setMode('join')}
                className={`py-3 px-4 rounded font-semibold transition ${
                  mode === 'join'
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                👤 参加する
              </button>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-gray-400">
              {mode === 'display' ? (
                <>
                  <strong className="text-white">常設ディスプレイモード:</strong> テーブルに設置するタブレットやモニター用。QRコードを表示して参加者を受け付けます。
                </>
              ) : (
                <>
                  <strong className="text-white">参加モード:</strong> スマホでテーブルに参加する際に使用します。
                </>
              )}
            </div>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">テーブル選択</span>
            </div>
          </div>

          {/* テーブル選択 */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableSelect(table.id)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-4 rounded transition"
                >
                  {table.name}
                </button>
              ))}
            </div>
          </div>

          {/* 戻るボタン */}
          <button
            onClick={() => router.push('/auth')}
            className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-4 rounded"
          >
            ← 戻る
          </button>
        </div>

        {/* 管理者セクション */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            ⚙️ 管理者メニュー
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/admin/menu')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded transition flex items-center justify-between"
            >
              <span>🍽️ メニュー管理</span>
              <span className="text-gray-400 text-sm">→</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
