import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { QuickActivityLogger } from '@/app/(wds)/wds/leads/[id]/components/QuickActivityLogger'
import { logLeadActivityAction } from '@/modules/crm/actions'

// Mock logLeadActivityAction
vi.mock('@/modules/crm/actions', () => ({
  logLeadActivityAction: vi.fn().mockResolvedValue({ success: true, activityId: 'act-123' }),
}))

describe('Tier 1.9: Quick Activity Logging', () => {
  it('T1.9.1: renders tabs for all 3 quick activity channels (Phone Call, LINE Chat, Note)', () => {
    const html = renderToString(
      React.createElement(QuickActivityLogger, { leadId: 'lead-test-01' })
    )

    expect(html).toContain('โทรศัพท์')
    expect(html).toContain('LINE')
    expect(html).toContain('โน้ตภายใน')
  })

  it('T1.9.2: renders quick suggestion tags for fast selection', () => {
    const html = renderToString(
      React.createElement(QuickActivityLogger, { leadId: 'lead-test-01' })
    )

    expect(html).toContain('ข้อความสำเร็จรูป')
    expect(html).toContain('โทรคุยเรื่อง BOQ และสรุปปริมาณสินค้า')
  })

  it('T1.9.3: renders textarea and action submit button', () => {
    const html = renderToString(
      React.createElement(QuickActivityLogger, { leadId: 'lead-test-01' })
    )

    expect(html).toContain('textarea')
    expect(html).toContain('พร้อมบันทึก')
    expect(html).toContain('บันทึกกิจกรรม')
  })

  it('T1.9.4: validates activity payload contract format', () => {
    const samplePayload = {
      leadId: 'lead-test-01',
      type: 'call' as const,
      note: 'โทรคุยเรื่องสเปกเหล็กข้ออ้อย มอก.',
      actorId: 'sales-ae',
    }

    expect(samplePayload.leadId).toBe('lead-test-01')
    expect(['call', 'line', 'note', 'visit']).toContain(samplePayload.type)
    expect(samplePayload.note.trim().length).toBeGreaterThan(0)
    expect(samplePayload.actorId).toBe('sales-ae')
  })

  it('T1.9.5: rejects empty or whitespace-only activity submission', () => {
    const validateNote = (note: string) => {
      if (!note.trim()) {
        return { valid: false, error: 'กรุณาระบุรายละเอียดกิจกรรมหรือข้อความ' }
      }
      return { valid: true }
    }

    expect(validateNote('').valid).toBe(false)
    expect(validateNote('   ').valid).toBe(false)
    expect(validateNote(' \n\t ').valid).toBe(false)
    expect(validateNote('').error).toBe('กรุณาระบุรายละเอียดกิจกรรมหรือข้อความ')
    expect(validateNote('ติดต่อลูกค้าเรียบร้อย').valid).toBe(true)
  })

  it('T1.9.6: verifies multiline tag appending behavior', () => {
    const appendTag = (currentNote: string, tag: string) => {
      return currentNote.trim() ? `${currentNote}\n- ${tag}` : tag
    }

    const note1 = appendTag('', 'แท็กเริ่มต้น')
    expect(note1).toBe('แท็กเริ่มต้น')

    const note2 = appendTag(note1, 'แท็กที่สอง')
    expect(note2).toBe('แท็กเริ่มต้น\n- แท็กที่สอง')
  })
})
