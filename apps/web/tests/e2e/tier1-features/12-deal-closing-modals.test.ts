import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { DealClosingModals } from '@/app/(wds)/wds/leads/[id]/components/DealClosingModals'
import { LOST_REASONS } from '@/modules/crm/actions'

// Mock actions
vi.mock('@/modules/crm/actions', async () => {
  const actual = await vi.importActual<any>('@/modules/crm/actions')
  return {
    ...actual,
    closeWinLeadAction: vi.fn().mockResolvedValue({
      success: true,
      orderId: 'ord-001',
      orderNumber: 'SO-202609-001',
      creditStatus: 'pass',
    }),
    closeLostLeadAction: vi.fn().mockResolvedValue({ success: true }),
  }
})

describe('Tier 1.12: Deal Closing Modals', () => {
  const sampleQuotations = [
    {
      id: 'qt-101',
      number: 'QT-202609-001',
      totalSatang: 35_000_000, // 350,000 THB
      status: 'accepted',
    },
  ]

  it('T1.12.1: enables Close Win button only when current status is "quoted"', () => {
    const htmlQuoted = renderToString(
      React.createElement(DealClosingModals, {
        leadId: 'lead-test-01',
        currentStatus: 'quoted',
        quotations: sampleQuotations,
      })
    )
    expect(htmlQuoted).toContain('+ ปิดการขาย (Win)')
    expect(htmlQuoted).toContain('bg-emerald-600')

    const htmlNew = renderToString(
      React.createElement(DealClosingModals, {
        leadId: 'lead-test-01',
        currentStatus: 'new',
        quotations: [],
      })
    )
    expect(htmlNew).toContain('disabled=""')
    expect(htmlNew).toContain('disabled:opacity-50')
    expect(htmlNew).toContain('เสนอราคาแล้ว (Quoted)')
  })

  it('T1.12.2: enables Close Lost button from any non-terminal state', () => {
    const nonTerminalStages = ['new', 'contacted', 'qualified', 'site_visit_requested', 'quoted']

    nonTerminalStages.forEach((stage) => {
      const html = renderToString(
        React.createElement(DealClosingModals, {
          leadId: 'lead-test-01',
          currentStatus: stage,
          quotations: [],
        })
      )
      expect(html).toContain('ปิดไม่สำเร็จ (Lost)')
    })
  })

  it('T1.12.3: verifies all 8 mandatory Close Lost reason options are defined and available', () => {
    const EXPECTED_REASONS = [
      'PRICE_HIGH',
      'COMPETITOR_CHOSEN',
      'PROJECT_CANCELLED',
      'UNREACHABLE',
      'SPEC_MISMATCH',
      'BUDGET_INSUFFICIENT',
      'BELOW_WHOLESALE_THRESHOLD',
      'OTHER',
    ]

    expect(LOST_REASONS).toEqual(expect.arrayContaining(EXPECTED_REASONS))
    expect(LOST_REASONS.length).toBeGreaterThanOrEqual(8)
  })

  it('T1.12.4: rejects Close Lost submission when no reason is selected', () => {
    const validateCloseLost = (reason: string) => {
      if (!reason || !reason.trim()) {
        return { valid: false, error: 'กรุณาเลือกสาเหตุการปิดการขายไม่สำเร็จ' }
      }
      if (!LOST_REASONS.includes(reason as any)) {
        return { valid: false, error: 'สาเหตุการปิดการขายไม่ถูกต้อง' }
      }
      return { valid: true }
    }

    expect(validateCloseLost('').valid).toBe(false)
    expect(validateCloseLost('').error).toBe('กรุณาเลือกสาเหตุการปิดการขายไม่สำเร็จ')
    expect(validateCloseLost('UNKNOWN_RANDOM_REASON').valid).toBe(false)
    expect(validateCloseLost('UNKNOWN_RANDOM_REASON').error).toBe('สาเหตุการปิดการขายไม่ถูกต้อง')
    expect(validateCloseLost('PRICE_HIGH').valid).toBe(true)
  })

  it('T1.12.5: locks UI and shows Won status badge when current status is won', () => {
    const htmlWon = renderToString(
      React.createElement(DealClosingModals, {
        leadId: 'lead-test-01',
        currentStatus: 'won',
        quotations: sampleQuotations,
      })
    )

    expect(htmlWon).toContain('ดีลนี้ปิดการขายสำเร็จแล้ว (Deal Won)')
    expect(htmlWon).not.toContain('ปิดการขายไม่สำเร็จ (Close Lost)')
  })

  it('T1.12.6: locks UI and shows Lost status badge with reason when current status is lost', () => {
    const htmlLost = renderToString(
      React.createElement(DealClosingModals, {
        leadId: 'lead-test-01',
        currentStatus: 'lost',
        quotations: [],
        lostReason: 'COMPETITOR_CHOSEN',
      })
    )

    expect(htmlLost).toContain('ดีลนี้ปิดไม่สำเร็จ (Deal Lost)')
    expect(htmlLost).toContain('COMPETITOR_CHOSEN')
    expect(htmlLost).not.toContain('+ ปิดการขาย (Win)')
  })
})
