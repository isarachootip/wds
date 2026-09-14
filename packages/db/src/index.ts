import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export function createDb(connectionString: string) {
  const needsSsl =
    connectionString.includes('sslmode=require') ||
    connectionString.includes('neon.tech') ||
    connectionString.includes('supabase.co')
  const client = postgres(connectionString, {
    ssl: needsSsl ? 'require' : false,
    max: 10,
  })
  return drizzle(client, { schema })
}

export type Db = ReturnType<typeof createDb>
export * from './schema'
