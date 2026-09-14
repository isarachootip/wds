'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  ShoppingBag,
  BadgePercent,
  Calendar,
} from 'lucide-react'
import { PillTabs, type PillTabOption } from '@/components/ui/PillTabs'
import { cn } from '@/lib/utils'

export type ChartTimeframe = '7D' | '30D' | '12M'

export interface ChartDataPoint {
  label: string
  date: string
  revenue: number // Baht
  orderCount: number
  velocityPerDay: number
  volumeBreakApplied: boolean
  volumeDiscountPct: number
}

const TIMEFRAME_DATA: Record<
  ChartTimeframe,
  {
    title: string
    periodLabel: string
    totalRevenue: number
    prevPeriodRevenue: number
    totalOrders: number
    orderVelocity: string
    avgDealSize: number
    activeVolumeTier: string
    volumeBreakThreshold: number // Baht line on chart
    points: ChartDataPoint[]
  }
> = {
  '7D': {
    title: '7 วันล่าสุด',
    periodLabel: 'สัปดาห์นี้',
    totalRevenue: 582400,
    prevPeriodRevenue: 512000,
    totalOrders: 28,
    orderVelocity: '4.0 ออเดอร์/วัน',
    avgDealSize: 20800,
    activeVolumeTier: 'Tier 1 (ส่วนลด 5% เมื่อครบ ฿80,000/บิล)',
    volumeBreakThreshold: 90000,
    points: [
      { label: 'จันทร์', date: '8 ก.ย.', revenue: 64200, orderCount: 3, velocityPerDay: 3.0, volumeBreakApplied: false, volumeDiscountPct: 0 },
      { label: 'อังคาร', date: '9 ก.ย.', revenue: 89500, orderCount: 5, velocityPerDay: 5.0, volumeBreakApplied: true, volumeDiscountPct: 5 },
      { label: 'พุธ', date: '10 ก.ย.', revenue: 76000, orderCount: 4, velocityPerDay: 4.0, volumeBreakApplied: false, volumeDiscountPct: 0 },
      { label: 'พฤหัสฯ', date: '11 ก.ย.', revenue: 104200, orderCount: 6, velocityPerDay: 6.0, volumeBreakApplied: true, volumeDiscountPct: 5 },
      { label: 'ศุกร์', date: '12 ก.ย.', revenue: 118000, orderCount: 5, velocityPerDay: 5.0, volumeBreakApplied: true, volumeDiscountPct: 7 },
      { label: 'เสาร์', date: '13 ก.ย.', revenue: 72500, orderCount: 3, velocityPerDay: 3.0, volumeBreakApplied: false, volumeDiscountPct: 0 },
      { label: 'อาทิตย์', date: '14 ก.ย.', revenue: 58000, orderCount: 2, velocityPerDay: 2.0, volumeBreakApplied: false, volumeDiscountPct: 0 },
    ],
  },
  '30D': {
    title: '30 วันล่าสุด',
    periodLabel: 'รอบเดือนปัจจุบัน',
    totalRevenue: 2480000,
    prevPeriodRevenue: 2150000,
    totalOrders: 114,
    orderVelocity: '28.5 ออเดอร์/สัปดาห์',
    avgDealSize: 21754,
    activeVolumeTier: 'Tier 2 (ส่วนลด 7% เมื่อสะสมเกิน ฿500,000)',
    volumeBreakThreshold: 550000,
    points: [
      { label: 'สัปดาห์ 1', date: '17-23 ส.ค.', revenue: 490000, orderCount: 24, velocityPerDay: 3.4, volumeBreakApplied: false, volumeDiscountPct: 0 },
      { label: 'สัปดาห์ 2', date: '24-30 ส.ค.', revenue: 610000, orderCount: 29, velocityPerDay: 4.1, volumeBreakApplied: true, volumeDiscountPct: 7 },
      { label: 'สัปดาห์ 3', date: '31 ส.ค.-6 ก.ย.', revenue: 680000, orderCount: 32, velocityPerDay: 4.6, volumeBreakApplied: true, volumeDiscountPct: 7 },
      { label: 'สัปดาห์ 4', date: '7-13 ก.ย.', revenue: 560000, orderCount: 23, velocityPerDay: 3.3, volumeBreakApplied: true, volumeDiscountPct: 7 },
      { label: 'ปัจจุบัน', date: '14 ก.ย.', revenue: 140000, orderCount: 6, velocityPerDay: 6.0, volumeBreakApplied: true, volumeDiscountPct: 7 },
    ],
  },
  '12M': {
    title: '12 เดือนล่าสุด',
    periodLabel: 'ปีงบประมาณ 2569',
    totalRevenue: 31250000,
    prevPeriodRevenue: 26800000,
    totalOrders: 1480,
    orderVelocity: '123.3 ออเดอร์/เดือน',
    avgDealSize: 21115,
    activeVolumeTier: 'Tier 3 VIP Contractor (ส่วนลด 10% สะสมเกิน ฿2M)',
    volumeBreakThreshold: 2600000,
    points: [
      { label: 'ต.ค.', date: 'ต.ค. 68', revenue: 2100000, orderCount: 102, velocityPerDay: 3.3, volumeBreakApplied: false, volumeDiscountPct: 5 },
      { label: 'พ.ย.', date: 'พ.ย. 68', revenue: 2350000, orderCount: 114, velocityPerDay: 3.8, volumeBreakApplied: false, volumeDiscountPct: 5 },
      { label: 'ธ.ค.', date: 'ธ.ค. 68', revenue: 2750000, orderCount: 135, velocityPerDay: 4.4, volumeBreakApplied: true, volumeDiscountPct: 7 },
      { label: 'ม.ค.', date: 'ม.ค. 69', revenue: 2420000, orderCount: 118, velocityPerDay: 3.8, volumeBreakApplied: false, volumeDiscountPct: 5 },
      { label: 'ก.พ.', date: 'ก.พ. 69', revenue: 2580000, orderCount: 122, velocityPerDay: 4.3, volumeBreakApplied: false, volumeDiscountPct: 5 },
      { label: 'มี.ค.', date: 'มี.ค. 69', revenue: 2890000, orderCount: 141, velocityPerDay: 4.5, volumeBreakApplied: true, volumeDiscountPct: 7 },
      { label: 'เม.ย.', date: 'เม.ย. 69', revenue: 2200000, orderCount: 98, velocityPerDay: 3.3, volumeBreakApplied: false, volumeDiscountPct: 5 },
      { label: 'พ.ค.', date: 'พ.ค. 69', revenue: 2710000, orderCount: 130, velocityPerDay: 4.2, volumeBreakApplied: true, volumeDiscountPct: 7 },
      { label: 'มิ.ย.', date: 'มิ.ย. 69', revenue: 2950000, orderCount: 142, velocityPerDay: 4.7, volumeBreakApplied: true, volumeDiscountPct: 10 },
      { label: 'ก.ค.', date: 'ก.ค. 69', revenue: 2840000, orderCount: 138, velocityPerDay: 4.5, volumeBreakApplied: true, volumeDiscountPct: 7 },
      { label: 'ส.ค.', date: 'ส.ค. 69', revenue: 3100000, orderCount: 146, velocityPerDay: 4.7, volumeBreakApplied: true, volumeDiscountPct: 10 },
      { label: 'ก.ย.', date: 'ก.ย. 69', revenue: 2360000, orderCount: 94, velocityPerDay: 6.7, volumeBreakApplied: false, volumeDiscountPct: 7 },
    ],
  },
}

