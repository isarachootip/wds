/**
 * Offline action queue backed by IndexedDB
 * Provides idempotent action queuing for offline-first Visit App
 */

const DB_NAME = 'wds_offline'
const DB_VERSION = 1
const STORE_NAME = 'queue'

export interface QueueItem {
  id: string          // idempotency key (UUID v4)
  action: string      // 'checkin' | 'checkout' | 'add_job_item' | 'update_checklist' | 'save_summary' | 'upload_photo'
  payload: unknown
  createdAt: number   // timestamp ms
  attempts: number
  status: 'pending' | 'syncing' | 'done' | 'failed'
  error?: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, mode)
    const store = t.objectStore(STORE_NAME)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueue(item: Omit<QueueItem, 'createdAt' | 'attempts' | 'status'>): Promise<void> {
  // Check if already exists (idempotency)
  const existing = await tx<QueueItem | undefined>('readonly', s => s.get(item.id))
  if (existing) return  // already queued

  await tx('readwrite', s => s.put({
    ...item,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
  } satisfies QueueItem))
}

export async function getPendingItems(): Promise<QueueItem[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, 'readonly')
    const req = t.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve((req.result as QueueItem[]).filter(i => i.status === 'pending'))
    req.onerror = () => reject(req.error)
  })
}

export async function markDone(id: string): Promise<void> {
  const item = await tx<QueueItem | undefined>('readonly', s => s.get(id))
  if (!item) return
  await tx('readwrite', s => s.put({ ...item, status: 'done' }))
}

export async function markFailed(id: string, error: string): Promise<void> {
  const item = await tx<QueueItem | undefined>('readonly', s => s.get(id))
  if (!item) return
  await tx('readwrite', s => s.put({ ...item, status: 'failed', error, attempts: item.attempts + 1 }))
}

export async function resetFailed(): Promise<void> {
  const db = await openDb()
  const items: QueueItem[] = await new Promise((res, rej) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    req.onsuccess = () => res(req.result)
    req.onerror = () => rej(req.error)
  })
  for (const item of items.filter(i => i.status === 'failed' && i.attempts < 3)) {
    await tx('readwrite', s => s.put({ ...item, status: 'pending' }))
  }
}

export type SyncHandler = (item: QueueItem) => Promise<void>

/**
 * Process all pending items in order. Stops on failure, retries up to 3x.
 */
export async function syncQueue(handler: SyncHandler): Promise<{ processed: number; failed: number }> {
  const pending = await getPendingItems()
  let processed = 0
  let failed = 0

  for (const item of pending) {
    try {
      await handler(item)
      await markDone(item.id)
      processed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await markFailed(item.id, msg)
      failed++
    }
  }
  return { processed, failed }
}
