import { describe, it, expect } from 'vitest'
import { runCreditCheck, computeAvailable, isFullyPaid, remainingBalanceSatang, NEW_CUSTOMER_THRESHOLD_SATANG } from './credit'

const BASE: Parameters<typeof runCreditCheck>[0] = {
  onHold: false,
  creditLimitSatang: 10_000_000,    // 100,000 บาท
  outstandingSatang: 0,
  overdueAmountSatang: 0,
  orderTotalSatang: 1_000_000,      // 10,000 บาท
  hasPriorHistory: true,
}

describe('runCreditCheck — 8 cases', () => {
  it('1. on_hold=true → reject', () => {
    const r = runCreditCheck({ ...BASE, onHold: true })
    expect(r.decision).toBe('reject')
    expect(r.reason).toContain('hold')
  })

  it('2. overdue_amount > 0 → hold', () => {
    const r = runCreditCheck({ ...BASE, overdueAmountSatang: 100_00 })
    expect(r.decision).toBe('hold')
    expect(r.reason).toContain('ค้างชำระ')
  })

  it('3. orderTotal > available → hold (เกินวงเงิน)', () => {
    // outstanding=9,000,000 satang → available=1,000,000 satang, order=1,000,001 satang
    const r = runCreditCheck({ ...BASE, outstandingSatang: 9_000_000, orderTotalSatang: 1_000_001 })
    expect(r.decision).toBe('hold')
    expect(r.reason).toContain('เกินวงเงิน')
  })

  it('4. orderTotal = available (พอดีวงเงิน) → pass', () => {
    // limit=1,000,000 outstanding=0 order=1,000,000
    const r = runCreditCheck({ ...BASE, creditLimitSatang: 1_000_000, orderTotalSatang: 1_000_000 })
    expect(r.decision).toBe('pass')
  })

  it('5. ลูกค้าใหม่ + order > 50,000 บาท → hold', () => {
    const r = runCreditCheck({ ...BASE, hasPriorHistory: false, orderTotalSatang: NEW_CUSTOMER_THRESHOLD_SATANG + 1 })
    expect(r.decision).toBe('hold')
    expect(r.reason).toContain('ลูกค้าใหม่')
  })

  it('6. ลูกค้าใหม่ + order = 50,000 บาท พอดี → pass', () => {
    const r = runCreditCheck({ ...BASE, hasPriorHistory: false, orderTotalSatang: NEW_CUSTOMER_THRESHOLD_SATANG })
    expect(r.decision).toBe('pass')
  })

  it('7. ลูกค้าเก่า ทุกอย่างผ่าน → pass', () => {
    const r = runCreditCheck(BASE)
    expect(r.decision).toBe('pass')
    expect(r.availableSatang).toBe(BASE.creditLimitSatang)
  })

  it('8. outstanding ลดวงเงินจนไม่พอ → hold', () => {
    // limit=1,000,000 outstanding=800,000 → available=200,000, order=300,000
    const r = runCreditCheck({
      ...BASE,
      creditLimitSatang: 1_000_000,
      outstandingSatang: 800_000,
      orderTotalSatang: 300_000,
    })
    expect(r.decision).toBe('hold')
    expect(r.availableSatang).toBe(200_000)
  })
})

describe('computeAvailable', () => {
  it('limit=1000, outstanding=400 → available=600', () => {
    expect(computeAvailable(1000, 400)).toBe(600)
  })
  it('outstanding > limit → available=0 (never negative)', () => {
    expect(computeAvailable(1000, 1500)).toBe(0)
  })
})

describe('isFullyPaid / remainingBalanceSatang', () => {
  it('confirmed >= total → fully paid', () => {
    expect(isFullyPaid(100_000, 100_000)).toBe(true)
    expect(isFullyPaid(100_000, 150_000)).toBe(true)  // overpaid
  })
  it('confirmed < total → not fully paid', () => {
    expect(isFullyPaid(100_000, 99_999)).toBe(false)
  })
  it('partial payment: remaining = total - confirmed', () => {
    expect(remainingBalanceSatang(100_000, 60_000)).toBe(40_000)
  })
  it('overpaid: remaining = 0 (not negative)', () => {
    expect(remainingBalanceSatang(100_000, 120_000)).toBe(0)
  })
})
