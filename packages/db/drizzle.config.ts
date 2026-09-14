import type { Config } from 'drizzle-kit'
import { existsSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(__dirname, '../../.env')
if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath)
  } catch {}
}

export default {
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://neondb_owner:npg_yZnoLR05TqQW@ep-weathered-cake-a142l6vv.ap-southeast-1.aws.neon.tech/thai_watsadu_wds?sslmode=require',
  },
} satisfies Config
