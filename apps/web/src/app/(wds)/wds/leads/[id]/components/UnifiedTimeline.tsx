'use client'

import React, { useState } from 'react'
import {
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  ArrowRightCircle,
  Home,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'
import { formatTHB, satang } from '@/lib/money'
import { PillTabs, type PillTabOption } from '@/components/ui/PillTabs'

export interface UnifiedTimelineProps {
  activities: any[]
  followUps: any[]
  siteVisits: any[]
  quotations: any[]
}

export type TimelineFilterKind = 'all' | 'phone' | 'line' | 'visit' | 'quotation' | 'note'

interface NormalizedItem {
  id: string
  date: Date
  channel: 'phone' | 'line' | 'visit' | 'quotation' | 'note' | 'followup' | 'status'
  title: string
  subtitle?: string
  content?: string | null
  badge: {
    label: string
    className: string
  }
  iconType: 'phone' | 'line' | 'note' | 'status' | 'visit_req' | 'checkin' | 'checkout' | 'quote' | 'followup'
  actor?: string | null
}

const FILTER_TAB_OPTIONS: PillTabOption<TimelineFilterKind>[] = [
  { value: 'all', label: 'ทั้งหมด (All)' },
  { value: 'phone', label: 'โทรศัพท์ (Phone)' },
  { value: 'line', label: 'LINE OA' },
  { value: 'visit', label: 'สำรวจหน้างาน (Visit)' },
  { value: 'quotation', label: 'ใบเสนอราคา (Quote)' },
  { value: 'note', label: 'โน้ตบันทึก (Note)' },
]

export function UnifiedTimeline({
  activities = [],
  followUps = [],
  siteVisits = [],
  quotations = [],
}: UnifiedTimelineProps) {
  const [filter, setFilter] = useState<TimelineFilterKind>('all')

  const items: NormalizedItem[] = []

  // 1. Ingest activities
  for (const a of activities) {
    const occurredAt = new Date(a.occurredAt || a.createdAt)
    if (a.type === 'call') {
      items.push({
        id: `act-${a.id}`,
        date: occurredAt,
        channel: 'phone',
        title: '📞 บันทึกการโทรศัพท์ (Phone Call)',
        content: a.note,
        badge: {
          label: 'โทรศัพท์',
          className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        },
        iconType: 'phone',
        actor: a.userId,
      })
    } else if (a.type === 'line') {
      items.push({
        id: `act-${a.id}`,
        date: occurredAt,
        channel: 'line',
        title: '💬 บันทึกการคุยผ่าน LINE OA',
        content: a.note,
        badge: {
          label: 'LINE Chat',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        },
        iconType: 'line',
        actor: a.userId,
      })
    } else if (a.type === 'status_change') {
      items.push({
        id: `act-${a.id}`,
        date: occurredAt,
        channel: 'status',
        title: '🔄 อัปเดตสถานะขั้นตอนการขาย (Pipeline Transition)',
        content: a.note,
        badge: {
          label: 'เปลี่ยนสถานะ',
          className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        },
        iconType: 'status',
        actor: a.userId,
      })
    } else if (a.type === 'visit') {
      items.push({
        id: `act-${a.id}`,
        date: occurredAt,
        channel: 'visit',
        title: '🏠 บันทึกการลงตรวจหน้างาน (Site Visit Log)',
        content: a.note,
        badge: {
          label: 'หน้างาน',
          className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        },
        iconType: 'visit_req',
        actor: a.userId,
      })
    } else {
      items.push({
        id: `act-${a.id}`,
        date: occurredAt,
        channel: 'note',
        title: '📝 บันทึกโน้ตภายใน (Internal Note)',
        content: a.note,
        badge: {
          label: 'บันทึก',
          className: 'bg-muted text-foreground border-border',
        },
        iconType: 'note',
        actor: a.userId,
      })
    }
  }

  // 2. Ingest site visits
  for (const sv of siteVisits) {
    const requestedAt = new Date(sv.requestedAt || sv.createdAt)
    items.push({
      id: `sv-req-${sv.id}`,
      date: requestedAt,
      channel: 'visit',
      title: `🏠 ขอสำรวจหน้างาน: ${sv.purpose || 'สำรวจพื้นที่โครงการ'}`,
      content: sv.scope?.notes ? `ขอบเขตงาน: ${sv.scope.notes}` : null,
      badge: {
        label:
          sv.status === 'done'
            ? 'สำรวจเสร็จสิ้น'
            : sv.status === 'scheduled'
            ? 'นัดหมายแล้ว'
            : 'รอจัดคิวสำรวจ',
        className:
          sv.status === 'done'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      },
      iconType: 'visit_req',
    })

    if (sv.checkinAt) {
      items.push({
        id: `sv-in-${sv.id}`,
        date: new Date(sv.checkinAt),
        channel: 'visit',
        title: '📍 Check-in เข้าไซต์งาน (Site On)',
        content: `พิกัด GPS: ${sv.checkinLat?.toFixed(5)}, ${sv.checkinLng?.toFixed(5)} ${
          sv.checkinDistanceM !== null ? `(ระยะห่าง ${sv.checkinDistanceM} ม.)` : ''
        }`,
        badge: {
          label: 'GPS Site On',
          className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        },
        iconType: 'checkin',
      })
    }

    if (sv.checkoutAt) {
      items.push({
        id: `sv-out-${sv.id}`,
        date: new Date(sv.checkoutAt),
        channel: 'visit',
        title: '✅ Check-out ออกจากไซต์งาน',
        content: [
          sv.workSummary ? `สรุปงาน: ${sv.workSummary}` : null,
          sv.customerSignaturePath ? 'ลายเซ็นลูกค้า: ยืนยันเรียบร้อยแล้ว' : null,
        ]
          .filter(Boolean)
          .join(' • '),
        badge: {
          label: 'ปิดงานสำรวจ',
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        },
        iconType: 'checkout',
      })
    }
  }

  // 3. Ingest quotations
  for (const q of quotations) {
    const createdAt = new Date(q.createdAt)
    const formattedTotal = formatTHB(satang(q.totalSatang))
    items.push({
      id: `quote-${q.id}`,
      date: createdAt,
      channel: 'quotation',
      title: `📄 ใบเสนอราคา ${q.number}`,
      content: `ยอดรวมสุทธิ ${formattedTotal} • วันหมดอายุ: ${
        q.validUntil ? new Date(q.validUntil).toLocaleDateString('th-TH') : 'ไม่ระบุ'
      }`,
      badge: {
        label: `QT: ${q.status.toUpperCase()}`,
        className:
          q.status === 'accepted'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      },
      iconType: 'quote',
    })
  }

  // 4. Ingest follow-ups
  for (const f of followUps) {
    const dueAt = new Date(f.dueAt)
    const isPast = dueAt < new Date()
    const mappedChannel: NormalizedItem['channel'] =
      f.channel === 'phone'
        ? 'phone'
        : f.channel === 'line'
        ? 'line'
        : f.channel === 'visit'
        ? 'visit'
        : 'note'

    items.push({
      id: `fu-${f.id}`,
      date: dueAt,
      channel: mappedChannel,
      title: `📅 กำหนดติดตามผล (${
        f.channel === 'phone'
          ? 'โทรศัพท์'
          : f.channel === 'line'
          ? 'LINE OA'
          : f.channel === 'visit'
          ? 'พบลูกค้า'
          : 'อีเมล'
      })`,
      content: f.note ? `หมายเหตุ: ${f.note}` : 'นัดหมายพูดคุยความคืบหน้าโครงการ',
      badge: {
        label:
          f.status === 'done'
            ? 'ติดตามแล้ว'
            : isPast
            ? 'เลยกำหนด'
            : 'รอดำเนินการ',
        className:
          f.status === 'done'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : isPast
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      },
      iconType: 'followup',
      actor: f.assigneeId,
    })
  }

  // Chronological sort: newest first
  items.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Filter items by channel chips
  const filteredItems =
    filter === 'all'
      ? items
      : items.filter((i) => {
          if (filter === 'phone') return i.channel === 'phone'
          if (filter === 'line') return i.channel === 'line'
          if (filter === 'visit') return i.channel === 'visit'
          if (filter === 'quotation') return i.channel === 'quotation'
          if (filter === 'note') return i.channel === 'note' || i.channel === 'status'
          return true
        })

  function renderIcon(iconType: NormalizedItem['iconType']) {
    switch (iconType) {
      case 'phone':
        return <Phone className="w-3.5 h-3.5 text-blue-500" />
      case 'line':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
      case 'status':
        return <ArrowRightCircle className="w-3.5 h-3.5 text-purple-500" />
      case 'visit_req':
        return <Home className="w-3.5 h-3.5 text-indigo-500" />
      case 'checkin':
        return <MapPin className="w-3.5 h-3.5 text-teal-500" />
      case 'checkout':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      case 'quote':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
      case 'followup':
        return <Calendar className="w-3.5 h-3.5 text-cyan-500" />
      case 'note':
      default:
        return <FileText className="w-3.5 h-3.5 text-muted-foreground" />
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-card-foreground">
      {/* Header & Filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              ประวัติกิจกรรมรวม (Chronological Unified Timeline)
            </h3>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium border border-border">
              {filteredItems.length} รายการ
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            สตรีมกิจกรรมรวมทุกช่องทาง: โทรศัพท์, LINE OA, นัดสำรวจ, ใบเสนอราคา และงานติดตาม
          </p>
        </div>
      </div>

      {/* Channel Filter Chips */}
      <div className="mb-5 overflow-x-auto pb-1">
        <PillTabs
          options={FILTER_TAB_OPTIONS}
          value={filter}
          onChange={setFilter}
          size="sm"
        />
      </div>

      {/* Timeline Stream */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-2xl bg-muted/20">
          <Clock className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-medium">ไม่มีกิจกรรมในหมวดหมู่นี้</p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            เลือกแถบ &quot;ทั้งหมด (All)&quot; หรือบันทึกกิจกรรมใหม่จากแผงด้านบน
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline Marker Node */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center shadow-xs">
                {renderIcon(item.iconType)}
              </div>

              {/* Event Content Container */}
              <div className="bg-muted/30 hover:bg-muted/50 border border-border/70 rounded-xl p-3.5 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <span>{item.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${item.badge.className}`}
                  >
                    {item.badge.label}
                  </span>
                </div>

                {item.content && (
                  <p className="text-xs text-foreground/80 whitespace-pre-line leading-relaxed mb-2 font-normal">
                    {item.content}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {item.date.toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      •{' '}
                      {item.date.toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      น.
                    </span>
                  </div>

                  {item.actor && (
                    <div className="flex items-center gap-1 font-mono">
                      <UserCheck className="w-3 h-3" />
                      <span>{item.actor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
