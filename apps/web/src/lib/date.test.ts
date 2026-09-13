import { describe, it, expect } from 'vitest'
import { formatThaiDate, formatThaiDateTime, formatThaiShortDate, THAI_MONTHS } from './date'

describe('date', () => {
  const testDate = new Date('2026-09-11T16:30:00Z')

  it('formatThaiDate', () => {
    const formatted = formatThaiDate(testDate)
    expect(formatted).toBe('11 กันยายน 2569')
  })

  it('formatThaiDateTime', () => {
    const formatted = formatThaiDateTime(testDate)
    expect(formatted).toContain('11 กันยายน 2569')
    // time string depends on node tz, but let's check it doesn't crash
  })

  it('formatThaiShortDate', () => {
    const formatted = formatThaiShortDate(testDate)
    expect(formatted).toBe('11/09/69')
  })

  it('has thai months', () => {
    expect(THAI_MONTHS.length).toBe(12)
    expect(THAI_MONTHS[0]).toBe('มกราคม')
  })
})
