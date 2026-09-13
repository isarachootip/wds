import { Page } from '@playwright/test'

/** Inject a mock Supabase session into localStorage for test users */
export async function loginAs(page: Page, role: 'sales' | 'coordinator' | 'technician' | 'accounting' | 'admin') {
  // In a real CI environment, you would:
  // 1. Create test users in Supabase during setup
  // 2. Log in via the login page
  // 3. Save auth state to a file and reuse it

  // For now: navigate to login page and fill credentials
  const testCredentials: Record<string, { email: string; password: string }> = {
    sales: { email: process.env.E2E_SALES_EMAIL ?? 'sales@test.wds.local', password: process.env.E2E_TEST_PASSWORD ?? 'TestPass123!' },
    coordinator: { email: process.env.E2E_COORDINATOR_EMAIL ?? 'coordinator@test.wds.local', password: process.env.E2E_TEST_PASSWORD ?? 'TestPass123!' },
    technician: { email: process.env.E2E_TECH_EMAIL ?? 'tech@test.wds.local', password: process.env.E2E_TEST_PASSWORD ?? 'TestPass123!' },
    accounting: { email: process.env.E2E_ACCOUNTING_EMAIL ?? 'accounting@test.wds.local', password: process.env.E2E_TEST_PASSWORD ?? 'TestPass123!' },
    admin: { email: process.env.E2E_ADMIN_EMAIL ?? 'admin@test.wds.local', password: process.env.E2E_TEST_PASSWORD ?? 'TestPass123!' },
  }

  const creds = testCredentials[role]
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(creds.email)
  await page.getByLabel(/password/i).fill(creds.password)
  await page.getByRole('button', { name: /login|เข้าสู่ระบบ/i }).click()
  await page.waitForURL(/\/(wds|visit)\//)
}

/** Wait for toast/snackbar message */
export async function waitForToast(page: Page, text: string | RegExp) {
  await page.getByText(text).waitFor({ state: 'visible', timeout: 10_000 })
}
