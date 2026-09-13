import { describe, it, expect } from 'vitest'
import { nextRetryDelayMs, shouldRetryNow, MAX_ATTEMPTS } from './domain-events'

describe('Domain Events Worker', () => {
  describe('nextRetryDelayMs — exponential backoff', () => {
    it('attempt 1 → 1s', () => expect(nextRetryDelayMs(1)).toBe(1_000))
    it('attempt 2 → 2s', () => expect(nextRetryDelayMs(2)).toBe(2_000))
    it('attempt 3 → 4s', () => expect(nextRetryDelayMs(3)).toBe(4_000))
    it('attempt 4 → 8s', () => expect(nextRetryDelayMs(4)).toBe(8_000))
    it('attempt 5 → 16s', () => expect(nextRetryDelayMs(5)).toBe(16_000))
  })

  describe('shouldRetryNow', () => {
    it('no processedAt → retry immediately', () => {
      expect(shouldRetryNow(1, null)).toBe(true)
    })

    it('processedAt too recent for backoff → skip', () => {
      const recentlyFailed = new Date(Date.now() - 500) // 500ms ago, need 1000ms for attempt 1
      expect(shouldRetryNow(1, recentlyFailed)).toBe(false)
    })

    it('processedAt past backoff window → retry', () => {
      const longAgo = new Date(Date.now() - 2_000) // 2s ago, attempt 1 only needs 1s
      expect(shouldRetryNow(1, longAgo)).toBe(true)
    })
  })

  it('MAX_ATTEMPTS is 5', () => {
    expect(MAX_ATTEMPTS).toBe(5)
  })
})
