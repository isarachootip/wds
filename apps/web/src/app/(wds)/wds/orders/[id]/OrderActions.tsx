'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { satangToBaht } from '@/lib/qt-calc'

type Props = {
  orderId: string
  orderStatus: string
  confirmedSatang: number
  orderTotalSatang: number
}

export function OrderActions({ orderId, orderStatus, confirmedSatang, orderTotalSatang }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer' | 'credit' | 'card' | 'cod'>('transfer')
  const [payAmountBaht, setPayAmountBaht] = useState('')
  const [payRefNo, setPayRefNo] = useState('')

  // Stub: in production this comes from session
  const actorId = 'current-user-id'
  const actorRole = 'admin' // TODO: real role from session

  const remainingSatang = Math.max(0, orderTotalSatang - confirmedSatang)

  async function handleApprove() {
    setError('')
    startTransition(async () => {
      const { approveOrderAction } = await import('@/modules/billing/actions')
      const r = await approveOrderAction(orderId, actorId, actorRole)
      if (!r.success) setError(r.error ?? 'เกิดข้อผิดพลาด')
      else router.refresh()
    })
  }

  async function handleRecordPayment() {
    if (!payAmountBaht) { setError('กรุณากรอกจำนวนเงิน'); return }
    setError('')
    startTransition(async () => {
      const { recordPaymentAction } = await import('@/modules/billing/actions')
      const r = await recordPaymentAction({
        orderId,
        method: payMethod,
        amountSatang: Math.round(parseFloat(payAmountBaht) * 100),
        refNo: payRefNo || undefined,
        actorId,
      })
      if (!r.success) setError(r.error ?? 'เกิดข้อผิดพลาด')
      else { setShowPaymentForm(false); router.refresh() }
    })
  }

  async function handleMarkReady() {
    setError('')
    startTransition(async () => {
      const { markReadyAction } = await import('@/modules/billing/actions')
      const r = await markReadyAction(orderId, actorId, actorRole)
      if (!r.success) setError(r.error ?? 'เกิดข้อผิดพลาด')
      else router.refresh()
    })
  }

  async function handleClose() {
    if (!confirm('ปิดงาน?')) return
    setError('')
    startTransition(async () => {
      const { closeOrderAction } = await import('@/modules/billing/actions')
      const r = await closeOrderAction(orderId, actorId)
      if (!r.success) setError(r.error ?? 'เกิดข้อผิดพลาด')
      else router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">การดำเนินการ</h3>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {orderStatus === 'credit_hold' && (
        <button onClick={handleApprove} disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '...' : '✅ อนุมัติเครดิต → รอชำระ'}
        </button>
      )}

      {orderStatus === 'awaiting_payment' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">ค้างชำระ: <span className="font-bold text-orange-600">฿{satangToBaht(remainingSatang)}</span></p>
          {!showPaymentForm ? (
            <button onClick={() => setShowPaymentForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              💰 บันทึกรับชำระ
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">ช่องทาง</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="cash">เงินสด</option>
                    <option value="transfer">โอนเงิน</option>
                    <option value="credit">เครดิต</option>
                    <option value="card">บัตรเครดิต</option>
                    <option value="cod">COD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">จำนวน (บาท)</label>
                  <input type="number" min="0" step="0.01" value={payAmountBaht}
                    onChange={e => setPayAmountBaht(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <input type="text" value={payRefNo} onChange={e => setPayRefNo(e.target.value)}
                placeholder="เลข slip / ref" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
                <button onClick={handleRecordPayment} disabled={isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {isPending ? '...' : 'บันทึก'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {orderStatus === 'paid' && (
        <button onClick={handleMarkReady} disabled={isPending}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
          {isPending ? '...' : '📦 คลังเตรียมสินค้าแล้ว'}
        </button>
      )}

      {orderStatus === 'delivered' && (
        <button onClick={handleClose} disabled={isPending}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
          {isPending ? '...' : '✔ ปิดงาน'}
        </button>
      )}

      {['closed', 'cancelled'].includes(orderStatus) && (
        <p className="text-sm text-gray-400">{orderStatus === 'closed' ? 'ปิดงานแล้ว' : 'ยกเลิกแล้ว'}</p>
      )}
    </div>
  )
}
