'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import type { User, TableSession } from '@/lib/types/user';
import QRCode from 'qrcode';

export default function TableDisplayPage() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId') || '';
  const tableName = `テーブル ${tableId.split('-')[1] || tableId}`;

  const [tableSessions, setTableSessions] = useState<Array<TableSession & { user: User }>>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // QRコードを生成
  useEffect(() => {
    const joinUrl = `${window.location.origin}/table/join/detail?tableId=${tableId}`;
    QRCode.toDataURL(joinUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrCodeUrl(url);
    }).catch(err => {
      console.error('[ERROR] QRコード生成エラー:', err);
    });
  }, [tableId]);

  // テーブルセッションをリアルタイム監視
  useEffect(() => {
    const q = query(
      collection(db, 'tableSessions'),
      where('tableId', '==', tableId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate?.() || doc.data().joinedAt,
      } as TableSession));

      // 各セッションのユーザー情報を取得
      const sessionsWithUsers = await Promise.all(
        sessions.map(async (session) => {
          const userDoc = await getDoc(doc(db, 'users', session.userId));
          const userData = userDoc.exists()
            ? (userDoc.data() as User)
            : {
                userId: session.userId,
                email: '',
                name: 'ゲスト',
                role: 'Other' as const,
                organization: '',
                skills: [],
                interests: '',
                privacySettings: {
                  profileVisibility: 'Public' as const,
                  allowNotifications: true
                },
                createdAt: new Date(),
                updatedAt: new Date()
              };

          return { ...session, user: userData };
        })
      );

      setTableSessions(sessionsWithUsers);
      console.log('[DEBUG] テーブルセッション更新:', sessionsWithUsers.length, '人');
    });

    return () => unsubscribe();
  }, [tableId]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* ヘッダー */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">🍽️ {tableName}</h1>
              <p className="text-gray-400">VCバー 卓上モード</p>
            </div>
            <div className="text-right">
              <p className="text-6xl font-bold text-primary">{tableSessions.length}</p>
              <p className="text-gray-400 mt-1">人が着席中</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QRコード */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              参加はこちら
            </h2>

            <div className="bg-white rounded-xl p-8 mb-6">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-full h-auto" />
              ) : (
                <div className="aspect-square flex items-center justify-center">
                  <p className="text-gray-400">QRコード生成中...</p>
                </div>
              )}
            </div>

            <div className="text-center space-y-3">
              <p className="text-xl text-gray-300 font-semibold">
                スマホでQRコードをスキャン
              </p>
              <p className="text-gray-400">
                このテーブルに参加して<br />他の参加者とつながろう
              </p>
              <div className="pt-4 border-t border-gray-700 mt-6">
                <p className="text-sm text-gray-500 mb-2">または直接アクセス</p>
                <code className="text-xs text-primary bg-gray-900/50 px-3 py-2 rounded">
                  {typeof window !== 'undefined' && `${window.location.origin}/table/join/detail?tableId=${tableId}`}
                </code>
              </div>
            </div>
          </div>

          {/* 現在のメンバー */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-6">
              現在の参加者
            </h2>

            {tableSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-4">👋</div>
                <p className="text-xl text-gray-400">
                  まだ誰も参加していません
                </p>
                <p className="text-gray-500 mt-2">
                  QRコードをスキャンして<br />最初の参加者になろう！
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {tableSessions.map((session) => (
                  <div
                    key={session.userId}
                    className="bg-gray-700/50 rounded-xl p-6 border border-gray-600 hover:border-primary/50 transition"
                  >
                    <div className="flex items-center gap-4">
                      {session.user.photoURL ? (
                        <img
                          src={session.user.photoURL}
                          alt={session.user.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-2xl text-white font-bold border-2 border-primary">
                          {session.user.name.charAt(0)}
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">
                          {session.user.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {session.user.role} · {session.user.organization}
                        </p>
                        {session.user.skills && session.user.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {session.user.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-primary/20 text-primary rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">参加時刻</p>
                        <p className="text-sm font-semibold text-gray-300">
                          {new Date(session.joinedAt).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 py-3">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500">VCバー 卓上常設モード</p>
            <p className="text-gray-500">
              {new Date().toLocaleString('ja-JP', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
