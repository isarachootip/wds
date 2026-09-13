#!/usr/bin/env tsx
/**
 * Import customers from Excel file
 * 
 * Usage:
 *   tsx scripts/import-customers.ts --file customers.xlsx
 *   tsx scripts/import-customers.ts --file customers.xlsx --dry-run
 * 
 * Expected Excel columns (row 1 = header):
 *   A: name (required)
 *   B: phone (required, format: 0X-XXXX-XXXX or 0XXXXXXXXX)
 *   C: email (optional)
 *   D: tax_id (optional)
 *   E: line_ref (optional)
 */
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'

// Parse CLI args
const args = process.argv.slice(2)
const fileArg = args.find(a => a.startsWith('--file='))?.split('=')[1]
  ?? args[args.indexOf('--file') + 1]
const isDryRun = args.includes('--dry-run')

if (!fileArg) {
  console.error('Usage: tsx scripts/import-customers.ts --file <path.xlsx> [--dry-run]')
  process.exit(1)
}

const filePath = path.resolve(fileArg)
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

interface CustomerRow {
  rowNum: number
  name: string
  phone: string
  email?: string
  taxId?: string
  lineRef?: string
}

interface ValidationError {
  rowNum: number
  field: string
  message: string
  value: string
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, '')
}

function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone)
  return /^0[0-9]{8,9}$/.test(normalized)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function main() {
  console.log(`\n📊 WDS Customer Import`)
  console.log(`   File: ${filePath}`)
  console.log(`   Mode: ${isDryRun ? '🔵 DRY RUN (no DB writes)' : '🟢 LIVE'}`)
  console.log()

  // Read Excel
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1, defval: '' })

  if (rawRows.length < 2) {
    console.error('❌ File is empty or has no data rows')
    process.exit(1)
  }

  // Skip header row
  const dataRows = rawRows.slice(1) as unknown[][]

  const valid: CustomerRow[] = []
  const errors: ValidationError[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNum = i + 2 // Excel row number (1-indexed, +1 for header)
    const name = String(row[0] ?? '').trim()
    const phone = String(row[1] ?? '').trim()
    const email = String(row[2] ?? '').trim()
    const taxId = String(row[3] ?? '').trim()
    const lineRef = String(row[4] ?? '').trim()

    // Skip empty rows
    if (!name && !phone) continue

    let hasError = false

    if (!name) {
      errors.push({ rowNum, field: 'name', message: 'ชื่อลูกค้าไม่ควรว่าง', value: '' })
      hasError = true
    }

    if (!phone) {
      errors.push({ rowNum, field: 'phone', message: 'เบอร์โทรไม่ควรว่าง', value: '' })
      hasError = true
    } else if (!validatePhone(phone)) {
      errors.push({ rowNum, field: 'phone', message: `รูปแบบเบอร์โทรไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0, 9-10 หลัก)`, value: phone })
      hasError = true
    }

    if (email && !validateEmail(email)) {
      errors.push({ rowNum, field: 'email', message: 'รูปแบบ email ไม่ถูกต้อง', value: email })
      hasError = true
    }

    if (!hasError) {
      valid.push({
        rowNum,
        name,
        phone: normalizePhone(phone),
        email: email || undefined,
        taxId: taxId || undefined,
        lineRef: lineRef || undefined,
      })
    }
  }

  // Summary
  console.log(`📋 Summary:`)
  console.log(`   Total rows: ${dataRows.length}`)
  console.log(`   ✅ Valid: ${valid.length}`)
  console.log(`   ❌ Errors: ${errors.length}`)
  console.log()

  if (errors.length > 0) {
    console.log(`❌ Validation Errors:`)
    for (const err of errors) {
      console.log(`   Row ${err.rowNum} | ${err.field}: ${err.message} (value: "${err.value}")`)
    }
    console.log()
  }

  if (isDryRun) {
    console.log(`🔵 DRY RUN complete — no data written to DB`)
    if (valid.length > 0) {
      console.log(`   Would import ${valid.length} customers`)
      console.log(`   Preview (first 3):`)
      valid.slice(0, 3).forEach(c =>
        console.log(`     - ${c.name} | ${c.phone} | ${c.email ?? '-'}`)
      )
    }
    return
  }

  if (valid.length === 0) {
    console.log('⚠️ No valid rows to import')
    return
  }

  // Live import
  console.log(`🟢 Importing ${valid.length} customers...`)

  // Dynamic import to avoid issues when running in dry-run mode without DB
  const { createDb } = await import('../packages/db/src/index.js' as any)
  const { customers } = await import('../packages/db/src/schema/customers.js' as any)
  const postgres = await import('postgres').then(m => m.default)

  const connectionString = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL
  if (!connectionString) {
    console.error('❌ DATABASE_URL or SUPABASE_DB_URL environment variable not set')
    process.exit(1)
  }

  const client = postgres(connectionString, { max: 1 })
  const db = createDb(connectionString)

  let imported = 0
  let skipped = 0

  for (const customer of valid) {
    try {
      await db.insert(customers).values({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        taxId: customer.taxId,
      }).onConflictDoUpdate({
        target: [customers.phone],
        set: {
          name: customer.name,
          email: customer.email,
          updatedAt: new Date(),
        },
      })
      imported++
      process.stdout.write(`\r   Progress: ${imported}/${valid.length}`)
    } catch (e) {
      console.error(`\n   ❌ Row ${customer.rowNum} (${customer.name}): ${e instanceof Error ? e.message : e}`)
      skipped++
    }
  }

  await client.end()
  console.log(`\n\n✅ Import complete: ${imported} imported, ${skipped} skipped`)
}

main().catch(e => { console.error(e); process.exit(1) })
