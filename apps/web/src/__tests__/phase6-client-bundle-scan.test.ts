import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Phase 6 Security: Client Bundle Secret Leakage Audit
 * 
 * Verifies that:
 * 1. Server-only secrets are never exposed under NEXT_PUBLIC_*
 * 2. Next.js production build config disables browser source maps
 * 3. Client bundle artifacts do not contain plain-text server secret keys
 */

const SERVER_ONLY_SECRET_KEYS = [
  'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL',
  'CRON_SECRET',
  'LINE_CHANNEL_SECRET',
  'LINE_CHANNEL_ACCESS_TOKEN',
  'JWT_SECRET',
]

describe('Phase 6 Security: Client Bundle Secret Leakage Audit', () => {
  it('ensures no server-only secrets have NEXT_PUBLIC_ prefixes in env variables', () => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('NEXT_PUBLIC_')) {
        for (const secret of SERVER_ONLY_SECRET_KEYS) {
          expect(key.toUpperCase()).not.toContain(secret)
        }
      }
    }
  })

  it('verifies next.config.ts explicitly disables production source maps and removes x-powered-by', async () => {
    const nextConfigPath = path.resolve(__dirname, '../../next.config.ts')
    expect(fs.existsSync(nextConfigPath)).toBe(true)

    const content = fs.readFileSync(nextConfigPath, 'utf8')
    expect(content).toContain('productionBrowserSourceMaps: false')
    expect(content).toContain('poweredByHeader: false')
  })

  it('scans client source directories to ensure no hardcoded production secrets exist', () => {
    const srcDir = path.resolve(__dirname, '../')
    const filesToScan: string[] = []

    function walk(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!['node_modules', '.next', '.git'].includes(entry.name)) {
            walk(path.join(dir, entry.name))
          }
        } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name) && !entry.name.includes('.test.')) {
          filesToScan.push(path.join(dir, entry.name))
        }
      }
    }

    walk(srcDir)

    // Check files for suspicious hardcoded secrets like "postgresql://postgres:" with live passwords
    for (const file of filesToScan) {
      const code = fs.readFileSync(file, 'utf8')
      expect(code).not.toMatch(/postgresql:\/\/[^@:]+:[^@]+@[^/]+\/[^\s"']*(?<!localhost.*|127\.0\.0\.1.*)/i)
      expect(code).not.toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]{50,}/) // live JWT service role keys
    }
  })
})
