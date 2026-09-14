// apps/web/src/db/index.ts
import { createDb } from '@wds/db'
import * as schema from './schema'

export * from './schema'
export { createDb }

export function getDb(connectionString?: string) {
  const url = connectionString || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres'
  return createDb(url)
}
