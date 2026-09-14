import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import { LeadsHub } from '../LeadsHub'
import { LeadsTableView } from './LeadsTableView'
import {
  KanbanBoard,
  type LeadCard,
  STATUSES,
  STATUS_LABELS,
  getLeadDealSatang,
  isStale,
} from '../../pipeline/KanbanBoard'
import { KanbanCard } from '../../pipeline/components/KanbanCard'
import { KanbanColumn } from '../../pipeline/components/KanbanColumn'
import { CloseLostModal } from '../../pipeline/components/CloseLostModal'
import { satangToBaht } from '@/lib/qt-calc'

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock CRM actions
vi.mock('@/modules/crm/actions', () => ({
  updateLeadStatusAction: vi.fn().mockResolvedValue({ success: true }),
  closeLostLeadAction: vi.fn().mockResolvedValue({ success: true }),
  closeWinLeadAction: vi.fn().mockResolvedValue({
    success: true,
    orderNumber: 'SO-2026-09001',
    creditStatus: 'APPROVED',
  }),
  LOST_REASONS: [
    'PRICE_HIGH',
    'COMPETITOR_CHOSEN',
    'PROJECT_CANCELLED',
    'UNREACHABLE',
    'SPEC_MISMATCH',
    'BUDGET_INSUFFICIENT',
    'BELOW_WHOLESALE_THRESHOLD',
    'OTHER',
  ],
}))

// Helper test dataset
const stressTestLeads: LeadCard[] = [
  {
    id: 'lead-thai-special',
    status: 'new',
    source: 'line',
    channelRef: 'REF[001]-*SPECIAL*',
    customerName: 'คุณสมชาย ยิ่งเจริญ [VIP]',
    customerPhone: '081-234-5678',
    company: 'บจก. ก่อสร้างสยาม (ไทยแลนด์)',
    interest: { description: 'เหล็กข้ออ้อย (SD40) + ปูนซีเมนต์ 500 ถุง', products: ['เหล็ก', 'ปูน'] },
    dealValueSatang: 45_000_000, // 450,000.00 THB
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Stale (>7 days)
    ownerName: 'สมศักดิ์ ผู้จัดการ',
  },
  {
    id: 'lead-regex-chars',
    status: 'contacted',
    source: 'phone',
    channelRef: 'TEL(02)?+*^$\\',
    customerName: 'วิศวกร กิตติพงษ์ (Project-A)',
    customerPhone: '0898765432',
    company: 'หจก. พงษ์เจริญ {Engineering}',
    interest: 'กระเบื้องแกรนิตโต้ 60x60 ซม. [เกรด A]',
    dealValueSatang: 25_000_000,
    createdAt: new Date('2026-09-05T00:00:00Z'),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Fresh
  },
  {
    id: 'lead-extreme-satang',
    status: 'qualified',
    source: 'web',
    channelRef: 'MEGA-CORP-99',
    customerName: 'เมกะ โปรเจกต์ โฮลดิ้งส์',
    customerPhone: '025559999',
    company: 'บมจ. เมกะคอร์ปอเรชั่น',
    interest: 'โครงสร้างเหล็กเมกะโปรเจกต์',
    dealValueSatang: 99_999_999_999, // 999,999,999.99 THB (~1 Billion Baht)
    createdAt: new Date('2026-09-02T00:00:00Z'),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'lead-zero-satang',
    status: 'quoted',
    source: 'store',
    customerName: 'คุณประสิทธิ์ ศูนย์บาท',
    customerPhone: '0833331111',
    dealValueSatang: 0,
    budgetRangeMinSatang: 0,
    budgetRangeMaxSatang: 0,
    createdAt: new Date('2026-09-03T00:00:00Z'),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'lead-negative-satang',
    status: 'quoted',
    source: 'architect',
    customerName: 'คุณอนันต์ ติดลบ',
    customerPhone: '0844442222',
    dealValueSatang: -5_000_000, // Invalid negative satang
    budgetRangeMinSatang: -1_000_000,
    budgetRangeMaxSatang: -2_000_000,
    createdAt: new Date('2026-09-04T00:00:00Z'),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'lead-won-stale',
    status: 'won',
    source: 'phone',
    customerName: 'คุณสุชัย ชนะแล้ว',
    customerPhone: '0855553333',
    dealValueSatang: 50_000_000,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago but WON
  },
  {
    id: 'lead-lost-stale',
    status: 'lost',
    source: 'subcontractor',
    customerName: 'คุณมานพ แพ้แล้ว',
    customerPhone: '0866664444',
    lostReason: 'PRICE_HIGH',
    dealValueSatang: 30_000_000,
    createdAt: new Date('2026-08-05T00:00:00Z'),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago but LOST
  },
]

