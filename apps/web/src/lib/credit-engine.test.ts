import { describe, it, expect } from 'vitest'
import { checkCredit } from './credit-engine'

describe('checkCredit', () => {
  const limit = 1_000_000_00  // 1,000,000 baht = 100,000,000 satang
  const used = 0

  it('new order < 80% → pass', () => {
    const r = checkCredit({ creditLimitSatang: limit, creditUsedSatang: 0, newOrderAmountSatang: 70_000_00 })
    expect(r.tier).toBe('pass')
  })

  it('exactly 80% → soft_warn', () => {
    const r = checkCredit({ creditLimitSatang: 100_000, creditUsedSatang: 0, newOrderAmountSatang: 80_000 })
    expect(r.tier).toBe('soft_warn')
    expect(r.usedPct).toBe(80)
  })

  it('99% used → soft_warn', () => {
    const r = checkCredit({ creditLimitSatang: 100_000, creditUsedSatang: 99_000, newOrderAmountSatang: 0 })
    expect(r.tier).toBe('soft_warn')
  })

  it('over 100% → hard_block', () => {
    const r = checkCredit({ creditLimitSatang: 100_000, creditUsedSatang: 90_000, newOrderAmountSatang: 20_000 })
    expect(r.tier).toBe('hard_block')
    expect(r.totalAfterOrderSatang).toBe(110_000)
  })

  it('creditLimit=0 (cash customer) → always pass', () => {
    const r = checkCredit({ creditLimitSatang: 0, creditUsedSatang: 0, newOrderAmountSatang: 999_999_999 })
    expect(r.tier).toBe('pass')
  })

  it('availableSatang computed correctly', () => {
    const r = checkCredit({ creditLimitSatang: 100_000, creditUsedSatang: 30_000, newOrderAmountSatang: 20_000 })
    expect(r.availableSatang).toBe(50_000)
  })
})
