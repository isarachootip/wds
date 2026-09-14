import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import { LeadsHub } from '../LeadsHub'
import { LeadsTableView } from './LeadsTableView'
import { KanbanBoard, type LeadCard, STATUSES, STATUS_LABELS, isStale } from '../../pipeline/KanbanBoard'
import { KanbanCard } from '../../pipeline/components/KanbanCard'
import { satangToBaht } from '@/lib/qt-calc'

// Helper to resolve workspace file paths reliably across monorepo and package cwd
function resolveFilePath(relPath: string): string {
  const normRel = relPath.replace(/\\/g, '/')
  const stripped = normRel.replace(/^apps\/web\//, '')
  const candidates = [
    path.resolve(process.cwd(), normRel),
    path.resolve(process.cwd(), stripped),
    path.resolve('c:/atgv/wds', normRel),
    path.resolve(__dirname, '../../../../../../..', normRel),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return candidates[0]
}

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Sample test fixtures
const testLeads: LeadCard[] = [
  {
    id: 'lead-001',
    status: 'new',
    source: 'line',
    channelRef: 'BR-BANGNA-01',
    customerName: 'คุณสมชาย นครพิงค์',
    customerPhone: '0812345678',
    company: 'บจก. สยามนครก่อสร้าง',
    interest: { description: 'ปูนอินทรี 500 ถุง', products: ['ปูน'] },
    dealValueSatang: 45_000_000, // 450,000 THB
    createdAt: new Date('2026-09-10T10:00:00Z'),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Stale (>7 days)
    score: 85,
    ownerId: 'ae-001',
    ownerName: 'สมชาย ผู้ดูแล',
  },
  {
    id: 'lead-002',
    status: 'contacted',
    source: 'phone',
    channelRef: 'TEL-INBOUND',
    customerName: 'คุณวิไลพร เก่งการช่าง',
    customerPhone: '0898765432',
    company: 'หจก. วิไลการช่าง',
    interest: 'กระเบื้องแกรนิตโต้ 200 กล่อง',
    dealValueSatang: 25_000_000, // 250,000 THB
    createdAt: new Date('2026-09-12T08:00:00Z'),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Fresh
    score: 70,
    ownerId: 'ae-002',
    ownerName: 'วิภาดา ฝ่ายขาย',
  },
  {
    id: 'lead-003',
    status: 'qualified',
    source: 'web',
    channelRef: 'WEB-INQ-88',
    customerName: 'บจก. เอเปกซ์ บิลเดอร์',
    customerPhone: '025556677',
    company: 'บจก. เอเปกซ์ บิลเดอร์',
    interest: 'เหล็กโครงสร้าง มอก.',
    dealValueSatang: 120_000_000, // 1,200,000 THB
    createdAt: new Date('2026-09-08T09:00:00Z'),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    score: 90,
  },
  {
    id: 'lead-004',
    status: 'site_visit_requested',
    source: 'architect',
    customerName: 'สถาปนิก เอกรินทร์',
    customerPhone: '0844445566',
    dealValueSatang: 80_000_000,
    createdAt: new Date('2026-09-05T09:00:00Z'),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'lead-005',
    status: 'quoted',
    source: 'subcontractor',
    customerName: 'ช่างเด่น งานระบบ',
    customerPhone: '0867778899',
    dealValueSatang: 35_000_000,
    createdAt: new Date('2026-09-06T09:00:00Z'),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'lead-006',
    status: 'won',
    source: 'store',
    customerName: 'คุณอนันต์ ชัยชนะ',
    customerPhone: '0911112233',
    dealValueSatang: 50_000_000,
    createdAt: new Date('2026-09-01T09:00:00Z'),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // >7 days but WON
  },
  {
    id: 'lead-007',
    status: 'lost',
    source: 'phone',
    customerName: 'คุณกิตติ ชะลอโครงการ',
    customerPhone: '0833334455',
    lostReason: 'PROJECT_CANCELLED',
    dealValueSatang: 15_000_000,
    createdAt: new Date('2026-09-02T09:00:00Z'),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // >7 days but LOST
  },
]

describe('Milestone 4: Leads Hub & Sales Pipeline Modernization Test Suite', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. LeadsHub View Switcher & Header Controls
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. View Switcher & Header Controls', () => {
    it('renders header with title, Thai Buddhist Era context, and + เพิ่มลีด action button', () => {
      const html = renderToString(<LeadsHub initialLeads={testLeads} initialView="kanban" />)

      expect(html).toContain('ศูนย์จัดการลีด (Leads Hub)')
      const buddhistYear = String(new Date().getFullYear() + 543)
      expect(html).toContain(buddhistYear)

      expect(html).toContain('+ เพิ่มลีด')
      expect(html).toContain('href="/wds/leads/new"')
    })

    it('renders pill-segmented view switcher with Pipeline (Kanban) and Data Table options', () => {
      const html = renderToString(<LeadsHub initialLeads={testLeads} initialView="kanban" />)

      expect(html).toContain('Pipeline (Kanban)')
      expect(html).toContain('Data Table')
      expect(html).toContain('role="tablist"')
      expect(html).toContain('aria-selected="true"')
    })

    it('switches seamlessly between Kanban view and Table view when rendered with initialView', () => {
      // Kanban view
      const kanbanHtml = renderToString(<LeadsHub initialLeads={testLeads} initialView="kanban" />)
      expect(kanbanHtml).toContain('ใหม่')
      expect(kanbanHtml).toContain('Pipeline (Kanban)')
      expect(kanbanHtml).not.toContain('<table')

      // Table view
      const tableHtml = renderToString(<LeadsHub initialLeads={testLeads} initialView="table" />)
      expect(tableHtml).toContain('<table')
      expect(tableHtml).toContain('ลูกค้า / โครงการ')
      expect(tableHtml).toContain('AE ผู้ดูแล')
      expect(tableHtml).toContain('สาขา')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Faceted Search, Channel Chips & Stale Filter
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Faceted Search & Filtering Engine', () => {
    it('provides all 6 channel chips (Phone, LINE OA, Walk-in, Web, Architect, Subcontractor) plus All', () => {
      const html = renderToString(<LeadsHub initialLeads={testLeads} initialView="table" />)

      expect(html).toContain('ทุกช่องทาง (All)')
      expect(html).toContain('โทรศัพท์ (Phone)')
      expect(html).toContain('LINE OA')
      expect(html).toContain('หน้าร้าน (Walk-in)')
      expect(html).toContain('เว็บไซต์ (Web)')
      expect(html).toContain('สถาปนิก (Architect)')
      expect(html).toContain('ผู้รับเหมาช่วง (Subcontractor)')
    })

    it('filters leads by channel chip selection', () => {
      const html = renderToString(
        <LeadsHub initialLeads={testLeads} initialView="table" initialSource="line" />
      )

      expect(html).toContain('คุณสมชาย นครพิงค์')
      expect(html).not.toContain('คุณวิไลพร เก่งการช่าง')
    })

    it('filters leads by search query and supports clear button', () => {
      const filteredHtml = renderToString(
        <LeadsHub initialLeads={testLeads} initialView="table" initialSearch="วิไลพร" />
      )
      expect(filteredHtml).toContain('คุณวิไลพร เก่งการช่าง')
      expect(filteredHtml).not.toContain('คุณสมชาย นครพิงค์')
      expect(filteredHtml).toContain('ล้างคำค้นหา')
    })

    it('filters stale leads inactive >7 days excluding won and lost deals', () => {
      const hubHtml = renderToString(<LeadsHub initialLeads={testLeads} initialView="table" />)
      expect(hubHtml).toContain('กรองเฉพาะ Lead ที่ไม่มีการอัปเดตเกิน 7 วัน')

      const staleFilter = (lead: LeadCard) =>
        isStale(lead.updatedAt) && lead.status !== 'won' && lead.status !== 'lost'

      const staleFilteredLeads = testLeads.filter(staleFilter)
      expect(staleFilteredLeads.map(l => l.id)).toEqual(['lead-001'])

      const tableHtml = renderToString(
        <LeadsTableView
          leads={staleFilteredLeads}
          sortKey="updatedAt"
          sortDirection="desc"
          onSort={vi.fn()}
        />
      )
      expect(tableHtml).toContain('คุณสมชาย นครพิงค์')
      expect(tableHtml).not.toContain('คุณอนันต์ ชัยชนะ')
      expect(tableHtml).not.toContain('คุณกิตติ ชะลอโครงการ')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Cruip Artifact Kanban Cards & 7 Pipeline Stages
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Kanban Board & Cruip Deal Cards', () => {
    it('defines exactly the 7 CRM pipeline stages', () => {
      expect(STATUSES).toEqual([
        'new',
        'contacted',
        'qualified',
        'site_visit_requested',
        'quoted',
        'won',
        'lost',
      ])
    })

    it('renders modern column headers with lead counts and total sum formatted via satangToBaht', () => {
      const rawHtml = renderToString(<KanbanBoard leads={testLeads} />)
      const html = rawHtml.replace(/<!--.*?-->/g, '')

      // Verify each stage label is displayed
      STATUSES.forEach(status => {
        expect(html).toContain(STATUS_LABELS[status])
      })

      // Stage totals
      // new: 45_000_000 satang -> 450,000.00
      expect(html).toContain(`฿${satangToBaht(45_000_000)}`)
      // contacted: 25_000_000 satang -> 250,000.00
      expect(html).toContain(`฿${satangToBaht(25_000_000)}`)
    })

    it('renders KanbanCard with Cruip Artifact styling and deal attributes', () => {
      const rawHtml = renderToString(
        <KanbanCard
          lead={testLeads[0]}
          onMoveStage={vi.fn()}
        />
      )
      const html = rawHtml.replace(/<!--.*?-->/g, '')

      // Customer name & project
      expect(html).toContain('คุณสมชาย นครพิงค์')
      expect(html).toContain('บจก. สยามนครก่อสร้าง')

      // Satang amount via satangToBaht
      expect(html).toContain(`฿${satangToBaht(45_000_000)}`)

      // Stale indicator dot
      expect(html).toContain('ค้าง &gt;7 วัน')

      // AE avatar initials
      expect(html).toContain('สผ')

      // Accessible stage move dropdown
      expect(html).toContain('ย้ายสถานะลีด คุณสมชาย นครพิงค์')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Dense Operational Table View
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Dense Operational Table View', () => {
    it('renders table columns for Customer, Phone, Channel, Branch, AE Actor, Interest, Deal Value, Status, and Actions', () => {
      const html = renderToString(
        <LeadsTableView
          leads={testLeads}
          sortKey="updatedAt"
          sortDirection="desc"
          onSort={vi.fn()}
        />
      )

      expect(html).toContain('ลูกค้า / โครงการ')
      expect(html).toContain('เบอร์โทรศัพท์')
      expect(html).toContain('ช่องทาง')
      expect(html).toContain('สาขา')
      expect(html).toContain('AE ผู้ดูแล')
      expect(html).toContain('ความต้องการ / สินค้า')
      expect(html).toContain('งบประมาณ / มูลค่า')
      expect(html).toContain('สถานะ')
      expect(html).toContain('อัปเดตล่าสุด')
      expect(html).toContain('การดำเนินการ')

      // Check actions link to lead detail
      expect(html).toContain('href="/wds/leads/lead-001"')
      expect(html).toContain('รายละเอียด')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Zero Light-Only Hardcoded Classes Audit
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Zero Light-Only Hardcoded Classes Source Audit', () => {
    const allM4Files = [
      'apps/web/src/app/(wds)/wds/leads/LeadsHub.tsx',
      'apps/web/src/app/(wds)/wds/leads/page.tsx',
      'apps/web/src/app/(wds)/wds/leads/components/LeadsTableView.tsx',
      'apps/web/src/app/(wds)/wds/pipeline/KanbanBoard.tsx',
      'apps/web/src/app/(wds)/wds/pipeline/page.tsx',
      'apps/web/src/app/(wds)/wds/pipeline/components/KanbanCard.tsx',
      'apps/web/src/app/(wds)/wds/pipeline/components/KanbanColumn.tsx',
      'apps/web/src/app/(wds)/wds/pipeline/components/CloseLostModal.tsx',
      'apps/web/src/app/(wds)/wds/pipeline/components/CloseWinModal.tsx',
    ]

    const prohibitedClassPatterns = [
      /\bbg-white\b/,
      /\bborder-gray-\d+\b/,
      /\btext-gray-\d+\b/,
      /\bbg-gray-\d+\b/,
      /\bborder-slate-\d+\b/,
      /\btext-slate-\d+\b/,
    ]

    allM4Files.forEach(relPath => {
      it(`verifies ${relPath} contains 0 hardcoded light-only classes`, () => {
        const fullPath = resolveFilePath(relPath)
        const content = fs.readFileSync(fullPath, 'utf8')

        prohibitedClassPatterns.forEach(pattern => {
          const matches = content.match(pattern)
          expect(matches, `Found prohibited light-only class ${pattern} in ${relPath}`).toBeNull()
        })
      })
    })

    const coreComponentFiles = [
      'apps/web/src/app/(wds)/wds/leads/LeadsHub.tsx',
      'apps/web/src/app/(wds)/wds/leads/components/LeadsTableView.tsx',
      'apps/web/src/app/(wds)/wds/pipeline/KanbanBoard.tsx',
      'apps/web/src/app/(wds)/wds/pipeline/components/KanbanCard.tsx',
      'apps/web/src/app/(wds)/wds/pipeline/components/KanbanColumn.tsx',
    ]

    coreComponentFiles.forEach(relPath => {
      it(`verifies ${relPath} utilizes Cruip Artifact semantic tokens`, () => {
        const fullPath = resolveFilePath(relPath)
        const content = fs.readFileSync(fullPath, 'utf8')

        expect(content).toMatch(/\bbg-card\b/)
        expect(content).toMatch(/\bborder-border\b/)
        expect(content).toMatch(/\btext-foreground\b/)
        expect(content).toMatch(/\btext-muted-foreground\b/)
      })
    })
  })
})
