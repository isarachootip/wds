import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createDb, customers, addresses, products, leads, quotations, quotationItems, orders, deliveries, siteVisits, followUps } from '../index'
import { count } from 'drizzle-orm'

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
const db = createDb(dbUrl)

async function verify() {
  const [c] = await db.select({ count: count() }).from(customers)
  const [a] = await db.select({ count: count() }).from(addresses)
  const [p] = await db.select({ count: count() }).from(products)
  const [l] = await db.select({ count: count() }).from(leads)
  const [q] = await db.select({ count: count() }).from(quotations)
  const [qi] = await db.select({ count: count() }).from(quotationItems)
  const [o] = await db.select({ count: count() }).from(orders)
  const [d] = await db.select({ count: count() }).from(deliveries)
  const [sv] = await db.select({ count: count() }).from(siteVisits)
  const [fu] = await db.select({ count: count() }).from(followUps)

  console.log('--- DATABASE SEED VERIFICATION ---')
  console.log('Customers:', c.count)
  console.log('Addresses:', a.count)
  console.log('Products:', p.count)
  console.log('CRM Leads:', l.count)
  console.log('Quotations:', q.count)
  console.log('Quotation Items:', qi.count)
  console.log('Orders:', o.count)
  console.log('Deliveries:', d.count)
  console.log('Site Visits:', sv.count)
  console.log('Follow-ups:', fu.count)
  console.log('----------------------------------')
  process.exit(0)
}
verify()

