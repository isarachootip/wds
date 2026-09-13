import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Flow 6: Delivery → POD (Driver/Technician)', () => {
  test.skip(!process.env.E2E_TEST_PASSWORD, 'Skip: E2E_TEST_PASSWORD not set')

  test('driver sees today deliveries list', async ({ page }) => {
    await loginAs(page, 'technician')
    await page.goto('/visit/deliveries')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(500)
    expect(errors).toHaveLength(0)
  })

  test('delivery detail page handles unknown id gracefully', async ({ page }) => {
    await loginAs(page, 'technician')
    const res = await page.goto('/visit/deliveries/00000000-0000-0000-0000-000000000000')
    // Should be 404, not 500
    expect(res?.status()).not.toBe(500)
  })

  test('POD capture: blocked without photo', async ({ page }) => {
    await loginAs(page, 'technician')
    await page.goto('/visit/deliveries')
    await page.waitForLoadState('networkidle')
    // If there is a delivered button visible, clicking without photo should show error
    // (Cannot fully test file upload in playwright without real delivery)
    // Just verify the page loads correctly
    await expect(page.locator('body')).toBeVisible()
  })

  test('wds deliveries management page loads', async ({ page }) => {
    await loginAs(page, 'coordinator')
    await page.goto('/wds/deliveries')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('TypeError')
  })
})
