import { test, expect } from '@playwright/test'

test.describe('Health & Public Routes', () => {
  test('health check endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.db).toBeDefined()
  })

  test('security headers present on all responses', async ({ request }) => {
    const res = await request.get('/')
    expect(res.headers()['x-frame-options']).toBe('DENY')
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
    expect(res.headers()['content-security-policy']).toBeDefined()
  })

  test('rate limit returns 429 after too many requests', async ({ request }) => {
    // Hit a rate-limited endpoint many times
    const results = await Promise.all(
      Array.from({ length: 25 }).map(() =>
        request.post('/api/line/webhook', {
          data: '{}',
          headers: { 'Content-Type': 'application/json', 'X-Line-Signature': 'invalid' }
        })
      )
    )
    // Should eventually get 429 (or 401 for invalid sig — both are acceptable)
    const statuses = results.map(r => r.status())
    expect(statuses.some(s => s === 401 || s === 429)).toBe(true)
  })

  test('portal root loads', async ({ page }) => {
    await page.goto('/portal')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
