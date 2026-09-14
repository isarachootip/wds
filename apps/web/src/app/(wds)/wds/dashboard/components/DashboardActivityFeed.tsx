'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  PhoneCall,
  MessageSquare,
  MapPin,
  FileText,
  Activity,
  ArrowRight,
  ExternalLink,
  Clock,
  User,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ActivityChannel = 'phone' | 'line' | 'visit' | 'quotation' | 'note' | 'all'

export interface OperationalActivityItem {
  id: string
  leadId?: string
  channel: 'phone' | 'line' | 'visit' | 'quotation' | 'note'
  customerName: string
  projectName?: string
  note: string
  actor: string
  actorRole?: string
  occurredAt: string // ISO string or relative
  timeAgo?: string
  badgeVariant?: 'default' | 'success' | 'warning' | 'alert'
}

const DEFAULT_ACTIVITIES: OperationalActivityItem[] = [
  {
    id: 'act-1',
    leadId: 'lead-01',
    channel: 'quotation',
    customerName: 'บจก. ธนพัฒน์ คอนสตรัคชั่น',
    projectName: 'โครงการหมู่บ้านพฤกษา รังสิต คลอง 3',
    note: 'ออกใบเสนอราคา QT-2026-09-0042 ยอดรวม ฿480,000 สำหรับปูนซีเมนต์ถุงและเหล็กข้ออ้อย DB16 พร้อมให้ส่วนลด Volume Break Tier 1',
    actor: 'กานดา ประเสริฐสุข',
    actorRole: 'Senior AE',
    occurredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    timeAgo: '15 นาทีที่แล้ว',
  },
  {
    id: 'act-2',
    leadId: 'lead-02',
    channel: 'visit',
    customerName: 'หจก. ศิริชัยการช่าง (1998)',
    projectName: 'หน้างานโกดังสินค้า บางพลี กม.19',
    note: 'Field Surveyor สมชาย เช็คอินเข้าหน้างาน ตรวจสอบระยะทางเข้าไซต์สำหรับรถบรรทุก 10 ล้อ พร้อมบันทึกพิกัด GPS เรียบร้อย',
    actor: 'สมชาย สายตรวจ',
    actorRole: 'Field Surveyor',
    occurredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    timeAgo: '45 นาทีที่แล้ว',
  },
  {
    id: 'act-3',
    leadId: 'lead-03',
    channel: 'line',
    customerName: 'คุณเกรียงไกร มงคลศิลป์',
    projectName: 'อาคารพาณิชย์ 4 ชั้น นนทบุรี',
    note: 'ลูกค้าสอบถามสต๊อกสินค้ากระเบื้องหลังคาคอนกรีตสีเทา 1,200 แผ่น ทาง LINE OA ยืนยันการจัดส่งจากคลังไทวัสดุ สาขาบางบัวทอง',
    actor: 'ปรียานุช วงศ์สว่าง',
    actorRole: 'Inside Sales',
    occurredAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    timeAgo: '2 ชั่วโมงที่แล้ว',
  },
  {
    id: 'act-4',
    leadId: 'lead-04',
    channel: 'phone',
    customerName: 'บมจ. อสังหาทวีกิจ กรุ๊ป',
    projectName: 'โครงการทาวน์โฮม สุขุมวิท 105',
    note: 'โทรศัพท์ติดตามใบเสนอราคา ลูกค้าพึงพอใจเครดิตเทอม 60 วัน และกำลังส่งเรื่องเข้าคณะกรรมการจัดซื้อเพื่อเปิด PO',
    actor: 'พิเชษฐ์ เกียรติดำรง',
    actorRole: 'Key Account AE',
    occurredAt: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    timeAgo: '3 ชั่วโมงที่แล้ว',
  },
  {
    id: 'act-5',
    leadId: 'lead-05',
    channel: 'quotation',
    customerName: 'บจก. เอสเตท พลัส เอ็นจิเนียริ่ง',
    projectName: 'คอนโดมิเนียม High-rise พระราม 9',
    note: 'ปรับปรุงใบเสนอราคา QT-2026-09-0038 ยอดรวม ฿1,250,000 ปรับโครงสร้างราคาตามราคากลางเหล็กเส้นประจำสัปดาห์',
    actor: 'กานดา ประเสริฐสุข',
    actorRole: 'Senior AE',
    occurredAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    timeAgo: '5 ชั่วโมงที่แล้ว',
  },
  {
    id: 'act-6',
    leadId: 'lead-06',
    channel: 'phone',
    customerName: 'ห้างหุ้นส่วน ปรีชา พาณิชย์งานสร้าง',
    projectName: 'โรงงานแปรรูปอาหาร ฉะเชิงเทรา',
    note: 'โทรแนะนำแคมเปญสั่งสินค้าโครงสร้างรับคะแนน The1 X3 สำหรับยอดซื้อเกิน 500,000 บาท ลูกค้านัดหมายสำรวจหน้างานวันพุธนี้',
    actor: 'พิเชษฐ์ เกียรติดำรง',
    actorRole: 'Key Account AE',
    occurredAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    timeAgo: '8 ชั่วโมงที่แล้ว',
  },
]

