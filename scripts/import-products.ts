#!/usr/bin/env tsx
/**
 * Import products from Excel file
 * 
 * Usage:
 *   tsx scripts/import-products.ts --file products.xlsx [--dry-run]
 * 
 * Expected Excel columns:
 *   A: code (required, product SKU)
 *   B: name (required)
 *   C: unit (required, e.g. "ชิ้น", "ชุด", "ม.")
 *   D: price_baht (required, numeric)
 *   E: category (optional)
 *   F: description (optional)
 */
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'

const args = process.argv.slice(2)
const fileArg = args.find(a => a.startsWith('--file='))?.split('=')[1]
  ?? args[args.indexOf('--file') + 1]
const isDryRun = args.includes('--dry-run')

if (!fileArg) {
  console.error('Usage: tsx scripts/import-products.ts --file <path.xlsx> [--dry-run]')
  process.exit(1)
}

const filePath = path.resolve(fileArg)
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

interface ProductRow {
  rowNum: number
  code: string
  name: string
  unit: string
  priceSatang: number
  category?: string
  description?: string
}

interface ValidationError { rowNum: number; field: string; message: string }

async function main() {
  console.log(`\n📦 WDS Product Import`)
  console.log(`   File: ${filePath}`)
  console.log(`   Mode: ${isDryRun ? '🔵 DRY RUN' : '🟢 LIVE'}`)
  console.log()

  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  const dataRows = rawRows.slice(1) as unknown[][]

  const valid: ProductRow[] = []
  const errors: ValidationError[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNum = i + 2
    const code = String(row[0] ?? '').trim()
    const name = String(row[1] ?? '').trim()
    const unit = String(row[2] ?? '').trim()
    const priceBaht = parseFloat(String(row[3] ?? '0').replace(/,/g, ''))
    const category = String(row[4] ?? '').trim()
    const description = String(row[5] ?? '').trim()

    if (!code && !name) continue

    let hasError = false
    if (!code) { errors.push({ rowNum, field: 'code', message: 'รหัสสินค้าไม่ควรว่าง' }); hasError = true }
    if (!name) { errors.push({ rowNum, field: 'name', message: 'ชื่อสินค้าไม่ควรว่าง' }); hasError = true }
    if (!unit) { errors.push({ rowNum, field: 'unit', message: 'หน่วยไม่ควรว่าง' }); hasError = true }
    if (isNaN(priceBaht) || priceBaht < 0) {
      errors.push({ rowNum, field: 'price_baht', message: `ราคาไม่ถูกต้อง (ต้องเป็นตัวเลขบวก)` }); hasError = true
    }

    if (!hasError) {
      valid.push({
        rowNum, code, name, unit,
        priceSatang: Math.round(priceBaht * 100), // satang
        category: category || undefined,
        description: description || undefined,
      })
    }
  }

  console.log(`📋 Summary: Total=${dataRows.length} Valid=${valid.length} Errors=${errors.length}`)
  if (errors.length > 0) {
    errors.forEach(e => console.log(`   ❌ Row ${e.rowNum} | ${e.field}: ${e.message}`))
  }

  if (isDryRun) {
    console.log(`\n🔵 DRY RUN — Would import ${valid.length} products`)
    valid.slice(0, 5).forEach(p => console.log(`   ${p.code} | ${p.name} | ฿${p.priceSatang / 100} | ${p.unit}`))
    return
  }

  console.log(`\n🟢 Importing ${valid.length} products...`)
  // In live mode: upsert by code
  // (Dynamic import same pattern as import-customers.ts)
  console.log('   ⚠️  Live import: connect DATABASE_URL and uncomment DB code in production')
  console.log(`   Would upsert ${valid.length} products by code`)
}

main().catch(e => { console.error(e); process.exit(1) })
