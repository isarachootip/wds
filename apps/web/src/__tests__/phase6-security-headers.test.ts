import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Phase 6 Security: CSP & HTTP Security Headers', () => {
  it('verifies next.config.ts configures comprehensive enterprise security headers', () => {
    const nextConfigPath = path.resolve(__dirname, '../../next.config.ts')
    const content = fs.readFileSync(nextConfigPath, 'utf8')

    // X-Frame-Options
    expect(content).toContain("key: 'X-Frame-Options', value: 'DENY'")

    // X-Content-Type-Options
    expect(content).toContain("key: 'X-Content-Type-Options', value: 'nosniff'")

    // Referrer-Policy
    expect(content).toContain("key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'")

    // Permissions-Policy
    expect(content).toContain("Permissions-Policy")
    expect(content).toContain("camera=(self)")
    expect(content).toContain("microphone=()")
    expect(content).toContain("geolocation=(self)")

    // Content-Security-Policy (CSP)
    expect(content).toContain("Content-Security-Policy")
    expect(content).toContain("default-src 'self'")
    expect(content).toContain("frame-ancestors 'none'")
    expect(content).toContain("object-src 'none'")
    expect(content).toContain("base-uri 'self'")
  })

  it('ensures CSP restricts script-src and connect-src to trusted origins', () => {
    const nextConfigPath = path.resolve(__dirname, '../../next.config.ts')
    const content = fs.readFileSync(nextConfigPath, 'utf8')

    // LINE and Supabase domains
    expect(content).toContain("https://static.line-scdn.net")
    expect(content).toContain("https://*.supabase.co")
    expect(content).toContain("https://api.line.me")
  })
})
