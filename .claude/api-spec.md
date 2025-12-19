# API仕様書

## プロジェクト名
VCバーコミュニティアプリ

## API概要
Firebase BaaS（Backend as a Service）を使用するため、REST APIではなくFirebase SDKを介したデータアクセスとなります。

---

## 認証API（Firebase Authentication）

### サインアップ（新規登録）

**メソッド**: `createUserWithEmailAndPassword()`

**パラメータ**:
```javascript
{
  email: "user@example.com",      // メールアドレス
  password: "Password123!"        // パスワード（最低6文字）
}
```

**レスポンス**:
```javascript
{
  user: {
    uid: "firebase-uid-123456",
    email: "user@example.com",
    emailVerified: false
  }
}
```

**エラーハンドリング**:
- `auth/email-already-in-use`: メールアドレスが既に使用されている
- `auth/invalid-email`: 無効なメールアドレス
- `auth/weak-password`: パスワードが弱い

---

### ログイン

**メソッド**: `signInWithEmailAndPassword()`

**パラメータ**:
```javascript
{
  email: "user@example.com",
  password: "Password123!"
}
```

**レスポンス**:
```javascript
{
  user: {
    uid: "firebase-uid-123456",
    email: "user@example.com",
    emailVerified: true
  }
}
```

**エラーハンドリング**:
- `auth/user-not-found`: ユーザーが存在しない
- `auth/wrong-password`: パスワードが間違っている
- `auth/too-many-requests`: リクエスト過多

---

### ソーシャルログイン（Google/Apple）

**メソッド**: `signInWithPopup(provider)`

**パラメータ**:
```javascript
const provider = new GoogleAuthProvider();
// または
const provider = new OAuthProvider('apple.com');
```

**レスポンス**:
```javascript
{
  user: {
    uid: "firebase-uid-123456",
    email: "user@example.com",
    displayName: "田中太郎",
    photoURL: "https://example.com/photo.jpg"
  }
}
```

---

### ログアウト

**メソッド**: `signOut()`

**パラメータ**: なし

**レスポンス**: 成功時は空のPromise

---

### メール認証送信

**メソッド**: `sendEmailVerification()`

**パラメータ**: なし

**レスポンス**: 成功時は空のPromise

---

## ユーザープロフィールAPI（Firestore）

### プロフィール作成

**メソッド**: `setDoc()`

**パス**: `/users/{userId}`

**パラメータ**:
```javascript
{
  userId: "firebase-uid-123456",
  email: "user@example.com",
  name: "田中太郎",
  photoURL: "https://storage.googleapis.com/...",
  role: "Student",                  // VC | Student | Entrepreneur | Mentor | Other
  organization: "東京大学",
  skills: ["AI", "Python", "SaaS"],
  interests: "EdTech、ヘルスケア領域の起業",
  currentProject: "学習管理アプリ開発中",
  privacySettings: {
    profileVisibility: "Public",    // Public | FollowersOnly | Private
    allowNotifications: true
  },
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

**レスポンス**: 成功時は空のPromise

---

### プロフィール取得

**メソッド**: `getDoc()`

**パス**: `/users/{userId}`

**レスポンス**:
```javascript
{
  userId: "firebase-uid-123456",
  name: "田中太郎",
  role: "Student",
  organization: "東京大学",
  // ... その他のフィールド
}
```

---

### プロフィール更新

**メソッド**: `updateDoc()`

**パス**: `/users/{userId}`

**パラメータ**:
```javascript
{
  name: "田中太郎（更新）",
  skills: ["AI", "Python", "SaaS", "React"],
  updatedAt: Timestamp.now()
}
```

**レスポンス**: 成功時は空のPromise

---

### 全ユーザー取得（役割フィルター付き）

**メソッド**: `getDocs(query())`

**クエリ**:
```javascript
const q = query(
  collection(db, "users"),
  where("role", "==", "VC"),
  orderBy("createdAt", "desc"),
  limit(50)
);
```

**レスポンス**:
```javascript
[
  { userId: "...", name: "...", role: "VC", ... },
  { userId: "...", name: "...", role: "VC", ... }
]
```

---

## チェックイン/アウトAPI（Firestore + Realtime Database）

### チェックイン

**メソッド**: `setDoc()` + `set()`

**Firestoreパス**: `/presence/{userId}`
**Realtime DBパス**: `/presence_realtime/{userId}`

**パラメータ**:
```javascript
// Firestore
{
  userId: "firebase-uid-123456",
  isPresent: true,
  checkedInAt: Timestamp.now(),
  estimatedCheckout: Timestamp.fromDate(new Date(Date.now() + 3*60*60*1000)), // 3時間後
  purpose: "Networking",            // Networking | Working | Mentoring | Pitching | Casual
  visibility: "Public",             // Public | FollowersOnly | Private
  autoCheckoutEnabled: true,
  lastUpdated: Timestamp.now()
}

