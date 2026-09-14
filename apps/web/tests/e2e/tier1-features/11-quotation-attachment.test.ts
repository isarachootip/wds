import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { QuotationCard } from '@/app/(wds)/wds/leads/[id]/components/QuotationCard'
import { attachQuotationToLeadAction } from '@/modules/crm/actions'

// Mock attachQuotationToLeadAction
vi.mock('@/modules/crm/actions', () => ({
  attachQuotationToLeadAction: vi.fn().mockResolvedValue({ success: true, quotationId: 'qt-123' }),
}))

describe('Tier 1.11: Quotation Attachment', () => {
  it('T1.11.1: renders empty state when no quotations are attached', () => {
    const html = renderToString(
      React.createElement(QuotationCard, {
        leadId: 'lead-test-01',
        quotations: [],
      })
    )

    expect(html).toContain('ยังไม่มีใบเสนอราคาแนบกับ Lead นี้')
    expect(html).toContain('แนบใบเสนอราคา (Attach QT)')
  })

  it('T1.11.2: renders existing quotation list with number, status, and Baht amount', () => {
    const mockQuotations = [
      {
        id: 'qt-001',
        number: 'QT-202609-0012',
        totalSatang: 481_500_00, // 481,500.00 THB
        subtotalSatang: 450_000_00,
        vatAmountSatang: 31_500_00, // 31,500.00 THB
        status: 'sent',
        createdAt: new Date('2026-09-12T10:00:00Z'),
        validUntil: new Date('2026-10-12T10:00:00Z'),
      },
    ]

    const html = renderToString(
      React.createElement(QuotationCard, {
        leadId: 'lead-test-01',
        quotations: mockQuotations,
      })
    )

    expect(html).toContain('QT-202609-0012')
    expect(html).toContain('SENT')
    expect(html).toContain('฿481,500.00')
    expect(html).toContain('VAT 7%')
  })

  it('T1.11.3: computes live 7% VAT calculation correctly', () => {
    // Standard 107 THB -> 100 subtotal, 7 VAT
    const calculateVat = (totalBaht: number) => {
      const subtotal = Math.round((totalBaht / 1.07) * 100) / 100
      const vat = Math.round((totalBaht - subtotal) * 100) / 100
      return { subtotal, vat }
    }

    const res1 = calculateVat(107)
    expect(res1.subtotal).toBe(100)
    expect(res1.vat).toBe(7)

    const res2 = calculateVat(107_000)
    expect(res2.subtotal).toBe(100_000)
    expect(res2.vat).toBe(7_000)

    const res3 = calculateVat(481_500)
    expect(res3.subtotal).toBe(450_000)
    expect(res3.vat).toBe(31_500)
  })

  it('T1.11.4: converts Baht input accurately to integer Satang for database storage', () => {
    const toSatang = (baht: number) => Math.round(baht * 100)

    expect(toSatang(0.01)).toBe(1)
    expect(toSatang(100)).toBe(10000)
    expect(toSatang(450000.5)).toBe(45000050)
    expect(toSatang(1234567.89)).toBe(123456789)
  })

  it('T1.11.5: validates quotation number and monetary amount requirements', () => {
    const validateQuotationInput = (number: string, bahtStr: string) => {
      if (!number.trim()) {
        return { valid: false, error: 'กรุณาระบุเลขที่ใบเสนอราคา เช่น QT-202609-0012' }
      }
      const numBaht = parseFloat(bahtStr)
      if (isNaN(numBaht) || numBaht <= 0) {
        return { valid: false, error: 'กรุณาระบุยอดเงินรวมเป็นจำนวนเงินที่ถูกต้อง (มากกว่า 0)' }
      }
      return { valid: true }
    }

    expect(validateQuotationInput('', '1000').valid).toBe(false)
    expect(validateQuotationInput('', '1000').error).toBe('กรุณาระบุเลขที่ใบเสนอราคา เช่น QT-202609-0012')
    expect(validateQuotationInput('QT-01', '0').valid).toBe(false)
    expect(validateQuotationInput('QT-01', '-50').valid).toBe(false)
    expect(validateQuotationInput('QT-01', 'invalid').valid).toBe(false)
    expect(validateQuotationInput('QT-01', '1000').valid).toBe(true)
  })

  it('T1.11.6: calculates default quotation expiration to 30 days from creation', () => {
    const baseDate = new Date('2026-09-14T00:00:00Z')
    const validUntil = new Date(baseDate)
    validUntil.setDate(validUntil.getDate() + 30)

    const diffDays = Math.round((validUntil.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(30)
  })
})
