import { describe, it, expect } from 'vitest'
import { satang, add, subtract, multiply, vat7, withVat7, fromBaht, toBaht, formatTHB } from './money'

describe('money', () => {
  it('satang throws if not integer', () => {
    expect(() => satang(1.5)).toThrow()
    expect(satang(100)).toBe(100)
  })

  it('add/subtract/multiply', () => {
    const a = satang(100)
    const b = satang(50)
    expect(add(a, b)).toBe(150)
    expect(subtract(a, b)).toBe(50)
    expect(multiply(a, 1.5)).toBe(150)
  })

  it('vat7', () => {
    expect(vat7(satang(100))).toBe(7)
    expect(vat7(satang(150))).toBe(11) // 10.5 rounded up
  })

  it('withVat7', () => {
    const res = withVat7(satang(1000))
    expect(res.subtotal).toBe(1000)
    expect(res.vat).toBe(70)
    expect(res.total).toBe(1070)
  })

  it('fromBaht/toBaht', () => {
    expect(fromBaht(1.23)).toBe(123)
    expect(toBaht(satang(123))).toBe(1.23)
  })

  it('formatTHB', () => {
    // Some envs might format space slightly differently, check digits
    const str = formatTHB(satang(123456))
    expect(str).toContain('1,234.56')
  })
})
