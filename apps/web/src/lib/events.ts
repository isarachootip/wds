import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { eq, and, lt } from 'drizzle-orm'

export type EventHandler = (event: DomainEvent) => Promise<void>
export type EventHandlers = Record<string, EventHandler>

export interface DomainEvent {
  id: string
  name: string
  aggregate: string
  aggregateId: string
  payload: Record<string, unknown>
  occurredAt: Date
  attempts: number
  status?: string
  lastError?: string | null
  processedAt?: Date | null
}

// emit must be called inside a Drizzle transaction
export async function emit(
  tx: PostgresJsDatabase<any>,
  domainEventsTable: any,
  name: string,
  aggregate: string,
  aggregateId: string,
  payload: Record<string, unknown>
): Promise<void> {
  await tx.insert(domainEventsTable).values({
    name,
    aggregate,
    aggregateId,
    payload,
    status: 'pending',
    attempts: 0,
    occurredAt: new Date(),
  })
}

export const MAX_ATTEMPTS = 3

export async function processEvents(
  db: PostgresJsDatabase<any>,
  domainEventsTable: any,
  handlers: EventHandlers
): Promise<{ processed: number; failed: number }> {
  // Query pending events with attempts under MAX_ATTEMPTS
  let pendingEvents: any[] = []

  try {
    if (typeof db.select === 'function') {
      const query = db.select().from(domainEventsTable)
      if (typeof query.where === 'function') {
        pendingEvents = await query.where(
          and(
            eq(domainEventsTable.status, 'pending'),
            lt(domainEventsTable.attempts, MAX_ATTEMPTS)
          )
        )
      } else {
        pendingEvents = await query
      }
    }
  } catch (e) {
    console.error('[OutboxWorker] Error querying pending events:', e)
    return { processed: 0, failed: 0 }
  }

  let processed = 0
  let failed = 0

  for (const event of pendingEvents) {
    const handler = handlers[event.name]
    if (!handler) {
      continue
    }

    try {
      await handler(event)

      // Mark as processed
      if (typeof db.update === 'function') {
        await db
          .update(domainEventsTable)
          .set({
            status: 'processed',
            processedAt: new Date(),
          })
          .where(eq(domainEventsTable.id, event.id))
      }
      processed++
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      const newAttempts = (event.attempts || 0) + 1

      if (typeof db.update === 'function') {
        await db
          .update(domainEventsTable)
          .set({
            attempts: newAttempts,
            status: newAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
            lastError: errorMsg,
          })
          .where(eq(domainEventsTable.id, event.id))
      }
      failed++
    }
  }

  return { processed, failed }
}
