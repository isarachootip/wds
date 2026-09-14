import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { DashboardTimeframeFilter } from './DashboardTimeframeFilter'
import { RevenueVelocityChart } from './RevenueVelocityChart'
import { DashboardActivityFeed } from './DashboardActivityFeed'
import { DashboardFunnelCard } from './DashboardFunnelCard'
import DashboardPage from '../page'

describe('M3 Dashboard Modernization: Cruip Artifact UI & Components', () => {
  describe('1. DashboardTimeframeFilter (PillTabs)', () => {
    it('renders 7D | 30D | 12M tabs using PillTabs with semantic styling', () => {
      const html = renderToString(
        React.createElement(DashboardTimeframeFilter, { value: '30D' })
      )
      expect(html).toContain('7D')
      expect(html).toContain('30D')
      expect(html).toContain('12M')
      expect(html).toContain('role="tablist"')
      expect(html).toContain('bg-muted')
      expect(html).toContain('rounded-lg')
    })
  })

  describe('2. RevenueVelocityChart (Responsive SVG / CSS Visuals)', () => {
    it('renders Cruip Artifact card container with rounded-2xl and semantic tokens', () => {
      const html = renderToString(React.createElement(RevenueVelocityChart))
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('border-border')
      expect(html).toContain('bg-card')
      expect(html).toContain('แนวโน้มรายได้ &amp; ความเร็วคำสั่งซื้อ')
    })

    it('renders authentic responsive SVG chart with gradients and volume break threshold', () => {
      const html = renderToString(React.createElement(RevenueVelocityChart))
      expect(html).toContain('<svg')
      expect(html).toContain('viewBox="0 0 720 220"')
      expect(html).toContain('id="revenueGrad"')
      expect(html).toContain('id="velocityBarGrad"')
      expect(html).toContain('Volume Break')
      expect(html).toContain('Order Velocity')
    })

    it('displays summary metrics strip including AOV and Volume Break Tier', () => {
      const html = renderToString(React.createElement(RevenueVelocityChart))
      expect(html).toContain('ยอดขายรวม')
      expect(html).toContain('มูลค่าเฉลี่ยต่อบิล (AOV)')
      expect(html).toContain('Volume Break Tier')
    })

    it('safely renders across all timeframe options with default active point', () => {
      for (const tf of ['7D', '30D', '12M'] as const) {
        const html = renderToString(
          React.createElement(RevenueVelocityChart, { initialTimeframe: tf })
        )
        expect(html).toContain('ยอดขายรวม')
        expect(html).toContain('Volume Break')
      }
    })
  })

  describe('3. DashboardActivityFeed (Channel Badges & Chronological Stream)', () => {
    it('renders Cruip Artifact card with recent operations feed header', () => {
      const html = renderToString(React.createElement(DashboardActivityFeed))
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('border-border')
      expect(html).toContain('bg-card')
      expect(html).toContain('กิจกรรมล่าสุด (Recent Operations Feed)')
    })

    it('renders channel badges for Phone, LINE, Visit, and Quotation', () => {
      const html = renderToString(React.createElement(DashboardActivityFeed))
      expect(html).toContain('โทรศัพท์')
      expect(html).toContain('LINE OA')
      expect(html).toContain('สำรวจหน้างาน (Visit)')
      expect(html).toContain('ใบเสนอราคา (QT)')
    })

    it('renders custom provided operational activities', () => {
      const customActivities = [
        {
          id: 'custom-1',
          channel: 'phone' as const,
          customerName: 'บจก. ก่อสร้างสยามธานี',
          projectName: 'อาคารสำนักงาน 12 ชั้น',
          note: 'ประสานงานเรื่องตารางส่งปูนผสมเสร็จ',
          actor: 'สมชาย ประเสริฐ',
          occurredAt: new Date().toISOString(),
          timeAgo: '5 นาทีที่แล้ว',
        },
      ]

      const html = renderToString(
        React.createElement(DashboardActivityFeed, { activities: customActivities })
      )
      expect(html).toContain('บจก. ก่อสร้างสยามธานี')
      expect(html).toContain('อาคารสำนักงาน 12 ชั้น')
      expect(html).toContain('ประสานงานเรื่องตารางส่งปูนผสมเสร็จ')
      expect(html).toContain('5 นาทีที่แล้ว')
    })

    it('renders authentic empty state message when activities=[] is provided', () => {
      const html = renderToString(
        React.createElement(DashboardActivityFeed, { activities: [] })
      )
      expect(html).toContain('ไม่พบกิจกรรมสำหรับช่องทางที่เลือก')
      expect(html).not.toContain('บจก. ธนพัฒน์ คอนสตรัคชั่น')
    })

    it('renders note channel badge for note activity type', () => {
      const html = renderToString(
        React.createElement(DashboardActivityFeed, {
          activities: [
            {
              id: 'note-1',
              channel: 'note',
              customerName: 'คุณสมศักดิ์ ผู้รับเหมา',
              note: 'บันทึกสรุปเงื่อนไขการส่งมอบสินค้าหน้างาน',
              actor: 'สมชาย AE',
              occurredAt: new Date().toISOString(),
            },
          ],
        })
      )
      expect(html).toContain('บันทึก / โน้ต (Note)')
      expect(html).toContain('bg-amber-500/10')
    })
  })

  describe('4. DashboardFunnelCard (5-Stage Conversion Funnel)', () => {
    it('renders Cruip Artifact card with 5 conversion stages and progress bars', () => {
      const html = renderToString(React.createElement(DashboardFunnelCard))
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('Conversion Funnel')
      expect(html).toContain('Leads ทั้งหมด')
      expect(html).toContain('สำรวจหน้างาน (Site Visit)')
      expect(html).toContain('ออกใบเสนอราคา (Quotation)')
      expect(html).toContain('แปลงเป็นคำสั่งซื้อ (Order)')
      expect(html).toContain('ชำระเงินเรียบร้อย (Paid)')
    })

    it('renders turnaround time and conversion rates', () => {
      const html = renderToString(
        React.createElement(DashboardFunnelCard, {
          funnel: {
            total_leads: 100,
            sv_count: 50,
            sv_rate_pct: 50,
            sv_avg_days: 2.5,
            qt_count: 35,
            qt_rate_pct: 70,
            qt_avg_days: 1.8,
            order_count: 25,
            order_rate_pct: 71,
            paid_count: 20,
            paid_rate_pct: 80,
          },
        })
      )
      expect(html).toContain('50% แปลง')
      expect(html).toContain('เฉลี่ย 2.5 วัน')
      expect(html).toContain('70% แปลง')
      expect(html).toContain('เฉลี่ย 1.8 วัน')
      expect(html).toContain('Overall Win Rate')
    })

    it('renders authentic zero-lead state when total_leads is 0 without defaulting to DEFAULT_FUNNEL', () => {
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
      )
      expect(html).not.toContain('184')
      expect(html).toContain('0%')
    })
  })

  describe('5. DashboardPage SSR & Cruip Artifact Composition', () => {
    it('renders the complete modernized dashboard with Welcome Bar, quick actions, and 4x2 KPI grid', async () => {
      const pageJsx = await DashboardPage()
      const html = renderToString(pageJsx)

      // Welcome Bar & Thai Buddhist Date
      expect(html).toContain('ภาพรวมงานขาย &amp; ปฏิบัติการ')
      expect(html).toContain('Thai Watsadu Wholesale &amp; Direct Sales Platform')
      expect(html).toContain('2569') // Buddhist Era year

      // Quick action buttons with Button primitives
      expect(html).toContain('+ เพิ่มลีด')
      expect(html).toContain('+ สร้างใบเสนอราคา')
      expect(html).toContain('href="/wds/leads/new"')
      expect(html).toContain('href="/wds/quotations/new"')

      // Timeframe tabs
      expect(html).toContain('7D')
      expect(html).toContain('30D')
      expect(html).toContain('12M')

      // 4x2 responsive grid of ArtifactKpiCards
      expect(html).toContain('Lead ใหม่วันนี้')
      expect(html).toContain('Follow-up ค้างติดต่อ')
      expect(html).toContain('Site Visit รอช่างสำรวจ')
      expect(html).toContain('QT รอลูกค้าตอบรับ')
      expect(html).toContain('สลิปรอตรวจสอบยอด')
      expect(html).toContain('สินค้าคิวรอจัดส่ง')
      expect(html).toContain('Credit Dual-Control')
      expect(html).toContain('รายงานสรุปทั้งหมด')

      // Trend badges rendered
      expect(html).toContain('+12.5%')
      expect(html).toContain('+15.4%')

      // Visual Chart, Funnel, and Activity Stream
      expect(html).toContain('แนวโน้มรายได้ &amp; ความเร็วคำสั่งซื้อ')
      expect(html).toContain('Conversion Funnel')
      expect(html).toContain('กิจกรรมล่าสุด (Recent Operations Feed)')
    })

    it('has zero hardcoded light-only classes across dashboard markup', async () => {
      const pageJsx = await DashboardPage()
      const html = renderToString(pageJsx)

      expect(html).not.toContain('bg-white')
      expect(html).not.toContain('border-gray-200')
      expect(html).not.toContain('border-gray-100')
      expect(html).not.toContain('text-gray-900')
      expect(html).not.toContain('text-gray-500')
    })

    it('harmonizes timeframe filter and chart based on searchParams', async () => {
      const pageJsx7D = await DashboardPage({ searchParams: Promise.resolve({ timeframe: '7D' }) })
      const html7D = renderToString(pageJsx7D).replace(/<!--.*?-->/g, '')
      expect(html7D).toContain('฿582,400')

      const pageJsx12M = await DashboardPage({ searchParams: Promise.resolve({ timeframe: '12M' }) })
      const html12M = renderToString(pageJsx12M).replace(/<!--.*?-->/g, '')
      expect(html12M).toContain('฿31,250,000')
    })
  })
})
