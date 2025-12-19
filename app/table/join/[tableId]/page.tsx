'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import type { User, TableSession } from '@/lib/types/user';

export default function TableJoinPage() {
  const router = useRouter();
  const params = useParams();
  const tableId = params.tableId as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tableSessions, setTableSessions] = useState<Array<TableSession & { user: User }>>([]);
  const [mySession, setMySession] = useState<TableSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log('[DEBUG] 未ログイン、認証画面へリダイレクト');
        router.push('/auth');
        return;
      }

      // ユーザー情報を取得
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setCurrentUser({ ...userDoc.data(), userId: user.uid } as User);
      } else {
        setCurrentUser({
          userId: user.uid,
          email: user.email || '',
          name: user.displayName || 'ゲスト',
          photoURL: user.photoURL || undefined,
          role: 'Other',
          organization: '',
          skills: [],
          interests: '',
          privacySettings: {
            profileVisibility: 'Public',
            allowNotifications: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // テーブルセッションをリアルタイム監視
  useEffect(() => {
    if (!auth.currentUser) return;

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

      // 自分のセッションを確認
      const myActiveSession = sessions.find(s => s.userId === auth.currentUser!.uid);
      setMySession(myActiveSession || null);

      console.log('[DEBUG] テーブルセッション更新:', sessionsWithUsers.length, '人');
    });

    return () => unsubscribe();
  }, [tableId]);

  const handleJoinTable = async () => {
    if (!auth.currentUser) return;

    try {
      const sessionData = {
        tableId,
        tableName: `テーブル ${tableId.split('-')[1] || tableId}`,
        userId: auth.currentUser.uid,
        joinedAt: Timestamp.now(),
        isActive: true
      };

      await addDoc(collection(db, 'tableSessions'), sessionData);
      console.log('[SUCCESS] テーブルに参加しました');

      // 同じテーブルの他のユーザーと自動的につながる
      await connectWithTableMembers();

      alert('テーブルに参加しました！他の参加者と自動的につながりました。');
    } catch (err) {
      console.error('[ERROR] テーブル参加エラー:', err);
      alert('テーブルへの参加に失敗しました');
    }
  };

  const handleLeaveTable = async () => {
    if (!auth.currentUser || !mySession) return;

    try {
      const q = query(
        collection(db, 'tableSessions'),
        where('tableId', '==', tableId),
        where('userId', '==', auth.currentUser.uid),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          isActive: false,
          leftAt: Timestamp.now()
        })
      );

      await Promise.all(updates);
      console.log('[SUCCESS] テーブルから退出しました');
      router.push('/home');
    } catch (err) {
      console.error('[ERROR] テーブル退出エラー:', err);
      alert('テーブルからの退出に失敗しました');
    }
  };

  const connectWithTableMembers = async () => {
    if (!auth.currentUser) return;

    try {
      // テーブルの他のメンバーとつながりを作成
      const otherMembers = tableSessions.filter(s => s.userId !== auth.currentUser!.uid);

      for (const member of otherMembers) {
        // 既存のコネクションをチェック
        const q = query(
          collection(db, 'connections'),
          where('userIdA', 'in', [auth.currentUser.uid, member.userId])
        );
        const snapshot = await getDocs(q);

        const exists = snapshot.docs.some(doc => {
          const data = doc.data();
          return (
            (data.userIdA === auth.currentUser!.uid && data.userIdB === member.userId) ||
            (data.userIdA === member.userId && data.userIdB === auth.currentUser!.uid)
          );
        });

        // まだつながっていない場合は作成
        if (!exists) {
          await addDoc(collection(db, 'connections'), {
            userIdA: auth.currentUser.uid,
            userIdB: member.userId,
            createdAt: Timestamp.now(),
            location: `${tableId} (自動)`,
            notes: '同じテーブルに座りました',
            tags: ['table-auto-connect']
          });
          console.log('[SUCCESS] 自動つながり作成:', member.user.name);
        }
      }
    } catch (err) {
      console.error('[ERROR] 自動つながりエラー:', err);
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            🍽️ {tableId.replace('-', ' ').toUpperCase()}
          </h1>
          <p className="text-gray-400">VCバー テーブルセッション</p>
        </div>

        {/* 参加/退出ボタン */}
        <div className="mb-6">
          {mySession ? (
            <button
              onClick={handleLeaveTable}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              🚪 テーブルから退出する
            </button>
          ) : (
            <button
              onClick={handleJoinTable}
              className="w-full bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg"
            >
              ✨ テーブルに参加する
            </button>
          )}
        </div>

        {/* 現在のメンバー */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            このテーブルのメンバー ({tableSessions.length}人)
          </h2>

          {tableSessions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              まだ誰も座っていません
            </p>
          ) : (
            <div className="space-y-3">
              {tableSessions.map((session) => (
                <div
                  key={session.userId}
                  className="flex items-center gap-4 bg-gray-700/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700"
                  onClick={() => router.push(`/profile/${session.userId}`)}
                >
                  {session.user.photoURL ? (
                    <img
                      src={session.user.photoURL}
                      alt={session.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-xl text-gray-300">
                      {session.user.name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {session.user.name}
                      {session.userId === auth.currentUser?.uid && (
                        <span className="ml-2 text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                          あなた
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {session.user.role} · {session.user.organization}
                    </p>
                  </div>

                  <div className="text-xs text-gray-500">
                    {new Date(session.joinedAt).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} 参加
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
