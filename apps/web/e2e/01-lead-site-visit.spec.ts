import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Flow 1: Lead → Site Visit Request', () => {
  test.skip(!process.env.E2E_TEST_PASSWORD, 'Skip: E2E_TEST_PASSWORD not set')

  test('sales สร้าง Lead ใหม่แล้วขอ site visit', async ({ page }) => {
    await loginAs(page, 'sales')

    // Navigate to leads
    await page.goto('/wds/leads/new')
    await expect(page).toHaveURL(/leads\/new/)

    // Fill lead form
    const testName = `E2E Test Lead ${Date.now()}`
    await page.getByLabel(/ชื่อ|name/i).first().fill(testName)

    // Select source
    const sourceSelect = page.getByLabel(/แหล่งที่มา|source/i)
    if (await sourceSelect.count() > 0) {
      await sourceSelect.selectOption('phone')
    }

    // Submit
    await page.getByRole('button', { name: /บันทึก|save|สร้าง/i }).click()
    await page.waitForURL(/\/wds\/leads\/[^/]+$/)

    // Verify lead was created
    await expect(page.getByText(testName)).toBeVisible()

    // Request site visit
    const svButton = page.getByRole('button', { name: /ขอสำรวจ|site visit/i })
    if (await svButton.count() > 0) {
      await svButton.click()
      await page.waitForTimeout(1000)
    }
  })

  test('leads list shows new lead', async ({ page }) => {
    await loginAs(page, 'sales')
    await page.goto('/wds/leads')
    await expect(page).toHaveTitle(/WDS|Lead/)
    // Table should render
    await expect(page.locator('table, [role="grid"]').first()).toBeVisible({ timeout: 10_000 })
  })

  test('pipeline view loads', async ({ page }) => {
    await loginAs(page, 'sales')
    await page.goto('/wds/pipeline')
    // Should show kanban or list
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Error', { ignoreCase: false })
  })
})
