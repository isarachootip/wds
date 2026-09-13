import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

export interface AllowedTransition {
  from: string | '*'
  to: string
}

export interface StateMachineConfig {
  entity: string
  transitions: AllowedTransition[]
}

export class InvalidTransitionError extends Error {
  constructor(entity: string, from: string, to: string) {
    super(`[StateMachine] Invalid transition for ${entity}: '${from}' → '${to}'`)
    this.name = 'InvalidTransitionError'
  }
}

export function isValidTransition(
  config: StateMachineConfig,
  from: string,
  to: string
): boolean {
  return config.transitions.some(
    t => (t.from === '*' || t.from === from) && t.to === to
  )
}

export async function transition(
  db: PostgresJsDatabase<any>,
  auditLogTable: any,
  config: StateMachineConfig,
  entityId: string,
  fromStatus: string,
  toStatus: string,
  actorId: string,
  payload?: Record<string, unknown>
): Promise<void> {
  if (!isValidTransition(config, fromStatus, toStatus)) {
    throw new InvalidTransitionError(config.entity, fromStatus, toStatus)
  }

  await db.insert(auditLogTable).values({
    actorId,
    entity: config.entity,
    entityId,
    action: 'status_change',
    fromStatus,
    toStatus,
    payload: payload ?? null,
    at: new Date(),
  })
}
