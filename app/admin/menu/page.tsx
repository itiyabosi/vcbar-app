'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, updateDoc, doc, orderBy, query } from 'firebase/firestore';
import type { MenuItem } from '@/lib/types/user';

export default function AdminMenuPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // フォーム入力
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'drink' | 'food'>('drink');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('[DEBUG] 未ログイン、認証画面へリダイレクト');
      router.push('/auth');
      return;
    }
    fetchMenu();
  }, [router]);

  const fetchMenu = async () => {
    try {
      const q = query(collection(db, 'menu'), orderBy('category'), orderBy('name'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        itemId: doc.id,
        ...doc.data()
      } as MenuItem));
      setMenuItems(items);
    } catch (err) {
      console.error('[ERROR] メニュー取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price) {
      setMessage('名前と価格は必須です');
      return;
    }

    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setMessage('正しい価格を入力してください');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'menu'), {
        name,
        category,
        price: priceNum,
        description,
        available: true
      });

      setMessage(`✓ ${name} を追加しました`);

      // フォームをリセット
      setName('');
      setPrice('');
      setDescription('');

      // メニューを再取得
      await fetchMenu();
    } catch (err) {
      console.error('[ERROR] メニュー追加エラー:', err);
      setMessage('エラーが発生しました: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'menu', itemId), {
        available: !currentStatus
      });

      // メニューを再取得
      await fetchMenu();
    } catch (err) {
      console.error('[ERROR] 更新エラー:', err);
      alert('更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-gray-400">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/table/scan')}
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            ← 戻る
          </button>
          <h1 className="text-3xl font-bold text-white">🍽️ メニュー管理</h1>
          <div className="w-20"></div>
        </div>

        {/* メニュー追加フォーム */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">新規メニュー追加</h2>

          <form onSubmit={handleAddMenu} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                商品名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                placeholder="例: コーヒー"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                カテゴリ <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCategory('drink')}
                  className={`flex-1 py-2 px-4 rounded font-semibold transition ${
                    category === 'drink'
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  🥤 ドリンク
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('food')}
                  className={`flex-1 py-2 px-4 rounded font-semibold transition ${
                    category === 'food'
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  🍔 フード
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                価格（円・税込） <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                placeholder="例: 500"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                説明（任意）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                placeholder="例: ホットまたはアイスを選べます"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '追加中...' : '追加する'}
            </button>

            {message && (
              <div className={`p-4 rounded-lg text-center ${
                message.includes('エラー') || message.includes('必須')
                  ? 'bg-red-900/20 text-red-400'
                  : 'bg-green-900/20 text-green-400'
              }`}>
                {message}
              </div>
            )}
          </form>
        </div>

        {/* 既存メニュー一覧 */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">
            登録済みメニュー ({menuItems.length}件)
          </h2>

          {menuItems.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              メニューが登録されていません
            </p>
          ) : (
            <div className="space-y-3">
              {menuItems.map((item) => (
                <div
                  key={item.itemId}
                  className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {item.name}
                      </h3>
                      <span className="text-2xl">
                        {item.category === 'drink' ? '🥤' : '🍔'}
                      </span>
                      {!item.available && (
                        <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">
                          提供停止中
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                    )}
                    <p className="text-xl font-bold text-primary">¥{item.price}</p>
                  </div>

                  <button
                    onClick={() => toggleAvailability(item.itemId, item.available)}
                    className={`px-4 py-2 rounded font-semibold transition ${
                      item.available
                        ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50'
                        : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                    }`}
                  >
                    {item.available ? '提供停止' : '提供再開'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
