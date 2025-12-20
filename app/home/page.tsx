'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, realtimeDb } from '@/lib/firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import type { User, Presence, Purpose } from '@/lib/types/user';

interface UserWithPresence extends User {
  presence?: Presence;
}

const PURPOSE_CONFIG: Record<Purpose, { icon: string; label: string; color: string }> = {
  Networking: { icon: '🤝', label: 'ネットワーキング', color: 'bg-blue-500/20 text-blue-400' },
  Working: { icon: '💻', label: '作業中', color: 'bg-purple-500/20 text-purple-400' },
  Mentoring: { icon: '🎓', label: 'メンタリング', color: 'bg-green-500/20 text-green-400' },
  Pitching: { icon: '🎤', label: 'ピッチ準備', color: 'bg-orange-500/20 text-orange-400' },
  Casual: { icon: '☕', label: 'カジュアル', color: 'bg-gray-500/20 text-gray-400' },
};

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [presentUsers, setPresentUsers] = useState<UserWithPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [purposeFilter, setPurposeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    console.log('[DEBUG] ホーム画面マウント');

    let presenceUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('[DEBUG] 未ログイン、認証画面へリダイレクト');
        router.push('/auth');
        return;
      }

      console.log('[DEBUG] ログイン済み:', user.email);

      // 現在のユーザープロフィール取得
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
          console.log('[SUCCESS] ユーザープロフィール取得成功');
        } else {
          console.log('[DEBUG] プロフィール未作成、作成画面へリダイレクト');
          router.push('/profile/create');
          return;
        }
      } catch (error) {
        console.error('[ERROR] プロフィール取得エラー:', error);
        setLoading(false);
        return;
      }

      setLoading(false);

      // 認証完了後にRealtime Databaseのリスナーを設定
      console.log('[DEBUG] 在館者リスナー設定');
      const presenceRef = ref(realtimeDb, 'presence_realtime');
      presenceUnsubscribe = onValue(presenceRef, async (snapshot) => {
        console.log('[DEBUG] 在館者リスト更新');
        const data = snapshot.val();

        if (!data) {
          console.log('[DEBUG] 在館者データなし');
          setPresentUsers([]);
          return;
        }

        // 在館中のユーザーIDを取得
        const presentUserIds = Object.entries(data)
          .filter(([_, value]: [string, any]) => value.isPresent === true)
          .map(([userId, _]) => userId);

        console.log('[DEBUG] 在館者数:', presentUserIds.length);

        if (presentUserIds.length === 0) {
          setPresentUsers([]);
          return;
        }

        // 各ユーザーの詳細情報とpresence情報を取得
        const usersData: UserWithPresence[] = [];
        for (const userId of presentUserIds) {
          try {
            const [userDoc, presenceDoc] = await Promise.all([
              getDoc(doc(db, 'users', userId)),
              getDoc(doc(db, 'presence', userId))
            ]);

            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              let presenceData: Presence | undefined = undefined;

              if (presenceDoc.exists()) {
                const rawPresence = presenceDoc.data();
                // Timestampを Dateに変換
                presenceData = {
                  ...rawPresence,
                  checkedInAt: rawPresence.checkedInAt?.toDate?.() || rawPresence.checkedInAt,
                  estimatedCheckout: rawPresence.estimatedCheckout?.toDate?.() || rawPresence.estimatedCheckout,
                  lastUpdated: rawPresence.lastUpdated?.toDate?.() || rawPresence.lastUpdated,
                } as Presence;
              }

              usersData.push({
                ...userData,
                presence: presenceData
              });
            }
          } catch (error) {
            console.error('[ERROR] ユーザー情報取得エラー:', userId, error);
          }
        }

        // 状態を一度だけ更新
        setPresentUsers(usersData);
        console.log('[SUCCESS] 在館者リスト更新完了:', usersData.length);
      }, (error) => {
        console.error('[ERROR] Realtime Databaseエラー:', error);
      });
    });

    return () => {
      unsubscribe();
      if (presenceUnsubscribe) {
        console.log('[DEBUG] 在館者リスナー解除');
        presenceUnsubscribe();
      }
    };
  }, [router]);

  const handleLogout = async () => {
    console.log('[DEBUG] ログアウト処理開始');
    try {
      await signOut(auth);
      console.log('[SUCCESS] ログアウト成功');
      router.push('/auth');
    } catch (error) {
      console.error('[ERROR] ログアウトエラー:', error);
    }
  };

  // 相対時間を計算する関数
  const getRelativeTime = (date: Date | undefined): string => {
    if (!date) return '';

    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}日前`;
  };

  // フィルタリング
  let filteredUsers = presentUsers;

  // 役割フィルター
  if (roleFilter !== 'All') {
    filteredUsers = filteredUsers.filter((user) => user.role === roleFilter);
  }

  // 目的フィルター
  if (purposeFilter !== 'All') {
    filteredUsers = filteredUsers.filter(
      (user) => user.presence?.purpose === purposeFilter
    );
  }

  // 検索フィルター（名前、スキル、組織で検索）
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredUsers = filteredUsers.filter((user) => {
      // 名前で検索
      const nameMatch = user.name.toLowerCase().includes(query);

      // 組織で検索
      const orgMatch = user.organization.toLowerCase().includes(query);

      // スキルで検索
      const skillMatch = user.skills.some((skill) =>
        skill.toLowerCase().includes(query)
      );

      // 興味・関心で検索
      const interestMatch = user.interests?.toLowerCase().includes(query);

      return nameMatch || orgMatch || skillMatch || interestMatch;
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">VCバー</h1>
              <p className="text-xs sm:text-sm text-gray-400">
                在館者: {presentUsers.length}名
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/menu')}
                className="p-2 sm:px-4 sm:py-2 bg-primary hover:bg-blue-800 text-white rounded text-sm transition flex items-center gap-2"
                aria-label="メニュー"
              >
                <span>🍴</span>
                <span className="hidden sm:inline">注文</span>
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="p-2 sm:px-4 sm:py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition flex items-center gap-2"
                aria-label="マイページ"
              >
                <span>👤</span>
                <span className="hidden sm:inline">{currentUser?.name || 'ゲスト'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs sm:text-sm transition"
                aria-label="ログアウト"
              >
                <span className="hidden sm:inline">ログアウト</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* 検索バー */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前、スキル、組織で検索..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 bg-gray-800 border border-gray-700 rounded-lg text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-primary transition"
              aria-label="在館者を検索"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-400">
              {filteredUsers.length}件の結果
            </p>
          )}
        </div>

        {/* 役割フィルター */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2">役割</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'VC', 'Student', 'Entrepreneur', 'Mentor'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded whitespace-nowrap text-xs sm:text-sm transition ${
                  roleFilter === role
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                aria-label={`${role === 'All' ? 'すべて' : role}でフィルター`}
              >
                {role === 'All' ? 'すべて' : role}
              </button>
            ))}
          </div>
        </div>

        {/* 目的フィルター */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2">滞在目的</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setPurposeFilter('All')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded whitespace-nowrap text-xs sm:text-sm transition ${
                purposeFilter === 'All'
                  ? 'bg-primary text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              aria-label="すべての目的でフィルター"
            >
              すべて
            </button>
            {Object.entries(PURPOSE_CONFIG).map(([purpose, config]) => (
              <button
                key={purpose}
                onClick={() => setPurposeFilter(purpose)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded whitespace-nowrap text-xs sm:text-sm transition ${
                  purposeFilter === purpose
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                aria-label={`${config.label}でフィルター`}
              >
                <span className="sm:hidden">{config.icon}</span>
                <span className="hidden sm:inline">{config.icon} {config.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 在館者リスト */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            {presentUsers.length === 0 ? (
              <div>
                <p className="text-gray-400 mb-2">現在、在館者はいません</p>
                <p className="text-sm text-gray-500">
                  チェックインすると他の在館者があなたを見つけやすくなります
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 mb-2">該当する在館者が見つかりません</p>
                <p className="text-sm text-gray-500">
                  検索条件やフィルターを変更してみてください
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const purpose = user.presence?.purpose;
              const purposeConfig = purpose ? PURPOSE_CONFIG[purpose] : null;

              return (
                <div
                  key={user.userId}
                  className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition cursor-pointer"
                  onClick={() => router.push(`/profile/detail?userId=${user.userId}`)}
                >
                  <div className="flex items-start gap-4">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-gray-400">
                        {user.name.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {user.name}
                        </h3>
                        <span className="w-3 h-3 bg-success rounded-full flex-shrink-0 animate-pulse"></span>
                      </div>

                      <p className="text-sm text-gray-400 mb-2">
                        {user.role} · {user.organization}
                      </p>

                      {/* 滞在目的バッジ */}
                      {purposeConfig && (
                        <div className="mb-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${purposeConfig.color}`}
                          >
                            <span>{purposeConfig.icon}</span>
                            <span>{purposeConfig.label}</span>
                          </span>
                        </div>
                      )}

                      {/* チェックイン時刻 */}
                      {user.presence?.checkedInAt && (
                        <p className="text-xs text-gray-500 mb-2">
                          🕐 {getRelativeTime(user.presence.checkedInAt)}にチェックイン
                        </p>
                      )}

                      {/* スキル */}
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {user.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="px-2 py-1 text-xs text-gray-400">
                              +{user.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* チェックインボタン（FAB風） */}
        <button
          onClick={() => router.push('/checkin')}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-accent hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-2xl sm:text-3xl transition-all active:scale-95"
          aria-label="チェックイン"
        >
          +
        </button>
      </div>
    </main>
  );
}
