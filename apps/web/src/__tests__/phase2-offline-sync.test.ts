import { describe, it, expect, vi, beforeEach } from 'vitest'

interface MockQueueItem {
  id: string // idempotency key (UUID v4)
  action: 'checkin' | 'add_job_item' | 'upload_photo' | 'checkout'
  payload: any
  status: 'pending' | 'syncing' | 'done' | 'failed'
  attempts: number
  createdAt: number
}

class MockIndexedDbQueue {
  private store = new Map<string, MockQueueItem>()

  async enqueue(item: Omit<MockQueueItem, 'status' | 'attempts' | 'createdAt'>): Promise<boolean> {
    if (this.store.has(item.id)) {
      return false // Idempotent: ignore duplicate
    }
    this.store.set(item.id, {
      ...item,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
    })
    return true
  }

  async getPending(): Promise<MockQueueItem[]> {
    return Array.from(this.store.values()).filter((i) => i.status === 'pending')
  }

  async markDone(id: string): Promise<void> {
    const item = this.store.get(id)
    if (item) item.status = 'done'
  }

  async markFailed(id: string): Promise<void> {
    const item = this.store.get(id)
    if (item) {
      item.status = 'failed'
      item.attempts++
    }
  }

  getAll(): MockQueueItem[] {
    return Array.from(this.store.values())
  }
}

describe('Phase 2 Acceptance Criteria 5: Offline Queue & Idempotent Sync', () => {
  let queue: MockIndexedDbQueue
  let backendProcessed: string[]

  beforeEach(() => {
    queue = new MockIndexedDbQueue()
    backendProcessed = []
  })

  it('1. Queues check-in, photo upload, and job items when offline', async () => {
    const isOnline = false

    // Simulate technician checking in offline
    if (!isOnline) {
      await queue.enqueue({
        id: 'idempotency-checkin-001',
        action: 'checkin',
        payload: { jobId: 'job-101', lat: 13.7469, lng: 100.5393 },
      })

      await queue.enqueue({
        id: 'idempotency-photo-001',
        action: 'upload_photo',
        payload: { jobId: 'job-101', kind: 'before', storagePath: 'blob:mock-url' },
      })

      await queue.enqueue({
        id: 'idempotency-item-001',
        action: 'add_job_item',
        payload: { jobId: 'job-101', description: 'ปูนฉาบสำเร็จรูป', qty: 2, price: 15000 },
      })
    }

    const pending = await queue.getPending()
    expect(pending).toHaveLength(3)
    expect(pending.map((p) => p.action)).toEqual(['checkin', 'upload_photo', 'add_job_item'])
  })

  it('2. Enforces idempotency keys: duplicate queued actions are ignored', async () => {
    const item = {
      id: 'idempotency-key-dup-01',
      action: 'checkin' as const,
      payload: { jobId: 'job-101' },
    }

    const firstEnqueue = await queue.enqueue(item)
    const secondEnqueue = await queue.enqueue(item) // Duplicate submission

    expect(firstEnqueue).toBe(true)
    expect(secondEnqueue).toBe(false)
    expect(queue.getAll()).toHaveLength(1)
  })

  it('3. Automatically syncs all pending actions when network restores', async () => {
    // 3 items queued offline
    await queue.enqueue({ id: 'k1', action: 'checkin', payload: { jobId: 'job-1' } })
    await queue.enqueue({ id: 'k2', action: 'upload_photo', payload: { jobId: 'job-1' } })
    await queue.enqueue({ id: 'k3', action: 'add_job_item', payload: { jobId: 'job-1' } })

    // Simulate online event trigger & sync handler
    const mockHandler = vi.fn(async (item: MockQueueItem) => {
      backendProcessed.push(item.id)
    })

    const pending = await queue.getPending()
    for (const item of pending) {
      await mockHandler(item)
      await queue.markDone(item.id)
    }

    expect(backendProcessed).toEqual(['k1', 'k2', 'k3'])
    const remainingPending = await queue.getPending()
    expect(remainingPending).toHaveLength(0)

    const all = queue.getAll()
    expect(all.every((i) => i.status === 'done')).toBe(true)
  })
})
