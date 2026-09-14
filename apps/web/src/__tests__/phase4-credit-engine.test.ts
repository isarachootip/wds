import { describe, it, expect } from 'vitest'
import {
  runCreditCheck,
  computeAvailable,
  isFullyPaid,
  remainingBalanceSatang,
  NEW_CUSTOMER_THRESHOLD_SATANG,
  type CreditInput,
} from '@/modules/billing/credit'

describe('Phase 4 Acceptance Criteria 1: Credit Check Engine (Comprehensive 8 Test Cases)', () => {
  const BASE: CreditInput = {
    onHold: false,
    creditLimitSatang: 10_000_000, // 100,000 บาท
    outstandingSatang: 0,
    overdueAmountSatang: 0,
    orderTotalSatang: 1_000_000, // 10,000 บาท
    hasPriorHistory: true,
  }

  it('Case 1: on_hold=true → reject (บัญชีถูก hold)', () => {
    const res = runCreditCheck({ ...BASE, onHold: true })
    expect(res.decision).toBe('reject')
    expect(res.reason).toContain('hold')
  })

  it('Case 2: overdue_amount > 0 → hold (มียอดค้างชำระเกินกำหนด)', () => {
    const res = runCreditCheck({ ...BASE, overdueAmountSatang: 250_00 })
    expect(res.decision).toBe('hold')
    expect(res.reason).toContain('ค้างชำระ')
  })

  it('Case 3: orderTotal > available → hold (เกินวงเงินคงเหลือ)', () => {
    // creditLimit = 10,000,000, outstanding = 9,500,000 -> available = 500,000
    // orderTotal = 500,001 -> exceeds available
    const res = runCreditCheck({
      ...BASE,
      outstandingSatang: 9_500_000,
      orderTotalSatang: 500_001,
    })
    expect(res.decision).toBe('hold')
    expect(res.reason).toContain('เกินวงเงิน')
  })

  it('Case 4: orderTotal = available (พอดีวงเงิน) → pass', () => {
    const res = runCreditCheck({
      ...BASE,
      creditLimitSatang: 2_000_000,
      outstandingSatang: 1_000_000,
      orderTotalSatang: 1_000_000,
    })
    expect(res.decision).toBe('pass')
    expect(res.availableSatang).toBe(1_000_000)
  })

  it('Case 5: ลูกค้าใหม่ (no prior history) + order > 50,000 บาท (5,000,000 satang) → hold', () => {
    const res = runCreditCheck({
      ...BASE,
      hasPriorHistory: false,
      orderTotalSatang: NEW_CUSTOMER_THRESHOLD_SATANG + 1,
    })
    expect(res.decision).toBe('hold')
    expect(res.reason).toContain('ลูกค้าใหม่')
  })

  it('Case 6: ลูกค้าใหม่ + order = 50,000 บาท พอดี → pass', () => {
    const res = runCreditCheck({
      ...BASE,
      hasPriorHistory: false,
      orderTotalSatang: NEW_CUSTOMER_THRESHOLD_SATANG,
    })
    expect(res.decision).toBe('pass')
  })

  it('Case 7: ลูกค้าเก่า วงเงินพอ ไม่มียอดค้าง → pass', () => {
    const res = runCreditCheck(BASE)
    expect(res.decision).toBe('pass')
    expect(res.availableSatang).toBe(BASE.creditLimitSatang)
    expect(res.reason).toContain('ผ่านการตรวจสอบเครดิต')
  })

  it('Case 8: outstanding สะสมทำให้วงเงินคงเหลือไม่พอ Order → hold', () => {
    const res = runCreditCheck({
      ...BASE,
      creditLimitSatang: 5_000_000,
      outstandingSatang: 4_200_000,
      orderTotalSatang: 1_000_000,
    })
    expect(res.decision).toBe('hold')
    expect(res.availableSatang).toBe(800_000)
  })

  it('Auxiliary: computeAvailable never drops below 0', () => {
    expect(computeAvailable(1_000_000, 1_500_000)).toBe(0)
    expect(computeAvailable(1_000_000, 400_000)).toBe(600_000)
  })

  it('Auxiliary: isFullyPaid and remainingBalanceSatang handle exact and partial payments', () => {
    expect(isFullyPaid(1_000_000, 1_000_000)).toBe(true)
    expect(isFullyPaid(1_000_000, 800_000)).toBe(false)
    expect(remainingBalanceSatang(1_000_000, 800_000)).toBe(200_000)
    expect(remainingBalanceSatang(1_000_000, 1_200_000)).toBe(0)
  })
})