// Realtime Database
{
  userId: "firebase-uid-123456",
  isPresent: true,
  lastSeen: ServerValue.TIMESTAMP
}
```

**レスポンス**: 成功時は空のPromise

---

### チェックアウト

**メソッド**: `updateDoc()` + `update()`

**パラメータ**:
```javascript
// Firestore
{
  isPresent: false,
  lastUpdated: Timestamp.now()
}

// Realtime Database
{
  isPresent: false,
  lastSeen: ServerValue.TIMESTAMP
}
```

**レスポンス**: 成功時は空のPromise

---

### 在館者リスト取得（リアルタイム）

**メソッド**: `onValue()`（Realtime Database）

**パス**: `/presence_realtime`

**クエリ**:
```javascript
const presenceRef = ref(db, 'presence_realtime');
onValue(presenceRef, (snapshot) => {
  const data = snapshot.val();
  // データをフィルタリング
  const presentUsers = Object.entries(data)
    .filter(([_, value]) => value.isPresent === true)
    .map(([userId, _]) => userId);
});
```

**レスポンス**:
```javascript
{
  "user-id-1": { userId: "...", isPresent: true, lastSeen: 1699999999 },
  "user-id-2": { userId: "...", isPresent: true, lastSeen: 1699999998 },
  "user-id-3": { userId: "...", isPresent: false, lastSeen: 1699999000 }
}
```

---

### 在館者詳細情報取得

**メソッド**: `getDocs(query())`（Firestore）

**クエリ**:
```javascript
const q = query(
  collection(db, "presence"),
  where("isPresent", "==", true),
  orderBy("checkedInAt", "desc")
);
```

**レスポンス**:
```javascript
[
  {
    userId: "...",
    isPresent: true,
    checkedInAt: Timestamp,
    purpose: "Networking",
    visibility: "Public"
  },
  // ...
]
```

---

## 画像アップロードAPI（Cloud Storage）

### プロフィール画像アップロード

**メソッド**: `uploadBytesResumable()`

**パス**: `/profile_images/{userId}/{fileName}`

**パラメータ**:
```javascript
const storageRef = ref(storage, `profile_images/${userId}/${file.name}`);
const uploadTask = uploadBytesResumable(storageRef, file, {
  contentType: 'image/jpeg'
});
```

**レスポンス**:
```javascript
{
  state: 'success',
  bytesTransferred: 102400,
  totalBytes: 102400,
  metadata: {
    fullPath: 'profile_images/user123/photo.jpg',
    contentType: 'image/jpeg'
  }
}
```

**進捗監視**:
```javascript
uploadTask.on('state_changed',
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload is ' + progress + '% done');
  },
  (error) => {
    console.error('Upload failed:', error);
  },
  () => {
    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
      console.log('File available at', downloadURL);
    });
  }
);
```

---

### 画像URL取得

**メソッド**: `getDownloadURL()`

**パラメータ**:
```javascript
const storageRef = ref(storage, `profile_images/${userId}/${fileName}`);
```

**レスポンス**:
```javascript
"https://firebasestorage.googleapis.com/v0/b/.../o/profile_images%2Fuser123%2Fphoto.jpg?alt=media&token=..."
```

---

## プッシュ通知API（Cloud Messaging）

### デバイストークン登録

**メソッド**: `getToken()`

**パラメータ**:
```javascript
const token = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY'
});
```

**レスポンス**:
```javascript
"dQw4w9WgXcQ:APA91bF..."  // FCMトークン
```

**Firestoreに保存**:
```javascript
await updateDoc(doc(db, "users", userId), {
  fcmToken: token
});
```

---

### 通知送信（Cloud Functions）

**メソッド**: Cloud Functions for Firebase

**トリガー**: Firestoreの`/presence/{userId}`の`isPresent`がtrueに変更された時

**Cloud Function例**:
```javascript
exports.sendCheckInNotification = functions.firestore
  .document('presence/{userId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    if (newValue.isPresent && !previousValue.isPresent) {
      const userId = context.params.userId;
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userName = userDoc.data().name;

      const message = {
        notification: {
          title: '新しいチェックイン',
          body: `${userName}さんが来館しました！`
        },
        topic: 'checkins'
      };

      return admin.messaging().send(message);
    }
  });
