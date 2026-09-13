'use client'

import { useState, useTransition } from 'react'

export function AddFollowUpForm({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition()
  const [dueAt, setDueAt] = useState('')
  const [channel, setChannel] = useState<'phone' | 'line' | 'email' | 'visit'>('phone')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dueAt) { setError('กรุณาระบุวันที่'); return }
    setError('')
    startTransition(async () => {
      const { createFollowUpAction } = await import('@/modules/crm/actions')
      const result = await createFollowUpAction(
        { leadId, dueAt, assigneeId: 'current-user-id', channel, note: note || undefined },
        'current-user-id'
      )
      if (result.success) { setSuccess(true); setTimeout(() => setSuccess(false), 2000) }
      else setError(result.error ?? 'เกิดข้อผิดพลาด')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">กำหนดติดตาม</label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={e => setDueAt(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">ช่องทาง</label>
        <select value={channel} onChange={e => setChannel(e.target.value as any)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="phone">📞 โทรศัพท์</option>
          <option value="line">💬 LINE</option>
          <option value="email">📧 อีเมล</option>
          <option value="visit">🏠 เยี่ยมชม</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">หมายเหตุ (ไม่บังคับ)</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="..."
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-600">✅ สร้าง Follow-up แล้ว</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? '...' : 'สร้าง Follow-up'}
      </button>
    </form>
  )
}
