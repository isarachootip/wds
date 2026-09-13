'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getPendingItems, syncQueue, resetFailed, type QueueItem, type SyncHandler } from '@/lib/offline-queue'

export function useOfflineQueue(handler: SyncHandler) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOnline(navigator.onLine)

    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const refreshCount = useCallback(async () => {
    const items = await getPendingItems()
    setPendingCount(items.length)
  }, [])

  const syncNow = useCallback(async () => {
    if (!isOnline || syncing) return
    setSyncing(true)
    try {
      await resetFailed()
      await syncQueue(handlerRef.current)
      setLastSyncAt(new Date())
      await refreshCount()
    } finally {
      setSyncing(false)
    }
  }, [isOnline, syncing, refreshCount])

  // Auto-sync when back online
  useEffect(() => {
    if (isOnline) syncNow()
  }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh count every 5s
  useEffect(() => {
    refreshCount()
    const interval = setInterval(refreshCount, 5000)
    return () => clearInterval(interval)
  }, [refreshCount])

  return { isOnline, pendingCount, syncNow, syncing, lastSyncAt, refreshCount }
}
