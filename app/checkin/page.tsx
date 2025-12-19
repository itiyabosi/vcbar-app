'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, realtimeDb } from '@/lib/firebase/config';
import { doc, setDoc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, set, serverTimestamp } from 'firebase/database';
import type { Purpose } from '@/lib/types/user';

const PURPOSE_OPTIONS: { value: Purpose; label: string; description: string }[] = [
  {
    value: 'Networking',
    label: 'ネットワーキング',
    description: '人脈を広げたい'
  },
  {
    value: 'Working',
    label: '作業',
    description: '集中して作業したい'
  },
  {
    value: 'Mentoring',
    label: 'メンタリング',
    description: 'アドバイスを求める/与える'
  },
  {
    value: 'Pitching',
    label: 'ピッチ準備',
    description: 'ピッチの準備・練習'
  },
  {
    value: 'Casual',
    label: 'カジュアル',
    description: '気軽に立ち寄り'
  }
];

const DURATION_OPTIONS = [
  { hours: 1, label: '1時間' },
  { hours: 2, label: '2時間' },
  { hours: 3, label: '3時間' },
  { hours: 4, label: '4時間' },
  { hours: 6, label: '6時間' }
];

export default function CheckInPage() {
  const router = useRouter();
  const [purpose, setPurpose] = useState<Purpose>('Networking');
  const [duration, setDuration] = useState(3); // デフォルト3時間
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPresent, setIsPresent] = useState(false);

  // ページ読み込み時に現在の在館状態を確認
  useEffect(() => {
    const checkStatus = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const status = await checkCurrentStatus();
        setIsPresent(status);
      } catch (error) {
        console.error('[ERROR] 在館状態確認エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  const handleCheckIn = async () => {
    if (!auth.currentUser) {
      setError('ログインが必要です');
      return;
    }

    if (isPresent) {
      setError('既にチェックイン済みです');
      return;
    }

    setLoading(true);
    setError('');

    console.log('[DEBUG] チェックイン処理開始:', {
      userId: auth.currentUser.uid,
      purpose,
      duration
    });

    try {
      const userId = auth.currentUser.uid;
      const now = Timestamp.now();
      const estimatedCheckout = Timestamp.fromDate(
        new Date(Date.now() + duration * 60 * 60 * 1000)
      );

      // Firestoreに在館状態を保存
      const presenceDoc = {
        userId,
        isPresent: true,
        checkedInAt: now,
        estimatedCheckout,
        purpose,
        visibility: 'Public' as const,
        autoCheckoutEnabled: true,
        lastUpdated: now
      };

      await setDoc(doc(db, 'presence', userId), presenceDoc);
      console.log('[SUCCESS] Firestore presenceドキュメント作成成功');

      try {
        // Realtime Databaseにも保存（リアルタイム同期用）
        await set(ref(realtimeDb, `presence_realtime/${userId}`), {
          userId,
          isPresent: true,
          lastSeen: serverTimestamp()
        });
        console.log('[SUCCESS] Realtime Database更新成功');
      } catch (realtimeErr) {
        // Realtime Databaseの書き込みに失敗した場合、Firestoreをロールバック
        console.error('[ERROR] Realtime Database書き込みエラー:', realtimeErr);
        await updateDoc(doc(db, 'presence', userId), {
          isPresent: false,
          lastUpdated: Timestamp.now()
        });
        throw new Error('リアルタイムデータベースへの書き込みに失敗しました');
      }

      console.log('[SUCCESS] チェックイン完了');
      setIsPresent(true);

      // ホーム画面に戻る
      router.push('/home');
    } catch (err: any) {
      console.error('[ERROR] チェックインエラー:', err);
      setError(err.message || 'チェックインに失敗しました');
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!auth.currentUser) {
      return;
    }

    if (!isPresent) {
      setError('チェックインしていません');
      return;
    }

    setLoading(true);
    setError('');

    console.log('[DEBUG] チェックアウト処理開始:', auth.currentUser.uid);

    try {
      const userId = auth.currentUser.uid;

      // Firestoreを更新
      await updateDoc(doc(db, 'presence', userId), {
        isPresent: false,
        lastUpdated: Timestamp.now()
      });
      console.log('[SUCCESS] Firestore更新成功');

      try {
        // Realtime Databaseを更新
        await set(ref(realtimeDb, `presence_realtime/${userId}`), {
          userId,
          isPresent: false,
          lastSeen: serverTimestamp()
        });
        console.log('[SUCCESS] Realtime Database更新成功');
      } catch (realtimeErr) {
        // Realtime Databaseの書き込みに失敗した場合、Firestoreをロールバック
        console.error('[ERROR] Realtime Database書き込みエラー:', realtimeErr);
        await updateDoc(doc(db, 'presence', userId), {
          isPresent: true,
          lastUpdated: Timestamp.now()
        });
        throw new Error('リアルタイムデータベースへの書き込みに失敗しました');
      }

      console.log('[SUCCESS] チェックアウト完了');
      setIsPresent(false);

      // ホーム画面に戻る
      router.push('/home');
    } catch (err: any) {
      console.error('[ERROR] チェックアウトエラー:', err);
      setError(err.message || 'チェックアウトに失敗しました');
      setLoading(false);
    }
  };

  // 現在の在館状態を確認
  const checkCurrentStatus = async () => {
    if (!auth.currentUser) return false;

    try {
      const presenceDoc = await getDoc(doc(db, 'presence', auth.currentUser.uid));
      if (presenceDoc.exists()) {
        return presenceDoc.data().isPresent === true;
      }
      return false;
    } catch (error) {
      console.error('[ERROR] 在館状態確認エラー:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background py-8 flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push('/home')}
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            ← 戻る
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isPresent ? 'チェックアウト' : 'チェックイン'}
          </h1>
          <p className="text-gray-400 mb-8">
            {isPresent
              ? '退館する場合はチェックアウトボタンを押してください'
              : '滞在目的と予定時間を選択してください'}
          </p>

          {/* 現在の状態表示 */}
          {isPresent && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 font-semibold">
                現在チェックイン中です
              </p>
            </div>
          )}

          {/* 滞在目的 (チェックイン時のみ表示) */}
          {!isPresent && (
            <>
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  滞在目的
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PURPOSE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPurpose(option.value)}
                      disabled={loading}
                      className={`p-4 rounded-lg text-left transition ${
                        purpose === option.value
                          ? 'bg-primary text-white border-2 border-primary'
                          : 'bg-gray-700 text-gray-300 border-2 border-gray-700 hover:border-gray-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-semibold mb-1">{option.label}</div>
                      <div className="text-sm opacity-80">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 滞在予定時間 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  滞在予定時間
                </label>
                <div className="flex flex-wrap gap-3">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.hours}
                      onClick={() => setDuration(option.hours)}
                      disabled={loading}
                      className={`px-6 py-3 rounded-lg font-semibold transition ${
                        duration === option.hours
                          ? 'bg-primary text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-3">
                  選択時間後に自動的にチェックアウトされます
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="text-red-500 text-sm bg-red-900/20 p-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-4">
            {!isPresent ? (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full bg-primary hover:bg-blue-800 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'チェックイン中...' : 'チェックイン'}
              </button>
            ) : (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'チェックアウト中...' : 'チェックアウト'}
              </button>
            )}
          </div>

          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">💡 ヒント</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• チェックインすると、他のユーザーに在館が通知されます</li>
              <li>• 滞在目的を設定することで、話しかけやすくなります</li>
              <li>• 退館時は忘れずにチェックアウトしてください</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
