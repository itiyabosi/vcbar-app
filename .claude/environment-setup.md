# 環境構築手順書

## プロジェクト名
VCバーコミュニティアプリ

## 開発環境要件

### 必須ソフトウェア

| ソフトウェア | バージョン | 用途 |
|------------|----------|------|
| Node.js | v18以上 | JavaScript実行環境 |
| npm | 最新版 | パッケージマネージャー |
| Git | 最新版 | バージョン管理 |
| Firebase CLI | 最新版 | Firebase管理 |
| VS Code | 最新版（推奨） | コードエディタ |

### 推奨VS Code拡張機能
- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

---

## セットアップ手順

### 1. Node.js インストール

#### macOS（Homebrew使用）
```bash
brew install node
```

#### Windows（公式インストーラー使用）
https://nodejs.org/ からLTS版をダウンロードしてインストール

#### バージョン確認
```bash
node -v   # v18以上であることを確認
npm -v
```

---

### 2. プロジェクトのクローンまたは作成

#### 既存プロジェクトの場合
```bash
cd ~/00/2025
cd "19 VCばー"
```

#### 依存パッケージのインストール
```bash
npm install
```

---

### 3. Firebase CLIインストール

```bash
npm install -g firebase-tools
```

#### Firebaseログイン
```bash
firebase login
```

---

### 6. プロジェクト初期化

#### リポジトリクローン（既存プロジェクトの場合）
```bash
cd ~/00/2025
git clone <リポジトリURL> "19 VCばー"
cd "19 VCばー"
```

#### 新規プロジェクト作成（React Native）
```bash
npx react-native init VCBarApp --template react-native-template-typescript
cd VCBarApp
```

#### または Expo使用の場合
```bash
expo init VCBarApp
cd VCBarApp
```

---

### 7. 依存パッケージインストール

#### 基本パッケージ
```bash
npm install
```

#### Firebase関連パッケージ
```bash
npm install firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/database @react-native-firebase/storage @react-native-firebase/messaging
```

#### ナビゲーション
```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
```

#### UI ライブラリ
```bash
npm install react-native-paper react-native-vector-icons
```

#### 画像関連
```bash
npm install react-native-image-picker
```

#### iOSの場合、CocoaPods依存関係をインストール
```bash
cd ios
pod install
cd ..
```

---

### 8. Firebase プロジェクト設定

#### Firebaseプロジェクト作成
1. https://console.firebase.google.com/ にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: vc-bar-app）
4. Google Analyticsを有効化（推奨）

#### iOS アプリ登録
1. Firebaseコンソールで「iOSアプリを追加」
2. バンドルID入力（例: com.vcbar.app）
3. `GoogleService-Info.plist` をダウンロード
4. Xcodeで `ios/VCBarApp/` にファイルを追加

#### Android アプリ登録
1. Firebaseコンソールで「Androidアプリを追加」
2. パッケージ名入力（例: com.vcbar.app）
3. `google-services.json` をダウンロード
4. `android/app/` にファイルを配置

#### Firebase設定ファイル作成
`.env` ファイルを作成（Gitには含めない）:
```bash
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=vc-bar-app.firebaseapp.com
FIREBASE_PROJECT_ID=vc-bar-app
FIREBASE_STORAGE_BUCKET=vc-bar-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### `.env.example` も作成（Gitに含める）:
```bash
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
```

---

### 9. Firebase Emulator Suite セットアップ（ローカル開発用）

#### 初期化
```bash
firebase init emulators
```

選択するEmulator:
- [x] Authentication Emulator
- [x] Firestore Emulator
- [x] Realtime Database Emulator
- [x] Storage Emulator

#### firebase.json 設定例
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "database": {
      "port": 9000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

#### Emulator起動
```bash
firebase emulators:start
```

Emulator UI: http://localhost:4000

---

### 10. .gitignore 設定

`.gitignore` に以下を追加:
```
# Environment variables
.env
.env.local

# Firebase
.firebase/
firebase-debug.log

# Node modules
node_modules/

# iOS
ios/Pods/
ios/build/
*.pbxuser
*.mode1v3
*.mode2v3
*.perspectivev3
xcuserdata/

# Android
android/build/
android/.gradle/
android/app/build/

# macOS
.DS_Store

# IDEs
.vscode/
.idea/
*.swp
*.swo
```

---

### 11. 開発サーバー起動

#### Metro Bundler起動
```bash
npm start
```

#### iOS Simulator起動
```bash
npm run ios
```

または
```bash
npx react-native run-ios
```

#### Android Emulator起動
```bash
npm run android
```

または
```bash
npx react-native run-android
```

---

## トラブルシューティング

### iOS関連

#### エラー: `Command PhaseScriptExecution failed`
**解決策**:
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

#### エラー: `Could not find iPhone Simulator`
**解決策**:
```bash
# 利用可能なシミュレーターを確認
xcrun simctl list devices

# 特定のシミュレーターを指定
npx react-native run-ios --simulator="iPhone 14"
```

---

### Android関連

#### エラー: `SDK location not found`
**解決策**:
`android/local.properties` に以下を追加:
```
sdk.dir=/Users/YourUsername/Library/Android/sdk
```

#### エラー: `Execution failed for task ':app:installDebug'`
**解決策**:
```bash
# ADB接続確認
adb devices

# AVDを再起動
```

---

### Firebase関連

#### エラー: `Firebase: No Firebase App '[DEFAULT]' has been created`
**解決策**:
Firebase初期化コードを確認:
```javascript
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  // ...
};

const app = initializeApp(firebaseConfig);
```

---

## 本番環境デプロイ準備

### iOS（App Store）

#### Apple Developer Program登録
1. https://developer.apple.com/ で登録（年間$99）
2. App IDを作成
3. Provisioning Profileを作成

#### Xcode設定
1. Xcodeでプロジェクトを開く
2. Signing & Capabilitiesで開発チームを選択
3. バンドルIDを設定

#### アーカイブ作成
```bash
cd ios
xcodebuild -workspace VCBarApp.xcworkspace -scheme VCBarApp -configuration Release archive
```

---

### Android（Google Play）

#### Google Play Console登録
1. https://play.google.com/console で登録（一回限り$25）
2. アプリを作成

#### 署名キー生成
```bash
cd android/app
keytool -genkeypair -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### gradle設定（android/app/build.gradle）
```gradle
signingConfigs {
    release {
        storeFile file('my-release-key.keystore')
        storePassword 'your-password'
        keyAlias 'my-key-alias'
        keyPassword 'your-password'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...
    }
}
```

#### APK/AABビルド
```bash
cd android
./gradlew bundleRelease
```

生成されたファイル: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 開発ワークフロー確認

### Git初期化
```bash
git init
git add .
git commit -m "feat: 初期プロジェクトセットアップ"
```

### Firebaseデプロイ（Security Rulesなど）
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

**最終更新日**: 2025-11-15
