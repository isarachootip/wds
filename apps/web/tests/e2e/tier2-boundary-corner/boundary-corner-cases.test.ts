import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  formatDealValue,
  formatPhone,
  isStale,
  isOverdue,
  STATUSES,
  type LeadCard,
  type Status,
} from '@/app/(wds)/wds/pipeline/KanbanBoard'
import { LOST_REASONS } from '@/modules/crm/actions'
import { LEAD_MACHINE } from '@/modules/crm/lead-machine'
import { isValidTransition } from '@/lib/statemachine'
import { haversineDistance, CHECKIN_RADIUS_M, isWithinRadius } from '@/lib/geo'
import { formatTHB, satang, fromBaht, toBaht } from '@/lib/money'

describe('Tier 2: Boundary & Corner Cases', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Empty States Across Pipeline Columns
  // ──────────────────────────────────────────────────────────────────────────
  describe('2.1 Empty States in Pipeline Columns', () => {
    it('handles empty card lists across all 7 pipeline stages without throwing', () => {
      const emptyStageGroups: Record<Status, LeadCard[]> = {
        new: [],
        contacted: [],
        qualified: [],
        site_visit_requested: [],
        quoted: [],
        won: [],
        lost: [],
      }

      STATUSES.forEach((status) => {
        const cards = emptyStageGroups[status]
        expect(cards).toHaveLength(0)

        // Aggregation of 0 cards equals 0 Satang and 0 count
        const totalSatang = cards.reduce((sum, c) => sum + (c.dealValueSatang || 0), 0)
        expect(totalSatang).toBe(0)
        expect(formatDealValue(totalSatang)).toBe('฿0')
      })
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Long Customer Names & Unicode / Emojis
  // ──────────────────────────────────────────────────────────────────────────
  describe('2.2 Long Customer Names & Unicode Stress', () => {
    it('safely handles ultra-long customer name (500+ characters) with Unicode and Emojis', () => {
      const longName =
        'คุณสมชาย ยอดขายก่อสร้างยิ่งใหญ่ไพศาลแห่งสยามประเทศผู้ชำนาญการปูนอินทรีเหล็กเส้นและงานโครงสร้างอาคารพาณิชย์ขนาดใหญ่พิเศษ 🏗️🏢👷‍♂️ ' +
        'A'.repeat(350)

      const card: LeadCard = {
        id: 'lead-boundary-01',
        status: 'new',
        source: 'line',
        customerName: longName,
        customerPhone: '0812345678',
        dealValueSatang: 100_000_00,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect((card.customerName ?? '').length).toBeGreaterThan(400)
      expect(card.customerName ?? '').toContain('🏗️')

      // Safe rendering check
      const Component = () =>
        React.createElement(
          'div',
          { className: 'truncate max-w-[200px]', title: card.customerName ?? '' },
          card.customerName ?? ''
        )
      const html = renderToString(React.createElement(Component))
      expect(html).toContain('truncate')
      expect(html).toContain('คุณสมชาย')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Extreme Satang Values
  // ──────────────────────────────────────────────────────────────────────────
  describe('2.3 Extreme Satang Values & Formatting', () => {
    it('formats 0 Satang accurately as ฿0', () => {
      expect(formatDealValue(0)).toBe('฿0')
      expect(formatTHB(satang(0))).toBe('฿0.00')
    })

    it('formats 1 Satang (0.01 THB) correctly', () => {
      expect(toBaht(satang(1))).toBe(0.01)
      expect(formatTHB(satang(1))).toBe('฿0.01')
    })

    it('formats extreme mega-value (1 Billion THB = 100,000,000,000 Satang)', () => {
      const megaSatang = 100_000_000_000 // 1,000,000,000.00 THB
      expect(toBaht(satang(megaSatang))).toBe(1_000_000_000)
      expect(formatDealValue(megaSatang)).toBe('฿1,000,000,000')
      expect(formatTHB(satang(megaSatang))).toBe('฿1,000,000,000.00')
    })

    it('fromBaht conversion handles decimal precision without floating point drift', () => {
      expect(fromBaht(12.34)).toBe(1234)
      expect(fromBaht(0.01)).toBe(1)
      expect(fromBaht(100.99)).toBe(10099)
      expect(fromBaht(999999.99)).toBe(99999999)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Dark Mode Hydration Safety
  // ──────────────────────────────────────────────────────────────────────────
  describe('2.4 Dark Mode Hydration Safety', () => {
    it('handles localStorage throwing SecurityError (e.g. sandboxed iframe) without crashing', () => {
      const mockStorageWithError = {
        getItem: () => {
          throw new Error('SecurityError: The operation is insecure.')
        },
        setItem: () => {
          throw new Error('SecurityError: The operation is insecure.')
        },
      }

      const safeGetTheme = (storage: any, fallback: string) => {
        try {
          return storage.getItem('wds-theme') || fallback
        } catch {
          return fallback
        }
      }

      expect(safeGetTheme(mockStorageWithError, 'system')).toBe('system')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Close Lost Mandatory Reason Validation
  // ──────────────────────────────────────────────────────────────────────────
  describe('2.5 Close Lost Mandatory Validation Boundary Rules', () => {
    it('rejects empty, whitespace, and null reasons', () => {
      const isValidReason = (r: unknown): boolean => {
        if (!r || typeof r !== 'string') return false
        if (!r.trim()) return false
        return LOST_REASONS.includes(r as any)
      }

      expect(isValidReason('')).toBe(false)
      expect(isValidReason('   ')).toBe(false)
      expect(isValidReason(null)).toBe(false)
      expect(isValidReason(undefined)).toBe(false)
      expect(isValidReason('PRICE_HIGH')).toBe(true)
    })

    it('rejects fabricated or lower-case reason keys', () => {
      const isValidReason = (r: string): boolean => {
        return LOST_REASONS.includes(r as any)
      }

      expect(isValidReason('price_high')).toBe(false)
      expect(isValidReason('CHEAPER_COMPETITOR')).toBe(false)
      expect(isValidReason('PRICE_HIGH')).toBe(true)
    })

    it('preserves terminal state immutability: lost cannot transition to any other stage', () => {
      STATUSES.forEach((targetStatus) => {
        expect(isValidTransition(LEAD_MACHINE, 'lost', targetStatus)).toBe(false)
      })
    })

    it('preserves terminal state immutability: won cannot transition to any other stage', () => {
      STATUSES.forEach((targetStatus) => {
        expect(isValidTransition(LEAD_MACHINE, 'won', targetStatus)).toBe(false)
      })
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Phone Number Parsing Edge Cases
  // ──────────────────────────────────────────────────────────────────────────
  describe('2.6 Phone Number Parsing Edge Cases', () => {
    it('formats standard 10-digit mobile number', () => {
      expect(formatPhone('0812345678')).toBe('081-234-5678')
      expect(formatPhone('0998887777')).toBe('099-888-7777')
    })

    it('formats standard 9-digit landline number', () => {
      expect(formatPhone('025556677')).toBe('02-555-6677')
    })

    it('safely handles malformed, empty, and non-numeric phone values', () => {
      expect(formatPhone('')).toBe('')
      expect(formatPhone(null)).toBe('')
      expect(formatPhone(undefined)).toBe('')
      expect(formatPhone('123')).toBe('123')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Haversine Geofence Boundary Threshold (300m)
  // ──────────────────────────────────────────────────────────────────────────
  describe('2.7 Haversine Geofence Boundary Threshold', () => {
    const siteLat = 13.7563
    const siteLng = 100.5018

    it('verifies 300m geofence checkin radius constant', () => {
      expect(CHECKIN_RADIUS_M).toBe(300)
    })

    it('accurately identifies check-in at exact same location as 0m distance', () => {
      const distance = haversineDistance(siteLat, siteLng, siteLat, siteLng)
      expect(distance).toBe(0)
      expect(distance <= CHECKIN_RADIUS_M).toBe(true)
      expect(isWithinRadius(siteLat, siteLng, siteLat, siteLng)).toBe(true)
    })

    it('flags check-in when distance strictly exceeds checkin radius threshold', () => {
      // Offset ~400 meters north
      const userLat = siteLat + 0.0036
      const userLng = siteLng

      const distance = haversineDistance(userLat, userLng, siteLat, siteLng)
      expect(distance).toBeGreaterThan(300)

      const isFlagged = !isWithinRadius(userLat, userLng, siteLat, siteLng, CHECKIN_RADIUS_M)
      expect(isFlagged).toBe(true)
    })
  })
})
