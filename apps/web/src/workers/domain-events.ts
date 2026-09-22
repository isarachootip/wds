/**
 * Domain Events Worker
 * - Picks up pending events, runs handlers, applies exponential backoff
 * - Events failing 5 times → status='dead' (dead-letter)
 */
import { eq, and, lt, inArray, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { domainEvents } from '@wds/db'

export const MAX_ATTEMPTS = 5

/** Calculate next retry delay using exponential backoff: 2^(attempt-1) seconds */
export function nextRetryDelayMs(attempt: number): number {
  return Math.pow(2, attempt - 1) * 1000
}

/** Check if an event should be retried now based on its attempt count and last error time */
export function shouldRetryNow(attempt: number, processedAt: Date | null): boolean {
  if (!processedAt) return true
  const delayMs = nextRetryDelayMs(attempt)
  return Date.now() - processedAt.getTime() >= delayMs
}

// ─── Event Handlers ────────────────────────────────────────────────────────────
type EventHandler = (payload: unknown, eventId: string) => Promise<void>

const handlers: Record<string, EventHandler> = {
  'lead.created_from_line': async (payload) => {
    // TODO Phase 7: notify duty sales via LINE Flex Message
    console.log('[event] lead.created_from_line', payload)
  },
  'order.ready_to_deliver': async (payload) => {
    // TODO Phase 7: notify warehouse
    console.log('[event] order.ready_to_deliver', payload)
  },
  'delivery.completed': async (payload) => {
    // TODO Phase 7: send LINE Flex Message to customer
    console.log('[event] delivery.completed', payload)
  },
  'delivery.failed_3_times': async (payload) => {
    // TODO Phase 7: send alert to manager
    console.log('[event] delivery.failed_3_times', payload)
  },
  'order.closed': async (payload) => {
    console.log('[event] order.closed', payload)
  },
  'pmt.qc.passed': async (payload, eventId) => {
    console.log(`[event] pmt.qc.passed (${eventId}):`, payload)
  },
}

// ─── Process Batch ─────────────────────────────────────────────────────────────
export interface ProcessResult {
  processed: number
  succeeded: number
  failed: number
  dead: number
}

export async function processPendingEvents(batchSize = 50): Promise<ProcessResult> {
  const db = getDb()
  const result: ProcessResult = { processed: 0, succeeded: 0, failed: 0, dead: 0 }

  // Pick pending events
  const pendingEvents = await db
    .select()
    .from(domainEvents)
    .where(
      and(
        inArray(domainEvents.status, ['pending', 'failed']),
        lt(domainEvents.attempts, MAX_ATTEMPTS),
      )
    )
    .limit(batchSize)

  for (const event of pendingEvents) {
    // Check backoff — if not ready to retry yet, skip
    if (event.status === 'failed' && !shouldRetryNow(event.attempts ?? 0, event.processedAt)) {
      continue
    }

    result.processed++
    const handler = handlers[event.name]
    const newAttempts = (event.attempts ?? 0) + 1

    try {
      if (handler) {
        await handler(event.payload, event.id)
      }
      // Mark processed
      await db.update(domainEvents)
        .set({ status: 'processed', processedAt: new Date(), attempts: newAttempts, lastError: null })
        .where(eq(domainEvents.id, event.id))
      result.succeeded++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      const isDead = newAttempts >= MAX_ATTEMPTS

      await db.update(domainEvents)
        .set({
          status: isDead ? 'dead' : 'failed',
          attempts: newAttempts,
          processedAt: new Date(),
          lastError: errorMsg,
        })
        .where(eq(domainEvents.id, event.id))

      if (isDead) {
        result.dead++
        console.error(`[events] Event ${event.id} (${event.name}) entered dead-letter after ${newAttempts} attempts`)
      } else {
        result.failed++
        console.warn(`[events] Event ${event.id} failed attempt ${newAttempts}/${MAX_ATTEMPTS}: ${errorMsg}`)
      }
    }
  }

  return result
}
