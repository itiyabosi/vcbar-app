export type UserRole = 'VC' | 'Student' | 'Entrepreneur' | 'Mentor' | 'Other';

export type ProfileVisibility = 'Public' | 'FollowersOnly' | 'Private';

export type Purpose = 'Networking' | 'Working' | 'Mentoring' | 'Pitching' | 'Casual';

export interface User {
  userId: string;
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  organization: string;
  skills: string[];
  interests: string;
  currentProject?: string;
  privacySettings: {
    profileVisibility: ProfileVisibility;
    allowNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Presence {
  userId: string;
  isPresent: boolean;
  checkedInAt?: Date;
  estimatedCheckout?: Date;
  purpose?: Purpose;
  visibility: ProfileVisibility;
  autoCheckoutEnabled: boolean;
  lastUpdated: Date;
}

export interface Connection {
  connectionId: string;
  userIdA: string; // つながりを作成したユーザー
  userIdB: string; // つながった相手
  createdAt: Date;
  location?: string; // どこで会ったか（例：VCバー）
  notes?: string; // 会話メモ
  tags?: string[]; // タグ（例：「ピッチした」「メンタリング受けた」）
}

export interface TableSession {
  tableId: string;
  tableName: string;
  userId: string;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

export type MenuCategory = 'drink' | 'food';

export interface MenuItem {
  itemId: string;
  name: string;
  category: MenuCategory;
  price: number;
  description?: string;
  imageUrl?: string;
  available: boolean;
}

export interface Order {
  orderId: string;
  userId: string;
  tableId: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
  }[];
  totalPrice: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
