'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UserRole } from '@/lib/types/user';

const SKILL_OPTIONS = [
  'AI', 'Machine Learning', 'Python', 'JavaScript', 'TypeScript',
  'React', 'Next.js', 'Node.js', 'Go', 'Rust',
  'SaaS', 'FinTech', 'EdTech', 'HealthTech', 'CleanTech',
  'デザイン', 'マーケティング', 'セールス', 'ファイナンス'
];

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Student' as UserRole,
    organization: '',
    skills: [] as string[],
    interests: '',
    currentProject: '',
  });
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) {
        console.log('[DEBUG] 未ログイン、認証画面へリダイレクト');
        router.push('/auth');
        return;
      }

      try {
        console.log('[DEBUG] プロフィール読み込み開始');
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            name: userData.name || '',
            role: userData.role || 'Student',
            organization: userData.organization || '',
            skills: userData.skills || [],
            interests: userData.interests || '',
            currentProject: userData.currentProject || '',
          });
          setCurrentPhotoURL(userData.photoURL || '');
          setImagePreview(userData.photoURL || '');
          console.log('[SUCCESS] プロフィール読み込み成功');
        } else {
          console.log('[DEBUG] プロフィールが見つかりません。作成画面へリダイレクト');
          router.push('/profile/create');
        }
      } catch (err) {
        console.error('[ERROR] プロフィール読み込みエラー:', err);
        setError('プロフィールの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setError('画像サイズは5MB以下にしてください');
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    setSelectedImage(file);
    setError('');

    // プレビュー生成
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(currentPhotoURL);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    console.log('[DEBUG] プロフィール更新開始:', formData);

    if (!auth.currentUser) {
      setError('ログインが必要です');
      setSaving(false);
      return;
    }

    try {
      let photoURL = currentPhotoURL;

      // 画像がアップロードされている場合、Cloud Storageにアップロード
      if (selectedImage) {
        setUploadingImage(true);
        console.log('[DEBUG] 画像アップロード開始');

        const timestamp = Date.now();
        const fileName = `${auth.currentUser.uid}_${timestamp}.${selectedImage.name.split('.').pop()}`;
        const storageRef = ref(storage, `profile_images/${auth.currentUser.uid}/${fileName}`);

        // アップロード
        await uploadBytes(storageRef, selectedImage);
        console.log('[SUCCESS] 画像アップロード完了');

        // ダウンロードURL取得
        photoURL = await getDownloadURL(storageRef);
        console.log('[SUCCESS] ダウンロードURL取得:', photoURL);

        setUploadingImage(false);
      }

      const updates = {
        name: formData.name,
        role: formData.role,
        organization: formData.organization,
        skills: formData.skills,
        interests: formData.interests,
        currentProject: formData.currentProject,
        photoURL,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);

      console.log('[SUCCESS] プロフィール更新成功');
      router.push(`/profile/${auth.currentUser.uid}`);
    } catch (err: any) {
      console.error('[ERROR] プロフィール更新エラー:', err);
      setError('プロフィール更新に失敗しました');
      setUploadingImage(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-gray-400">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 戻るボタン */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/profile/${auth.currentUser?.uid}`)}
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            ← 戻る
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">プロフィール編集</h1>
          <p className="text-gray-400 mb-6">情報を更新してください</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* プロフィール画像 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                プロフィール画像
              </label>
              <div className="flex items-center gap-6">
                {/* 画像プレビュー */}
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="プロフィール"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl text-gray-400 border-2 border-gray-600">
                      {formData.name.charAt(0) || '?'}
                    </div>
                  )}
                  {selectedImage && (
                    <div className="absolute -top-2 -right-2">
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition"
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* アップロードボタン */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                  >
                    {selectedImage ? '別の画像を選択' : '画像を選択'}
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    JPG, PNG, GIF（最大5MB）
                  </p>
                  {uploadingImage && (
                    <p className="text-sm text-primary mt-2">
                      画像をアップロード中...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 名前 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                氏名 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary"
                placeholder="山田太郎"
              />
            </div>

            {/* 役割 */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                役割 <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary"
              >
                <option value="Student">学生起業家</option>
                <option value="VC">VC（ベンチャーキャピタリスト）</option>
                <option value="Entrepreneur">起業家</option>
                <option value="Mentor">メンター</option>
                <option value="Other">その他</option>
              </select>
            </div>

            {/* 所属 */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-300 mb-2">
                所属 <span className="text-red-500">*</span>
              </label>
              <input
                id="organization"
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary"
                placeholder="東京大学 / 株式会社○○"
              />
            </div>

            {/* スキル */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                スキル・専門分野
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-1 rounded text-sm transition ${
                      formData.skills.includes(skill)
                        ? 'bg-primary text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* 興味・関心 */}
            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-gray-300 mb-2">
                興味・関心
              </label>
              <textarea
                id="interests"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary resize-none"
                placeholder="EdTech、ヘルスケア領域の起業に興味があります"
              />
            </div>

            {/* 現在のプロジェクト */}
            <div>
              <label htmlFor="currentProject" className="block text-sm font-medium text-gray-300 mb-2">
                現在のプロジェクト（任意）
              </label>
              <input
                id="currentProject"
                type="text"
                value={formData.currentProject}
                onChange={(e) => setFormData({ ...formData, currentProject: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-primary"
                placeholder="学習管理アプリ開発中"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-900/20 p-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push(`/profile/${auth.currentUser?.uid}`)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded transition"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="flex-1 bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {uploadingImage
                  ? '画像をアップロード中...'
                  : saving
                  ? '保存中...'
                  : '変更を保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
