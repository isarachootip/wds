// apps/web/src/db/seed.ts
import { runSeed } from '@wds/db/seed'

export { runSeed }

export async function executeSeed(databaseUrl?: string) {
  const url = databaseUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres'
  return runSeed(url)
}
