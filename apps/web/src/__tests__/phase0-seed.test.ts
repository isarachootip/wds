import { describe, it, expect } from 'vitest'
import { seedCustomers } from '../../../../packages/db/src/seed/customers'
import { seedProducts } from '../../../../packages/db/src/seed/products'
import { seedLeads } from '../../../../packages/db/src/seed/crm'

describe('Phase 0 Acceptance: Thai Seed Data Verification', () => {
  it('contains at least 10 sample customers in Thai language with valid tax and credit limit', () => {
    expect(seedCustomers.length).toBeGreaterThanOrEqual(10)
    for (const customer of seedCustomers) {
      expect(customer.name).toBeTruthy()
      expect(customer.code).toMatch(/^C\d{3}$/)
      expect(customer.taxId).toHaveLength(13)
      expect(customer.creditLimitSatang).toBeGreaterThan(0)
      expect(Number.isInteger(customer.creditLimitSatang)).toBe(true)
    }

    // Verify Thai company names
    const thaiNames = seedCustomers.map((c) => c.name)
    expect(thaiNames).toContain('บริษัท วิวัฒน์ก่อสร้าง จำกัด')
    expect(thaiNames).toContain('ห้างหุ้นส่วนจำกัด เจริญพัฒนา')
    expect(thaiNames).toContain('นายสมชาย ใจดี')
  })

  it('contains at least 15 sample products in Thai language with base prices in integer satang', () => {
    expect(seedProducts.length).toBeGreaterThanOrEqual(15)
    for (const product of seedProducts) {
      expect(product.name).toBeTruthy()
      expect(product.sku).toMatch(/^P\d{3}$/)
      expect(product.unit).toBeTruthy()
      expect(product.basePriceSatang).toBeGreaterThan(0)
      expect(Number.isInteger(product.basePriceSatang)).toBe(true)
    }

    const productNames = seedProducts.map((p) => p.name)
    expect(productNames).toContain('ปูนซีเมนต์ SCG ตราช้าง ถุง 50 กก.')
    expect(productNames).toContain('ทรายหยาบ')
    expect(productNames).toContain('เหล็กข้ออ้อย DB12')
    expect(productNames).toContain('อิฐมวลเบา SCG ขนาด 7.5x20x60 ซม.')
  })

  it('contains realistic Thai CRM cases with multi-channel sources and satang budget ranges', () => {
    expect(seedLeads.length).toBeGreaterThanOrEqual(5)
    const validChannels = ['line', 'phone', 'store', 'other']

    for (const lead of seedLeads) {
      expect(validChannels).toContain(lead.source)
      expect(lead.status).toBeTruthy()
      expect(lead.budgetRangeMinSatang).toBeGreaterThan(0)
      expect(lead.budgetRangeMaxSatang).toBeGreaterThan(lead.budgetRangeMinSatang)
    }
  })
})
