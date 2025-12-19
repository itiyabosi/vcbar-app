import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h2 className="text-4xl font-bold text-white mb-2">404</h2>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">
          ページが見つかりません
        </h3>
        <p className="text-gray-400 mb-6">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Link
          href="/"
          className="inline-block bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
