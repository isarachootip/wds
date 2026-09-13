import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Flow 2: Appointment → Approve', () => {
  test.skip(!process.env.E2E_TEST_PASSWORD, 'Skip: E2E_TEST_PASSWORD not set')

  test('coordinator เห็นรายการนัดหมาย', async ({ page }) => {
    await loginAs(page, 'coordinator')
    await page.goto('/wds/appointments')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('TypeError')
    // Page should load without JS errors
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })

  test('calendar view loads', async ({ page }) => {
    await loginAs(page, 'coordinator')
    await page.goto('/wds/appointments/calendar')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
  })

  test('pending appointments show approve button', async ({ page }) => {
    await loginAs(page, 'coordinator')
    await page.goto('/wds/appointments')
    await page.waitForLoadState('networkidle')
    // If there are pending appointments, approve button should be visible
    // Otherwise the page should show empty state gracefully
    const hasApprove = await page.getByRole('button', { name: /อนุมัติ|approve/i }).count()
    const hasEmpty = await page.getByText(/ไม่มี|empty|no appointments/i).count()
    expect(hasApprove + hasEmpty).toBeGreaterThan(0)
  })
})
