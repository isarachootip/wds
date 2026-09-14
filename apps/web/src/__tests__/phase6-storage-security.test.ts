import { describe, it, expect, vi } from 'vitest'
import {
  PRIVATE_BUCKETS,
  isPrivateBucket,
  validateExpirationSeconds,
  createSignedUrl,
  getPublicUrlGuard,
  STORAGE_POLICIES,
} from '@/lib/storage'

describe('Phase 6 Security: Supabase Storage & Signed URL Protection', () => {
  it('classifies slips, job-photos, and pod-photos as strictly private', () => {
    expect(PRIVATE_BUCKETS).toContain('slips')
    expect(PRIVATE_BUCKETS).toContain('job-photos')
    expect(PRIVATE_BUCKETS).toContain('pod-photos')

    expect(isPrivateBucket('slips')).toBe(true)
    expect(isPrivateBucket('job-photos')).toBe(true)
    expect(isPrivateBucket('pod-photos')).toBe(true)
    expect(isPrivateBucket('public-marketing')).toBe(false)
  })

  it('rejects public URL generation for private buckets with explicit security violation', () => {
    expect(() => getPublicUrlGuard('slips', '2026/slip_01.jpg')).toThrowError(
      /Security Violation: Bucket "slips" is strictly private/
    )
    expect(() => getPublicUrlGuard('job-photos', 'job_123/after.webp')).toThrowError(
      /Security Violation/
    )
    expect(() => getPublicUrlGuard('pod-photos', 'del_456/signature.png')).toThrowError(
      /Security Violation/
    )
  })

  it('allows public URL generation only for non-private buckets', () => {
    const url = getPublicUrlGuard('catalog-banners', 'hero.jpg')
    expect(url).toContain('https://storage.supabase.co/v1/object/public/catalog-banners/hero.jpg')
  })

  it('validates signed URL expiration bounds', () => {
    // Under 60 seconds rejected
    expect(() => validateExpirationSeconds(30)).toThrowError(/at least 60 seconds/)
    // Over 24 hours (86400) rejected
    expect(() => validateExpirationSeconds(100_000)).toThrowError(/cannot exceed 86400 seconds/)

    // Valid range accepted
    expect(validateExpirationSeconds(3600)).toBe(3600)
    expect(validateExpirationSeconds(60)).toBe(60)
    expect(validateExpirationSeconds(86400)).toBe(86400)
  })

  it('creates signed URL with valid expiration timestamp and token', async () => {
    const mockSupabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: 'https://storage.supabase.co/storage/v1/object/sign/slips/slip1.jpg?token=abc123' },
            error: null,
          }),
        }),
      },
    }

    const tBefore = Date.now()
    const res = await createSignedUrl(mockSupabase, 'slips', 'slip1.jpg', 1800)

    expect(res.bucket).toBe('slips')
    expect(res.path).toBe('slip1.jpg')
    expect(res.signedUrl).toContain('token=abc123')
    expect(res.expiresAt.getTime()).toBeGreaterThanOrEqual(tBefore + 1800 * 1000)
  })

  it('verifies storage policy constraints on mime types and file sizes', () => {
    const slipPolicy = STORAGE_POLICIES['slips']
    expect(slipPolicy.isPublic).toBe(false)
    expect(slipPolicy.maxFileSizeBytes).toBe(10 * 1024 * 1024)
    expect(slipPolicy.allowedMimeTypes).toContain('image/jpeg')
    expect(slipPolicy.allowedMimeTypes).toContain('application/pdf')

    const jobPolicy = STORAGE_POLICIES['job-photos']
    expect(jobPolicy.isPublic).toBe(false)
    expect(jobPolicy.maxFileSizeBytes).toBe(15 * 1024 * 1024)
  })
})
