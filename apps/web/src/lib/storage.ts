/**
 * Supabase Storage Security Module
 * 
 * Enforces:
 * 1. Sensitive business buckets (slips, job-photos, pod-photos) are private (public: false)
 * 2. Signed URLs must have explicit expiration times (default: 3600 seconds / 1 hour)
 * 3. Rejects generation of public URLs for private buckets
 */

export const PRIVATE_BUCKETS = ['slips', 'job-photos', 'pod-photos'] as const
export type PrivateBucket = typeof PRIVATE_BUCKETS[number]

export interface SignedUrlResult {
  signedUrl: string
  expiresAt: Date
  bucket: string
  path: string
}

export interface StoragePolicyConfig {
  bucket: string
  isPublic: boolean
  maxFileSizeBytes: number
  allowedMimeTypes: string[]
}

export const STORAGE_POLICIES: Record<string, StoragePolicyConfig> = {
  'slips': {
    bucket: 'slips',
    isPublic: false,
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
  'job-photos': {
    bucket: 'job-photos',
    isPublic: false,
    maxFileSizeBytes: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  'pod-photos': {
    bucket: 'pod-photos',
    isPublic: false,
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
}

/**
 * Check if a bucket is marked as private.
 */
export function isPrivateBucket(bucket: string): boolean {
  return (PRIVATE_BUCKETS as readonly string[]).includes(bucket)
}

/**
 * Validates expiration duration (between 60 seconds and 86400 seconds / 24 hours).
 */
export function validateExpirationSeconds(expiresInSeconds: number): number {
  if (expiresInSeconds < 60) {
    throw new Error('Signed URL expiration must be at least 60 seconds')
  }
  if (expiresInSeconds > 86400) {
    throw new Error('Signed URL expiration cannot exceed 86400 seconds (24 hours)')
  }
  return expiresInSeconds
}

/**
 * Generate signed URL with strict expiration enforcement.
 */
export async function createSignedUrl(
  supabaseClient: { storage: { from: (bucket: string) => { createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }> } } },
  bucket: string,
  path: string,
  expiresInSeconds: number = 3600
): Promise<SignedUrlResult> {
  const validatedExpires = validateExpirationSeconds(expiresInSeconds)

  const { data, error } = await supabaseClient.storage.from(bucket).createSignedUrl(path, validatedExpires)
  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL for ${bucket}/${path}: ${error ? JSON.stringify(error) : 'Unknown error'}`)
  }

  const expiresAt = new Date(Date.now() + validatedExpires * 1000)

  return {
    signedUrl: data.signedUrl,
    expiresAt,
    bucket,
    path,
  }
}

/**
 * Guard that prevents exposing public URLs for private buckets.
 */
export function getPublicUrlGuard(bucket: string, path: string): string {
  if (isPrivateBucket(bucket)) {
    throw new Error(`Security Violation: Bucket "${bucket}" is strictly private and cannot generate public CDN URLs. Use createSignedUrl instead.`)
  }
  return `https://storage.supabase.co/v1/object/public/${bucket}/${path}`
}
