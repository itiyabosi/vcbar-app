import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HomePage from '@/app/home/page'
import { onAuthStateChanged } from 'firebase/auth'
import { getDoc } from 'firebase/firestore'
import { onValue } from 'firebase/database'

// Firebaseモックの型定義
jest.mock('firebase/auth')
jest.mock('firebase/firestore')
jest.mock('firebase/database')

const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockOnValue = onValue as jest.MockedFunction<typeof onValue>

describe('ホームページ', () => {
  const mockCurrentUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    name: 'テストユーザー',
  }

  const mockPresentUsers = [
    {
      userId: 'user-1',
      name: '山田太郎',
      role: 'Student',
      organization: '東京大学',
      skills: ['AI', 'Python'],
      interests: 'Machine Learning',
      photoURL: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      privacySettings: {
        profileVisibility: 'Public',
        allowNotifications: true,
      },
    },
    {
      userId: 'user-2',
      name: '佐藤花子',
      role: 'VC',
      organization: 'ABC Capital',
      skills: ['FinTech', 'Investment'],
      interests: 'Startup Investment',
      photoURL: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      privacySettings: {
        profileVisibility: 'Public',
        allowNotifications: true,
      },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // 認証状態をモック
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockCurrentUser as any)
      return jest.fn()
    })

    // ユーザープロフィール取得をモック
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockCurrentUser,
    } as any)

    // Realtime Database監視をモック
    mockOnValue.mockImplementation((ref, callback) => {
      const snapshot = {
        val: () => ({
          'user-1': { userId: 'user-1', isPresent: true, lastSeen: Date.now() },
          'user-2': { userId: 'user-2', isPresent: true, lastSeen: Date.now() },
        }),
      }
      callback(snapshot as any)
      return jest.fn()
    })
  })

  describe('UI表示', () => {
    it('ヘッダーが表示される', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('VCバー')).toBeInTheDocument()
      })
    })

    it('検索バーが表示される', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/検索/i)).toBeInTheDocument()
      })
    })

    it('役割フィルターが表示される', async () => {
      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('すべて')).toBeInTheDocument()
        expect(screen.getByText('VC')).toBeInTheDocument()
        expect(screen.getByText('Student')).toBeInTheDocument()
      })
    })

    it('チェックインボタンが表示される', async () => {
      render(<HomePage />)

      await waitFor(() => {
        const checkinButton = screen.getByRole('button', { name: /チェックイン/i })
        expect(checkinButton).toBeInTheDocument()
      })
    })
  })

  describe('検索機能', () => {
    it('名前で検索できる', async () => {
      // ユーザーリストをモック
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockCurrentUser,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[1],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[1],
        } as any)

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('山田太郎')).toBeInTheDocument()
        expect(screen.getByText('佐藤花子')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/検索/i)
      fireEvent.change(searchInput, { target: { value: '山田' } })

      await waitFor(() => {
        expect(screen.getByText('山田太郎')).toBeInTheDocument()
        expect(screen.queryByText('佐藤花子')).not.toBeInTheDocument()
      })
    })

    it('スキルで検索できる', async () => {
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockCurrentUser,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[1],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[1],
        } as any)

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('山田太郎')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/検索/i)
      fireEvent.change(searchInput, { target: { value: 'AI' } })

      await waitFor(() => {
        expect(screen.getByText('山田太郎')).toBeInTheDocument()
        expect(screen.queryByText('佐藤花子')).not.toBeInTheDocument()
      })
    })

    it('検索結果の件数が表示される', async () => {
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockCurrentUser,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)

      render(<HomePage />)

      const searchInput = screen.getByPlaceholderText(/検索/i)
      fireEvent.change(searchInput, { target: { value: '山田' } })

      await waitFor(() => {
        expect(screen.getByText(/1件の結果/i)).toBeInTheDocument()
      })
    })
  })

  describe('フィルター機能', () => {
    it('役割でフィルターできる', async () => {
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockCurrentUser,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[1],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[1],
        } as any)

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText('山田太郎')).toBeInTheDocument()
        expect(screen.getByText('佐藤花子')).toBeInTheDocument()
      })

      // VCフィルターをクリック
      const vcFilter = screen.getAllByText('VC').find(el => el.tagName === 'BUTTON')
      if (vcFilter) {
        fireEvent.click(vcFilter)
      }

      await waitFor(() => {
        expect(screen.queryByText('山田太郎')).not.toBeInTheDocument()
        expect(screen.getByText('佐藤花子')).toBeInTheDocument()
      })
    })
  })

  describe('空の状態', () => {
    it('在館者がいない場合、適切なメッセージが表示される', async () => {
      mockOnValue.mockImplementation((ref, callback) => {
        const snapshot = {
          val: () => null,
        }
        callback(snapshot as any)
        return jest.fn()
      })

      render(<HomePage />)

      await waitFor(() => {
        expect(screen.getByText(/現在、在館者はいません/i)).toBeInTheDocument()
      })
    })

    it('検索結果がない場合、適切なメッセージが表示される', async () => {
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockCurrentUser,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockPresentUsers[0],
        } as any)

      render(<HomePage />)

      const searchInput = screen.getByPlaceholderText(/検索/i)
      fireEvent.change(searchInput, { target: { value: '存在しないユーザー' } })

      await waitFor(() => {
        expect(screen.getByText(/該当する在館者が見つかりません/i)).toBeInTheDocument()
      })
    })
  })
})
