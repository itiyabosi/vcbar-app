import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const initialMenu = [
  {
    name: '水',
    category: 'drink',
    price: 100,
    description: '冷たいお水',
    available: true
  },
  {
    name: '空気',
    category: 'food',
    price: 10,
    description: '新鮮な空気',
    available: true
  }
];

async function initMenu() {
  console.log('メニューの初期化を開始します...');

  try {
    for (const item of initialMenu) {
      const docRef = await addDoc(collection(db, 'menu'), item);
      console.log(`✓ ${item.name} を追加しました (ID: ${docRef.id})`);
    }
    console.log('\n初期メニューの登録が完了しました！');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

initMenu();
