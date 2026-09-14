import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { LeadsHub } from '@/app/(wds)/wds/leads/LeadsHub'
import type { LeadCard } from '@/app/(wds)/wds/pipeline/KanbanBoard'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/wds/leads',
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Tier 1.6: View Switcher (Kanban vs Table)', () => {
  const sampleLeads: LeadCard[] = [
    {
      id: 'lead-test-01',
      status: 'new',
      source: 'line',
      channelRef: 'U100200300',
      customerName: 'คุณสมชาย ยอดขาย',
      customerPhone: '0812345678',
      company: 'บจก. สยามนคร คอนสตรัคชั่น',
      interest: 'ปูนอินทรี 500 ถุง + เหล็กเส้น',
      budgetRangeMinSatang: 30_000_000,
      budgetRangeMaxSatang: 50_000_000,
      dealValueSatang: 45_000_000,
      createdAt: new Date('2026-09-10T10:00:00Z'),
      updatedAt: new Date('2026-09-10T10:00:00Z'),
      score: 85,
    },
    {
      id: 'lead-test-02',
      status: 'contacted',
      source: 'phone',
      channelRef: '029998888',
      customerName: 'คุณวิไลพร ช่างทอง',
      customerPhone: '0898765432',
      company: 'หจก. วิไลการช่าง',
      interest: 'กระเบื้องปูพื้น 200 กล่อง',
      dealValueSatang: 20_000_000,
      createdAt: new Date('2026-09-12T08:00:00Z'),
      updatedAt: new Date('2026-09-12T08:00:00Z'),
      score: 65,
    },
  ]

  it('T1.6.1: renders in Kanban mode by default when initialView="kanban"', () => {
    const html = renderToString(
      React.createElement(LeadsHub, {
        initialLeads: sampleLeads,
        initialView: 'kanban',
      })
    )

    // Kanban board column headers and cards
    expect(html).toContain('ใหม่')
    expect(html).toContain('ติดต่อแล้ว')
    expect(html).toContain('คุณสมชาย ยอดขาย')
  })

  it('T1.6.2: renders in Table mode when initialView="table"', () => {
    const html = renderToString(
      React.createElement(LeadsHub, {
        initialLeads: sampleLeads,
        initialView: 'table',
      })
    )

    expect(html).toContain('<table')
    expect(html).toContain('ลูกค้า / โครงการ')
    expect(html).toContain('เบอร์โทรศัพท์')
    expect(html).toContain('ช่องทาง')
    expect(html).toContain('ความต้องการ / สินค้า')
    expect(html).toContain('งบประมาณ / มูลค่า')
    expect(html).toContain('สถานะ')
    expect(html).toContain('คุณสมชาย ยอดขาย')
  })

  it('T1.6.3: Table view renders formatted monetary values in Baht with Thai Watsadu formatting', () => {
    const rawHtml = renderToString(
      React.createElement(LeadsHub, {
        initialLeads: sampleLeads,
        initialView: 'table',
      })
    )
    const html = rawHtml.replace(/<!--.*?-->/g, '')

    // 45,000,000 Satang = 450,000 THB
    expect(html).toContain('฿450,000')
    // 20,000,000 Satang = 200,000 THB
    expect(html).toContain('฿200,000')
  })

  it('T1.6.4: Table view renders phone link with tel: protocol', () => {
    const html = renderToString(
      React.createElement(LeadsHub, {
        initialLeads: sampleLeads,
        initialView: 'table',
      })
    )

    expect(html).toContain('href="tel:0812345678"')
    expect(html).toContain('href="tel:0898765432"')
  })

  it('T1.6.5: View switcher preserves applied source and status filters', () => {
    const html = renderToString(
      React.createElement(LeadsHub, {
        initialLeads: sampleLeads,
        initialView: 'table',
        initialSource: 'line',
        initialStatus: 'new',
      })
    )

    // Only lead-test-01 (LINE, new) should appear, not lead-test-02 (phone, contacted)
    expect(html).toContain('คุณสมชาย ยอดขาย')
    expect(html).not.toContain('คุณวิไลพร ช่างทอง')
  })

  it('T1.6.6: Table view displays channel source badge for LINE and Phone', () => {
    const html = renderToString(
      React.createElement(LeadsHub, {
        initialLeads: sampleLeads,
        initialView: 'table',
      })
    )

    expect(html).toContain('LINE')
    expect(html).toContain('โทร')
  })
})
