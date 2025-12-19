'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error('[ERROR]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          エラーが発生しました
        </h2>
        <p className="text-gray-400 mb-6">
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-primary hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            もう一度試す
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            ホームに戻る
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 p-4 bg-red-900/20 rounded text-left">
            <p className="text-xs text-red-400 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
