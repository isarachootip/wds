'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Props = { paymentId: string; orderId: string }

export function PaymentActions({ paymentId, orderId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [error, setError] = useState('')

  // In production: get role from session
  const actorRole = 'accounting'
  const actorId = 'current-user-id'

  async function handleVerify(decision: 'confirmed' | 'rejected') {
    if (decision === 'rejected' && !rejectReason.trim()) {
      setError('กรุณาระบุเหตุผล'); return
    }
    setError('')
    startTransition(async () => {
      const { verifyPaymentAction } = await import('@/modules/billing/actions')
      const r = await verifyPaymentAction({
        paymentId,
        decision,
        rejectReason: rejectReason || undefined,
        actorId,
        actorRole,
      })
      if (!r.success) setError(r.error ?? 'เกิดข้อผิดพลาด')
      else router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!showReject ? (
        <div className="flex gap-2">
          <button onClick={() => handleVerify('confirmed')} disabled={isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {isPending ? '...' : '✅ ยืนยันรับชำระ'}
          </button>
          <button onClick={() => setShowReject(true)}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
            ❌ ปฏิเสธ
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input type="text" placeholder="เหตุผลที่ปฏิเสธ..." value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" autoFocus />
          <div className="flex gap-2">
            <button onClick={() => setShowReject(false)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
            <button onClick={() => handleVerify('rejected')} disabled={isPending}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">
              {isPending ? '...' : 'ยืนยันปฏิเสธ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
