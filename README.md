# VCバー コミュニティアプリ

学生起業家とベンチャーキャピタリストが集まるバー型コミュニティスペースにおいて、「誰が今ここにいるか」をリアルタイムで可視化し、偶然の出会いとマッチングを促進するWebアプリケーション。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS
- **認証・DB**: Firebase (Authentication, Firestore, Realtime Database, Storage)
- **デプロイ**: Vercel (予定)

## プロジェクト構成

```
/Users/hikaru/00/2025/19 VCばー/
├── .claude/                     # プロジェクト管理ドキュメント
│   ├── project.md              # プロジェクト全体情報
│   ├── database-design.md      # データベース設計書
│   ├── api-spec.md             # API仕様書
│   ├── test-plan.md            # テスト計画書
│   ├── environment-setup.md    # 環境構築手順書
│   ├── security-design.md      # セキュリティ設計書
│   └── tasks.md                # タスク管理・進捗管理
├── app/                        # Next.js App Router
│   ├── auth/                   # 認証画面
│   ├── home/                   # ホーム画面（在館者リスト）
│   ├── profile/                # プロフィール画面
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # トップページ
│   └── globals.css             # グローバルスタイル
├── components/                 # Reactコンポーネント
├── lib/                        # ライブラリ・ユーティリティ
│   ├── firebase/               # Firebase設定
│   ├── types/                  # TypeScript型定義
│   ├── hooks/                  # カスタムフック
│   └── utils/                  # ユーティリティ関数
├── 事業計画.md                 # 事業計画書
├── 開発計画.md                 # 開発要件定義書
├── package.json                # npm設定
├── tsconfig.json               # TypeScript設定
├── tailwind.config.ts          # Tailwind CSS設定
└── README.md                   # このファイル
```

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、Firebase設定を追加:

```bash
cp .env.example .env.local
```

`.env.local` を編集して、Firebaseプロジェクトの設定値を入力:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 主要機能

### Phase 1（MVP - 実装完了）

- ✅ **認証機能**: メール/パスワード、Googleログイン
- ✅ **プロフィール作成・編集**: 名前、役割、所属、スキル、興味など
- ✅ **画像アップロード**: プロフィール画像のアップロード（Cloud Storage）
- ✅ **チェックイン/アウト**: 来館・退館の手動記録、滞在目的・時間設定
- ✅ **在館者リスト表示**: リアルタイムで在館者を一覧表示
- ✅ **フィルター・検索**: 役割別・目的別フィルター、名前・スキル検索
- ✅ **プロフィール詳細表示**: 他のユーザーの詳細情報閲覧、リアルタイム在館状態
- ✅ **マイページ**: 自分のプロフィール管理、統計情報表示
- ✅ **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応

### Phase 2（将来実装予定）

- DM（ダイレクトメッセージ）機能
- 1on1マッチング提案（AIによる相性分析）
- イベント管理機能
- フォロー機能・コネクション履歴
- プッシュ通知
- スキルマッチング

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# リント実行
npm run lint

# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch
```

## テスト

このプロジェクトではJestとReact Testing Libraryを使用してテストを実装しています。

### テストの実行

```bash
# 全てのテストを実行
npm test

# ウォッチモードでテストを実行（ファイル変更時に自動再実行）
npm run test:watch

# カバレッジレポート付きでテスト実行
npm test -- --coverage
```

### テストファイル

```
__tests__/
├── auth.test.tsx             # 認証機能のテスト
├── profile-create.test.tsx   # プロフィール作成のテスト
└── home.test.tsx             # ホーム画面・検索機能のテスト
```

### テスト範囲

- **認証機能**: ログイン、新規登録、バリデーション
- **プロフィール作成**: フォーム入力、スキル選択、画像アップロード
- **ホーム画面**: 検索機能、フィルター機能、在館者リスト表示
- **UI/UX**: レスポンシブデザイン、アクセシビリティ

## ブラウザコンソールでのデバッグ

開発中は、ブラウザのDevTools（F12キー）のConsoleタブで以下のようなログが確認できます:

- `[DEBUG]`: デバッグ情報
- `[SUCCESS]`: 成功メッセージ
- `[ERROR]`: エラー情報
- `[API]`: API通信情報

## Firebaseプロジェクト設定

### 必要な設定

1. **Firebase Console** (https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** を有効化:
   - メール/パスワード認証
   - Google認証
3. **Firestore Database** を作成（本番モードまたはテストモード）
4. **Realtime Database** を作成
5. **Cloud Storage** を有効化

### Firestore Security Rules

`.claude/security-design.md` を参照してください。

## デプロイ

### Vercelへのデプロイ

詳細な手順は **`VERCEL_DEPLOY.md`** を参照してください。

#### クイックスタート

```bash
# 1. GitHubリポジトリを作成・プッシュ
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/vcbar-app.git
git push -u origin main

# 2. Vercelにログイン
# https://vercel.com/ でGitHubと連携

# 3. リポジトリをインポート
# Vercelダッシュボードから vcbar-app をインポート

# 4. 環境変数を設定
# .env.example を参照してFirebase設定を追加

# 5. デプロイ実行
# 自動的にビルド・デプロイが開始されます
```

環境変数の設定方法やトラブルシューティングは `VERCEL_DEPLOY.md` を参照してください。

## ドキュメント

詳細なドキュメントは `.claude/` ディレクトリ内にあります:

- **プロジェクト全体情報**: `.claude/project.md`
- **データベース設計**: `.claude/database-design.md`
- **API仕様**: `.claude/api-spec.md`
- **テスト計画**: `.claude/test-plan.md`
- **環境構築手順**: `.claude/environment-setup.md`
- **セキュリティ設計**: `.claude/security-design.md`
- **タスク管理**: `.claude/tasks.md`

## ライセンス

Private

## 開発者

VCバーチーム

---

**最終更新日**: 2025-11-15
