import { describe, it, expect } from 'vitest'

/**
 * Phase 6 Security: Rate Limiting Unit Tests
 * 
 * Verifies that:
 * 1. Rate limiter tracks requests per IP/endpoint prefix.
 * 2. Excess requests return 429 Too Many Requests with Retry-After headers.
 * 3. Expired windows reset counter back to 1.
 * 4. Critical OTP endpoints enforce strict defense (max 5 req/min).
 */

interface RateLimitConfig {
  windowMs: number
  max: number
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/line/': { windowMs: 60_000, max: 100 },
  '/api/portal/': { windowMs: 60_000, max: 20 },
  '/portal/': { windowMs: 60_000, max: 60 },
  '/api/auth/otp': { windowMs: 60_000, max: 5 },
  '/api/otp': { windowMs: 60_000, max: 5 },
}

class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>()

  check(ip: string, pathname: string, now = Date.now()): {
    allowed: boolean
    status: number
    limit?: number
    remaining?: number
    retryAfter?: number
  } {
    for (const [prefix, { windowMs, max }] of Object.entries(RATE_LIMIT_CONFIGS)) {
      if (!pathname.startsWith(prefix)) continue

      const key = `${prefix}:${ip}`
      const entry = this.store.get(key)

      if (!entry || now > entry.resetAt) {
        this.store.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, status: 200, limit: max, remaining: max - 1 }
      }

      entry.count++
      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        return {
          allowed: false,
          status: 429,
          limit: max,
          remaining: 0,
          retryAfter,
        }
      }

      return { allowed: true, status: 200, limit: max, remaining: max - entry.count }
    }

    // No limit applies to unconfigured paths
    return { allowed: true, status: 200 }
  }

  clear() {
    this.store.clear()
  }
}

describe('Phase 6 Security: Rate Limiting & Denial of Service Protection', () => {
  const limiter = new InMemoryRateLimiter()

  it('allows normal traffic within rate limit thresholds', () => {
    limiter.clear()
    const result = limiter.check('1.2.3.4', '/portal/q/token-123')
    expect(result.allowed).toBe(true)
    expect(result.status).toBe(200)
    expect(result.limit).toBe(60)
    expect(result.remaining).toBe(59)
  })

  it('strictly limits OTP requests to 5 attempts per minute', () => {
    limiter.clear()
    const ip = '192.168.1.50'
    const path = '/api/auth/otp/send'

    for (let i = 1; i <= 5; i++) {
      const res = limiter.check(ip, path)
      expect(res.allowed).toBe(true)
      expect(res.status).toBe(200)
    }

    // 6th attempt must be rejected with 429
    const blocked = limiter.check(ip, path)
    expect(blocked.allowed).toBe(false)
    expect(blocked.status).toBe(429)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('resets window after duration expires', () => {
    limiter.clear()
    const ip = '10.0.0.1'
    const path = '/api/portal/order-status'
    let fakeTime = 1_000_000

    // Exhaust 20 requests
    for (let i = 1; i <= 20; i++) {
      limiter.check(ip, path, fakeTime)
    }
    expect(limiter.check(ip, path, fakeTime).status).toBe(429)

    // Advance time past 60s
    fakeTime += 61_000
    const fresh = limiter.check(ip, path, fakeTime)
    expect(fresh.allowed).toBe(true)
    expect(fresh.status).toBe(200)
    expect(fresh.remaining).toBe(19)
  })

  it('isolates rate limits between distinct IP addresses', () => {
    limiter.clear()
    const path = '/api/line/webhook'
    for (let i = 1; i <= 100; i++) {
      limiter.check('100.0.0.1', path)
    }
    // IP 1 is blocked
    expect(limiter.check('100.0.0.1', path).status).toBe(429)

    // IP 2 is unaffected
    const otherIp = limiter.check('100.0.0.2', path)
    expect(otherIp.allowed).toBe(true)
    expect(otherIp.status).toBe(200)
  })
})
