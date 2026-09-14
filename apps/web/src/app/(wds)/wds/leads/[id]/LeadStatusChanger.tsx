'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

const NEXT_STATUSES: Record<string, string[]> = {
  new: ['contacted', 'lost'],
  contacted: ['qualified', 'lost'],
  qualified: ['site_visit_requested', 'quoted', 'lost'],
  site_visit_requested: ['quoted', 'lost'],
  quoted: ['won', 'lost'],
}

const STATUS_LABELS: Record<string, string> = {
  contacted: 'ติดต่อแล้ว',
  qualified: 'คุณสมบัติผ่าน',
  site_visit_requested: 'ขอสำรวจหน้างาน',
  quoted: 'เสนอราคาแล้ว',
  won: 'ปิดการขาย ✅',
  lost: 'สูญเสีย ❌',
}

import { LOST_REASONS } from '@/modules/crm/types'

export function LeadStatusChanger({ leadId, currentStatus }: { leadId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showLostReason, setShowLostReason] = useState(false)
  const [lostReason, setLostReason] = useState('')

  const nextStatuses = NEXT_STATUSES[currentStatus] ?? []

  async function handleStatusChange(newStatus: string) {
    if (newStatus === 'lost') {
      setShowLostReason(true)
      return
    }
    setError('')
    startTransition(async () => {
      const { updateLeadStatusAction } = await import('@/modules/crm/actions')
      const result = await updateLeadStatusAction(leadId, newStatus, 'sales-ae')
      if (!result.success) setError(result.error ?? 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
    })
  }

  async function handleLostSubmit() {
    if (!lostReason) {
      setError('กรุณาเลือกเหตุผลการปิดไม่สำเร็จ')
      return
    }
    setError('')
    startTransition(async () => {
      const { updateLeadStatusAction } = await import('@/modules/crm/actions')
      const result = await updateLeadStatusAction(leadId, 'lost', 'sales-ae', lostReason)
      if (!result.success) setError(result.error ?? 'เกิดข้อผิดพลาดในการปิดดีล')
      else setShowLostReason(false)
    })
  }

  return (
    <div className="space-y-3">
      {!showLostReason ? (
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isPending}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 cursor-pointer ${
                status === 'lost'
                  ? 'border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                  : status === 'won'
                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                  : 'border-primary/30 text-primary hover:bg-primary/10'
              }`}
            >
              {isPending ? '...' : `→ ${STATUS_LABELS[status] ?? status}`}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">เหตุผลที่ไม่ปิดได้</label>
          <select
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            className="w-full border border-input bg-background rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="" className="bg-popover text-popover-foreground">-- เลือกเหตุผล --</option>
            {LOST_REASONS.map((r) => (
              <option key={r} value={r} className="bg-popover text-popover-foreground">
                {r}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLostReason(false)}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={handleLostSubmit}
              disabled={isPending || !lostReason}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {isPending ? '...' : 'ยืนยันปิด Lead'}
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
