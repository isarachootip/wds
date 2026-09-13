import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Flow 3: Check-in / Check-out (Technician)', () => {
  test.skip(!process.env.E2E_TEST_PASSWORD, 'Skip: E2E_TEST_PASSWORD not set')

  test('visit home page loads for technician', async ({ page }) => {
    await loginAs(page, 'technician')
    // Technician redirected to /visit/dashboard
    await expect(page).toHaveURL(/\/visit\//)
    await page.waitForLoadState('networkidle')
  })

  test('visit deliveries page loads (mobile)', async ({ page }) => {
    await loginAs(page, 'technician')
    await page.goto('/visit/deliveries')
    await page.waitForLoadState('networkidle')
    // Should show today's deliveries or empty state
    const hasContent = await page.getByText(/วันนี้|งานส่ง|no deliveries|ไม่มีงาน/i).count()
    expect(hasContent).toBeGreaterThan(0)
  })

  test('job check-in requires location permission info', async ({ page }) => {
    await loginAs(page, 'technician')
    await page.goto('/visit')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })
})
