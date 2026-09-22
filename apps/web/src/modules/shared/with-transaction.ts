import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

export async function withTransaction<T>(
  db: PostgresJsDatabase<any>,
  fn: (tx: PostgresJsDatabase<any>) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => fn(tx))
}
