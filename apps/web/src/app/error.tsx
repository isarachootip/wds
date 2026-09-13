'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Application Error]:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">เกิดข้อผิดพลาดในการโหลดหน้าเว็บ</h2>
        <p className="text-sm text-slate-600">
          {error.message || 'ระบบไม่สามารถแสดงผลหน้านี้ได้'}
        </p>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    </div>
  )
}
