import { describe, it, expect } from 'vitest'
import { can, canAny, getPermissions, type Role } from './rbac'

describe('rbac', () => {
  it('admin can do everything', () => {
    expect(can(['admin'], 'delete', 'customer')).toBe(true)
    expect(can(['admin'], 'approve', 'payment')).toBe(true)
  })

  it('technician cannot access payment', () => {
    expect(can(['technician'], 'read', 'payment')).toBe(false)
    expect(can(['technician'], 'create', 'payment')).toBe(false)
  })

  it('customer cannot create leads', () => {
    expect(can(['customer'], 'create', 'lead')).toBe(false)
  })

  it('sales cannot approve credit', () => {
    expect(can(['sales'], 'approve', 'credit')).toBe(false)
  })

  it('multi-role user gets union of permissions', () => {
    expect(can(['technician'], 'read', 'payment')).toBe(false)
    expect(can(['technician', 'accounting'], 'read', 'payment')).toBe(true)
  })

  it('canAny works', () => {
    expect(canAny(['technician'], 'work_log')).toBe(true)
    expect(canAny(['technician'], 'payment')).toBe(false)
  })
})
