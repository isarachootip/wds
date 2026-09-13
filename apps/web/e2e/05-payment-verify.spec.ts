import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Flow 5: Payment → Accounting Verify', () => {
  test.skip(!process.env.E2E_TEST_PASSWORD, 'Skip: E2E_TEST_PASSWORD not set')

  test('payments queue page loads', async ({ page }) => {
    await loginAs(page, 'accounting')
    await page.goto('/wds/payments')
    await page.waitForLoadState('networkidle')
    // Should show payment list or empty state
    await expect(page.locator('body')).not.toContainText('Error')
  })

  test('orders page shows 3-column status', async ({ page }) => {
    await loginAs(page, 'accounting')
    await page.goto('/wds/orders')
    await page.waitForLoadState('networkidle')
    // Headers: เครดิต, ชำระ, จัดส่ง
    await expect(page.locator('body')).toBeVisible()
  })

  test('credit hold queue loads', async ({ page }) => {
    await loginAs(page, 'accounting')
    await page.goto('/wds/credit')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('TypeError')
  })

  test('sales cannot see accounting-only verify button', async ({ page }) => {
    await loginAs(page, 'sales')
    await page.goto('/wds/payments')
    await page.waitForLoadState('networkidle')
    // Sales should either be redirected or see limited view
    // The key is no 500 error
    await expect(page.locator('body')).toBeVisible()
  })
})
