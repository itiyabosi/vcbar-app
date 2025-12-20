'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db, realtimeDb } from '@/lib/firebase/config';
import { doc, getDoc, addDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import type { User } from '@/lib/types/user';
import type { Connection } from '@/lib/types/connection';

export default function ProfileDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || '';

  const [user, setUser] = useState<User | null>(null);
  const [isPresent, setIsPresent] = useState(false);
  const [lastVisit, setLastVisit] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [connectionNotes, setConnectionNotes] = useState('');
  const [connectionLocation, setConnectionLocation] = useState('VCバー');
  const [saving, setSaving] = useState(false);
  const [connectionHistory, setConnectionHistory] = useState<Connection[]>([]);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('[DEBUG] 未ログイン、認証画面へリダイレクト');
      router.push('/auth');
      return;
    }

    if (!userId) {
      console.error('[ERROR] userIdが指定されていません');
      setError('ユーザーが見つかりません');
      setLoading(false);
      return;
    }

    console.log('[DEBUG] プロフィール詳細画面マウント:', userId);

    // ユーザープロフィールを取得
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
          console.log('[SUCCESS] ユーザープロフィール取得成功');
        } else {
          console.log('[DEBUG] ユーザーが見つかりません');
          setError('ユーザーが見つかりません');
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

    // このユーザーとのコネクション履歴を取得
    const fetchConnectionHistory = async () => {
      if (!auth.currentUser) return;

      try {
        const q1 = query(
          collection(db, 'connections'),
          where('userIdA', '==', auth.currentUser.uid),
          where('userIdB', '==', userId)
        );
        const q2 = query(
          collection(db, 'connections'),
          where('userIdA', '==', userId),
          where('userIdB', '==', auth.currentUser.uid)
        );

        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q1),
          getDocs(q2)
        ]);

        const allConnections = [...snapshot1.docs, ...snapshot2.docs];
        const connections = allConnections.map(doc => ({
          connectionId: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        } as Connection));

        // 作成日時の新しい順にソート
        connections.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setConnectionHistory(connections);
        console.log('[DEBUG] コネクション履歴取得:', connections.length, '件');
      } catch (err) {
        console.error('[ERROR] コネクション履歴取得エラー:', err);
      }
    };

    fetchConnectionHistory();

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
  }, [userId, router]);

  // つながりを保存する関数
  const handleConnect = async () => {
    if (!auth.currentUser || !user) return;

    setSaving(true);
    try {
      const connectionData = {
        userIdA: auth.currentUser.uid,
        userIdB: userId,
        createdAt: Timestamp.now(),
        location: connectionLocation || 'VCバー',
        notes: connectionNotes || '',
        tags: []
      };

      await addDoc(collection(db, 'connections'), connectionData);
      console.log('[SUCCESS] コネクション作成成功');

      // ダイアログを閉じてフォームをリセット
      setShowConnectionDialog(false);
      setConnectionNotes('');
      setConnectionLocation('VCバー');

      // コネクション履歴を再取得
      const q1 = query(
        collection(db, 'connections'),
        where('userIdA', '==', auth.currentUser.uid),
        where('userIdB', '==', userId)
      );
      const q2 = query(
        collection(db, 'connections'),
        where('userIdA', '==', userId),
        where('userIdB', '==', auth.currentUser.uid)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const allConnections = [...snapshot1.docs, ...snapshot2.docs];
      const connections = allConnections.map(doc => ({
        connectionId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      } as Connection));

      connections.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setConnectionHistory(connections);

      if (auth.currentUser.uid === userId) {
        alert('メモを保存しました！');
      } else {
        alert(`${user.name}さんとつながりました！`);
      }
    } catch (err) {
      console.error('[ERROR] コネクション作成エラー:', err);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

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
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 戻るボタン */}
        <button
          onClick={() => router.push('/home')}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-6"
        >
          ← 戻る
        </button>

        {/* プロフィールカード */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          {/* ヘッダー */}
          <div className="flex items-start gap-6 mb-8">
            {/* プロフィール画像 */}
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl text-gray-400">
                {user.name.charAt(0)}
              </div>
            )}

            {/* 基本情報 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                {isPresent && (
                  <span className="flex items-center gap-2 px-3 py-1 bg-success/20 text-success rounded-full text-sm font-semibold">
                    <span className="w-2 h-2 bg-success rounded-full"></span>
                    在館中
                  </span>
                )}
              </div>

              <p className="text-xl text-gray-300 mb-3">
                {user.role} · {user.organization}
              </p>

              <div className="text-sm text-gray-400">
                前回の来館日:{' '}
                {lastVisit
                  ? new Date(lastVisit).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'まだ来館していません'}
              </div>
            </div>
          </div>

          {/* スキル・専門分野 */}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">
                スキル・専門分野
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 興味・関心 */}
          {user.interests && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">
                興味・関心
              </h2>
              <p className="text-gray-300 leading-relaxed">{user.interests}</p>
            </div>
          )}

          {/* 現在のプロジェクト */}
          {user.currentProject && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3">
                現在のプロジェクト
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {user.currentProject}
              </p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-4 pt-6 border-t border-gray-700">
            {auth.currentUser?.uid === userId ? (
              <>
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  ✏️ プロフィールを編集
                </button>
                <button
                  onClick={() => setShowConnectionDialog(true)}
                  className="flex-1 bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  📝 メモを残す
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowConnectionDialog(true)}
                  className="flex-1 bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  🤝 つながる
                </button>
                <button
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition opacity-50 cursor-not-allowed"
                  disabled
                >
                  メッセージ（準備中）
                </button>
              </>
            )}
          </div>
        </div>

        {/* 在館履歴（Phase 2で実装予定） */}
        {isPresent && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              在館情報
            </h2>
            <p className="text-gray-400 text-sm">
              現在、バーに在館中です。気軽に声をかけてみましょう！
            </p>
          </div>
        )}

        {/* メモ履歴 */}
        {connectionHistory.length > 0 && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">
              {auth.currentUser?.uid === userId
                ? `自分へのメモ (${connectionHistory.length})`
                : `${user?.name}さんとのつながり履歴 (${connectionHistory.length})`}
            </h2>

            <div className="space-y-4">
              {connectionHistory.map((connection) => (
                <div
                  key={connection.connectionId}
                  className="bg-gray-700/50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {connection.location && (
                        <span className="text-sm px-2 py-1 bg-primary/20 text-primary rounded">
                          📍 {connection.location}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(connection.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {connection.notes && (
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {connection.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* つながるダイアログ */}
      {showConnectionDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowConnectionDialog(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              {auth.currentUser?.uid === userId
                ? 'メモを残す'
                : `${user?.name}さんとつながる`}
            </h3>

            <div className="space-y-4">
              {/* 場所 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {auth.currentUser?.uid === userId
                    ? '場所（任意）'
                    : 'どこで会いましたか？'}
                </label>
                <input
                  type="text"
                  value={connectionLocation}
                  onChange={(e) => setConnectionLocation(e.target.value)}
                  placeholder="例：VCバー、オフィス"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>

              {/* メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {auth.currentUser?.uid === userId
                    ? 'メモ（任意）'
                    : '会話メモ（任意）'}
                </label>
                <textarea
                  value={connectionNotes}
                  onChange={(e) => setConnectionNotes(e.target.value)}
                  placeholder={
                    auth.currentUser?.uid === userId
                      ? '例：今日学んだこと、考えたこと、次のアクション'
                      : '例：AIプロダクトについて話した、ピッチのフィードバックをもらった'
                  }
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* ボタン */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConnectionDialog(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConnect}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-blue-800 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
