import { describe, it, expect } from 'vitest'
import {
  calculateLine, calculateQuotation, formatQtNumber, parseQtNumber,
  bahtToSatang, satangToBaht
} from './qt-calc'

describe('calculateLine', () => {
  it('qty=1, price=10000 satang, discount=0 → amount=10000', () => {
    const r = calculateLine({ qty: 1, unitPriceSatang: 10000, discountSatang: 0 })
    expect(r.grossSatang).toBe(10000)
    expect(r.amountSatang).toBe(10000)
  })

  it('qty=3, price=50000, discount=5000 → gross=150000, amount=145000', () => {
    const r = calculateLine({ qty: 3, unitPriceSatang: 50000, discountSatang: 5000 })
    expect(r.grossSatang).toBe(150000)
    expect(r.amountSatang).toBe(145000)
  })

  it('discount cannot exceed gross', () => {
    const r = calculateLine({ qty: 1, unitPriceSatang: 10000, discountSatang: 99999 })
    expect(r.amountSatang).toBe(0)
  })

  it('qty=0 → gross=0', () => {
    const r = calculateLine({ qty: 0, unitPriceSatang: 10000, discountSatang: 0 })
    expect(r.grossSatang).toBe(0)
    expect(r.amountSatang).toBe(0)
  })
})

describe('calculateQuotation — VAT exclusive (บวกนอก)', () => {
  const items = [
    { qty: 2, unitPriceSatang: 100000, discountSatang: 0 },  // 200,000 satang
    { qty: 1, unitPriceSatang: 50000, discountSatang: 5000 }, // 45,000 satang
  ]

  it('subtotal=245000, no bill discount, VAT 7% exclusive', () => {
    const r = calculateQuotation(items, 0, 7, 'exclusive')
    expect(r.subtotalSatang).toBe(245000)
    expect(r.afterDiscountSatang).toBe(245000)
    expect(r.vatAmountSatang).toBe(Math.round(245000 * 7 / 100)) // 17150
    expect(r.totalSatang).toBe(245000 + 17150) // 262150
  })

  it('with bill discount 10000 satang', () => {
    const r = calculateQuotation(items, 10000, 7, 'exclusive')
    expect(r.afterDiscountSatang).toBe(235000)
    expect(r.vatAmountSatang).toBe(Math.round(235000 * 7 / 100)) // 16450
    expect(r.totalSatang).toBe(235000 + 16450) // 251450
  })

  it('VAT 0%', () => {
    const r = calculateQuotation(items, 0, 0, 'exclusive')
    expect(r.vatAmountSatang).toBe(0)
    expect(r.totalSatang).toBe(245000)
  })

  it('bill discount = entire subtotal → total=0', () => {
    const r = calculateQuotation(items, 245000, 7, 'exclusive')
    expect(r.afterDiscountSatang).toBe(0)
    expect(r.vatAmountSatang).toBe(0)
    expect(r.totalSatang).toBe(0)
  })

  it('rounding: 1 satang item VAT 7%', () => {
    const r = calculateQuotation([{ qty: 1, unitPriceSatang: 1, discountSatang: 0 }], 0, 7, 'exclusive')
    expect(r.vatAmountSatang).toBe(Math.round(1 * 7 / 100)) // 0 (rounds down)
    expect(r.totalSatang).toBe(1)
  })

  it('multiple items no discounts', () => {
    const r = calculateQuotation([
      { qty: 10, unitPriceSatang: 10000, discountSatang: 0 },
      { qty: 5, unitPriceSatang: 20000, discountSatang: 0 },
    ], 0, 7, 'exclusive')
    expect(r.subtotalSatang).toBe(200000)
    expect(r.vatAmountSatang).toBe(14000)
    expect(r.totalSatang).toBe(214000)
  })
})

describe('calculateQuotation — VAT inclusive (รวมใน)', () => {
  it('amount 10700 satang inclusive 7% → vat=700, subtotal before vat=10000', () => {
    const r = calculateQuotation(
      [{ qty: 1, unitPriceSatang: 10700, discountSatang: 0 }],
      0, 7, 'inclusive'
    )
    expect(r.subtotalSatang).toBe(10700)
    expect(r.vatAmountSatang).toBe(Math.round(10700 * 7 / 107)) // 700
    expect(r.totalSatang).toBe(10700) // total unchanged (VAT already included)
  })

  it('inclusive VAT + bill discount', () => {
    const r = calculateQuotation(
      [{ qty: 1, unitPriceSatang: 21400, discountSatang: 0 }],
      700, 7, 'inclusive'
    )
    expect(r.afterDiscountSatang).toBe(20700)
    expect(r.vatAmountSatang).toBe(Math.round(20700 * 7 / 107))
    expect(r.totalSatang).toBe(20700)
  })
})

describe('formatQtNumber / parseQtNumber', () => {
  it('formatQtNumber seq=1, 2026-09-11 → QT-202609-0001', () => {
    expect(formatQtNumber(1, new Date('2026-09-11'))).toBe('QT-202609-0001')
  })

  it('formatQtNumber seq=9999 → QT-202609-9999', () => {
    expect(formatQtNumber(9999, new Date('2026-09-11'))).toBe('QT-202609-9999')
  })

  it('50 sequential numbers are all unique', () => {
    const refDate = new Date('2026-09-01')
    const numbers = Array.from({ length: 50 }, (_, i) => formatQtNumber(i + 1, refDate))
    const unique = new Set(numbers)
    expect(unique.size).toBe(50)
    expect(numbers[0]).toBe('QT-202609-0001')
    expect(numbers[49]).toBe('QT-202609-0050')
  })

  it('all 50 concurrent calls produce unique numbers (simulating nextval)', () => {
    // Simulate atomic sequence increments (Postgres nextval is atomic)
    let seq = 0
    const nextVal = () => ++seq  // simulates nextval() — no gaps, no duplicates
    const refDate = new Date('2026-09-01')
    const results = Promise.all(
      Array.from({ length: 50 }, () =>
        Promise.resolve(formatQtNumber(nextVal(), refDate))
      )
    )
    return results.then(numbers => {
      const unique = new Set(numbers)
      expect(unique.size).toBe(50)
      expect(numbers.every(n => /^QT-202609-\d{4}$/.test(n))).toBe(true)
    })
  })

  it('parseQtNumber roundtrip', () => {
    const parsed = parseQtNumber('QT-202609-0042')
    expect(parsed).not.toBeNull()
    expect(parsed!.seq).toBe(42)
    expect(parsed!.yearMonth).toBe('202609')
  })

  it('parseQtNumber invalid returns null', () => {
    expect(parseQtNumber('INVALID')).toBeNull()
    expect(parseQtNumber('QT-20260-0001')).toBeNull()
  })
})

describe('bahtToSatang / satangToBaht', () => {
  it('1500.50 baht → 150050 satang', () => {
    expect(bahtToSatang('1500.50')).toBe(150050)
  })

  it('100 baht → 10000 satang', () => {
    expect(bahtToSatang('100')).toBe(10000)
  })

  it('150050 satang → "1,500.50"', () => {
    const formatted = satangToBaht(150050)
    expect(formatted).toContain('1,500')
    expect(formatted).toContain('50')
  })

  it('invalid string → 0 satang', () => {
    expect(bahtToSatang('abc')).toBe(0)
  })
})
