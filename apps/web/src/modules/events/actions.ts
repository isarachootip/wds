'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { domainEvents } from '@wds/db'

export async function retryEventAction(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    await db.update(domainEvents)
      .set({ status: 'pending', attempts: 0, lastError: null, processedAt: null })
      .where(eq(domainEvents.id, eventId))
    revalidatePath('/wds/admin/events')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

export async function markDeadAction(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb()
    await db.update(domainEvents)
      .set({ status: 'dead' })
      .where(eq(domainEvents.id, eventId))
    revalidatePath('/wds/admin/events')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}

export async function processEventsNowAction(): Promise<{ success: boolean; result?: object; error?: string }> {
  try {
    const { processPendingEvents } = await import('@/workers/domain-events')
    const result = await processPendingEvents(50)
    revalidatePath('/wds/admin/events')
    return { success: true, result }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error' }
  }
}
