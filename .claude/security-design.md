# セキュリティ設計書

## プロジェクト名
VCバーコミュニティアプリ

## セキュリティ方針

### 基本原則
1. **最小権限の原則**: ユーザーは必要最小限のデータにのみアクセス可能
2. **多層防御**: 複数のセキュリティレイヤーで保護
3. **データ暗号化**: 通信・保存データの暗号化
4. **プライバシー保護**: 個人情報の適切な管理

---

## 脅威モデル分析

### 想定される脅威

#### 1. 認証・認可の脆弱性
**脅威**: 不正ログイン、なりすまし
**対策**:
- Firebase Authenticationの使用（セキュアな認証基盤）
- パスワード強度チェック
- メール認証の実施
- セッション管理

#### 2. データ漏洩
**脅威**: 未認証ユーザーによるデータアクセス
**対策**:
- Firestore Security Rulesによるアクセス制御
- 読み取り/書き込み権限の厳格化
- 個人情報の適切な保存

#### 3. XSS（クロスサイトスクリプティング）
**脅威**: 悪意のあるスクリプト挿入
**対策**:
- 入力値のサニタイズ
- React Nativeの標準コンポーネント使用（自動エスケープ）
- DOMベースのレンダリング回避

#### 4. インジェクション攻撃
**脅威**: SQLインジェクション、NoSQLインジェクション
**対策**:
- Firestore SDKの使用（パラメータ化クエリ）
- ユーザー入力の検証

#### 5. MITM（中間者攻撃）
**脅威**: 通信傍受、データ改ざん
**対策**:
- HTTPS通信の徹底
- TLS 1.2以上の使用
- 証明書ピンニング（推奨）

#### 6. プライバシー侵害
**脅威**: 位置情報の不正利用、個人情報の漏洩
**対策**:
- 位置情報は取得しない（チェックインは手動操作）
- プライバシー設定の提供
- データ最小化の原則

---

## 認証・認可設計

### 認証フロー

#### 1. メール/パスワード認証
```javascript
// Firebase Authenticationを使用
import { createUserWithEmailAndPassword } from 'firebase/auth';

async function signUp(email, password) {
  // パスワード強度チェック
  if (password.length < 8) {
    throw new Error('パスワードは8文字以上にしてください');
  }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('パスワードは大文字と数字を含む必要があります');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}
```

**セキュリティ要件**:
- パスワード最低8文字
- 大文字、数字を含むこと
- Firebase側でハッシュ化（bcrypt）
- ソルト付きハッシュ

#### 2. ソーシャルログイン（Google/Apple）
- OAuth 2.0プロトコル使用
- トークンの安全な保存（Firebase SDK管理）
- リフレッシュトークンの自動更新

---

### セッション管理

#### トークン管理
- **IDトークン**: 1時間有効
- **リフレッシュトークン**: 自動更新（Firebase SDK管理）
- **セキュアストレージ**: Keychain（iOS）、Keystore（Android）

#### ログアウト処理
```javascript
import { signOut } from 'firebase/auth';

async function logout() {
  await signOut(auth);
  // ローカルストレージのクリア
  await AsyncStorage.clear();
}
```

---

## アクセス制御（Firestore Security Rules）

### 基本ルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ヘルパー関数
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // ユーザープロフィール
    match /users/{userId} {
      // ログイン済みユーザーのみ読み取り可
      allow read: if isAuthenticated();

      // 本人のみ書き込み可
      allow write: if isOwner(userId);

      // バリデーション
      allow create: if isAuthenticated()
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.email is string
                    && request.resource.data.name is string;

      allow update: if isOwner(userId)
                    && request.resource.data.userId == resource.data.userId; // ユーザーIDの変更不可
    }

    // 在館状態
    match /presence/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // イベント（Phase 2）
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated()
                            && resource.data.organizerId == request.auth.uid;
    }
  }
}
```

### Cloud Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // プロフィール画像
    match /profile_images/{userId}/{fileName} {
      // ログイン済みユーザーのみ読み取り可
      allow read: if request.auth != null;

      // 本人のみアップロード可
      allow write: if request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // 5MB制限
                   && request.resource.contentType.matches('image/.*'); // 画像のみ
    }
  }
}
```

---

## データ暗号化

### 通信の暗号化
- **HTTPS**: すべての通信をHTTPS化
- **TLS 1.2以上**: 古いプロトコルの無効化
- **証明書ピンニング（推奨）**:
```javascript
// React Nativeでの証明書ピンニング例
import { fetch } from 'react-native-ssl-pinning';

fetch('https://api.example.com', {
  method: 'GET',
  sslPinning: {
    certs: ['sha256/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX']
  }
});
```

### データの暗号化
- **保存データ**: Firebase側で自動暗号化（AES-256）
- **パスワード**: bcryptでハッシュ化（Firebase Auth管理）
- **APIキー**: 環境変数（.env）で管理、Gitには含めない

---

## 入力検証・サニタイゼーション

### クライアント側検証

#### メールアドレス
```javascript
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
```

