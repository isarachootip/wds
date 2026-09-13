import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

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
  // In a real implementation this would fetch pending events
  // For the purpose of the skeleton, we mock the counts
  return { processed: 0, failed: 0 }
}
