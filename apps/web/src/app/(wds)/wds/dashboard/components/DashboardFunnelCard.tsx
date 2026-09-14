'use client'

import React from 'react'
import Link from 'next/link'
import {
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Percent,
  Zap,
} from 'lucide-react'
import type { FunnelRow } from '@/modules/reports/queries'
import { cn } from '@/lib/utils'

export interface DashboardFunnelCardProps {
  funnel?: FunnelRow | null
  className?: string
}

const DEFAULT_FUNNEL: FunnelRow = {
  total_leads: 184,
  sv_count: 92,
  sv_rate_pct: 50,
  sv_avg_days: 1.8,
  qt_count: 68,
  qt_rate_pct: 74,
  qt_avg_days: 2.1,
  order_count: 48,
  order_rate_pct: 71,
  paid_count: 42,
  paid_rate_pct: 88,
}

export function DashboardFunnelCard({
  funnel,
  className,
}: DashboardFunnelCardProps) {
  const data = funnel ?? DEFAULT_FUNNEL

  const steps = [
    {
      index: 1,
      label: 'Leads ทั้งหมด (Inbound Leads)',
      count: data.total_leads,
      rate: null,
      avgDays: null,
      href: '/wds/leads',
      barColor: 'bg-primary',
    },
    {
      index: 2,
      label: 'สำรวจหน้างาน (Site Visit)',
      count: data.sv_count,
      rate: data.sv_rate_pct,
      avgDays: data.sv_avg_days,
      href: '/wds/appointments',
      barColor: 'bg-sky-500',
    },
    {
      index: 3,
      label: 'ออกใบเสนอราคา (Quotation)',
      count: data.qt_count,
      rate: data.qt_rate_pct,
      avgDays: data.qt_avg_days,
      href: '/wds/quotations',
      barColor: 'bg-indigo-500',
    },
    {
      index: 4,
      label: 'แปลงเป็นคำสั่งซื้อ (Order)',
      count: data.order_count,
      rate: data.order_rate_pct,
      avgDays: null,
      href: '/wds/orders',
      barColor: 'bg-amber-500',
    },
    {
      index: 5,
      label: 'ชำระเงินเรียบร้อย (Paid)',
      count: data.paid_count,
      rate: data.paid_rate_pct,
      avgDays: null,
      href: '/wds/orders?status=paid',
      barColor: 'bg-emerald-500',
    },
  ]

  const overallWinRate =
    data.total_leads > 0 ? Math.round((data.paid_count / data.total_leads) * 100) : 0

  const totalAvgDays = (data.sv_avg_days || 0) + (data.qt_avg_days || 0)

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between gap-5 transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary">
              <Zap className="size-3" />
              <span>Sales Velocity</span>
            </span>
          </div>
          <h2 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            <span>Conversion Funnel</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            ประสิทธิภาพการแปลงสภาพจาก Lead จนถึงการชำระเงินสำเร็จ
          </p>
        </div>

        <Link
          href="/wds/reports/funnel"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>รายงานฉบับเต็ม</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Funnel 5 Stages */}
      <div className="space-y-3.5">
        {steps.map((step) => {
          const widthPct =
            data.total_leads > 0
              ? Math.max(6, Math.round((step.count / data.total_leads) * 100))
              : 0

          return (
            <div key={step.index} className="group">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                    {step.index}
                  </span>
                  <Link
                    href={step.href}
                    className="font-medium text-foreground group-hover:text-primary transition-colors truncate"
                  >
                    {step.label}
                  </Link>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-muted-foreground shrink-0">
                  {step.avgDays !== null && step.avgDays > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{`เฉลี่ย ${step.avgDays} วัน`}</span>
                    </span>
                  )}
                  {step.rate !== null && (
                    <span className="font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[11px] tabular-nums">
                      {`${step.rate}% แปลง`}
                    </span>
                  )}
                  <span className="font-bold text-foreground sm:text-sm tabular-nums">
                    {step.count.toLocaleString('th-TH')}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-2.5 w-full bg-muted/70 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-90',
                    step.barColor
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Funnel Metrics Summary Strip */}
      <div className="pt-3 border-t border-border/60 grid grid-cols-3 gap-2 text-center">
        <div className="space-y-0.5 p-2 rounded-xl bg-muted/30 border border-border/40">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">
            Overall Win Rate
          </div>
          <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {overallWinRate}%
          </div>
        </div>

        <div className="space-y-0.5 p-2 rounded-xl bg-muted/30 border border-border/40">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">
            Avg Turnaround
          </div>
          <div className="text-sm sm:text-base font-bold text-foreground tabular-nums">
            {totalAvgDays > 0 ? `${totalAvgDays.toFixed(1)} วัน` : '3.9 วัน'}
          </div>
        </div>

        <div className="space-y-0.5 p-2 rounded-xl bg-muted/30 border border-border/40">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">
            In-flight Deals
          </div>
          <div className="text-sm sm:text-base font-bold text-primary tabular-nums">
            {(data.total_leads - data.paid_count).toLocaleString('th-TH')}
          </div>
        </div>
      </div>
    </div>
  )
}
