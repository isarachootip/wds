'use client'

import { useState, useTransition } from 'react'

type Props = {
  quotationId: string
}

export function RejectForm({ quotationId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (done) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-gray-600">ส่งคำขอแก้ไขแล้ว — เจ้าหน้าที่จะติดต่อกลับ</p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
      >
        ขอแก้ไขหรือปฏิเสธใบเสนอราคา
      </button>
    )
  }

  async function handleReject() {
    if (!reason.trim()) { setError('กรุณาระบุเหตุผลหรือสิ่งที่ต้องการแก้ไข'); return }
    setError('')
    startTransition(async () => {
      const ip = 'unknown'
      const ua = navigator.userAgent
      const { rejectQuotationAction } = await import('@/modules/ordering/actions')
      const result = await rejectQuotationAction(quotationId, reason, ip, ua)
      if (!result.success) { setError(result.error ?? 'เกิดข้อผิดพลาด'); return }
      setDone(true)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-red-100 p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">ขอแก้ไข / ปฏิเสธ</h3>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        rows={3}
        placeholder="ระบุรายการที่ต้องการแก้ไข หรือเหตุผลที่ไม่สะดวกดำเนินการ..."
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
        autoFocus
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
          ยกเลิก
        </button>
        <button onClick={handleReject} disabled={isPending}
          className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
          {isPending ? '...' : 'ส่งคำขอ'}
        </button>
      </div>
    </div>
  )
}
