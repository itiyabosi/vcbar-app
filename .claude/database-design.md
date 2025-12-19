# データベース設計書

## プロジェクト名
VCバーコミュニティアプリ

## データベース選定
**採用**: Firebase Firestore + Firebase Realtime Database

**理由**:
- サーバーレスで迅速な開発が可能
- リアルタイム同期機能が標準搭載
- 低コスト運用（初期段階）
- 自動スケーリング

---

## データベース構成

### Firestore（メインデータベース）
ユーザープロフィール、イベント等の永続データを保存

### Realtime Database
在館状態など、リアルタイム性が求められるデータを保存

---

## コレクション設計（Firestore）

### 1. users（ユーザー情報）

**パス**: `/users/{userId}`

**スキーマ**:
```json
{
  "userId": "string",                    // ユーザーID（Firebase Auth UID）
  "email": "string",                     // メールアドレス
  "name": "string",                      // 氏名
  "photoURL": "string",                  // プロフィール写真URL
  "role": "string",                      // 役割（VC | Student | Entrepreneur | Mentor | Other）
  "organization": "string",              // 所属（大学名/会社名）
  "skills": ["string"],                  // 専門分野・スキル（複数タグ）
  "interests": "string",                 // 興味・関心（テキスト）
  "currentProject": "string",            // 現在のプロジェクト（任意）
  "privacySettings": {
    "profileVisibility": "string",       // Public | FollowersOnly | Private
    "allowNotifications": "boolean"      // 通知許可
  },
  "createdAt": "timestamp",              // 登録日時
  "updatedAt": "timestamp"               // 更新日時
}
```

**インデックス**:
- `role`（フィルター検索用）
- `skills`（配列検索用）

**セキュリティルール**:
```javascript
match /users/{userId} {
  allow read: if request.auth != null;                // ログイン済みユーザーのみ読み取り可
  allow write: if request.auth.uid == userId;         // 本人のみ書き込み可
}
```

---

### 2. presence（在館状態管理）

**パス**: `/presence/{userId}`

**スキーマ**:
```json
{
  "userId": "string",                    // ユーザーID
  "isPresent": "boolean",                // 在館中かどうか
  "checkedInAt": "timestamp",            // チェックイン時刻
  "estimatedCheckout": "timestamp",      // 予定退館時刻
  "purpose": "string",                   // 滞在目的（Networking | Working | Mentoring | Pitching | Casual）
  "visibility": "string",                // 公開範囲（Public | FollowersOnly | Private）
  "autoCheckoutEnabled": "boolean",      // 自動チェックアウト有効/無効
  "lastUpdated": "timestamp"             // 最終更新時刻
}
```

**インデックス**:
- `isPresent`（在館者リスト取得用）
- `checkedInAt`（最近のチェックイン順）

**セキュリティルール**:
```javascript
match /presence/{userId} {
  allow read: if request.auth != null;                // ログイン済みユーザーのみ読み取り可
  allow write: if request.auth.uid == userId;         // 本人のみ書き込み可
}
```

---

### 3. events（イベント情報）※ Phase 2

**パス**: `/events/{eventId}`

**スキーマ**:
```json
{
  "eventId": "string",                   // イベントID
  "title": "string",                     // イベント名
  "description": "string",               // イベント説明
  "datetime": "timestamp",               // 開催日時
  "location": "string",                  // 開催場所
  "organizerId": "string",               // 主催者ユーザーID
  "attendees": ["string"],               // 参加者ユーザーID配列
  "maxAttendees": "number",              // 最大参加者数（任意）
  "tags": ["string"],                    // タグ（例: ピッチ会、ネットワーキング）
  "createdAt": "timestamp",              // 作成日時
  "updatedAt": "timestamp"               // 更新日時
}
```

**インデックス**:
- `datetime`（日時順ソート用）
- `tags`（タグフィルター用）

---

### 4. connections（コネクション履歴）※ Phase 2

**パス**: `/connections/{connectionId}`

