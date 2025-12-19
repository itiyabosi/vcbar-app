'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy } from 'firebase/firestore';
import type { MenuItem } from '@/lib/types/user';

export default function MenuPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'drink' | 'food'>('drink');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [initializing, setInitializing] = useState(false);

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
      // Firestoreからメニューを取得
      const q = query(
        collection(db, 'menu'),
        where('available', '==', true),
        orderBy('category'),
        orderBy('price')
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        itemId: doc.id,
        ...doc.data()
      } as MenuItem));

      setMenuItems(items);
      console.log('[SUCCESS] メニュー取得:', items.length, '件');
    } catch (err) {
      console.error('[ERROR] メニュー取得エラー:', err);
      // エラーの場合は空配列のまま
    } finally {
      setLoading(false);
    }
  };

  const initializeMenu = async () => {
    setInitializing(true);
    try {
      const initialMenu = [
        {
          name: '水',
          category: 'drink',
          price: 100,
          description: '冷たいお水',
          available: true
        },
        {
          name: '空気',
          category: 'food',
          price: 10,
          description: '新鮮な空気',
          available: true
        }
      ];

      for (const item of initialMenu) {
        await addDoc(collection(db, 'menu'), item);
        console.log(`✓ ${item.name} を追加しました`);
      }

      alert('メニューを初期化しました！');
      await fetchMenu();
    } catch (err) {
      console.error('[ERROR] メニュー初期化エラー:', err);
      alert('メニューの初期化に失敗しました');
    } finally {
      setInitializing(false);
    }
  };

  const addToCart = (itemId: string) => {
    setCart(prev => {
      const newCart = new Map(prev);
      newCart.set(itemId, (newCart.get(itemId) || 0) + 1);
      return newCart;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = new Map(prev);
      const currentQty = newCart.get(itemId) || 0;
      if (currentQty > 1) {
        newCart.set(itemId, currentQty - 1);
      } else {
        newCart.delete(itemId);
      }
      return newCart;
    });
  };

  const calculateTotal = () => {
    let total = 0;
    cart.forEach((quantity, itemId) => {
      const item = menuItems.find(i => i.itemId === itemId);
      if (item) {
        total += item.price * quantity;
      }
    });
    return total;
  };

  const handleOrder = async () => {
    if (!auth.currentUser || cart.size === 0) return;

    try {
      const items = Array.from(cart.entries()).map(([itemId, quantity]) => {
        const item = menuItems.find(i => i.itemId === itemId);
        return {
          itemId,
          itemName: item?.name || '',
          quantity,
          price: item?.price || 0
        };
      });

      await addDoc(collection(db, 'orders'), {
        userId: auth.currentUser.uid,
        items,
        totalPrice: calculateTotal(),
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      alert('注文を受け付けました！');
      setCart(new Map());
      router.push('/profile');
    } catch (err) {
      console.error('[ERROR] 注文エラー:', err);
      alert('注文に失敗しました');
    }
  };

  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

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
            onClick={() => router.push('/home')}
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            ← ホーム
          </button>
          <h1 className="text-3xl font-bold text-white">🍴 メニュー</h1>
          <div className="w-20"></div>
        </div>

        {/* カテゴリ選択 */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setSelectedCategory('drink')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              selectedCategory === 'drink'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🥤 ドリンク
          </button>
          <button
            onClick={() => setSelectedCategory('food')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              selectedCategory === 'food'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🍔 フード
          </button>
        </div>

        {/* メニュー一覧 */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-6">
          {menuItems.length === 0 && !loading ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-xl text-gray-400 mb-2">メニュー準備中</p>
              <p className="text-sm text-gray-500">
                しばらくお待ちください
              </p>
            </div>
          ) : filteredItems.length === 0 && menuItems.length > 0 ? (
            <p className="text-gray-400 text-center py-8">
              このカテゴリにメニューがありません
            </p>
          ) : (
            <div className="space-y-4">
              {filteredItems.map(item => {
                const quantity = cart.get(item.itemId) || 0;
                return (
                  <div
                    key={item.itemId}
                    className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                      )}
                      <p className="text-xl font-bold text-primary">¥{item.price}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {quantity > 0 && (
                        <>
                          <button
                            onClick={() => removeFromCart(item.itemId)}
                            className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-full flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="text-white font-semibold w-8 text-center">
                            {quantity}
                          </span>
                        </>
                      )}
                      <button
                        onClick={() => addToCart(item.itemId)}
                        className="w-8 h-8 bg-primary hover:bg-blue-800 text-white rounded-full flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* カート */}
        {cart.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">合計金額</p>
                <p className="text-2xl font-bold text-white">¥{calculateTotal()}</p>
              </div>
              <button
                onClick={handleOrder}
                className="bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-8 rounded-lg"
              >
                注文する ({Array.from(cart.values()).reduce((a, b) => a + b, 0)}点)
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
