import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { runSeed } from './index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../../../.env')
if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath)
  } catch {}
}

const dbUrl =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_yZnoLR05TqQW@ep-weathered-cake-a142l6vv.ap-southeast-1.aws.neon.tech/thai_watsadu_wds?sslmode=require'

console.log('🌱 Starting WDS Data Seeding...')
runSeed(dbUrl)
  .then(() => {
    console.log('🎉 Seeding completed successfully!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  })

