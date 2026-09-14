'use client'

import React, { useState, useTransition } from 'react'
import {
  Phone,
  MessageCircle,
  FileText,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
} from 'lucide-react'
import { logLeadActivityAction } from '@/modules/crm/actions'
import { Button } from '@/components/ui/button'
import { PillTabs, type PillTabOption } from '@/components/ui/PillTabs'

export interface QuickActivityLoggerProps {
  leadId: string
  onActivityLogged?: () => void
}

export type ActivityType = 'call' | 'line' | 'note' | 'visit'

const ACTIVITY_TAB_OPTIONS: PillTabOption<ActivityType>[] = [
  {
    value: 'call',
    label: 'โทรศัพท์ (Call)',
    icon: <Phone className="w-3.5 h-3.5 text-blue-500" />,
  },
  {
    value: 'line',
    label: 'LINE OA',
    icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />,
  },
  {
    value: 'note',
    label: 'โน้ตภายใน (Note)',
    icon: <FileText className="w-3.5 h-3.5 text-amber-500" />,
  },
  {
    value: 'visit',
    label: 'เยี่ยมหน้างาน (Visit)',
    icon: <MapPin className="w-3.5 h-3.5 text-purple-500" />,
  },
]

const OUTCOME_OPTIONS = [
  { value: 'interested', label: '🌟 สนใจมาก (นัดคุยสเปก / ขั้นตอนถัดไป)' },
  { value: 'quoted', label: '📄 ขอใบเสนอราคา (ส่ง BOQ ให้ประเมิน)' },
  { value: 'followup', label: '📅 นัดหมายติดตามต่อ (Follow-up)' },
  { value: 'busy', label: '⏳ ลูกค้าติดธุระ / ให้ติดต่อกลับภายหลัง' },
  { value: 'no_answer', label: '📵 ไม่รับสาย / ติดต่อไม่ได้' },
  { value: 'general', label: '📝 สรุปบันทึกการสนทนาทั่วไป' },
]

const QUICK_TAGS: Record<ActivityType, string[]> = {
  call: [
    'โทรคุยเรื่อง BOQ และสรุปปริมาณสินค้า',
    'ติดต่อแจ้งราคาเบื้องต้นและส่วนลดโครงการ',
    'โทรติดตามการตัดสินใจเรื่องใบเสนอราคา',
    'ลูกค้าไม่สะดวกคุย นัดหมายโทรกลับรอบถัดไป',
  ],
  line: [
    'ส่งแคตตาล็อกสินค้าและเอกสารสเปกทาง LINE',
    'ลูกค้าส่งรูปภาพหน้างานและพิกัดแผนที่มาให้',
    'แชทสรุปรายการวัสดุเพื่อออกใบเสนอราคา',
    'ส่งลิงก์ใบเสนอราคาและแจ้งโปรโมชั่นทาง LINE',
  ],
  note: [
    'ลูกค้าต้องการสินค้ามาตรฐาน มอก. พร้อมใบ Cer',
    'มีเงื่อนไขการส่งสินค้าแบบทยอยส่ง 3 งวด',
    'ทางเข้าไซต์งานแคบ ต้องใช้รถบรรทุก 6 ล้อเท่านั้น',
    'ประสานงานฝ่ายเครดิตเพื่อประเมินวงเงินซื้อสินค้า',
  ],
  visit: [
    'เข้าพบลูกค้าที่ไซต์งาน ตรวจสอบพื้นที่ก่อสร้าง',
    'วัดระยะทางเข้าไซต์งานและความกว้างถนน',
    'ประชุมสรุปรายการสั่งซื้อร่วมกับผู้รับเหมา',
    'ตรวจสอบจุดลงสินค้าและพื้นที่วางสต็อก',
  ],
}

export function QuickActivityLogger({ leadId, onActivityLogged }: QuickActivityLoggerProps) {
  const [isPending, startTransition] = useTransition()
  const [activeType, setActiveType] = useState<ActivityType>('call')
  const [outcome, setOutcome] = useState('interested')
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleSelectTag(tag: string) {
    if (note.trim()) {
      setNote((prev) => `${prev}\n- ${tag}`)
    } else {
      setNote(tag)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) {
      setError('กรุณาระบุรายละเอียดกิจกรรมหรือข้อความ')
      return
    }

    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const outcomeLabel = OUTCOME_OPTIONS.find((o) => o.value === outcome)?.label || outcome
      const fullNote = `[ผลลัพธ์: ${outcomeLabel}] [เวลา: ${dateTime}]\n${note.trim()}`

      const result = await logLeadActivityAction({
        leadId,
        type: activeType,
        note: fullNote,
        actorId: 'sales-ae',
      })

      if (result.success) {
        const typeThai =
          activeType === 'call'
            ? 'โทรศัพท์'
            : activeType === 'line'
            ? 'LINE OA'
            : activeType === 'visit'
            ? 'เยี่ยมหน้างาน'
            : 'บันทึกภายใน'
        setSuccess(`บันทึกกิจกรรม ${typeThai} เรียบร้อยแล้ว`)
        setNote('')
        if (onActivityLogged) onActivityLogged()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error ?? 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>บันทึกกิจกรรมด่วน (Quick Activity Logger)</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            ลงบันทึกการสื่อสารทันทีเพื่ออัปเดตสถานะและประวัติกิจกรรมแบบเรียลไทม์
          </p>
        </div>
      </div>

      {/* Activity Type Selection Tabs using PillTabs */}
      <div className="mb-4">
        <PillTabs
          options={ACTIVITY_TAB_OPTIONS}
          value={activeType}
          onChange={(val) => {
            setActiveType(val)
            setError(null)
          }}
          fullWidth
          size="sm"
        />
      </div>

      {/* Outcome Selector & Date/Time Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[11px] font-medium text-foreground mb-1">
            ผลลัพธ์การติดต่อ (Outcome)
          </label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {OUTCOME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-foreground mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>วันและเวลาที่ติดต่อ (Date & Time)</span>
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Preset Quick Tags */}
      <div className="mb-3">
        <div className="text-[11px] text-muted-foreground mb-1.5 font-medium">
          ข้อความสำเร็จรูป (คลิกเพื่อเพิ่มลงบันทึก):
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAGS[activeType].map((tag, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectTag(tag)}
              className="text-[11px] bg-muted hover:bg-muted/80 text-foreground/80 hover:text-foreground px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-border/50"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Note Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={
            activeType === 'call'
              ? 'บันทึกผลการสนทนาทางโทรศัพท์ เช่น ลูกค้าสนใจแบบไหน นัดหมายอย่างไร...'
              : activeType === 'line'
              ? 'บันทึกข้อความหรือประเด็นที่พูดคุยผ่าน LINE OA เช่น รายละเอียดที่ลูกค้าทักมา...'
              : activeType === 'visit'
              ? 'บันทึกข้อมูลการลงตรวจพื้นที่หน้างาน สภาพทางเข้า การนัดพบลูกค้า...'
              : 'บันทึกโน้ตภายใน ความต้องการโครงการ ข้อมูลคู่แข่ง หรือสิ่งที่ทีมต้องระวัง...'
          }
          className="w-full border border-input bg-background rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />

        {error && (
          <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground font-mono">
            {note.length > 0 ? `${note.length} ตัวอักษร` : 'พร้อมบันทึก'}
          </span>
          <Button
            type="submit"
            disabled={isPending || !note.trim()}
            size="sm"
            className="inline-flex items-center gap-2 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPending ? 'กำลังบันทึก...' : 'บันทึกกิจกรรม (Log Activity)'}</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
