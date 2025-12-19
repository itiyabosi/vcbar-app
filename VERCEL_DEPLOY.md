# Vercelデプロイガイド

このガイドでは、VCバーアプリをVercelにデプロイする手順を説明します。

## 📋 前提条件

- GitHubアカウント
- Vercelアカウント（無料プランでOK）
- Firebaseプロジェクトの設定完了（`FIREBASE_SETUP.md`参照）
- ローカルで動作確認済み

---

## 🚀 Step 1: Gitリポジトリの作成

### 1-1. GitHubリポジトリを作成

1. [GitHub](https://github.com/) にログイン
2. 「New repository」をクリック
3. リポジトリ名: `vcbar-app`（任意）
4. プライベートリポジトリを推奨
5. 「Create repository」をクリック

### 1-2. ローカルリポジトリを初期化

```bash
cd "/Users/hikaru/00/2025/19 VCばー"

# Gitリポジトリ初期化
git init

# ファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: VCバーアプリ MVP完成

- 認証機能（メール/パスワード、Google）
- プロフィール作成・編集
- チェックイン/アウト機能
- 在館者リスト表示
- 検索・フィルター機能
- 画像アップロード
- レスポンシブデザイン
- テスト実装

🤖 Generated with Claude Code"

# リモートリポジトリを追加
git remote add origin https://github.com/あなたのユーザー名/vcbar-app.git

# プッシュ
git branch -M main
git push -u origin main
```

---

## 🌐 Step 2: Vercelプロジェクト作成

### 2-1. Vercelにログイン

1. [Vercel](https://vercel.com/) にアクセス
2. 「Sign Up」または「Continue with GitHub」でログイン

### 2-2. 新しいプロジェクトをインポート

1. ダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリをインポート
3. `vcbar-app`リポジトリを選択
4. 「Import」をクリック

### 2-3. プロジェクト設定

#### Framework Preset
- 自動検出: **Next.js**（自動で設定されるはず）

#### Build and Output Settings
- Build Command: `npm run build`（デフォルト）
- Output Directory: `.next`（デフォルト）
- Install Command: `npm install`（デフォルト）

#### Root Directory
- `.`（変更不要）

---

## 🔑 Step 3: 環境変数の設定

### 3-1. Firebase設定値を追加

Vercelのプロジェクト設定で「Environment Variables」タブを開き、以下を追加：

| Key | Value | 備考 |
|-----|-------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIza...` | Firebase Console から取得 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `vcbar-xxx.firebaseapp.com` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `vcbar-xxx` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `vcbar-xxx.appspot.com` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123...:web:abc...` | |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXXXXX` | オプション |

**重要**: すべての環境変数に「Production」「Preview」「Development」すべてにチェックを入れる

### 3-2. 環境変数の取得方法

Firebase Consoleから取得：

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択
3. ⚙️（設定） → 「プロジェクトの設定」
4. 「全般」タブ → 「マイアプリ」セクション
5. Webアプリの設定値をコピー

---

## 🎯 Step 4: デプロイ実行

### 4-1. 初回デプロイ

Vercelのプロジェクト設定画面で「Deploy」をクリック

デプロイプロセス:
1. ソースコード取得
2. 依存パッケージインストール
3. Next.jsビルド（最適化）
4. デプロイ

⏱️ 初回デプロイは約2〜5分かかります

### 4-2. デプロイ完了確認

デプロイが完了すると、以下のURLが生成されます:

- **本番URL**: `https://vcbar-app.vercel.app`
- **プレビューURL**: `https://vcbar-app-xxx.vercel.app`

「Visit」ボタンをクリックしてアプリを確認

---

## ✅ Step 5: 動作確認

### 5-1. 基本機能の確認

デプロイされたアプリで以下を確認：

- [ ] トップページが表示される
- [ ] 認証画面が表示される
- [ ] メール/パスワードでログインできる
- [ ] Googleログインができる
- [ ] プロフィール作成ができる
- [ ] チェックインができる
- [ ] 在館者リストが表示される
- [ ] 検索機能が動作する
- [ ] プロフィール画像がアップロードできる

### 5-2. Firebase認証ドメインの追加

**重要**: 本番環境で認証が動作しない場合

1. Firebase Console → Authentication → Settings
2. 「承認済みドメイン」に以下を追加:
   - `vcbar-app.vercel.app`
   - `localhost`（開発用）

---

## 🔄 Step 6: 継続的デプロイ（CI/CD）

### 自動デプロイの仕組み

Vercelは自動的にGitHubと連携し、以下の動作をします:

- **mainブランチ**へのプッシュ → **本番環境**に自動デプロイ
- **他のブランチ**へのプッシュ → **プレビュー環境**に自動デプロイ
- **Pull Request**作成 → プレビューURLを自動生成

### コード変更後のデプロイ

```bash
# ローカルで変更を加える
git add .
git commit -m "機能追加: XXX"
git push origin main
```

→ 自動的にVercelでビルド・デプロイが開始されます

---

## 🛠️ トラブルシューティング

### エラー: "Firebase: Error (auth/unauthorized-domain)"

**原因**: Vercelのドメインが認証済みドメインに追加されていない

**解決策**:
1. Firebase Console → Authentication → Settings
2. 「承認済みドメイン」に `vcbar-app.vercel.app` を追加

### エラー: "Missing environment variables"

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. すべての環境変数が設定されているか確認
3. 「Redeploy」で再デプロイ

### ビルドエラー: "Module not found"

**原因**: 依存パッケージのインストール失敗

**解決策**:
```bash
# ローカルで確認
npm install
npm run build

# 問題なければ package-lock.json をコミット
git add package-lock.json
git commit -m "fix: Update package-lock.json"
git push
```

### 画像が表示されない

**原因**: Next.js Image Optimizationの設定不足

**解決策**:
- `next.config.js` で `firebasestorage.googleapis.com` が許可されているか確認

### パフォーマンスが遅い

**原因**: 無料プランのリソース制限

**解決策**:
1. 画像最適化を確認（AVIF/WebP形式）
2. 不要なconsole.logを削除（本番ビルドで自動削除される）
3. 必要に応じてVercel Proプランへアップグレード

---

## 📊 Vercel Analytics（オプション）

### アクセス解析を有効化

1. Vercelダッシュボード → プロジェクト → Analytics
2. 「Enable Analytics」をクリック
3. リアルタイムアクセス数、ページビュー、パフォーマンスを確認

---

## 🔒 セキュリティ設定

### 推奨設定

1. **環境変数の管理**:
   - `.env.local` は絶対にGitにコミットしない
   - `.gitignore` に含まれていることを確認

2. **Firebase Security Rules**:
   - Firestore、Storage、Realtime Databaseのルールが適切に設定されているか確認
   - `firebase deploy --only firestore:rules,storage:rules,database` で更新

3. **HTTPS強制**:
   - Vercelは自動的にHTTPSを有効化（設定不要）

---

## 🎨 カスタムドメイン設定（オプション）

### 独自ドメインの追加

1. Vercelダッシュボード → プロジェクト → Settings → Domains
2. 「Add Domain」をクリック
3. ドメイン名を入力（例: `vcbar.com`）
4. DNSレコードを設定:
   - **Aレコード**: `76.76.21.21`
   - **CNAMEレコード**: `cname.vercel-dns.com`

5. DNS伝播を待つ（最大48時間、通常は数分）

---

## 📈 パフォーマンス最適化

### Vercelでのベストプラクティス

- ✅ 画像最適化: Next.js Imageコンポーネントを使用
- ✅ コード分割: 動的インポート `next/dynamic` を活用
- ✅ キャッシング: Vercel Edge Networkが自動で最適化
- ✅ ISR（Incremental Static Regeneration）: 必要に応じて実装

---

## 📝 チェックリスト

デプロイ前の最終確認:

- [ ] GitHubリポジトリ作成・プッシュ完了
- [ ] Vercelプロジェクト作成完了
- [ ] 環境変数すべて設定完了
- [ ] Firebase認証ドメイン追加完了
- [ ] 初回デプロイ成功
- [ ] 本番環境で全機能動作確認
- [ ] Security Rules デプロイ完了
- [ ] エラーログ確認（Vercel Logs）

---

## 🆘 サポート

問題が解決しない場合:

1. **Vercelドキュメント**: https://vercel.com/docs
2. **Next.jsドキュメント**: https://nextjs.org/docs
3. **Firebase認証ドキュメント**: https://firebase.google.com/docs/auth
4. **Vercelサポート**: support@vercel.com

---

**最終更新日**: 2025-11-15