**スキーマ**:
```json
{
  "connectionId": "string",              // コネクションID
  "userIdA": "string",                   // ユーザーA
  "userIdB": "string",                   // ユーザーB
  "status": "string",                    // Pending | Accepted | Declined
  "createdAt": "timestamp",              // 作成日時
  "acceptedAt": "timestamp"              // 承認日時（任意）
}
```

**インデックス**:
- `userIdA`（ユーザーのコネクション取得用）
- `userIdB`（ユーザーのコネクション取得用）

---

### 5. messages（ダイレクトメッセージ）※ Phase 2

**パス**: `/messages/{conversationId}/messages/{messageId}`

**スキーマ**:
```json
{
  "messageId": "string",                 // メッセージID
  "conversationId": "string",            // 会話ID
  "senderId": "string",                  // 送信者ユーザーID
  "receiverId": "string",                // 受信者ユーザーID
  "content": "string",                   // メッセージ本文
  "readAt": "timestamp",                 // 既読時刻（任意）
  "createdAt": "timestamp"               // 送信日時
}
```

**インデックス**:
- `conversationId` + `createdAt`（会話履歴取得用）

---

## Realtime Database構成

### presence_realtime（リアルタイム在館状態）

**パス**: `/presence_realtime/{userId}`

**スキーマ**:
```json
{
  "userId": "string",                    // ユーザーID
  "isPresent": "boolean",                // 在館中かどうか
  "lastSeen": "timestamp"                // 最終確認時刻
}
```

**用途**:
- 在館者リストのリアルタイム更新
- オフライン検出（Firebase Realtime Databaseの`.info/connected`機能を使用）

**セキュリティルール**:
```json
{
  "rules": {
    "presence_realtime": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth.uid == $userId"
      }
    }
  }
}
```

---

## Cloud Storage構造

### プロフィール画像保存

**パス**: `/profile_images/{userId}/{fileName}`

**ファイル形式**: JPEG, PNG
**最大サイズ**: 5MB
**リサイズ**: Cloud Functions for Firebaseでサムネイル自動生成

**セキュリティルール**:
```javascript
match /profile_images/{userId}/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId
                && request.resource.size < 5 * 1024 * 1024    // 5MB制限
                && request.resource.contentType.matches('image/.*');  // 画像のみ
}
```

---

## データフロー図

### チェックインフロー
```
1. ユーザーがチェックインボタンをタップ
   ↓
2. Firestoreの `/presence/{userId}` を更新
   - isPresent: true
   - checkedInAt: 現在時刻
   ↓
3. Realtime Databaseの `/presence_realtime/{userId}` を更新
   - isPresent: true
   - lastSeen: 現在時刻
   ↓
4. 他のユーザーの画面にリアルタイム反映
```

### 自動チェックアウトフロー
```
1. Cloud Schedulerで1分ごとにCloud Functionを実行
   ↓
2. estimatedCheckout < 現在時刻 のユーザーを検索
   ↓
3. 該当ユーザーの isPresent を false に更新
   ↓
4. Realtime Databaseも同期更新
```

---

## パフォーマンス最適化

### 1. キャッシュ戦略
- プロフィール情報: 5分間キャッシュ
- 在館者リスト: キャッシュなし（常にリアルタイム）

### 2. ページネーション
- イベントリスト: 20件/ページ
- メッセージ履歴: 50件/ページ

### 3. インデックス最適化
- 複合インデックス:
  - `isPresent` + `checkedInAt`（在館者の最新順）
  - `role` + `isPresent`（役割別在館者）

---

## バックアップ・復旧計画

### 自動バックアップ
- Firestore: 毎日午前3時にエクスポート（Cloud Storage）
- 保存期間: 30日間

### 復旧手順
1. Firebase Consoleからエクスポートデータを取得
2. `gcloud firestore import` コマンドで復元

---

## マイグレーション計画（Phase 2移行時）

### スケーラビリティ対応
- ユーザー数1000名超え: Firestoreシャーディング検討
- メッセージ数増加: Cloud Firestoreのサブコレクション活用

---

**最終更新日**: 2025-11-15
