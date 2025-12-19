import '@testing-library/jest-dom'

// Firebase Authのモック
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}))

// Firebase Firestoreのモック
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
    fromDate: jest.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  },
}))

// Firebase Realtime Databaseのモック
jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  set: jest.fn(),
  onValue: jest.fn(),
  serverTimestamp: jest.fn(),
}))

// Firebase Storageのモック
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}))

// Next.js Routerのモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useParams: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// グローバルモック設定
global.console = {
  ...console,
  // console.logをテスト中に抑制（必要に応じて）
  log: jest.fn(),
  debug: jest.fn(),
}