#### 名前（XSS対策）
```javascript
function sanitizeName(name) {
  // HTMLタグ除去
  return name.replace(/<[^>]*>/g, '');
}
```

#### URL
```javascript
function validateURL(url) {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}
```

### サーバー側検証（Cloud Functions）

```javascript
exports.createUser = functions.https.onCall((data, context) => {
  // 認証チェック
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '認証が必要です');
  }

  // 入力検証
  if (!data.name || typeof data.name !== 'string' || data.name.length > 50) {
    throw new functions.https.HttpsError('invalid-argument', '名前が不正です');
  }

  // XSS対策
  const sanitizedName = data.name.replace(/<[^>]*>/g, '');

  // データベース操作
  return admin.firestore().collection('users').doc(context.auth.uid).set({
    name: sanitizedName,
    // ...
  });
});
```

---

## プライバシー保護

### 個人情報の取り扱い

#### 収集する情報
- **必須**: メールアドレス、氏名、役割、所属
- **任意**: プロフィール写真、スキル、興味、現在のプロジェクト

#### 収集しない情報
- **位置情報**: GPSは使用しない（チェックインは手動操作）
- **連絡先**: 電話帳アクセスなし
- **通話履歴**: 取得しない

### プライバシー設定

#### ユーザー制御可能な項目
```javascript
const privacySettings = {
  profileVisibility: 'Public' | 'FollowersOnly' | 'Private',
  allowNotifications: true | false,
  showOnlineStatus: true | false
};
```

### データ削除（GDPR対応）

#### アカウント削除機能
```javascript
async function deleteAccount(userId) {
  // Firestore データ削除
  await admin.firestore().collection('users').doc(userId).delete();
  await admin.firestore().collection('presence').doc(userId).delete();

  // Realtime Database データ削除
  await admin.database().ref(`presence_realtime/${userId}`).remove();

  // Cloud Storage 画像削除
  const bucket = admin.storage().bucket();
  await bucket.deleteFiles({ prefix: `profile_images/${userId}/` });

  // Firebase Auth アカウント削除
  await admin.auth().deleteUser(userId);
}
```

---

## セキュリティログ・監査

### ログ記録対象
- ログイン成功/失敗
- プロフィール変更
- チェックイン/アウト
- 権限エラー

### Cloud Functions ログ例
```javascript
exports.auditLog = functions.firestore
  .document('users/{userId}')
  .onUpdate((change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    console.log('[AUDIT]', {
      userId: context.params.userId,
      timestamp: new Date().toISOString(),
      action: 'UPDATE_PROFILE',
      changes: {
        before: before.name,
        after: after.name
      }
    });
  });
```

---

## レート制限・DDoS対策

### Firebase App Check導入（推奨）
```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### Cloud Functions レート制限
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100 // 最大100リクエスト
});

app.use(limiter);
```

---

## 脆弱性診断・ペネトレーションテスト

### 実施項目
- [ ] OWASP Top 10チェック
- [ ] SQLインジェクション（Firestore使用のため低リスク）
- [ ] XSS攻撃
- [ ] CSRF攻撃
- [ ] 認証バイパス
- [ ] 権限昇格
- [ ] データ漏洩

### ツール
- **Firebase Security Rules Unit Test**
- **OWASP ZAP**（Webアプリ診断）
- **npm audit**（依存パッケージ脆弱性チェック）

```bash
npm audit
npm audit fix
```

---

## インシデント対応

### インシデント発生時の対応フロー
1. **検知**: ログ監視、ユーザー報告
2. **隔離**: 影響範囲の特定、攻撃者のブロック
3. **調査**: ログ分析、原因究明
4. **復旧**: データ復元、脆弱性修正
5. **報告**: ユーザーへの通知、再発防止策

### 緊急連絡先
- **開発責任者**: [連絡先]
- **Firebase サポート**: https://firebase.google.com/support

---

## コンプライアンス

### 準拠法規
- **個人情報保護法**（日本）
- **GDPR**（EU、将来的に対応）

### プライバシーポリシー
アプリ内およびApp Store/Google Playに掲載

### 利用規約
不正利用の禁止、アカウント停止条件の明記

---

## セキュリティチェックリスト

### 開発時
- [ ] `.env` ファイルを `.gitignore` に追加
- [ ] APIキーをハードコードしない
- [ ] ユーザー入力を検証・サニタイズ
- [ ] Firestore Security Rules を実装
- [ ] Cloud Storage Security Rules を実装
- [ ] HTTPS通信の徹底

### リリース前
- [ ] npm audit 実行
- [ ] Firebase Security Rules テスト実行
- [ ] パスワード強度チェック実装確認
- [ ] プライバシーポリシー掲載
- [ ] 利用規約掲載
- [ ] App Check 有効化（推奨）

### 運用時
- [ ] 定期的なログ監視
- [ ] 依存パッケージの更新
- [ ] セキュリティパッチの適用
- [ ] 脆弱性診断（年1回）

---

**最終更新日**: 2025-11-15