describe('Milestone 4 Challenger Stress & Edge-Case Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Search Filter Rapid Inputs & Special Characters
  // ──────────────────────────────────────────────────────────────────────────
  describe('Task 1.1: Search Filter Special Characters & Rapid Inputs', () => {
    it('handles special regex characters in search input without throwing RegExp SyntaxError', () => {
      // Regex character sequences that typically break naive `new RegExp(query)`
      const adversarialQueries = [
        '[VIP]',
        '*SPECIAL*',
        'TEL(02)?',
        '+*^$\\',
        '{Engineering}',
        '(SD40)',
        '\\\\',
        '???+++***',
      ]

      for (const query of adversarialQueries) {
        expect(() => {
          renderToString(
            <LeadsHub initialLeads={stressTestLeads} initialView="table" initialSearch={query} />
          )
        }).not.toThrow()
      }
    })

    it('matches Thai Unicode queries with tone marks and vowels correctly', () => {
      const html = renderToString(
        <LeadsHub initialLeads={stressTestLeads} initialView="table" initialSearch="สมชาย ยิ่งเจริญ" />
      )
      expect(html).toContain('คุณสมชาย ยิ่งเจริญ [VIP]')
      expect(html).not.toContain('วิศวกร กิตติพงษ์')
      expect(html).toContain('ล้างคำค้นหา')
    })

    it('searches across multiple lead attributes (Name, Phone, Ref, Company, Interest snippet)', () => {
      // Search by phone
      const phoneHtml = renderToString(
        <LeadsHub initialLeads={stressTestLeads} initialView="table" initialSearch="0898765432" />
      )
      expect(phoneHtml).toContain('วิศวกร กิตติพงษ์')
      expect(phoneHtml).not.toContain('คุณสมชาย ยิ่งเจริญ')

      // Search by company
      const companyHtml = renderToString(
        <LeadsHub initialLeads={stressTestLeads} initialView="table" initialSearch="เมกะคอร์ปอเรชั่น" />
      )
      expect(companyHtml).toContain('เมกะ โปรเจกต์ โฮลดิ้งส์')
      expect(companyHtml).not.toContain('คุณสมชาย ยิ่งเจริญ')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Channel Filter Switching + Stale Filter Combinations
  // ──────────────────────────────────────────────────────────────────────────
  describe('Task 1.2: Channel Filter Switching + Stale Filter Combinations', () => {
    it('accurately filters leads when using channel filter', () => {
      // Phone channel
      const phoneHtml = renderToString(
        <LeadsHub initialLeads={stressTestLeads} initialView="table" initialSource="phone" />
      )
      expect(phoneHtml).toContain('วิศวกร กิตติพงษ์ (Project-A)')
      expect(phoneHtml).not.toContain('คุณสมชาย ยิ่งเจริญ [VIP]')

      // LINE OA channel
      const lineHtml = renderToString(
        <LeadsHub initialLeads={stressTestLeads} initialView="table" initialSource="line" />
      )
      expect(lineHtml).toContain('คุณสมชาย ยิ่งเจริญ [VIP]')
      expect(lineHtml).not.toContain('วิศวกร กิตติพงษ์ (Project-A)')

      // All channel
      const allHtml = renderToString(
        <LeadsHub initialLeads={stressTestLeads} initialView="table" initialSource="all" />
      )
      expect(allHtml).toContain('คุณสมชาย ยิ่งเจริญ [VIP]')
      expect(allHtml).toContain('วิศวกร กิตติพงษ์ (Project-A)')
    })

    it('combines channel filtering with Stale filter and strictly excludes won and lost leads', () => {
      // Stale filter rule: isStale(updatedAt) && status !== 'won' && status !== 'lost'
      const isLeadActiveStale = (lead: LeadCard) =>
        isStale(lead.updatedAt) && lead.status !== 'won' && lead.status !== 'lost'

      const staleLeads = stressTestLeads.filter(isLeadActiveStale)
      expect(staleLeads.map(l => l.id)).toEqual(['lead-thai-special'])

      const html = renderToString(
        <LeadsTableView
          leads={staleLeads}
          sortKey="updatedAt"
          sortDirection="desc"
          onSort={vi.fn()}
        />
      )
      expect(html).toContain('คุณสมชาย ยิ่งเจริญ [VIP]')
      expect(html).not.toContain('คุณสุชัย ชนะแล้ว')
      expect(html).not.toContain('คุณมานพ แพ้แล้ว')
      expect(html).not.toContain('วิศวกร กิตติพงษ์ (Project-A)')

      // With stale filter combined with phone:
      const stalePhoneLeads = staleLeads.filter(l => l.source === 'phone')
      expect(stalePhoneLeads.length).toBe(0)
    })

    it('resets all compound filters when clicking reset filters button', () => {
      const html = renderToString(
        <LeadsHub initialLeads={stressTestLeads} initialView="table" />
      )
      expect(html).toContain('ค้นหาลีด')
      expect(html).toContain('กรองเฉพาะ Lead ที่ไม่มีการอัปเดตเกิน 7 วัน')
      expect(html).toContain('ทุกช่องทาง (All)')
      expect(html).toContain('คุณสมชาย ยิ่งเจริญ [VIP]')
      expect(html).toContain('วิศวกร กิตติพงษ์ (Project-A)')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Empty Column States in Kanban Board
  // ──────────────────────────────────────────────────────────────────────────
  describe('Task 1.3: Empty Column States in Kanban Board', () => {
    it('handles empty columns with 0 deal sum and displays empty drop placeholder', () => {
      // Create leads with NO leads in site_visit_requested or won
      const leadsWithoutSiteVisit = stressTestLeads.filter(
        l => l.status !== 'site_visit_requested'
      )

      const html = renderToString(<KanbanBoard leads={leadsWithoutSiteVisit} />)

      // Site visit column header should display 0 ดีล and ฿0.00
      expect(html).toContain('นัดสำรวจ')

      // Empty column placeholder
      expect(html).toContain('ไม่มีรายการในสถานะนี้')
      expect(html).toContain('ลาก Lead มาวางที่นี่')
    })

    it('renders cleanly with 0 leads across all columns without crash or NaN', () => {
      const html = renderToString(<KanbanBoard leads={[]} />).replace(/<!--.*?-->/g, '')

      // All 7 columns present
      STATUSES.forEach(status => {
        expect(html).toContain(STATUS_LABELS[status])
      })

      // Sum aggregation renders ฿0.00 without NaN
      expect(html).not.toContain('NaN')
      expect(html).toContain('฿0.00')
      expect(html).toContain('0 ดีล')
    })

    it('supports drag-over and drop events on empty columns', () => {
      const html = renderToString(
        <KanbanColumn
          status="site_visit_requested"
          leads={[]}
          stageTotal={0}
          isTargetOver={true}
          onDragOver={vi.fn()}
          onDragLeave={vi.fn()}
          onDrop={vi.fn()}
          onDragStartCard={vi.fn()}
          onDragEndCard={vi.fn()}
          onMoveStage={vi.fn()}
        />
      ).replace(/<!--.*?-->/g, '')

      expect(html).toContain('นัดสำรวจ')
      expect(html).toContain('฿0.00')
      expect(html).toContain('0 ดีล')
      expect(html).toContain('ไม่มีรายการในสถานะนี้')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Extreme Satang Amounts in Deal Cards & Column Headers
  // ──────────────────────────────────────────────────────────────────────────
  describe('Task 1.4: Extreme Satang Amounts & Value Bounds', () => {
    it('formats extreme Satang amounts (99,999,999,999 Satang = ฿999,999,999.99) accurately', () => {
      const extremeSatang = 99_999_999_999
      const formatted = satangToBaht(extremeSatang)
      expect(formatted).toBe('999,999,999.99')

      const html = renderToString(
        <KanbanCard
          lead={stressTestLeads[2]} // lead-extreme-satang
          onMoveStage={vi.fn()}
        />
      ).replace(/<!--.*?-->/g, '')

      // Must display formatted extreme amount with Baht symbol
      expect(html).toContain('฿999,999,999.99')
    })

    it('aggregates column totals with extreme Satang amounts without integer overflow', () => {
      const html = renderToString(
        <KanbanColumn
          status="qualified"
          leads={[stressTestLeads[2]]}
          stageTotal={99_999_999_999}
          onDragOver={vi.fn()}
          onDragLeave={vi.fn()}
          onDrop={vi.fn()}
          onDragStartCard={vi.fn()}
          onDragEndCard={vi.fn()}
          onMoveStage={vi.fn()}
        />
      ).replace(/<!--.*?-->/g, '')

      expect(html).toContain('฿999,999,999.99')
      expect(html).toContain('1 ดีล')
    })

    it('protects against 0 Satang and negative Satang amounts via getLeadDealSatang', () => {
      // 0 satang lead
      const zeroSatang = getLeadDealSatang(stressTestLeads[3])
      expect(zeroSatang).toBe(0)
      expect(satangToBaht(zeroSatang)).toBe('0.00')

      // Negative satang lead (-5,000,000) should be guarded to 0
      const negativeSatang = getLeadDealSatang(stressTestLeads[4])
      expect(negativeSatang).toBe(0)
      expect(satangToBaht(negativeSatang)).toBe('0.00')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Close Lost Modal Validation
  // ──────────────────────────────────────────────────────────────────────────
  describe('Task 1.5: Close Lost Modal Validation & State Safety', () => {
    it('strictly blocks submission and disables submit button when lost reason is empty', () => {
      const disabledHtml = renderToString(
        <CloseLostModal
          pendingLead={{
            lead: stressTestLeads[0],
            fromStatus: 'new',
          }}
          selectedReason=""
          onSelectReason={vi.fn()}
          note=""
          onChangeNote={vi.fn()}
          error=""
          submitting={false}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      )

      // Button should be disabled
      expect(disabledHtml).toContain('disabled=""')
      expect(disabledHtml).toContain('ยืนยันปิด Lead (Close Lost)')

      // When a valid reason is selected, submit button becomes enabled
      const enabledHtml = renderToString(
        <CloseLostModal
          pendingLead={{
            lead: stressTestLeads[0],
            fromStatus: 'new',
          }}
          selectedReason="PRICE_HIGH"
          onSelectReason={vi.fn()}
          note=""
          onChangeNote={vi.fn()}
          error=""
          submitting={false}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      )

      expect(enabledHtml).toContain('ยืนยันปิด Lead (Close Lost)')
      expect(enabledHtml).not.toContain('disabled=""')
    })

    it('renders error banner inside CloseLostModal when error prop is provided', () => {
      const html = renderToString(
        <CloseLostModal
          pendingLead={{
            lead: stressTestLeads[0],
            fromStatus: 'new',
          }}
          selectedReason="PRICE_HIGH"
          onSelectReason={vi.fn()}
          note=""
          onChangeNote={vi.fn()}
          error="กรุณาเลือกเหตุผลการปิดการขายไม่สำเร็จ"
          submitting={false}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      )

      expect(html).toContain('กรุณาเลือกเหตุผลการปิดการขายไม่สำเร็จ')
    })

    it('displays loading spinner and disables actions while submitting', () => {
      const html = renderToString(
        <CloseLostModal
          pendingLead={{
            lead: stressTestLeads[0],
            fromStatus: 'new',
          }}
          selectedReason="PRICE_HIGH"
          onSelectReason={vi.fn()}
          note=""
          onChangeNote={vi.fn()}
          error=""
          submitting={true}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      )

      expect(html).toContain('กำลังบันทึก...')
      expect(html).toContain('disabled=""')
    })
  })
})
