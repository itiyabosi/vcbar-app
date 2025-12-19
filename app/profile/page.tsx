'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, realtimeDb } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import type { User, Connection, Order } from '@/lib/types/user';

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isPresent, setIsPresent] = useState(false);
  const [lastVisit, setLastVisit] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connections, setConnections] = useState<Array<Connection & { otherUser: User }>>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('[DEBUG] 未ログイン、認証画面へリダイレクト');
      router.push('/auth');
      return;
    }

    const userId = auth.currentUser.uid;
    console.log('[DEBUG] マイページマウント:', userId);

    // ユーザープロフィールを取得
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
          console.log('[SUCCESS] ユーザープロフィール取得成功');
        } else {
          console.log('[DEBUG] プロフィールが見つかりません。作成画面へリダイレクト');
          router.push('/profile/create');
          return;
        }
      } catch (err) {
        console.error('[ERROR] プロフィール取得エラー:', err);
        setError('プロフィールの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // 前回の来館日を取得
    const fetchLastVisit = async () => {
      try {
        const presenceDoc = await getDoc(doc(db, 'presence', userId));
        if (presenceDoc.exists()) {
          const presenceData = presenceDoc.data();
          // チェックアウト済み（isPresent=false）の場合、最終更新日時を前回の来館日として表示
          if (presenceData.isPresent === false && presenceData.lastUpdated) {
            const lastUpdated = presenceData.lastUpdated?.toDate?.() || presenceData.lastUpdated;
            setLastVisit(lastUpdated);
            console.log('[DEBUG] 前回の来館日:', lastUpdated);
          }
        }
      } catch (err) {
        console.error('[ERROR] 前回の来館日取得エラー:', err);
      }
    };

    fetchLastVisit();

    // コネクション一覧を取得
    const fetchConnections = async () => {
      try {
        // userIdA または userIdB が現在のユーザーであるコネクションを取得
        const q1 = query(
          collection(db, 'connections'),
          where('userIdA', '==', userId)
        );
        const q2 = query(
          collection(db, 'connections'),
          where('userIdB', '==', userId)
        );

        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q1),
          getDocs(q2)
        ]);

        const allConnections = [...snapshot1.docs, ...snapshot2.docs];
        console.log('[DEBUG] コネクション取得:', allConnections.length, '件');

        // 各コネクションの相手ユーザー情報を取得
        const connectionsWithUsers = await Promise.all(
          allConnections.map(async (connectionDoc) => {
            const connectionData = connectionDoc.data();
            const otherUserId = connectionData.userIdA === userId
              ? connectionData.userIdB
              : connectionData.userIdA;

            // 相手ユーザーのプロフィールを取得
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            const otherUser = otherUserDoc.exists()
              ? (otherUserDoc.data() as User)
              : null;

            return {
              connectionId: connectionDoc.id,
              ...connectionData,
              createdAt: connectionData.createdAt?.toDate?.() || connectionData.createdAt,
              otherUser: otherUser || {
                userId: otherUserId,
                name: '不明なユーザー',
                email: '',
                role: 'Other' as const,
                organization: '',
                skills: [],
                interests: '',
                privacySettings: {
                  profileVisibility: 'Private' as const,
                  allowNotifications: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
              }
            } as Connection & { otherUser: User };
          })
        );

        // 作成日時の新しい順にソート
        connectionsWithUsers.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setConnections(connectionsWithUsers);
        console.log('[SUCCESS] コネクション一覧取得成功');
      } catch (err) {
        console.error('[ERROR] コネクション取得エラー:', err);
      } finally {
        setConnectionsLoading(false);
      }
    };

    fetchConnections();

    // 注文履歴を取得
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map(doc => ({
          orderId: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
        } as Order));

        setOrders(ordersData);
        console.log('[SUCCESS] 注文履歴取得成功:', ordersData.length, '件');
      } catch (err) {
        console.error('[ERROR] 注文履歴取得エラー:', err);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();

    // 在館状態をリアルタイム監視
    const presenceRef = ref(realtimeDb, `presence_realtime/${userId}`);
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIsPresent(data.isPresent === true);
        console.log('[DEBUG] 在館状態更新:', data.isPresent);
      } else {
        setIsPresent(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-gray-400">読み込み中...</p>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-background py-8">
        <div className="max-w-3xl mx-auto px-4">
          <button
            onClick={() => router.push('/home')}
            className="text-gray-400 hover:text-white flex items-center gap-2 mb-6"
          >
            ← ホームに戻る
          </button>
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => router.push('/home')}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm sm:text-base"
            aria-label="ホームに戻る"
          >
            ← ホーム
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white">マイページ</h1>
          <div className="w-16 sm:w-20"></div> {/* Spacer for centering */}
        </div>

        {/* ステータスカード */}
        <div className="bg-gradient-to-r from-primary to-blue-900 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl sm:text-3xl text-white font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-sm sm:text-base text-blue-200">
                  {user.role} · {user.organization}
                </p>
              </div>
            </div>
            {isPresent && (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 rounded-full self-start sm:self-auto">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-success rounded-full animate-pulse"></span>
                <span className="text-sm sm:text-base text-white font-semibold">在館中</span>
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => router.push('/profile/edit')}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base"
            aria-label="プロフィールを編集"
          >
            <span>✏️</span>
            <span className="hidden xs:inline">プロフィール編集</span>
            <span className="xs:hidden">編集</span>
          </button>
          <button
            onClick={() => router.push('/checkin')}
            className={`font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base ${
              isPresent
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-primary hover:bg-blue-800 text-white'
            }`}
            aria-label={isPresent ? 'チェックアウト' : 'チェックイン'}
          >
            <span>{isPresent ? '🚪' : '✨'}</span>
            <span>{isPresent ? 'チェックアウト' : 'チェックイン'}</span>
          </button>
        </div>

        {/* プロフィール詳細 */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">
            プロフィール情報
          </h3>

          {/* スキル・専門分野 */}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">
                スキル・専門分野
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 興味・関心 */}
          {user.interests && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">
                興味・関心
              </h4>
              <p className="text-gray-300 leading-relaxed">{user.interests}</p>
            </div>
          )}

          {/* 現在のプロジェクト */}
          {user.currentProject && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">
                現在のプロジェクト
              </h4>
              <p className="text-gray-300 leading-relaxed">
                {user.currentProject}
              </p>
            </div>
          )}

          {/* 登録情報 */}
          <div className="pt-4 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">メール</span>
                <p className="text-gray-300 mt-1">{user.email}</p>
              </div>
              <div>
                <span className="text-gray-400">前回の来館日</span>
                <p className="text-gray-300 mt-1">
                  {lastVisit
                    ? new Date(lastVisit).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'まだ来館していません'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 統計情報（Phase 2で実装予定） */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">
            アクティビティ統計
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">-</div>
              <div className="text-sm text-gray-400 mt-1">総チェックイン数</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">-</div>
              <div className="text-sm text-gray-400 mt-1">累計滞在時間</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{connections.length}</div>
              <div className="text-sm text-gray-400 mt-1">つながり</div>
            </div>
          </div>
          <p className="text-gray-400 text-xs text-center mt-4">
            ※ 一部の統計機能は次のアップデートで利用可能になります
          </p>
        </div>

        {/* つながり一覧 */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">
            つながり ({connections.length})
          </h3>

          {connectionsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">読み込み中...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">まだつながりがありません</p>
              <p className="text-gray-500 text-sm">
                他のユーザーのプロフィールから「つながる」ボタンでつながりを作成できます
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection.connectionId}
                  className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition cursor-pointer"
                  onClick={() => router.push(`/profile/${connection.otherUser.userId}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* プロフィール画像 */}
                    {connection.otherUser.photoURL ? (
                      <img
                        src={connection.otherUser.photoURL}
                        alt={connection.otherUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-xl text-gray-300">
                        {connection.otherUser.name.charAt(0)}
                      </div>
                    )}

                    {/* コネクション情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white truncate">
                          {connection.otherUser.name}
                        </h4>
                        {connection.location && (
                          <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                            📍 {connection.location}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-400 mb-2">
                        {connection.otherUser.role} · {connection.otherUser.organization}
                      </p>

                      {connection.notes && (
                        <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                          💬 {connection.notes}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        {new Date(connection.createdAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} につながりました
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 注文履歴 */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mt-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              注文履歴 ({orders.length})
            </h3>
            <button
              onClick={() => router.push('/menu')}
              className="text-sm bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
            >
              🍴 注文する
            </button>
          </div>

          {ordersLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">読み込み中...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">まだ注文履歴がありません</p>
              <p className="text-gray-500 text-sm">
                メニューから注文してみましょう
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusConfig = {
                  pending: { label: '準備中', color: 'bg-yellow-500/20 text-yellow-400' },
                  preparing: { label: '調理中', color: 'bg-orange-500/20 text-orange-400' },
                  ready: { label: '準備完了', color: 'bg-green-500/20 text-green-400' },
                  delivered: { label: '配達済み', color: 'bg-blue-500/20 text-blue-400' },
                  cancelled: { label: 'キャンセル', color: 'bg-red-500/20 text-red-400' },
                };

                return (
                  <div
                    key={order.orderId}
                    className="bg-gray-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`text-xs px-2 py-1 rounded ${statusConfig[order.status].color}`}>
                          {statusConfig[order.status].label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {item.itemName} × {item.quantity}
                          </span>
                          <span className="text-gray-400">
                            ¥{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-600">
                      <span className="text-sm text-gray-400">合計</span>
                      <span className="text-lg font-bold text-primary">¥{order.totalPrice}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
