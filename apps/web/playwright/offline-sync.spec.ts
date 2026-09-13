import { test, expect } from '@playwright/test'

test.describe('Offline Check-in Sync', () => {
  test('queues check-in when offline and shows status banner', async ({ page, context }) => {
    // Go to job page
    await page.goto('/visit/jobs/test-job-id')

    // Go offline
    await context.setOffline(true)

    // Click check-in (button should still be visible and clickable)
    const checkinBtn = page.getByTestId('checkin-button')
    await expect(checkinBtn).toBeVisible({ timeout: 5000 })

    // Mock geolocation
    await page.evaluate(() => {
      // Override geolocation to return a fixed position
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: Function) => success({
            coords: { latitude: 13.7563, longitude: 100.5018, accuracy: 10 }
          })
        },
        configurable: true,
      })
    })

    await checkinBtn.click()

    // After confirming, offline status should show
    await expect(page.getByTestId('offline-status')).toContainText('ออฟไลน์', { timeout: 5000 })

    // Go back online
    await context.setOffline(false)

    // Status should update to syncing or synced
    await expect(page.getByTestId('offline-status')).toContainText(/sync/, { timeout: 10000 })
  })

  test('blocks checkout without required items', async ({ page }) => {
    await page.goto('/visit/jobs/test-job-id')
    // Click checkout accordion
    await page.getByText('Check-out').click()
    // Should show missing items warning
    await expect(page.getByText('ยังขาด:')).toBeVisible()
  })
})
