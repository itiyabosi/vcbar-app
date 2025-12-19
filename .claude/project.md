# VCバーコミュニティアプリ プロジェクト情報

## プロジェクト概要

**プロジェクト名**: VCバーコミュニティアプリ（仮称）

**開発期間**: 1ヶ月（MVP Phase 1）

**予算**: 20万円

**プロジェクトの目的**:
学生起業家とベンチャーキャピタリストが集まるバー型コミュニティスペースにおいて、「誰が今ここにいるか」をリアルタイムで可視化し、偶然の出会いとマッチングを促進するWebアプリケーションの開発。

**開発方針**:
初期フェーズではWeb UIで開発し、実証実験を実施。将来的にReact Nativeでモバイルアプリ化を検討。

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks (useState, useEffect)

### バックエンド・インフラ
- **BaaS**: Firebase
  - Authentication（認証）
  - Firestore（NoSQLデータベース）
  - Realtime Database（リアルタイム在館者管理）
  - Cloud Storage（画像保存）
- **デプロイ**: Vercel
- **ホスティング**: Firebase Hosting（代替案）

### 開発ツール
- **バージョン管理**: Git
- **コードエディタ**: VS Code
- **デバッグ**: Chrome DevTools / React DevTools
- **テスト**: Jest / React Testing Library

---

## ディレクトリ構成

```
/Users/hikaru/00/2025/19 VCばー/
├── .claude/
│   ├── project.md                    # プロジェクト全体情報（本ファイル）
│   ├── database-design.md            # データベース設計書
│   ├── api-spec.md                   # API仕様書
│   ├── test-plan.md                  # テスト計画書
│   ├── security-design.md            # セキュリティ設計書
│   ├── environment-setup.md          # 環境構築手順書
│   └── tasks.md                      # タスク管理・進捗管理
├── app/                              # Next.js App Router
│   ├── auth/                         # 認証画面
│   │   └── page.tsx                  # ログイン・新規登録
│   ├── home/                         # ホーム画面
│   │   └── page.tsx                  # 在館者リスト
│   ├── profile/                      # プロフィール画面
│   │   └── create/                   # プロフィール作成
│   │       └── page.tsx
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # トップページ（リダイレクト）
│   └── globals.css                   # グローバルスタイル
├── components/                       # Reactコンポーネント
│   ├── auth/                         # 認証関連コンポーネント
│   ├── common/                       # 共通コンポーネント
│   ├── home/                         # ホーム画面コンポーネント
│   └── profile/                      # プロフィール関連コンポーネント
├── lib/                              # ライブラリ・ユーティリティ
│   ├── firebase/                     # Firebase設定
│   │   └── config.ts                 # Firebase初期化
│   ├── types/                        # TypeScript型定義
│   │   └── user.ts                   # User, Presence型
│   ├── hooks/                        # カスタムフック
│   └── utils/                        # ユーティリティ関数
├── 事業計画.md                       # 事業計画書
├── 開発計画.md                       # 開発要件定義書
├── .env.example                      # 環境変数サンプル
├── .env.local                        # 環境変数（Git除外）
├── .gitignore                        # Git除外設定
├── package.json                      # npm設定
├── tsconfig.json                     # TypeScript設定
├── tailwind.config.ts                # Tailwind CSS設定
├── next.config.js                    # Next.js設定
└── README.md                         # プロジェクト説明
```

---

## 開発フロー

### TDD原則（Test-Driven Development）

1. **Red**: テスト作成（実装コードは書かない）
2. **仕様確認**: テストの意図を日本語で説明
3. **テスト実行**: 失敗確認 → コミット
4. **Green**: 実装（テストは変更しない）
5. **Refactor**: リファクタリング（テスト維持）

### Git運用ルール

#### コミットタイミング
- Red完了: テスト失敗確認後
- Green完了: テスト通過後
- 動作確認OK: ビルド成功、目視確認完了
- 作業中断前: 離席、終業時

#### コミットメッセージ規則
```bash
git commit -m "test: ユーザー認証テスト追加"
git commit -m "feat: ユーザー認証機能実装"
git commit -m "fix: プロフィール画像アップロードバグ修正"
git commit -m "docs: API仕様書更新"
```

#### 禁止操作
- `git commit --amend`（コミット履歴改変）
- `git push --force`（強制プッシュ）
- `git rebase`（履歴書き換え）

---

## 主要機能（Phase 1 MVP）

### 必須機能（Must Have）
1. ✅ ユーザー認証（メール/パスワード、Googleログイン）
2. ✅ プロフィール登録・編集
3. 🚧 チェックイン/チェックアウト機能
4. ✅ ホーム画面：在館者リスト表示（リアルタイム同期）
5. 🚧 プロフィール詳細画面
6. 🚧 マイページ
7. ✅ ナビゲーション

