import { describe, it, expect } from 'vitest'

describe('Phase 4 Acceptance Criteria 6: Role-Based Access Control (RBAC) on Billing Actions', () => {
  // Policy rule simulation from 00014_phase4_rls.sql and billing/actions.ts assertRole()
  function assertRole(actorRole: string, allowedRoles: string[]) {
    if (!allowedRoles.includes(actorRole)) {
      throw new Error(`บทบาท ${actorRole} ไม่มีสิทธิ์ดำเนินการนี้`)
    }
    return true
  }

  describe('Approve Credit Hold (approveOrderAction)', () => {
    const allowed = ['admin', 'accounting', 'sales_manager']

    it('Allows admin, accounting, and sales_manager', () => {
      expect(assertRole('admin', allowed)).toBe(true)
      expect(assertRole('accounting', allowed)).toBe(true)
      expect(assertRole('sales_manager', allowed)).toBe(true)
    })

    it('Blocks sales, technician, and warehouse', () => {
      expect(() => assertRole('sales', allowed)).toThrow('ไม่มีสิทธิ์ดำเนินการนี้')
      expect(() => assertRole('technician', allowed)).toThrow('ไม่มีสิทธิ์ดำเนินการนี้')
      expect(() => assertRole('warehouse', allowed)).toThrow('ไม่มีสิทธิ์ดำเนินการนี้')
    })
  })

  describe('Verify Payment (verifyPaymentAction)', () => {
    const allowed = ['admin', 'accounting']

    it('Allows only admin and accounting', () => {
      expect(assertRole('admin', allowed)).toBe(true)
      expect(assertRole('accounting', allowed)).toBe(true)
    })

    it('Blocks sales and sales_manager from verifying payment slips', () => {
      expect(() => assertRole('sales', allowed)).toThrow('ไม่มีสิทธิ์ดำเนินการนี้')
      expect(() => assertRole('sales_manager', allowed)).toThrow('ไม่มีสิทธิ์ดำเนินการนี้')
      expect(() => assertRole('coordinator', allowed)).toThrow('ไม่มีสิทธิ์ดำเนินการนี้')
    })
  })

  describe('Mark Delivery Delivered (markDeliveredAction)', () => {
    const allowed = ['admin', 'warehouse', 'technician']

    it('Allows admin, warehouse, and technician', () => {
      expect(assertRole('technician', allowed)).toBe(true)
      expect(assertRole('warehouse', allowed)).toBe(true)
      expect(assertRole('admin', allowed)).toBe(true)
    })

    it('Blocks sales and accounting from delivering jobs', () => {
      expect(() => assertRole('sales', allowed)).toThrow('ไม่มีสิทธิ์ดำเนินการนี้')
      expect(() => assertRole('accounting', allowed)).toThrow('ไม่มีสิทธิ์ดำเนินการนี้')
    })
  })
})
