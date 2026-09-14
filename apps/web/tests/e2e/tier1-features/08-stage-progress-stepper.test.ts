import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StageProgressStepper } from '@/app/(wds)/wds/leads/[id]/components/StageProgressStepper'
import { LEAD_MACHINE } from '@/modules/crm/lead-machine'
import { isValidTransition } from '@/lib/statemachine'

// Mock updateLeadStatusAction
vi.mock('@/modules/crm/actions', () => ({
  updateLeadStatusAction: vi.fn().mockResolvedValue({ success: true }),
}))

describe('Tier 1.8: Stage Progress Stepper', () => {
  it('T1.8.1: renders all 6 linear sales cycle stages in exact sequential order', () => {
    const html = renderToString(
      React.createElement(StageProgressStepper, {
        leadId: 'lead-test-01',
        currentStatus: 'new',
      })
    )

    expect(html).toContain('ใหม่')
    expect(html).toContain('ติดต่อแล้ว')
    expect(html).toContain('ผ่านเกณฑ์')
    expect(html).toContain('นัดสำรวจ')
    expect(html).toContain('เสนอราคา')
    expect(html).toContain('ปิดการขาย')
  })

  it('T1.8.2: marks stages preceding current stage as completed', () => {
    const html = renderToString(
      React.createElement(StageProgressStepper, {
        leadId: 'lead-test-01',
        currentStatus: 'qualified',
      })
    )

    // Stage 1 (new) and Stage 2 (contacted) are completed
    expect(html).toContain('text-white') // Completed step circle
    expect(html).toContain('bg-emerald-600')
  })

  it('T1.8.3: renders advance button for single next eligible transition (new -> contacted)', () => {
    const html = renderToString(
      React.createElement(StageProgressStepper, {
        leadId: 'lead-test-01',
        currentStatus: 'new',
      })
    )

    expect(html).toContain('เลื่อนเป็น: ติดต่อแล้ว (Contacted)')
  })

  it('T1.8.4: renders dual options when at qualified stage (Site Visit vs Fast-track Quote)', () => {
    const html = renderToString(
      React.createElement(StageProgressStepper, {
        leadId: 'lead-test-01',
        currentStatus: 'qualified',
      })
    )

    expect(html).toContain('นัดสำรวจหน้างาน (Site Visit)')
    expect(html).toContain('ข้ามไปเสนอราคา (Fast-track Quote)')
  })

  it('T1.8.5: renders Won banner and suppresses advance buttons when status is won', () => {
    const html = renderToString(
      React.createElement(StageProgressStepper, {
        leadId: 'lead-test-01',
        currentStatus: 'won',
      })
    )

    expect(html).toContain('ชนะการขายสำเร็จ (Won)')
    expect(html).not.toContain('เลื่อนเป็น:')
    expect(isValidTransition(LEAD_MACHINE, 'won', 'lost')).toBe(false)
  })

  it('T1.8.6: renders Lost banner with reason and suppresses advance buttons when status is lost', () => {
    const html = renderToString(
      React.createElement(StageProgressStepper, {
        leadId: 'lead-test-01',
        currentStatus: 'lost',
        lostReason: 'PRICE_HIGH',
      })
    )

    expect(html).toContain('ปิดไม่สำเร็จ (Lost)')
    expect(html).toContain('เหตุผล:')
    expect(html).toContain('PRICE_HIGH')
    expect(html).not.toContain('เลื่อนเป็น:')
    expect(isValidTransition(LEAD_MACHINE, 'lost', 'won')).toBe(false)
  })
})
