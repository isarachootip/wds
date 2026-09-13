import { describe, it, expect } from 'vitest'
import { haversineDistance, formatDistance } from './geo'

describe('haversineDistance', () => {
  it('same point = 0m', () => {
    expect(haversineDistance(13.7563, 100.5018, 13.7563, 100.5018)).toBe(0)
  })

  it('BKK → Samut Prakan ~20km', () => {
    const d = haversineDistance(13.7563, 100.5018, 13.5990, 100.5998)
    expect(d).toBeGreaterThan(15000)
    expect(d).toBeLessThan(25000)
  })

  it('100m apart', () => {
    // ~0.0009 degrees lat ≈ 100m
    const d = haversineDistance(13.0, 100.0, 13.0009, 100.0)
    expect(d).toBeGreaterThan(90)
    expect(d).toBeLessThan(110)
  })
})

describe('formatDistance', () => {
  it('under 1000m → ม.', () => {
    expect(formatDistance(150)).toBe('150 ม.')
  })
  it('over 1000m → กม.', () => {
    expect(formatDistance(2500)).toBe('2.5 กม.')
  })
})