### 推奨機能（Should Have）
8. 🚧 プッシュ通知
9. ✅ フィルター機能（役割別）
10. 🚧 検索機能（名前・スキル）

### 任意機能（Nice to Have）
11. デジタルサイネージ連携（店内ディスプレイ）

---

## KPI（成功指標）

| 指標 | 目標値 |
|------|--------|
| チェックイン率 | 70%以上 |
| アクティブユーザー率 | 20名以上/イベント |
| 平均滞在時間 | 3時間以上 |
| プロフィール閲覧数 | 5プロフィール/回 |
| ユーザー満足度（NPS） | 50以上 |

---

## 開発スケジュール（1ヶ月想定）

| Week | タスク | 成果物 | 進捗 |
|------|--------|--------|------|
| Week 1 | 要件定義・設計、Next.js環境構築、基本画面実装 | 設計書、認証画面、ホーム画面 | ✅ 80%完了 |
| Week 2 | Firebase環境構築、チェックイン機能開発、プロフィール詳細画面 | Firebase設定、チェックイン機能 | 🚧 進行中 |
| Week 3 | 検索機能、画像アップロード、マイページ実装 | 完全なプロフィール機能 | 未着手 |
| Week 4 | テスト実装、バグフィックス、Vercelデプロイ | 動作確認済みWebアプリ | 未着手 |

---

## セキュリティ・プライバシー要件

### 必須要件
- ✅ パスワードのハッシュ化（Firebase Authで自動対応）
- ✅ HTTPS通信の徹底
- ✅ ユーザーデータへのアクセス制御（Firestore Security Rules）
- ✅ プロフィール公開範囲の選択肢提供
- ✅ 位置情報は取得しない（チェックインは手動操作）

---

## 予算配分（20万円）

| 項目 | 金額 | 備考 |
|------|------|------|
| 開発費用 | ¥180,000 | MVP開発（Next.js Web UI） |
| UI/UXデザイン費用 | ¥15,000 | Tailwind CSSベース |
| Firebase利用料 | ¥2,000 | 初月無料枠超過分（予測） |
| Vercel Pro（任意） | ¥3,000 | 初月無料、必要に応じて |
| **合計** | **¥200,000** | |

**コスト削減理由**:
- Web UIによりApp Store/Google Play登録費が不要（¥15,000削減）
- Tailwind CSSによりデザイン工数削減
- Vercel無料枠で初期デプロイ可能

---

## 関連ドキュメント

| ドキュメント | ファイルパス |
|------------|------------|
| 事業計画書 | `/Users/hikaru/00/2025/19 VCばー/事業計画.md` |
| 開発要件定義書 | `/Users/hikaru/00/2025/19 VCばー/開発計画.md` |
| データベース設計書 | `/Users/hikaru/00/2025/19 VCばー/.claude/database-design.md` |
| API仕様書 | `/Users/hikaru/00/2025/19 VCばー/.claude/api-spec.md` |
| テスト計画書 | `/Users/hikaru/00/2025/19 VCばー/.claude/test-plan.md` |
| セキュリティ設計書 | `/Users/hikaru/00/2025/19 VCばー/.claude/security-design.md` |
| 環境構築手順書 | `/Users/hikaru/00/2025/19 VCばー/.claude/environment-setup.md` |
| タスク管理 | `/Users/hikaru/00/2025/19 VCばー/.claude/tasks.md` |

---

## Phase 2以降の拡張機能（参考）

実証実験の結果次第で、以下の機能を追加開発：

- DM（ダイレクトメッセージ）機能
- 1on1マッチング提案（AIによる相性分析）
- イベント管理機能（作成・告知・参加登録）
- フォロー機能・コネクション履歴
- スキルマッチング（「今Pythonできる人いる？」）
- コミュニティ分析ダッシュボード（VC向け）
- バーチャル参加機能（オンライン参加者も表示）

---

## 現在の開発状況（2025-11-15時点）

### ✅ 完了
- Next.js 14プロジェクト初期化（TypeScript + Tailwind CSS）
- 認証画面実装（メール/パスワード、Googleログイン対応）
- プロフィール作成画面実装（スキルタグ選択機能付き）
- ホーム画面実装（在館者リスト、役割別フィルター）
- Firebase SDK統合（認証、Firestore、Realtime Database）
- 型定義（User, Presence）
- デバッグログ実装

### 🚧 進行中
- Firebaseプロジェクトセットアップ（次のステップ）
- チェックイン/アウト機能実装

### 📋 未着手
- プロフィール詳細画面
- マイページ
- 画像アップロード機能
- 検索機能（名前・スキル）
- テスト実装
- Vercelデプロイ

---

**最終更新日**: 2025-11-15（Web UI開発開始）