export interface RevenueVelocityChartProps {
  initialTimeframe?: ChartTimeframe
  className?: string
}

export function RevenueVelocityChart({
  initialTimeframe = '30D',
  className,
}: RevenueVelocityChartProps) {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>(initialTimeframe)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const data = TIMEFRAME_DATA[timeframe]
  const points = data.points

  // Calculations for growth and metrics
  const revenueGrowth = ((data.totalRevenue - data.prevPeriodRevenue) / data.prevPeriodRevenue) * 100
  const isPositiveGrowth = revenueGrowth >= 0

  const timeframeOptions: PillTabOption<ChartTimeframe>[] = [
    { value: '7D', label: '7D' },
    { value: '30D', label: '30D' },
    { value: '12M', label: '12M' },
  ]

  // SVG Chart Geometry calculations
  const svgWidth = 720
  const svgHeight = 220
  const paddingLeft = 65
  const paddingRight = 50
  const paddingTop = 25
  const paddingBottom = 40

  const plotWidth = svgWidth - paddingLeft - paddingRight
  const plotHeight = svgHeight - paddingTop - paddingBottom

  // Find maximum values for scaling
  const maxRevenue = Math.max(...points.map((p) => p.revenue), data.volumeBreakThreshold) * 1.15
  const maxOrders = Math.max(...points.map((p) => p.orderCount)) * 1.25

  // Map coordinates
  const coords = points.map((p, i) => {
    const x = paddingLeft + (i / Math.max(1, points.length - 1)) * plotWidth
    const yRev = paddingTop + plotHeight - (p.revenue / maxRevenue) * plotHeight
    const yOrder = paddingTop + plotHeight - (p.orderCount / maxOrders) * plotHeight
    return { x, yRev, yOrder, point: p }
  })

  // Build Revenue Area SVG path
  const areaPath = coords.length > 0
    ? `M ${coords[0].x} ${paddingTop + plotHeight} ` +
      coords.map((c) => `L ${c.x} ${c.yRev}`).join(' ') +
      ` L ${coords[coords.length - 1].x} ${paddingTop + plotHeight} Z`
    : ''

  // Build Revenue Stroke SVG path (curved / polyline)
  const linePath = coords.length > 0
    ? `M ${coords[0].x} ${coords[0].yRev} ` + coords.slice(1).map((c) => `L ${c.x} ${c.yRev}`).join(' ')
    : ''

  // Volume Break Threshold Y-coordinate
  const volumeBreakY = paddingTop + plotHeight - (data.volumeBreakThreshold / maxRevenue) * plotHeight

  // Format currency helpers
  const formatBaht = (num: number) => {
    if (num >= 1_000_000) return `฿${(num / 1_000_000).toFixed(2)}M`
    if (num >= 1_000) return `฿${(num / 1_000).toFixed(0)}k`
    return `฿${num.toLocaleString('th-TH')}`
  }

  const handleTimeframeChange = (newTf: ChartTimeframe) => {
    setTimeframe(newTf)
    setHoveredIndex(null)
  }

  const activePoint =
    hoveredIndex !== null && points[hoveredIndex]
      ? points[hoveredIndex]
      : points[points.length - 1]

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col gap-5 transition-all',
        className
      )}
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-thaiwatsadu-red/10 text-thaiwatsadu-red dark:bg-rose-500/15 dark:text-rose-400">
              <Sparkles className="size-3" />
              <span>Cruip Artifact Visual Analytics</span>
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              Thai Watsadu Commercial
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="size-5 text-thaiwatsadu-red" />
            <span>แนวโน้มรายได้ & ความเร็วคำสั่งซื้อ</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            วิเคราะห์ยอดขายสะสม อัตราเร่งการสั่งซื้อ (Velocity) และระดับส่วนลดขั้นบันได (Volume Breaks)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <PillTabs<ChartTimeframe>
            options={timeframeOptions}
            value={timeframe}
            onChange={handleTimeframeChange}
            size="sm"
          />
        </div>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/30 border border-border/50 rounded-xl p-3.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              ยอดขายรวม ({data.periodLabel})
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-medium',
                isPositiveGrowth
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
              )}
            >
              {isPositiveGrowth ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {isPositiveGrowth ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`}
            </span>
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            ฿{data.totalRevenue.toLocaleString('th-TH')}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            เทียบรอบก่อน: ฿{data.prevPeriodRevenue.toLocaleString('th-TH')}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <ShoppingBag className="size-3 text-primary" />
            <span>Order Velocity</span>
          </div>
          <div className="text-xl font-bold text-primary tabular-nums">
            {data.orderVelocity}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            รวม {data.totalOrders} คำสั่งซื้อ
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <Layers className="size-3 text-muted-foreground" />
            <span>มูลค่าเฉลี่ยต่อบิล (AOV)</span>
          </div>
          <div className="text-xl font-bold text-foreground tabular-nums">
            ฿{data.avgDealSize.toLocaleString('th-TH')}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            ยอดเฉลี่ยคำสั่งซื้อ B2B
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <BadgePercent className="size-3 text-amber-500" />
            <span>Volume Break Tier</span>
          </div>
          <div className="text-sm font-bold text-amber-600 dark:text-amber-400 truncate">
            {data.activeVolumeTier}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            เกณฑ์บันได: {formatBaht(data.volumeBreakThreshold)}
          </div>
        </div>
      </div>

      {/* SVG Chart Surface */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Revenue Gradient Fill */}
            <linearGradient id="revenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D92D20" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#D92D20" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#D92D20" stopOpacity="0.00" />
            </linearGradient>

            {/* Order Velocity Bar Gradient */}
            <linearGradient id="velocityBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + plotHeight * (1 - ratio)
            const revVal = maxRevenue * ratio
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] font-medium"
                >
                  {formatBaht(revVal)}
                </text>
              </g>
            )
          })}

          {/* Volume Break Benchmark Threshold Line */}
          <line
            x1={paddingLeft}
            y1={volumeBreakY}
            x2={svgWidth - paddingRight}
            y2={volumeBreakY}
            stroke="#F59E0B"
            strokeDasharray="6 3"
            strokeWidth="1.5"
            strokeOpacity="0.85"
          />
          <text
            x={svgWidth - paddingRight - 4}
            y={volumeBreakY - 6}
            textAnchor="end"
            className="fill-amber-600 dark:fill-amber-400 text-[10px] font-semibold"
          >
            ⭐ Volume Break ({formatBaht(data.volumeBreakThreshold)})
          </text>

          {/* Order Velocity Columns / Bars */}
          {coords.map((c, i) => {
            const barWidth = Math.min(22, Math.max(10, plotWidth / (points.length * 2.2)))
            const barHeight = paddingTop + plotHeight - c.yOrder
            const isHovered = hoveredIndex === i

            return (
              <g
                key={`bar-${i}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <rect
                  x={c.x - barWidth / 2}
                  y={c.yOrder}
                  width={barWidth}
                  height={Math.max(2, barHeight)}
                  rx="3"
                  ry="3"
                  fill="url(#velocityBarGrad)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={isHovered ? '1.5' : '0.5'}
                  strokeOpacity={isHovered ? '1' : '0.4'}
                  className="transition-all duration-150"
                />
              </g>
            )
          })}

          {/* Revenue Area Fill */}
          <path d={areaPath} fill="url(#revenueGrad)" />

          {/* Revenue Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#D92D20"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-rose-500"
          />

          {/* Interactive Data Point Markers on Revenue Line */}
          {coords.map((c, i) => {
            const isHovered = hoveredIndex === i
            return (
              <g
                key={`point-${i}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover hitbox */}
                <circle cx={c.x} cy={c.yRev} r="14" fill="transparent" />

                {/* Outer halo when active */}
                {isHovered && (
                  <circle
                    cx={c.x}
                    cy={c.yRev}
                    r="8"
                    fill="#D92D20"
                    fillOpacity="0.25"
                    className="animate-pulse"
                  />
                )}

                {/* Main point */}
                <circle
                  cx={c.x}
                  cy={c.yRev}
                  r={isHovered ? '5' : '3.5'}
                  fill="hsl(var(--card))"
                  stroke="#D92D20"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              </g>
            )
          })}

          {/* X-axis Labels */}
          {coords.map((c, i) => (
            <text
              key={`label-${i}`}
              x={c.x}
              y={paddingTop + plotHeight + 18}
              textAnchor="middle"
              className={cn(
                'text-[11px] font-medium transition-colors',
                hoveredIndex === i
                  ? 'fill-foreground font-bold'
                  : 'fill-muted-foreground'
              )}
            >
              {c.point.label}
            </text>
          ))}
        </svg>

        {/* Floating Context Pill / Active Point Tooltip */}
        {activePoint && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-border/80 bg-muted/40 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {activePoint.label} ({activePoint.date})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-thaiwatsadu-red" />
                <span className="text-muted-foreground">ยอดขาย:</span>
                <span className="font-bold text-foreground">
                  ฿{activePoint.revenue.toLocaleString('th-TH')}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">คำสั่งซื้อ:</span>
                <span className="font-bold text-primary">
                  {activePoint.orderCount} ออเดอร์ ({activePoint.velocityPerDay.toFixed(1)}/วัน)
                </span>
              </div>

              {activePoint.volumeBreakApplied && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <BadgePercent className="size-3" />
                  Volume Break -{activePoint.volumeDiscountPct}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-thaiwatsadu-red rounded-full" />
            <span className="size-2 rounded-full border-2 border-thaiwatsadu-red bg-card" />
            <span>ยอดขายสะสม (Revenue Baht)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/40 border border-primary" />
            <span>ความเร็วคำสั่งซื้อ (Order Velocity)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 border-b border-dashed border-amber-500" />
            <span>เกณฑ์ Volume Break Discount</span>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground/80">
          อัปเดตข้อมูลอัตโนมัติตามช่วงเวลาที่เลือก
        </div>
      </div>
    </div>
  )
}
