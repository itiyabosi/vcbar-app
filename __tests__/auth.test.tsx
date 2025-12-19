import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuthPage from '@/app/auth/page'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

// Firebaseモックの型定義
jest.mock('firebase/auth')
const mockSignIn = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>
const mockSignUp = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>

describe('認証ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('UI表示', () => {
    it('ログインフォームが表示される', () => {
      render(<AuthPage />)

      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('パスワード（6文字以上）')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument()
    })

    it('新規登録タブに切り替えられる', () => {
      render(<AuthPage />)

      const signUpTab = screen.getByRole('button', { name: /新規登録/i })
      fireEvent.click(signUpTab)

      expect(screen.getByRole('button', { name: /新規登録する/i })).toBeInTheDocument()
    })
  })

  describe('ログイン機能', () => {
    it('メールアドレスとパスワードでログインできる', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' }
      mockSignIn.mockResolvedValueOnce({ user: mockUser } as any)

      render(<AuthPage />)

      const emailInput = screen.getByPlaceholderText('your@email.com')
      const passwordInput = screen.getByPlaceholderText('パスワード（6文字以上）')
      const loginButton = screen.getByRole('button', { name: /ログイン/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'password123'
        )
      })
    })

    it('ログインエラー時にエラーメッセージが表示される', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'))

      render(<AuthPage />)

      const emailInput = screen.getByPlaceholderText('your@email.com')
      const passwordInput = screen.getByPlaceholderText('パスワード（6文字以上）')
      const loginButton = screen.getByRole('button', { name: /ログイン/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrong' } })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/ログインに失敗しました/i)).toBeInTheDocument()
      })
    })
  })

  describe('新規登録機能', () => {
    it('メールアドレスとパスワードで新規登録できる', async () => {
      const mockUser = { uid: 'new-uid', email: 'new@example.com' }
      mockSignUp.mockResolvedValueOnce({ user: mockUser } as any)

      render(<AuthPage />)

      // 新規登録タブに切り替え
      fireEvent.click(screen.getByRole('button', { name: /新規登録/i }))

      const emailInput = screen.getByPlaceholderText('your@email.com')
      const passwordInput = screen.getByPlaceholderText('パスワード（6文字以上）')
      const signUpButton = screen.getByRole('button', { name: /新規登録する/i })

      fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(signUpButton)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          expect.anything(),
          'new@example.com',
          'password123'
        )
      })
    })

    it('バリデーションエラーが表示される', async () => {
      render(<AuthPage />)

      fireEvent.click(screen.getByRole('button', { name: /新規登録/i }))

      const emailInput = screen.getByPlaceholderText('your@email.com')
      const passwordInput = screen.getByPlaceholderText('パスワード（6文字以上）')
      const signUpButton = screen.getByRole('button', { name: /新規登録する/i })

      // 無効なメールアドレス
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.change(passwordInput, { target: { value: '12345' } }) // 6文字未満
      fireEvent.click(signUpButton)

      // フォームのHTML5バリデーションが発火することを期待
      await waitFor(() => {
        expect(mockSignUp).not.toHaveBeenCalled()
      })
    })
  })

  describe('入力フィールドのバリデーション', () => {
    it('メールアドレスフィールドがemailタイプである', () => {
      render(<AuthPage />)

      const emailInput = screen.getByPlaceholderText('your@email.com')
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('パスワードフィールドがpasswordタイプである', () => {
      render(<AuthPage />)

      const passwordInput = screen.getByPlaceholderText('パスワード（6文字以上）')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('パスワードフィールドの最小文字数が6文字である', () => {
      render(<AuthPage />)

      const passwordInput = screen.getByPlaceholderText('パスワード（6文字以上）')
      expect(passwordInput).toHaveAttribute('minLength', '6')
    })
  })
})
