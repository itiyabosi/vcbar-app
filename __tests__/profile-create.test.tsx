import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreateProfilePage from '@/app/profile/create/page'
import { setDoc } from 'firebase/firestore'
import { uploadBytes, getDownloadURL } from 'firebase/storage'

// Firebaseモックの型定義
jest.mock('firebase/firestore')
jest.mock('firebase/storage')
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>
const mockUploadBytes = uploadBytes as jest.MockedFunction<typeof uploadBytes>
const mockGetDownloadURL = getDownloadURL as jest.MockedFunction<typeof getDownloadURL>

// 認証ユーザーをモック
jest.mock('@/lib/firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      photoURL: null,
    },
  },
  db: {},
  storage: {},
  realtimeDb: {},
}))

describe('プロフィール作成ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('UI表示', () => {
    it('フォーム要素が全て表示される', () => {
      render(<CreateProfilePage />)

      expect(screen.getByLabelText(/氏名/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/役割/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/所属/i)).toBeInTheDocument()
      expect(screen.getByText(/スキル・専門分野/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/興味・関心/i)).toBeInTheDocument()
    })

    it('スキル選択ボタンが表示される', () => {
      render(<CreateProfilePage />)

      expect(screen.getByText('AI')).toBeInTheDocument()
      expect(screen.getByText('Python')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
    })

    it('画像アップロードUIが表示される', () => {
      render(<CreateProfilePage />)

      expect(screen.getByText(/プロフィール画像/i)).toBeInTheDocument()
      expect(screen.getByText(/画像を選択/i)).toBeInTheDocument()
    })
  })

  describe('フォーム入力', () => {
    it('名前を入力できる', () => {
      render(<CreateProfilePage />)

      const nameInput = screen.getByLabelText(/氏名/i) as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: '山田太郎' } })

      expect(nameInput.value).toBe('山田太郎')
    })

    it('役割を選択できる', () => {
      render(<CreateProfilePage />)

      const roleSelect = screen.getByLabelText(/役割/i) as HTMLSelectElement
      fireEvent.change(roleSelect, { target: { value: 'VC' } })

      expect(roleSelect.value).toBe('VC')
    })

    it('スキルを複数選択できる', () => {
      render(<CreateProfilePage />)

      const aiButton = screen.getByText('AI')
      const pythonButton = screen.getByText('Python')

      fireEvent.click(aiButton)
      fireEvent.click(pythonButton)

      // 選択されたスキルのスタイルが変わることを確認
      expect(aiButton).toHaveClass('bg-primary')
      expect(pythonButton).toHaveClass('bg-primary')
    })

    it('選択済みスキルを解除できる', () => {
      render(<CreateProfilePage />)

      const aiButton = screen.getByText('AI')

      // 選択
      fireEvent.click(aiButton)
      expect(aiButton).toHaveClass('bg-primary')

      // 解除
      fireEvent.click(aiButton)
      expect(aiButton).not.toHaveClass('bg-primary')
    })
  })

  describe('プロフィール作成', () => {
    it('画像なしでプロフィールを作成できる', async () => {
      mockSetDoc.mockResolvedValueOnce(undefined)

      render(<CreateProfilePage />)

      // フォーム入力
      fireEvent.change(screen.getByLabelText(/氏名/i), {
        target: { value: '山田太郎' },
      })
      fireEvent.change(screen.getByLabelText(/所属/i), {
        target: { value: '東京大学' },
      })

      // スキル選択
      fireEvent.click(screen.getByText('AI'))

      // 送信
      const submitButton = screen.getByRole('button', { name: /プロフィールを作成/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            name: '山田太郎',
            organization: '東京大学',
            skills: ['AI'],
          })
        )
      })
    })

    it('画像付きでプロフィールを作成できる', async () => {
      mockUploadBytes.mockResolvedValueOnce({} as any)
      mockGetDownloadURL.mockResolvedValueOnce('https://example.com/image.jpg')
      mockSetDoc.mockResolvedValueOnce(undefined)

      render(<CreateProfilePage />)

      // 画像ファイルを選択
      const file = new File(['dummy'], 'profile.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByLabelText(/プロフィール画像/i).parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      })
      fireEvent.change(fileInput)

      // フォーム入力
      fireEvent.change(screen.getByLabelText(/氏名/i), {
        target: { value: '田中花子' },
      })
      fireEvent.change(screen.getByLabelText(/所属/i), {
        target: { value: '京都大学' },
      })

      // 送信
      const submitButton = screen.getByRole('button', { name: /プロフィールを作成/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockUploadBytes).toHaveBeenCalled()
        expect(mockGetDownloadURL).toHaveBeenCalled()
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            name: '田中花子',
            photoURL: 'https://example.com/image.jpg',
          })
        )
      })
    })
  })

  describe('画像アップロードバリデーション', () => {
    it('5MBを超える画像は拒否される', async () => {
      render(<CreateProfilePage />)

      // 6MBの画像ファイル（モック）
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })

      const fileInput = screen.getByLabelText(/プロフィール画像/i).parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
      })
      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(/画像サイズは5MB以下にしてください/i)).toBeInTheDocument()
      })
    })

    it('画像ファイル以外は拒否される', async () => {
      render(<CreateProfilePage />)

      const pdfFile = new File(['dummy'], 'document.pdf', { type: 'application/pdf' })

      const fileInput = screen.getByLabelText(/プロフィール画像/i).parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [pdfFile],
      })
      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(/画像ファイルを選択してください/i)).toBeInTheDocument()
      })
    })
  })

  describe('必須フィールドのバリデーション', () => {
    it('名前が未入力の場合、送信できない', async () => {
      render(<CreateProfilePage />)

      const nameInput = screen.getByLabelText(/氏名/i)
      const submitButton = screen.getByRole('button', { name: /プロフィールを作成/i })

      expect(nameInput).toHaveAttribute('required')

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSetDoc).not.toHaveBeenCalled()
      })
    })

    it('組織が未入力の場合、送信できない', () => {
      render(<CreateProfilePage />)

      const orgInput = screen.getByLabelText(/所属/i)
      expect(orgInput).toHaveAttribute('required')
    })
  })
})
