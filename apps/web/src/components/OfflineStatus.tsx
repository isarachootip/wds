'use client'

import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import type { QueueItem } from '@/lib/offline-queue'

// Dummy handler placeholder — real handler provided per-page
const noopHandler = async (_item: QueueItem) => {}

export function OfflineStatus() {
  const { isOnline, pendingCount, syncing, lastSyncAt, syncNow } = useOfflineQueue(noopHandler)

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      data-testid="offline-status"
      className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium ${
        isOnline ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-800 text-white'
      }`}
    >
      {!isOnline ? (
        <span>📵 ออฟไลน์ — ค้าง sync {pendingCount} รายการ</span>
      ) : syncing ? (
        <span>🔄 กำลัง sync {pendingCount} รายการ...</span>
      ) : (
        <span>
          ⚠️ ค้าง sync {pendingCount} รายการ{' '}
          <button onClick={syncNow} className="underline ml-1">sync เดี๋ยวนี้</button>
        </span>
      )}
    </div>
  )
}
