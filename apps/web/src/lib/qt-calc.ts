/**
 * Quotation calculation engine — pure functions, all amounts in satang (integer)
 * ห้ามใช้ float กับจำนวนเงิน, ใช้ Math.round() สำหรับปัดเศษ
 */

export type VatMode = 'exclusive' | 'inclusive'

export interface LineItemInput {
  qty: number               // integer
  unitPriceSatang: number   // bigint as number
  discountSatang: number    // per-line discount
}

export interface LineItemResult extends LineItemInput {
  grossSatang: number       // qty × unitPriceSatang
  amountSatang: number      // grossSatang - discountSatang
}

export interface QuotationResult {
  lines: LineItemResult[]
  subtotalSatang: number       // Σ amountSatang
  billDiscountSatang: number   // bill-level discount
  afterDiscountSatang: number  // subtotalSatang - billDiscountSatang
  vatRate: number              // 0 or 7
  vatMode: VatMode
  vatAmountSatang: number      // computed VAT
  totalSatang: number          // final total
}

/**
 * Calculate a single line item
 */
export function calculateLine(item: LineItemInput): LineItemResult {
  const gross = item.qty * item.unitPriceSatang
  const discount = Math.min(item.discountSatang, gross) // discount cannot exceed gross
  return {
    ...item,
    grossSatang: gross,
    amountSatang: gross - discount,
  }
}

/**
 * Calculate full quotation
 * VAT exclusive: VAT is added on top of (subtotal - billDiscount)
 * VAT inclusive: VAT is extracted from (subtotal - billDiscount)
 */
export function calculateQuotation(
  items: LineItemInput[],
  billDiscountSatang: number,
  vatRate: number,   // 0-100 integer
  vatMode: VatMode
): QuotationResult {
  const lines = items.map(calculateLine)
  const subtotalSatang = lines.reduce((sum, l) => sum + l.amountSatang, 0)
  const safeDiscount = Math.min(billDiscountSatang, subtotalSatang)
  const afterDiscountSatang = subtotalSatang - safeDiscount

  let vatAmountSatang: number
  let totalSatang: number

  if (vatRate === 0) {
    vatAmountSatang = 0
    totalSatang = afterDiscountSatang
  } else if (vatMode === 'exclusive') {
    // VAT บวกนอก: total = afterDiscount + vat
    vatAmountSatang = Math.round((afterDiscountSatang * vatRate) / 100)
    totalSatang = afterDiscountSatang + vatAmountSatang
  } else {
    // VAT รวมใน: afterDiscount already includes VAT
    // vatAmount = afterDiscount × vatRate / (100 + vatRate)
    vatAmountSatang = Math.round((afterDiscountSatang * vatRate) / (100 + vatRate))
    totalSatang = afterDiscountSatang
  }

  return {
    lines,
    subtotalSatang,
    billDiscountSatang: safeDiscount,
    afterDiscountSatang,
    vatRate,
    vatMode,
    vatAmountSatang,
    totalSatang,
  }
}

/** Format QT number: QT-YYYYMM-NNNN */
export function formatQtNumber(seq: number, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `QT-${year}${month}-${String(seq).padStart(4, '0')}`
}

/** Format SO number: SO-YYYYMM-NNNN */
export function formatSoNumber(seq: number, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `SO-${year}${month}-${String(seq).padStart(4, '0')}`
}

/** Parse QT number to get sequence value */
export function parseQtNumber(number: string): { prefix: string; yearMonth: string; seq: number } | null {
  const match = number.match(/^(QT|SO)-(\d{6})-(\d{4,})$/)
  if (!match) return null
  return { prefix: match[1], yearMonth: match[2], seq: parseInt(match[3], 10) }
}

/** Convert baht string to satang (for UI input) */
export function bahtToSatang(bahtStr: string): number {
  const val = parseFloat(bahtStr)
  if (isNaN(val)) return 0
  return Math.round(val * 100)
}

/** Convert satang to baht for display */
export function satangToBaht(satang: number): string {
  return (satang / 100).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
