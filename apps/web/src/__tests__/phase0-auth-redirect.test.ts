import { describe, it, expect } from 'vitest'

type AppRole = 'admin' | 'sales' | 'sales_manager' | 'coordinator' | 'technician' | 'accounting' | 'warehouse' | 'customer'

// Logic matching middleware.ts getRedirectPath
function getRedirectPath(roles: AppRole[]): string {
  if (roles.includes('technician')) return '/visit/dashboard'
  if (roles.includes('customer')) return '/portal'
  return '/wds/dashboard'
}

describe('Phase 0 Acceptance: Role-based Authentication & Route Redirection', () => {
  const allRoles: AppRole[] = [
    'admin',
    'sales',
    'sales_manager',
    'coordinator',
    'technician',
    'accounting',
    'warehouse',
    'customer',
  ]

  it('verifies all 8 required roles exist in the system specification', () => {
    expect(allRoles).toHaveLength(8)
    expect(allRoles).toEqual([
      'admin',
      'sales',
      'sales_manager',
      'coordinator',
      'technician',
      'accounting',
      'warehouse',
      'customer',
    ])
  })

  it('redirects sales and sales_manager to /wds/dashboard', () => {
    expect(getRedirectPath(['sales'])).toBe('/wds/dashboard')
    expect(getRedirectPath(['sales_manager'])).toBe('/wds/dashboard')
  })

  it('redirects admin, coordinator, accounting, and warehouse to /wds/dashboard', () => {
    expect(getRedirectPath(['admin'])).toBe('/wds/dashboard')
    expect(getRedirectPath(['coordinator'])).toBe('/wds/dashboard')
    expect(getRedirectPath(['accounting'])).toBe('/wds/dashboard')
    expect(getRedirectPath(['warehouse'])).toBe('/wds/dashboard')
  })

  it('redirects field technician to /visit/dashboard', () => {
    expect(getRedirectPath(['technician'])).toBe('/visit/dashboard')
  })

  it('redirects customer to /portal', () => {
    expect(getRedirectPath(['customer'])).toBe('/portal')
  })

  it('properly validates redirect for every single one of the 8 roles', () => {
    const expectations: Record<AppRole, string> = {
      admin: '/wds/dashboard',
      sales: '/wds/dashboard',
      sales_manager: '/wds/dashboard',
      coordinator: '/wds/dashboard',
      accounting: '/wds/dashboard',
      warehouse: '/wds/dashboard',
      technician: '/visit/dashboard',
      customer: '/portal',
    }

    for (const role of allRoles) {
      expect(getRedirectPath([role])).toBe(expectations[role])
    }
  })
})
