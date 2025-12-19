# Firebase セットアップガイド

このガイドでは、VCバーアプリのFirebase環境を構築する手順を説明します。

## 📋 前提条件

- Googleアカウント
- Firebase CLIインストール済み（`npm install -g firebase-tools`）
- プロジェクトのクローン完了

---

## 🔥 Step 1: Firebaseプロジェクト作成

### 1-1. Firebase Consoleにアクセス
1. https://console.firebase.google.com/ を開く
2. Googleアカウントでログイン

### 1-2. 新しいプロジェクトを作成
1. 「プロジェクトを追加」をクリック
2. プロジェクト名を入力: `vcbar-app`（または任意の名前）
3. 「続行」をクリック
4. Google Analyticsを有効化（推奨）
5. 「プロジェクトを作成」をクリック

---

## 🌐 Step 2: Webアプリの登録

### 2-1. Webアプリを追加
1. プロジェクトのダッシュボードで「Webアプリを追加」（`</>`アイコン）をクリック
2. アプリのニックネーム: `VCバー Web`
3. Firebase Hostingの設定: **チェックを入れない**（Vercel使用のため）
4. 「アプリを登録」をクリック

### 2-2. 設定値をコピー
表示される設定値をメモします：

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "vcbar-app.firebaseapp.com",
  projectId: "vcbar-app",
  storageBucket: "vcbar-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:...",
  measurementId: "G-XXXXXXXXXX"
};
```

---

## 🔑 Step 3: 環境変数の設定

### 3-1. .env.localファイルを作成

プロジェクトルートに `.env.local` ファイルを作成：

```bash
cd "/Users/hikaru/00/2025/19 VCばー"
touch .env.local
```

### 3-2. 設定値を記入

`.env.local` に以下を記入（Step 2-2の値を使用）：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vcbar-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vcbar-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vcbar-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

⚠️ **重要**: `.env.local` はGitにコミットしない（`.gitignore`に含まれています）

---

## 🔐 Step 4: Firebase Authentication 有効化

### 4-1. Authenticationを有効化
1. Firebase Consoleの左メニューから「Authentication」を選択
2. 「始める」をクリック

### 4-2. ログイン方法を設定

#### メール/パスワード認証
1. 「Sign-in method」タブを選択
2. 「メール/パスワード」を選択
3. 「有効にする」をON
4. 「保存」をクリック

#### Google認証
1. 「Google」を選択
2. 「有効にする」をON
3. プロジェクトのサポートメールを選択
4. 「保存」をクリック

---

## 📊 Step 5: Firestore Database 作成

### 5-1. Firestoreを有効化
1. 左メニューから「Firestore Database」を選択
2. 「データベースの作成」をクリック

### 5-2. セキュリティルールを選択
- **本番モード**を選択（推奨）
- ロケーション: `asia-northeast1`（東京）を選択
- 「有効にする」をクリック

### 5-3. Security Rulesをデプロイ

ターミナルで以下を実行：

```bash
cd "/Users/hikaru/00/2025/19 VCばー"
firebase login
firebase init firestore
```

質問に答える：
- **What do you want to use as your Firestore Rules file?**: `firestore.rules`（既に作成済み）
- **What do you want to use as your Firestore indexes file?**: `firestore.indexes.json`（Enterでデフォルト）

Rulesをデプロイ：
```bash
firebase deploy --only firestore:rules
```

---

## 🔄 Step 6: Realtime Database 作成

### 6-1. Realtime Databaseを有効化
1. 左メニューから「Realtime Database」を選択
2. 「データベースを作成」をクリック

### 6-2. ロケーションを選択
- ロケーション: `asia-southeast1`（シンガポール）を選択
- セキュリティルール: **ロックモード**を選択
- 「有効にする」をクリック

### 6-3. Security Rulesをデプロイ

```bash
firebase deploy --only database
```

---

## 📦 Step 7: Cloud Storage 有効化

### 7-1. Storageを有効化
1. 左メニューから「Storage」を選択
2. 「始める」をクリック

### 7-2. セキュリティルールを選択
- **本番モード**を選択
- ロケーション: `asia-northeast1`（東京）を選択
- 「完了」をクリック

### 7-3. Security Rulesをデプロイ

```bash
firebase deploy --only storage
```

---

## 🧪 Step 8: 動作確認

### 8-1. 開発サーバーを起動

```bash
cd "/Users/hikaru/00/2025/19 VCばー"
npm run dev
```

### 8-2. ブラウザで確認

http://localhost:3000 にアクセス

### 8-3. テストユーザーを作成

1. 「新規登録」タブをクリック
2. メールアドレスとパスワードを入力
3. 「新規登録」をクリック
4. プロフィールを作成

### 8-4. チェックイン機能を確認

1. ホーム画面の右下「+」ボタンをクリック
2. チェックイン画面で滞在目的を選択
3. 「チェックイン」をクリック
4. ホーム画面に自分が表示されることを確認

### 8-5. Firebase Consoleでデータを確認

#### Firestore
1. Firebase Console > Firestore Database
2. `users` コレクションにユーザーが作成されているか確認
3. `presence` コレクションにチェックイン状態が保存されているか確認

#### Realtime Database
1. Firebase Console > Realtime Database
2. `presence_realtime` にユーザーの在館状態が保存されているか確認

---

## 🐛 トラブルシューティング

### エラー: "Firebase: Error (auth/unauthorized-domain)"

**原因**: 現在のドメインが認証済みドメインに追加されていない

**解決策**:
1. Firebase Console > Authentication > Settings
2. 「Authorized domains」に `localhost` を追加

### エラー: "Missing or insufficient permissions"

**原因**: Firestore Security Rulesが正しくデプロイされていない

**解決策**:
```bash
firebase deploy --only firestore:rules
```

### Realtime Databaseにデータが保存されない

**原因**: Database Security Rulesが正しくない

**解決策**:
1. Firebase Console > Realtime Database > Rules
2. `database.rules.json` の内容を確認
3. `firebase deploy --only database` を実行

---

## ✅ チェックリスト

開発開始前に以下を確認：

- [ ] Firebaseプロジェクト作成完了
- [ ] Webアプリ登録完了
- [ ] .env.local設定完了
- [ ] Authentication有効化（メール/パスワード、Google）
- [ ] Firestore Database作成完了
- [ ] Realtime Database作成完了
- [ ] Cloud Storage有効化完了
- [ ] Security Rulesデプロイ完了
- [ ] 開発サーバー起動確認
- [ ] テストユーザー作成確認
- [ ] チェックイン機能動作確認

---

## 📚 次のステップ

Firebase環境構築が完了したら：

1. プロフィール詳細画面の実装
2. 画像アップロード機能の実装
3. 検索機能の実装
4. テストの実装
5. Vercelデプロイ

---

**最終更新日**: 2025-11-15