```

---

## 検索・フィルターAPI

### 役割別フィルター

**メソッド**: `getDocs(query())`

**クエリ**:
```javascript
const q = query(
  collection(db, "users"),
  where("role", "==", "VC")
);
```

---

### スキル検索（配列検索）

**メソッド**: `getDocs(query())`

**クエリ**:
```javascript
const q = query(
  collection(db, "users"),
  where("skills", "array-contains", "AI")
);
```

---

### 名前検索（部分一致）

**注意**: Firestoreは部分一致検索非対応。Algoliaなどの外部検索サービス併用を推奨。

**代替案（前方一致のみ）**:
```javascript
const q = query(
  collection(db, "users"),
  orderBy("name"),
  startAt(searchTerm),
  endAt(searchTerm + '\uf8ff')
);
```

---

## エラーレスポンス共通フォーマット

```javascript
{
  code: "error-code",
  message: "エラーメッセージ（日本語）",
  details: {
    // エラー詳細情報
  }
}
```

**主要エラーコード**:
- `permission-denied`: 権限不足
- `not-found`: データが存在しない
- `already-exists`: データが既に存在する
- `unauthenticated`: 未認証
- `invalid-argument`: 無効な引数

---

## レート制限

Firebase無料プラン（Spark）の制限:
- Realtime Database: 同時接続100件
- Cloud Storage: 1GB/日のダウンロード
- Cloud Functions: 125K/月の呼び出し

有料プラン（Blaze）: 従量課金

---

## API使用例（TypeScript）

### チェックイン実装例
```typescript
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, set, serverTimestamp } from 'firebase/database';

async function checkIn(userId: string, purpose: string) {
  try {
    // Firestoreに保存
    await setDoc(doc(db, 'presence', userId), {
      userId,
      isPresent: true,
      checkedInAt: Timestamp.now(),
      estimatedCheckout: Timestamp.fromDate(new Date(Date.now() + 3*60*60*1000)),
      purpose,
      visibility: 'Public',
      autoCheckoutEnabled: true,
      lastUpdated: Timestamp.now()
    });

    // Realtime Databaseに保存
    await set(ref(realtimeDb, `presence_realtime/${userId}`), {
      userId,
      isPresent: true,
      lastSeen: serverTimestamp()
    });

    console.log('[SUCCESS] チェックイン完了');
  } catch (error) {
    console.error('[ERROR] チェックイン失敗:', error);
    throw error;
  }
}
```

---

**最終更新日**: 2025-11-15
