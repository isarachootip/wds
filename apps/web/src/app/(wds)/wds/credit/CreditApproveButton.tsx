'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function CreditApproveButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    if (!confirm('อนุมัติเครดิต override สำหรับ Order นี้?')) return
    startTransition(async () => {
      const { approveOrderAction } = await import('@/modules/billing/actions')
      await approveOrderAction(orderId, 'current-user-id', 'accounting')
      router.refresh()
    })
  }

  return (
    <button onClick={handleApprove} disabled={isPending}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
      {isPending ? '...' : '✅ อนุมัติ Override Credit Hold'}
    </button>
  )
}
