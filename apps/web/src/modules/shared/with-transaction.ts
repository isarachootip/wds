import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withTransaction<T>(
  db: PostgresJsDatabase<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (tx: PostgresJsDatabase<any>) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => fn(tx))
}
