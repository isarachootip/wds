import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getEffectiveLineConfig,
  invalidateLineConfigCache,
  verifyLineSignature,
} from '../lib/line'

describe('LINE Dynamic Configuration & Settings', () => {
  beforeEach(() => {
    invalidateLineConfigCache()
    vi.restoreAllMocks()
    process.env.LINE_CHANNEL_SECRET = 'test-env-secret-12345'
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-env-access-token-67890'
    process.env.LIFF_ID = 'test-env-liff-id-abc'
  })

  it('should fall back to environment variables when database is not configured', async () => {
    const config = await getEffectiveLineConfig()
    expect(config.channelSecret).toBe('test-env-secret-12345')
    expect(config.channelAccessToken).toBe('test-env-access-token-67890')
    expect(config.liffId).toBe('test-env-liff-id-abc')
  })

  it('should verify signature correctly with HMAC-SHA256', () => {
    const rawBody = JSON.stringify({ events: [] })
    const secret = 'test-secret-key'

    const crypto = require('crypto')
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64')

    expect(verifyLineSignature(rawBody, validSignature, secret)).toBe(true)
    expect(verifyLineSignature(rawBody, 'invalid-signature', secret)).toBe(false)
    expect(verifyLineSignature('', validSignature, secret)).toBe(false)
  })
})
