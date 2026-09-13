'use client'

import { useState, useTransition } from 'react'

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

const LOST_REASONS = [
  'ราคาสูงเกินไป',
  'เลือกคู่แข่ง',
  'ยกเลิกโครงการ',
  'ติดต่อไม่ได้',
  'ไม่ตรงความต้องการ',
  'งบประมาณไม่เพียงพอ',
  'อื่นๆ',
]

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
      const result = await updateLeadStatusAction(leadId, newStatus, 'current-user-id')
      if (!result.success) setError(result.error ?? 'เกิดข้อผิดพลาด')
    })
  }

  async function handleLostSubmit() {
    if (!lostReason) { setError('กรุณาเลือกเหตุผล'); return }
    setError('')
    startTransition(async () => {
      const { updateLeadStatusAction } = await import('@/modules/crm/actions')
      const result = await updateLeadStatusAction(leadId, 'lost', 'current-user-id', lostReason)
      if (!result.success) setError(result.error ?? 'เกิดข้อผิดพลาด')
      else setShowLostReason(false)
    })
  }

  return (
    <div className="space-y-3">
      {!showLostReason ? (
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isPending}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
                status === 'lost'
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : status === 'won'
                  ? 'border-green-200 text-green-700 hover:bg-green-50'
                  : 'border-blue-200 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {isPending ? '...' : `→ ${STATUS_LABELS[status] ?? status}`}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm text-gray-700">เหตุผลที่ไม่ปิดได้</label>
          <select
            value={lostReason}
            onChange={e => setLostReason(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">-- เลือกเหตุผล --</option>
            {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLostReason(false)}
              className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleLostSubmit}
              disabled={isPending}
              className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? '...' : 'ยืนยันปิด Lead'}
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
