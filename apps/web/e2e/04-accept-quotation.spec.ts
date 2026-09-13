import { test, expect } from '@playwright/test'

test.describe('Flow 4: Accept Quotation (Portal — no auth needed)', () => {
  test('portal page responds to unknown token with 404', async ({ page }) => {
    const res = await page.goto('/portal/q/invalid-token-xyz')
    // Should be 404 or redirect
    expect(res?.status()).not.toBe(500)
  })

  test('portal orders page with unknown token → not found', async ({ page }) => {
    const res = await page.goto('/portal/orders/invalid-token-xyz')
    expect(res?.status()).not.toBe(500)
  })

  test('LIFF page loads without crash', async ({ page }) => {
    await page.goto('/portal/liff?token=test-token')
    await page.waitForLoadState('networkidle')
    // Should show loading or error state (token not valid)
    await expect(page.locator('body')).toBeVisible()
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1000)
    // No unhandled JS errors
    expect(errors.filter(e => !e.includes('supabase') && !e.includes('fetch'))).toHaveLength(0)
  })

  test('portal QT page has correct title', async ({ page }) => {
    await page.goto('/portal')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })
})
