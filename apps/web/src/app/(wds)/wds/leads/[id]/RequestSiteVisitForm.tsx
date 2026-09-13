'use client'

import { useState, useTransition } from 'react'

export function RequestSiteVisitForm({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition()
  const [purpose, setPurpose] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!purpose.trim()) { setError('กรุณาระบุวัตถุประสงค์'); return }
    setError('')
    startTransition(async () => {
      const { requestSiteVisitAction } = await import('@/modules/crm/actions')
      const result = await requestSiteVisitAction({ leadId, purpose }, 'current-user-id')
      if (result.success) setSuccess(true)
      else setError(result.error ?? 'เกิดข้อผิดพลาด')
    })
  }

  if (success) {
    return <p className="text-sm text-green-700">✅ ส่งคำขอสำรวจหน้างานแล้ว</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-gray-600 mb-1">วัตถุประสงค์</label>
        <textarea
          value={purpose}
          onChange={e => setPurpose(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="อธิบายวัตถุประสงค์ในการเข้าสำรวจ..."
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {isPending ? 'กำลังส่ง...' : '🏠 ยืนยันขอสำรวจ'}
      </button>
    </form>
  )
}
