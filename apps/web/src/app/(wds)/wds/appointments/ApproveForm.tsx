'use client'

import { useState, useTransition } from 'react'

type Team = { id: string; name: string }

type Props = {
  domainEventId: string
  siteVisitId: string
  customerId?: string
  addressId?: string
  teams: Team[]
}

export function ApproveForm({ domainEventId, siteVisitId, customerId, addressId, teams }: Props) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle')
  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '')
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (done) {
    return <p className="text-sm text-green-700 font-medium">✅ ดำเนินการแล้ว</p>
  }

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault()
    if (!scheduledStart || !teamId) { setError('กรุณากรอกข้อมูลให้ครบ'); return }
    setError('')
    startTransition(async () => {
      const { approveAppointmentAction } = await import('@/modules/visit/actions')
      const result = await approveAppointmentAction(
        domainEventId,
        siteVisitId,
        { customerId, addressId, scheduledStart, scheduledEnd: scheduledEnd || scheduledStart, teamId },
        'current-user-id'
      )
      if (result.success) setDone(true)
      else setError(result.error ?? 'เกิดข้อผิดพลาด')
    })
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectReason.trim()) { setError('กรุณาระบุเหตุผล'); return }
    setError('')
    startTransition(async () => {
      const { rejectAppointmentAction } = await import('@/modules/visit/actions')
      const result = await rejectAppointmentAction(
        domainEventId, siteVisitId, rejectReason, 'current-user-id'
      )
      if (result.success) setDone(true)
      else setError(result.error ?? 'เกิดข้อผิดพลาด')
    })
  }

  if (mode === 'idle') {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => setMode('approve')}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
        >
          ✅ อนุมัติ + นัดหมาย
        </button>
        <button
          onClick={() => setMode('reject')}
          className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm rounded-lg hover:bg-red-100"
        >
          ❌ ปฏิเสธ
        </button>
      </div>
    )
  }

  if (mode === 'approve') {
    return (
      <form onSubmit={handleApprove} className="space-y-3">
        <h4 className="text-sm font-medium text-green-700">นัดหมายและมอบหมายทีม</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">วันและเวลาเริ่ม</label>
            <input
              type="datetime-local"
              value={scheduledStart}
              onChange={e => setScheduledStart(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">วันและเวลาสิ้นสุด</label>
            <input
              type="datetime-local"
              value={scheduledEnd}
              onChange={e => setScheduledEnd(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">ทีมที่รับผิดชอบ</label>
          <select
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode('idle')}
            className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            ยกเลิก
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
            {isPending ? 'กำลังบันทึก...' : '✅ ยืนยันนัดหมาย'}
          </button>
        </div>
      </form>
    )
  }

  // reject mode
  return (
    <form onSubmit={handleReject} className="space-y-3">
      <h4 className="text-sm font-medium text-red-700">เหตุผลที่ปฏิเสธ</h4>
      <textarea
        value={rejectReason}
        onChange={e => setRejectReason(e.target.value)}
        rows={2}
        placeholder="อธิบายเหตุผลที่ไม่สามารถดำเนินการได้..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        required
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('idle')}
          className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          ยกเลิก
        </button>
        <button type="submit" disabled={isPending}
          className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
          {isPending ? '...' : '❌ ยืนยันปฏิเสธ'}
        </button>
      </div>
    </form>
  )
}
