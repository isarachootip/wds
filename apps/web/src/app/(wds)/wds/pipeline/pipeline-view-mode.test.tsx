import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { KanbanBoard, type LeadCard } from './KanbanBoard'
import { PipelineListView } from './components/PipelineListView'
import { satangToBaht } from '@/lib/qt-calc'

describe('Sales Pipeline View Mode & High-Contrast Typography Suite', () => {
  const sampleLeads: LeadCard[] = [
    {
      id: 'lead-test-p1',
      status: 'new',
      source: 'line',
      channelRef: 'U999888777',
      customerName: 'ห้างหุ้นส่วนจำกัด ชัยเจริญ โลจิสติกส์',
      customerPhone: '0838123456',
      company: 'ห้างหุ้นส่วนจำกัด ชัยเจริญ โลจิสติกส์ พาร์ท',
      interest: 'เหล็กโครงสร้าง 10 ตัน + ปูนซีเมนต์ 200 ถุง',
      budgetRangeMinSatang: 710_000_000,
      budgetRangeMaxSatang: 710_000_000,
      dealValueSatang: 710_000_000, // 7,100,000 THB
      createdAt: new Date('2026-09-10T10:00:00Z'),
      updatedAt: new Date('2026-09-10T10:00:00Z'),
      ownerName: 'AE ฝ่ายขาย',
    },
    {
      id: 'lead-test-p2',
      status: 'contacted',
      source: 'phone',
      channelRef: '0535678901',
      customerName: 'ห้างหุ้นส่วนจำกัด นอร์ทเทิร์น บิลดิ้ง',
      customerPhone: '0535678901',
      company: 'นอร์ทเทิร์น บิลดิ้ง เชียงใหม่',
      interest: 'กระเบื้องแกรนิตโต้ 500 กล่อง',
      dealValueSatang: 150_000_000, // 1,500,000 THB
      createdAt: new Date('2026-09-12T08:00:00Z'),
      updatedAt: new Date('2026-09-12T08:00:00Z'),
      ownerName: 'AE ภาคเหนือ',
    },
  ]

  it('renders KanbanBoard in Card (Kanban) mode with high-contrast prominent stage headers', () => {
    const rawHtml = renderToString(
      <KanbanBoard initialLeads={sampleLeads} initialView="kanban" />
    )
    const html = rawHtml.replace(/<!--.*?-->/g, '')

    // View toggle buttons present
    expect(html).toContain('การ์ด (Card / Kanban)')
    expect(html).toContain('รายการ (List / Table)')

    // Stage labels & Large bold deal totals
    expect(html).toContain('ใหม่')
    expect(html).toContain('ติดต่อแล้ว')
    expect(html).toContain(`฿${satangToBaht(710_000_000)}`)
    expect(html).toContain(`฿${satangToBaht(150_000_000)}`)

    // Lead cards
    expect(html).toContain('ห้างหุ้นส่วนจำกัด ชัยเจริญ โลจิสติกส์')
  })

  it('renders KanbanBoard in List (Table) mode with stage KPI summary and leads data table', () => {
    const rawHtml = renderToString(
      <KanbanBoard initialLeads={sampleLeads} initialView="list" />
    )
    const html = rawHtml.replace(/<!--.*?-->/g, '')

    // Table elements
    expect(html).toContain('<table')
    expect(html).toContain('ลูกค้า / โครงการ')
    expect(html).toContain('สถานะ / ขั้นตอน')
    expect(html).toContain('มูลค่าดีล')
    expect(html).toContain('ช่องทาง')
    expect(html).toContain('เบอร์โทรศัพท์')

    // Formatted deal amounts
    expect(html).toContain(`฿${satangToBaht(710_000_000)}`)
    expect(html).toContain(`฿${satangToBaht(150_000_000)}`)
    expect(html).toContain('ห้างหุ้นส่วนจำกัด ชัยเจริญ โลจิสติกส์')
  })

  it('renders PipelineListView directly with stage sums and quick stage select', () => {
    const stageSums = {
      new: 710_000_000,
      contacted: 150_000_000,
      qualified: 0,
      site_visit_requested: 0,
      quoted: 0,
      won: 0,
      lost: 0,
    }
    const byStatus = {
      new: [sampleLeads[0]],
      contacted: [sampleLeads[1]],
      qualified: [],
      site_visit_requested: [],
      quoted: [],
      won: [],
      lost: [],
    }

    const rawHtml = renderToString(
      <PipelineListView
        leads={sampleLeads}
        stageSums={stageSums}
        byStatus={byStatus}
        onMoveStage={vi.fn()}
      />
    )
    const html = rawHtml.replace(/<!--.*?-->/g, '')

    expect(html).toContain('มูลค่ารวม:')
    expect(html).toContain(`฿${satangToBaht(710_000_000)}`)
    expect(html).toContain('ย้ายไป: ผ่านเกณฑ์')
  })
})