export interface DashboardActivityFeedProps {
  activities?: OperationalActivityItem[]
  className?: string
}

export function DashboardActivityFeed({
  activities,
  className,
}: DashboardActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityChannel>('all')

  const items = activities !== undefined ? activities : DEFAULT_ACTIVITIES

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true
    return item.channel === activeFilter
  })

  // Format channel badges
  const renderChannelBadge = (channel: OperationalActivityItem['channel']) => {
    switch (channel) {
      case 'phone':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <PhoneCall className="size-3" />
            <span>โทรศัพท์</span>
          </span>
        )
      case 'line':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
            <MessageSquare className="size-3" />
            <span>LINE OA</span>
          </span>
        )
      case 'visit':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
            <MapPin className="size-3" />
            <span>สำรวจหน้างาน (Visit)</span>
          </span>
        )
      case 'quotation':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            <FileText className="size-3" />
            <span>ใบเสนอราคา (QT)</span>
          </span>
        )
      case 'note':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <FileText className="size-3" />
            <span>บันทึก / โน้ต (Note)</span>
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col gap-4 transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary">
              <Activity className="size-3" />
              <span>Real-time Stream</span>
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              Thai Watsadu Sales Operations
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>กิจกรรมล่าสุด (Recent Operations Feed)</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            บันทึกการติดต่อและการดำเนินงานทีมขาย AE & Field Engineer ตามลำดับเวลา
          </p>
        </div>

        <Link
          href="/wds/leads"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline self-start sm:self-auto"
        >
          <span>ดูลีดทั้งหมด</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'all', label: 'ทั้งหมด', icon: null },
            { id: 'phone', label: 'โทรศัพท์', icon: <PhoneCall className="size-3" /> },
            { id: 'line', label: 'LINE OA', icon: <MessageSquare className="size-3" /> },
            { id: 'visit', label: 'สำรวจหน้างาน', icon: <MapPin className="size-3" /> },
            { id: 'quotation', label: 'ใบเสนอราคา', icon: <FileText className="size-3" /> },
            { id: 'note', label: 'บันทึก/โน้ต', icon: <FileText className="size-3" /> },
          ] as const
        ).map((filter) => {
          const isSelected = activeFilter === filter.id
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {filter.icon}
              <span>{filter.label}</span>
            </button>
          )
        })}
      </div>

      {/* Chronological Activities List */}
      <div className="divide-y divide-border/60">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            ไม่พบกิจกรรมสำหรับช่องทางที่เลือก
          </div>
        ) : (
          filteredItems.map((item) => {
            const leadHref = item.leadId ? `/wds/leads/${item.leadId}` : '/wds/leads'

            return (
              <div
                key={item.id}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-start justify-between gap-3 group hover:bg-muted/20 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Channel Icon Box */}
                  <div className="mt-0.5 size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                    {item.channel === 'phone' && <PhoneCall className="size-4 text-emerald-600 dark:text-emerald-400" />}
                    {item.channel === 'line' && <MessageSquare className="size-4 text-green-600 dark:text-green-400" />}
                    {item.channel === 'visit' && <MapPin className="size-4 text-sky-600 dark:text-sky-400" />}
                    {item.channel === 'quotation' && <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />}
                    {item.channel === 'note' && <FileText className="size-4 text-amber-600 dark:text-amber-400" />}
                  </div>

                  {/* Activity Details */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderChannelBadge(item.channel)}
                      <Link
                        href={leadHref}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
                      >
                        {item.customerName}
                      </Link>
                    </div>

                    {item.projectName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="size-3 shrink-0" />
                        <span className="truncate">{item.projectName}</span>
                      </div>
                    )}

                    <p className="text-xs text-foreground/80 leading-relaxed font-normal">
                      {item.note}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                      <div className="flex items-center gap-1">
                        <User className="size-3" />
                        <span>{item.actor}</span>
                        {item.actorRole && <span className="opacity-70">({item.actorRole})</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Time & Navigation link */}
                <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0 text-xs text-muted-foreground pl-11 sm:pl-0">
                  <span className="flex items-center gap-1 tabular-nums text-[11px]">
                    <Clock className="size-3" />
                    <span>{item.timeAgo || 'เมื่อสักครู่'}</span>
                  </span>

                  <Link
                    href={leadHref}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline mt-1 opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <span>ดูรายละเอียด</span>
                    <ExternalLink className="size-2.5" />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-border/60 text-center">
        <Link
          href="/wds/leads"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <span>ดูบันทึกและประวัติกิจกรรมทั้งหมด ({items.length}+ รายการ)</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  )
}
