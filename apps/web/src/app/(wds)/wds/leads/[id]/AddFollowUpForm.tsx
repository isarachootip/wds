'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'

export function AddFollowUpForm({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition()
  const [dueAt, setDueAt] = useState('')
  const [channel, setChannel] = useState<'phone' | 'line' | 'email' | 'visit'>('phone')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dueAt) {
      setError('กรุณาระบุวันที่และเวลา')
      return
    }
    setError('')
    startTransition(async () => {
      const { createFollowUpAction } = await import('@/modules/crm/actions')
      const result = await createFollowUpAction(
        { leadId, dueAt, assigneeId: 'sales-ae', channel, note: note || undefined },
        'sales-ae'
      )
      if (result.success) {
        setSuccess(true)
        setDueAt('')
        setNote('')
        setTimeout(() => setSuccess(false), 2500)
      } else {
        setError(result.error ?? 'เกิดข้อผิดพลาดในการสร้าง Follow-up')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">กำหนดติดตาม (Due Date & Time)</label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="w-full border border-input bg-background rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">ช่องทางการติดต่อ</label>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as any)}
          className="w-full border border-input bg-background rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="phone" className="bg-popover text-popover-foreground">📞 โทรศัพท์ (Call)</option>
          <option value="line" className="bg-popover text-popover-foreground">💬 LINE OA</option>
          <option value="email" className="bg-popover text-popover-foreground">📧 อีเมล (Email)</option>
          <option value="visit" className="bg-popover text-popover-foreground">🏠 เยี่ยมชมหน้างาน (Site Visit)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">หมายเหตุ (ไม่บังคับ)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border border-input bg-background rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          placeholder="เช่น โทรยืนยันใบเสนอราคา..."
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          ✅ สร้างงานติดตาม (Follow-up) เรียบร้อยแล้ว
        </p>
      )}
      <Button
        type="submit"
        disabled={isPending}
        size="sm"
        className="w-full shadow-xs"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>{isPending ? 'กำลังบันทึก...' : 'สร้างงานติดตาม (Add Follow-up)'}</span>
      </Button>
    </form>
  )
}
