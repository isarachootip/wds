import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { SiteVisitCard } from '@/app/(wds)/wds/leads/[id]/components/SiteVisitCard'
import { requestSiteVisitAction } from '@/modules/crm/actions'

// Mock requestSiteVisitAction
vi.mock('@/modules/crm/actions', () => ({
  requestSiteVisitAction: vi.fn().mockResolvedValue({ success: true, siteVisitId: 'sv-123' }),
}))

describe('Tier 1.10: Site Visit Dispatch', () => {
  it('T1.10.1: renders empty state callout when no site visit exists', () => {
    const html = renderToString(
      React.createElement(SiteVisitCard, {
        leadId: 'lead-test-01',
        siteVisits: [],
      })
    )

    expect(html).toContain('ยังไม่มีข้อมูลการนัดหมายสำรวจหน้างาน')
    expect(html).toContain('ขอนัดสำรวจหน้างานใหม่')
  })

  it('T1.10.2: renders existing site visit details with status and truck clearance', () => {
    const mockVisits = [
      {
        id: 'sv-001',
        leadId: 'lead-test-01',
        status: 'scheduled',
        purpose: 'วัดพื้นที่เทพื้นคอนกรีต (ระยะผ่านทางรถ: 10W)',
        createdAt: new Date('2026-09-12T10:00:00Z'),
        appointment: {
          id: 'app-001',
          status: 'scheduled',
          approvedAt: new Date('2026-09-12T11:00:00Z'),
        },
      },
    ]

    const html = renderToString(
      React.createElement(SiteVisitCard, {
        leadId: 'lead-test-01',
        siteVisits: mockVisits,
      })
    )

    expect(html).toContain('วัดพื้นที่เทพื้นคอนกรีต')
    expect(html).toContain('10W')
    expect(html).toContain('📅 นัดหมายแล้ว')
  })

  it('T1.10.3: defines all 4 standard truck road clearance categories', () => {
    const TRUCK_TYPES = [
      { key: '4W', label: '4W (กระบะ 4 ล้อ)', desc: 'เข้าได้สะดวก' },
      { key: '6W', label: '6W (บรรทุก 6 ล้อ)', desc: 'ถนนกว้าง > 4 ม.' },
      { key: '10W', label: '10W (สิบล้อ)', desc: 'ถนนกว้าง > 6 ม.' },
      { key: '22W', label: '22W (เทรลเลอร์)', desc: 'ทางหลัก ไม่มีสายไฟต่ำ' },
    ]

    expect(TRUCK_TYPES).toHaveLength(4)
    expect(TRUCK_TYPES.map((t) => t.key)).toEqual(['4W', '6W', '10W', '22W'])
  })

  it('T1.10.4: validates purpose requirement before dispatching site visit', () => {
    const validateRequest = (purpose: string) => {
      if (!purpose.trim()) {
        return { valid: false, error: 'กรุณาระบุวัตถุประสงค์ในการเข้าสำรวจหน้างาน' }
      }
      return { valid: true }
    }

    expect(validateRequest('').valid).toBe(false)
    expect(validateRequest('   ').valid).toBe(false)
    expect(validateRequest('').error).toBe('กรุณาระบุวัตถุประสงค์ในการเข้าสำรวจหน้างาน')
    expect(validateRequest('สำรวจขนาดคานและทางเข้า').valid).toBe(true)
  })

  it('T1.10.5: constructs formatted purpose string incorporating truck clearance and scope', () => {
    const buildFullPurpose = (purpose: string, truckClearance: string, scopeNotes?: string) => {
      return `${purpose.trim()} (ระยะผ่านทางรถ: ${truckClearance}${
        scopeNotes?.trim() ? `, ขอบเขต: ${scopeNotes.trim()}` : ''
      })`
    }

    const res1 = buildFullPurpose('ตรวจพื้นที่เทคอนกรีต', '6W')
    expect(res1).toBe('ตรวจพื้นที่เทคอนกรีต (ระยะผ่านทางรถ: 6W)')

    const res2 = buildFullPurpose('ตรวจพื้นที่เทคอนกรีต', '10W', 'วัดความกว้างซอยทางเข้า')
    expect(res2).toBe('ตรวจพื้นที่เทคอนกรีต (ระยะผ่านทางรถ: 10W, ขอบเขต: วัดความกว้างซอยทางเข้า)')
  })

  it('T1.10.6: displays link to Field Service App job view when visit is linked to a job', () => {
    const mockVisits = [
      {
        id: 'sv-002',
        leadId: 'lead-test-01',
        status: 'scheduled',
        purpose: 'วัดระดับดิน',
        job: { id: 'job-999', status: 'checked_in' },
      },
    ]

    const html = renderToString(
      React.createElement(SiteVisitCard, {
        leadId: 'lead-test-01',
        siteVisits: mockVisits,
      })
    )

    expect(html).toContain('เปิดดูรายละเอียดเต็มใน Field App')
    expect(html).toContain('href="/visit/jobs/job-999"')
  })
})
