import { describe, it, expect } from 'vitest'
import {
  calculateLine,
  calculateQuotation,
  bahtToSatang,
  satangToBaht,
  formatQtNumber,
  parseQtNumber,
} from '@/lib/qt-calc'

describe('Phase 3 Acceptance Criteria 2: Quotation Financial Math & Zero-Float Satang Engine', () => {
  describe('Line Calculations (calculateLine)', () => {
    it('1. Computes line item gross and amount with line discount', () => {
      // 5 units @ 120.50 THB (12,050 Satang), line discount 50.00 THB (5,000 Satang)
      const line = calculateLine({
        qty: 5,
        unitPriceSatang: 12050,
        discountSatang: 5000,
      })

      expect(line.grossSatang).toBe(60250) // 5 * 12050
      expect(line.discountSatang).toBe(5000)
      expect(line.amountSatang).toBe(55250) // 60250 - 5000
    })

    it('2. Caps line discount at gross so line amount never goes negative', () => {
      const line = calculateLine({
        qty: 2,
        unitPriceSatang: 1000,
        discountSatang: 50000,
      })

      expect(line.grossSatang).toBe(2000)
      expect(line.amountSatang).toBe(0)
    })
  })

  describe('VAT Exclusive (บวกนอก) & Bill Discount & Integer Rounding', () => {
    it('3. Computes subtotal, bill discount, VAT 7% exclusive, and rounds Satang via round-half-up', () => {
      // Line 1: 3 x 333.33 THB = 999.99 THB (99,999 Satang)
      // Line 2: 1 x 500.00 THB = 500.00 THB (50,000 Satang)
      // Subtotal = 149,999 Satang
      // Bill discount = 10,000 Satang
      // After discount = 139,999 Satang
      // VAT 7% exclusive = 139999 * 0.07 = 9799.93 -> rounds to 9800 Satang
      // Total = 139999 + 9800 = 149799 Satang
      const items = [
        { qty: 3, unitPriceSatang: 33333, discountSatang: 0 },
        { qty: 1, unitPriceSatang: 50000, discountSatang: 0 },
      ]
      const r = calculateQuotation(items, 10000, 7, 'exclusive')

      expect(r.subtotalSatang).toBe(149999)
      expect(r.billDiscountSatang).toBe(10000)
      expect(r.afterDiscountSatang).toBe(139999)
      expect(r.vatAmountSatang).toBe(9800)
      expect(r.totalSatang).toBe(149799)
    })

    it('4. Correctly applies 0% VAT exclusive', () => {
      const items = [{ qty: 2, unitPriceSatang: 25000, discountSatang: 0 }]
      const r = calculateQuotation(items, 5000, 0, 'exclusive')

      expect(r.subtotalSatang).toBe(50000)
      expect(r.afterDiscountSatang).toBe(45000)
      expect(r.vatAmountSatang).toBe(0)
      expect(r.totalSatang).toBe(45000)
    })
  })

  describe('VAT Inclusive (รวมใน)', () => {
    it('5. Computes VAT 7% inclusive: VAT extracted from after-discount total without changing total', () => {
      // 10,700 THB total (1,070,000 Satang)
      // afterDiscount = 1,070,000 Satang
      // VAT 7% inclusive = (1070000 * 7) / 107 = 70,000 Satang
      // total = 1,070,000 Satang
      const items = [{ qty: 1, unitPriceSatang: 1070000, discountSatang: 0 }]
      const r = calculateQuotation(items, 0, 7, 'inclusive')

      expect(r.subtotalSatang).toBe(1070000)
      expect(r.afterDiscountSatang).toBe(1070000)
      expect(r.vatAmountSatang).toBe(70000)
      expect(r.totalSatang).toBe(1070000)
    })

    it('6. Handles fractional VAT inclusive with exact Satang rounding', () => {
      // Total 100.00 THB (10,000 Satang)
      // VAT = 10000 * 7 / 107 = 70000 / 107 = 654.2056... -> 654 Satang (6.54 THB)
      const items = [{ qty: 1, unitPriceSatang: 10000, discountSatang: 0 }]
      const r = calculateQuotation(items, 0, 7, 'inclusive')

      expect(r.totalSatang).toBe(10000)
      expect(r.vatAmountSatang).toBe(654)
    })
  })

  describe('Formatting & Parsing Utilities', () => {
    it('7. Converts Baht string to Satang and Satang to Baht string cleanly', () => {
      expect(bahtToSatang('1234.56')).toBe(123456)
      expect(bahtToSatang('0.01')).toBe(1)
      expect(bahtToSatang('')).toBe(0)
      expect(satangToBaht(123456)).toBe('1,234.56')
      expect(satangToBaht(50)).toBe('0.50')
    })

    it('8. Validates and parses QT number formats', () => {
      const parsed = parseQtNumber('QT-202609-0042')
      expect(parsed).toEqual({ prefix: 'QT', yearMonth: '202609', seq: 42 })

      const formatted = formatQtNumber(42, new Date('2026-09-01T00:00:00Z'))
      expect(formatted).toBe('QT-202609-0042')

      expect(parseQtNumber('INVALID-QT')).toBeNull()
    })
  })
})
