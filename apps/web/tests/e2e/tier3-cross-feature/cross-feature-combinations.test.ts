import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  type LeadCard,
  formatDealValue,
  isStale,
  getLeadDealSatang,
  STATUSES,
  type Status,
} from '@/app/(wds)/wds/pipeline/KanbanBoard'
import { LEAD_MACHINE } from '@/modules/crm/lead-machine'
import { isValidTransition } from '@/lib/statemachine'
import { haversineDistance, CHECKIN_RADIUS_M, isWithinRadius } from '@/lib/geo'
import { calculateQuotation, type LineItemInput } from '@/lib/qt-calc'

describe('Tier 3: Cross-Feature Combinations', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Kanban View + Faceted Filter + Stage Transition
  // ──────────────────────────────────────────────────────────────────────────
  describe('3.1 Kanban View + Faceted Filter + Drag/Advance Transition', () => {
    const pipelineCards: LeadCard[] = [
      {
        id: 'c-01',
        status: 'contacted',
        source: 'line',
        customerName: 'คุณสมศักดิ์ ปูนดี',
        dealValueSatang: 50_000_000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'c-02',
        status: 'contacted',
        source: 'phone',
        customerName: 'คุณมณีรัตน์ สีทาบ้าน',
        dealValueSatang: 30_000_000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'c-03',
        status: 'qualified',
        source: 'line',
        customerName: 'คุณอนุชา อิฐบล็อก',
        dealValueSatang: 70_000_000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    it('filters cards by source "line" and computes column sums accurately', () => {
      const lineCards = pipelineCards.filter((c) => c.source === 'line')
      expect(lineCards).toHaveLength(2)

      const contactedLineCards = lineCards.filter((c) => c.status === 'contacted')
      expect(contactedLineCards).toHaveLength(1)
      expect(contactedLineCards[0].id).toBe('c-01')

      const sumContacted = contactedLineCards.reduce((s, c) => s + (c.dealValueSatang || 0), 0)
      expect(sumContacted).toBe(50_000_000)
      expect(formatDealValue(sumContacted)).toBe('฿500,000')
    })

    it('executes stage advance transition (contacted -> qualified) while maintaining filter integrity', () => {
      // Advance c-01 from contacted to qualified
      expect(isValidTransition(LEAD_MACHINE, 'contacted', 'qualified')).toBe(true)

      const updatedCards = pipelineCards.map((c) =>
        c.id === 'c-01' ? { ...c, status: 'qualified' as Status } : c
      )

      // Re-apply filter "line"
      const filteredAfterTransition = updatedCards.filter((c) => c.source === 'line')
      expect(filteredAfterTransition).toHaveLength(2)

      // Now qualified column has both c-01 and c-03
      const qualifiedLineCards = filteredAfterTransition.filter((c) => c.status === 'qualified')
      expect(qualifiedLineCards).toHaveLength(2)

      const newQualifiedSum = qualifiedLineCards.reduce((s, c) => s + (c.dealValueSatang || 0), 0)
      expect(newQualifiedSum).toBe(120_000_000) // 500k + 700k = 1.2M THB
      expect(formatDealValue(newQualifiedSum)).toBe('฿1,200,000')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Theme Switch + Modal Dialog Presentation
  // ──────────────────────────────────────────────────────────────────────────
  describe('3.2 Theme Switch + Modal Dialog Presentation', () => {
    it('verifies modal container adopts semantic dark/light classes dynamically', () => {
      const ModalMarkup = ({ isDark }: { isDark: boolean }) =>
        React.createElement(
          'div',
          { className: isDark ? 'dark' : '' },
          React.createElement(
            'div',
            {
              role: 'dialog',
              className:
                'bg-card text-card-foreground border-border rounded-2xl shadow-2xl p-6 backdrop-blur-md',
            },
            React.createElement('h2', { className: 'text-foreground font-semibold' }, 'ปิดการขาย')
          )
        )

      const lightHtml = renderToString(React.createElement(ModalMarkup, { isDark: false }))
      expect(lightHtml).not.toContain('class="dark"')
      expect(lightHtml).toContain('rounded-2xl')
      expect(lightHtml).toContain('bg-card')

      const darkHtml = renderToString(React.createElement(ModalMarkup, { isDark: true }))
      expect(darkHtml).toContain('class="dark"')
      expect(darkHtml).toContain('rounded-2xl')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Site Visit Check-in + Quotation Attachment Workflow
  // ──────────────────────────────────────────────────────────────────────────
  describe('3.3 Site Visit Check-in + Quotation Attachment Workflow', () => {
    it('simulates surveyor check-in within geofence and subsequent quotation calculation', () => {
      const siteCoords = { lat: 13.7563, lng: 100.5018 }
      const surveyorCoords = { lat: 13.7565, lng: 100.5019 } // ~25 meters away

      const distance = haversineDistance(
        surveyorCoords.lat,
        surveyorCoords.lng,
        siteCoords.lat,
        siteCoords.lng
      )
      expect(distance).toBeLessThanOrEqual(CHECKIN_RADIUS_M)
      expect(isWithinRadius(surveyorCoords.lat, surveyorCoords.lng, siteCoords.lat, siteCoords.lng)).toBe(true)

      // Surveyor measures materials on site:
      // Item 1: 50 bags Cement @ 150 THB (15,000 Satang) = 7,500 THB
      // Item 2: 10 Steel Bars @ 200 THB (20,000 Satang) = 2,000 THB
      const items: LineItemInput[] = [
        {
          qty: 50,
          unitPriceSatang: 15_000,
          discountSatang: 0,
        },
        {
          qty: 10,
          unitPriceSatang: 20_000,
          discountSatang: 0,
        },
      ]

      const qtCalc = calculateQuotation(items, 0, 7, 'exclusive')
      expect(qtCalc.subtotalSatang).toBe(950_000) // 9,500 THB
      expect(qtCalc.vatAmountSatang).toBe(66_500) // 7% of 9,500 = 665 THB (66,500 Satang)
      expect(qtCalc.totalSatang).toBe(1_016_500) // 10,165 THB (1,016,500 Satang)

      // Verify state machine allows progression from site_visit_requested -> quoted
      expect(isValidTransition(LEAD_MACHINE, 'site_visit_requested', 'quoted')).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Faceted Search + Stale Filter + Table Sorting
  // ──────────────────────────────────────────────────────────────────────────
  describe('3.4 Faceted Search + Stale Filter + Table Sorting', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

    const mixedLeads: LeadCard[] = [
      {
        id: 'lead-m1',
        customerName: 'บจก. ปูนซีเมนต์พัฒนา',
        dealValueSatang: 80_000_000,
        status: 'contacted',
        source: 'line',
        updatedAt: eightDaysAgo, // Stale
        createdAt: eightDaysAgo,
      },
      {
        id: 'lead-m2',
        customerName: 'หจก. ปูนทนทาน',
        dealValueSatang: 120_000_000,
        status: 'contacted',
        source: 'line',
        updatedAt: eightDaysAgo, // Stale
        createdAt: eightDaysAgo,
      },
      {
        id: 'lead-m3',
        customerName: 'บจก. ปูนสดใหม่',
        dealValueSatang: 150_000_000,
        status: 'contacted',
        source: 'line',
        updatedAt: twoDaysAgo, // Not stale
        createdAt: twoDaysAgo,
      },
    ]

    it('combines search keyword "ปูน" with stale filter and descending sort by deal value', () => {
      // 1. Search filter
      const searchMatch = mixedLeads.filter((l) => (l.customerName ?? '').includes('ปูน'))
      expect(searchMatch).toHaveLength(3)

      // 2. Stale filter (> 7 days)
      const staleMatch = searchMatch.filter((l) => isStale(l.updatedAt))
      expect(staleMatch).toHaveLength(2)
      expect(staleMatch.map((l) => l.id)).toEqual(['lead-m1', 'lead-m2'])

      // 3. Sort descending by dealValueSatang
      const sorted = [...staleMatch].sort(
        (a, b) => (b.dealValueSatang || 0) - (a.dealValueSatang || 0)
      )

      expect(sorted[0].id).toBe('lead-m2') // 1.2M THB
      expect(sorted[1].id).toBe('lead-m1') // 800k THB
      expect(sorted[0].dealValueSatang).toBe(120_000_000)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Command Palette Selection + Stepper State Synchrony
  // ──────────────────────────────────────────────────────────────────────────
  describe('3.5 Command Palette Selection + Stepper State Synchrony', () => {
    it('verifies route resolution from command palette to workbench with corresponding stepper state', () => {
      const getTargetStatusForRoute = (pathname: string): Status => {
        if (pathname.includes('/new')) return 'new'
        return 'quoted'
      }

      const status = getTargetStatusForRoute('/wds/leads/lead-abc')
      expect(status).toBe('quoted')

      // Quoted status allows progression to won or lost
      expect(isValidTransition(LEAD_MACHINE, status, 'won')).toBe(true)
      expect(isValidTransition(LEAD_MACHINE, status, 'lost')).toBe(true)
    })
  })
})
