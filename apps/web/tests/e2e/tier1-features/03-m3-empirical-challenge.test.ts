import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { DashboardTimeframeFilter, type Timeframe } from '@/app/(wds)/wds/dashboard/components/DashboardTimeframeFilter'
import { RevenueVelocityChart, type ChartTimeframe } from '@/app/(wds)/wds/dashboard/components/RevenueVelocityChart'
import {
  DashboardActivityFeed,
  type OperationalActivityItem,
  type ActivityChannel,
} from '@/app/(wds)/wds/dashboard/components/DashboardActivityFeed'
import { DashboardFunnelCard } from '@/app/(wds)/wds/dashboard/components/DashboardFunnelCard'
import { ArtifactKpiCard } from '@/components/ui/ArtifactKpiCard'
import { satangToBaht } from '@/lib/qt-calc'
import { getDashboardAlerts } from '@/lib/dashboard-metrics'
import DashboardPage from '@/app/(wds)/wds/dashboard/page'

describe('M3 Empirical Challenger: Stress Tests, Edge Cases & Verification Oracles', () => {
  // ══════════════════════════════════════════════════════════════════════════
  // Section 1: Rapid Timeframe Tab Switching (7D -> 30D -> 12M)
  // ══════════════════════════════════════════════════════════════════════════
  describe('1. Timeframe Switching & State Machine Stress', () => {
    it('1.1: DashboardTimeframeFilter renders 7D, 30D, and 12M pill options with active tab semantics', () => {
      const timeframes: Timeframe[] = ['7D', '30D', '12M']
      for (const tf of timeframes) {
        const html = renderToString(React.createElement(DashboardTimeframeFilter, { value: tf }))
        expect(html).toContain('7D')
        expect(html).toContain('30D')
        expect(html).toContain('12M')
        expect(html).toContain('role="tablist"')
        expect(html).toContain('aria-selected="true"')
      }
    })

    it('1.2: RevenueVelocityChart adapts summary metrics and dataset across initialTimeframes', () => {
      // 7D initial timeframe
      const html7D = renderToString(React.createElement(RevenueVelocityChart, { initialTimeframe: '7D' })).replace(/<!--.*?-->/g, '')
      expect(html7D).toContain('฿582,400')
      expect(html7D).toContain('4.0 ออเดอร์/วัน')
      expect(html7D).toContain('Tier 1')
      expect(html7D).toContain('สัปดาห์นี้')

      // 30D initial timeframe
      const html30D = renderToString(React.createElement(RevenueVelocityChart, { initialTimeframe: '30D' })).replace(/<!--.*?-->/g, '')
      expect(html30D).toContain('฿2,480,000')
      expect(html30D).toContain('28.5 ออเดอร์/สัปดาห์')
      expect(html30D).toContain('Tier 2')
      expect(html30D).toContain('รอบเดือนปัจจุบัน')

      // 12M initial timeframe
      const html12M = renderToString(React.createElement(RevenueVelocityChart, { initialTimeframe: '12M' })).replace(/<!--.*?-->/g, '')
      expect(html12M).toContain('฿31,250,000')
      expect(html12M).toContain('123.3 ออเดอร์/เดือน')
      expect(html12M).toContain('Tier 3')
      expect(html12M).toContain('ปีงบประมาณ 2569')
    })

    it('1.3: Top welcome bar DashboardTimeframeFilter is isolated from RevenueVelocityChart', async () => {
      const pageJsx = await DashboardPage()
      const html = renderToString(pageJsx)

      // Page contains both the top-level timeframe filter and chart internal tabs
      // Both render 'role="tablist"'
      const tablistMatches = html.match(/role="tablist"/g)
      expect(tablistMatches).not.toBeNull()
      expect(tablistMatches!.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 2: Extreme Values, Empty Data & Boundary Conditions
  // ══════════════════════════════════════════════════════════════════════════
  describe('2. Extreme Values & Boundary Conditions', () => {
    it('2.1: ArtifactKpiCard gracefully renders zero metrics without crashing or displaying NaN', () => {
      const html = renderToString(
        React.createElement(ArtifactKpiCard, {
          label: 'Follow-up ค้างติดต่อ',
          value: 0,
          sub: 'ติดต่อครบถ้วนตรงเวลา',
          trend: { value: '0 ค้าง', positive: true },
        })
      )
      expect(html).toContain('Follow-up ค้างติดต่อ')
      expect(html).toContain('>0<')
      expect(html).toContain('0 ค้าง')
      expect(html).not.toContain('NaN')
    })

    it('2.2: getDashboardAlerts returns empty array when all alert-triggering counts are 0', () => {
      const zeroMetrics = {
        new_leads_today: 0,
        overdue_followups: 0,
        pending_site_visits: 0,
        pending_appointments: 0,
        pending_quotations: 0,
        pending_payments_count: 0,
        pending_payments_satang: 0,
        pending_deliveries: 0,
      }
      const alerts = getDashboardAlerts(zeroMetrics)
      expect(alerts).toHaveLength(0)
    })

    it('2.3: [Empty State Integrity] DashboardFunnelCard genuinely reflects empty funnel data when provided', () => {
      const emptyFunnel = {
        total_leads: 0,
        sv_count: 0,
        sv_rate_pct: 0,
        sv_avg_days: 0,
        qt_count: 0,
        qt_rate_pct: 0,
        qt_avg_days: 0,
        order_count: 0,
        order_rate_pct: 0,
        paid_count: 0,
        paid_rate_pct: 0,
      }

      const html = renderToString(
        React.createElement(DashboardFunnelCard, { funnel: emptyFunnel })
      ).replace(/<!--.*?-->/g, '')

      // Verified: emptyFunnel with total_leads: 0 is genuinely rendered without masking
      expect(html).not.toContain('184')
    })

    it('2.4: [Empty State Integrity] DashboardActivityFeed renders empty state when activities=[] is passed', () => {
      const html = renderToString(
        React.createElement(DashboardActivityFeed, { activities: [] })
      ).replace(/<!--.*?-->/g, '')

      // Verified: activities: [] renders empty state indicator
      expect(html).toContain('ไม่พบกิจกรรมสำหรับช่องทางที่เลือก')
      expect(html).not.toContain('6+ รายการ')
    })

    it('2.5: ArtifactKpiCard renders negative trend percentages with rose styling and ArrowDownRight', () => {
      const html = renderToString(
        React.createElement(ArtifactKpiCard, {
          label: 'อัตราการปิดการขาย',
          value: '18.4%',
          trend: { value: '-6.2%', positive: false },
        })
      )
      expect(html).toContain('-6.2%')
      expect(html).toContain('text-rose-700')
      expect(html).toContain('bg-rose-500/10')
    })

    it('2.6: satangToBaht and ArtifactKpiCard format huge Baht sums without precision loss or scientific notation', () => {
      const hugeSatang = 999_999_999_999 // 9.99 billion Baht
      const formatted = satangToBaht(hugeSatang)
      expect(formatted).toBe('9,999,999,999.99')

      const html = renderToString(
        React.createElement(ArtifactKpiCard, {
          label: 'สลิปรอตรวจสอบยอด',
          value: 125,
          sub: `รวม ฿${formatted}`,
        })
      )
      expect(html).toContain('9,999,999,999.99')
      expect(html).not.toContain('e+')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 3: Channel Filter Switching in DashboardActivityFeed
  // ══════════════════════════════════════════════════════════════════════════
  describe('3. Channel Filter Switching in DashboardActivityFeed', () => {
    it('3.1: Renders all 5 channel filter buttons (All, Phone, LINE, Visit, Quotation)', () => {
      const html = renderToString(React.createElement(DashboardActivityFeed))
      expect(html).toContain('ทั้งหมด')
      expect(html).toContain('โทรศัพท์')
      expect(html).toContain('LINE OA')
      expect(html).toContain('สำรวจหน้างาน')
      expect(html).toContain('ใบเสนอราคา')
    })

    it('3.2: Displays channel badges with specific semantic color tokens', () => {
      const customActivities: OperationalActivityItem[] = [
        {
          id: 'p1',
          channel: 'phone',
          customerName: 'Customer Phone',
          note: 'Call note',
          actor: 'AE 1',
          occurredAt: new Date().toISOString(),
        },
        {
          id: 'l1',
          channel: 'line',
          customerName: 'Customer LINE',
          note: 'LINE note',
          actor: 'AE 2',
          occurredAt: new Date().toISOString(),
        },
        {
          id: 'v1',
          channel: 'visit',
          customerName: 'Customer Visit',
          note: 'Visit note',
          actor: 'Surveyor',
          occurredAt: new Date().toISOString(),
        },
        {
          id: 'q1',
          channel: 'quotation',
          customerName: 'Customer QT',
          note: 'QT note',
          actor: 'AE 3',
          occurredAt: new Date().toISOString(),
        },
      ]

      const html = renderToString(
        React.createElement(DashboardActivityFeed, { activities: customActivities })
      )

      // Phone: emerald badge
      expect(html).toContain('bg-emerald-500/10 text-emerald-700')
      expect(html).toContain('โทรศัพท์')

      // LINE: green badge
      expect(html).toContain('bg-green-500/10 text-green-700')
      expect(html).toContain('LINE OA')

      // Visit: sky badge
      expect(html).toContain('bg-sky-500/10 text-sky-700')
      expect(html).toContain('สำรวจหน้างาน (Visit)')

      // Quotation: indigo badge
      expect(html).toContain('bg-indigo-500/10 text-indigo-700')
      expect(html).toContain('ใบเสนอราคา (QT)')
    })

    it('3.3: Correctly links to lead detail view (/wds/leads/[leadId]) when leadId is present', () => {
      const activityWithLead: OperationalActivityItem[] = [
        {
          id: 'act-linked',
          leadId: 'lead-tw-999',
          channel: 'phone',
          customerName: 'บริษัท ก่อสร้างขนาดใหญ่ จำกัด',
          note: 'ติดตามสัญญาซื้อขาย',
          actor: 'วิชัย AE',
          occurredAt: new Date().toISOString(),
        },
      ]

      const html = renderToString(
        React.createElement(DashboardActivityFeed, { activities: activityWithLead })
      )

      expect(html).toContain('href="/wds/leads/lead-tw-999"')
      expect(html).toContain('ดูรายละเอียด')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 4: Tooltip Hovering & Active Point Selection in RevenueVelocityChart
  // ══════════════════════════════════════════════════════════════════════════
  describe('4. Tooltip Hovering & Active Point Selection in RevenueVelocityChart', () => {
    it('4.1: Default active point renders the latest period point in the Context Pill', () => {
      // For 7D, latest point is Sunday 14 Sep (฿58,000, 2 orders)
      const html7D = renderToString(React.createElement(RevenueVelocityChart, { initialTimeframe: '7D' })).replace(/<!--.*?-->/g, '')
      expect(html7D).toContain('อาทิตย์ (14 ก.ย.)')
      expect(html7D).toContain('฿58,000')
      expect(html7D).toContain('2 ออเดอร์')

      // For 30D, latest point is 'ปัจจุบัน (14 ก.ย.)' (฿140,000, 6 orders)
      const html30D = renderToString(React.createElement(RevenueVelocityChart, { initialTimeframe: '30D' })).replace(/<!--.*?-->/g, '')
      expect(html30D).toContain('ปัจจุบัน (14 ก.ย.)')
      expect(html30D).toContain('฿140,000')
      expect(html30D).toContain('6 ออเดอร์')
    })

    it('4.2: Renders Volume Break discount indicator on points exceeding the threshold', () => {
      // In 30D, active point is 'ปัจจุบัน' which has volumeBreakApplied: true, volumeDiscountPct: 7
      const html30D = renderToString(React.createElement(RevenueVelocityChart, { initialTimeframe: '30D' })).replace(/<!--.*?-->/g, '')
      expect(html30D).toContain('Volume Break -7%')
    })

    it('4.3: Renders SVG geometry with dual-axis labels, horizontal grid lines, and dashed volume break benchmark', () => {
      const html = renderToString(React.createElement(RevenueVelocityChart))

      // SVG dimensions
      expect(html).toContain('viewBox="0 0 720 220"')

      // Horizontal dashed gridlines
      expect(html).toContain('stroke-dasharray="4 4"')

      // Volume Break threshold benchmark line (dashed #F59E0B)
      expect(html).toContain('stroke-dasharray="6 3"')
      expect(html).toContain('⭐ Volume Break')

      // Polyline stroke for revenue line
      expect(html).toContain('stroke="#D92D20"')

      // Bar rects for Order Velocity
      expect(html).toContain('<rect')
      expect(html).toContain('fill="url(#velocityBarGrad)"')
    })

    it('4.4: Semantic token verification: zero hardcoded light-only classes in RevenueVelocityChart', () => {
      const html = renderToString(React.createElement(RevenueVelocityChart))
      expect(html).not.toContain('bg-white')
      expect(html).not.toContain('border-gray-200')
      expect(html).not.toContain('border-gray-100')
      expect(html).not.toContain('text-gray-900')
      expect(html).not.toContain('text-gray-500')
    })
  })
})
