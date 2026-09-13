'use client'

import { useEffect, useState } from 'react'
import { satangToBaht } from '@/lib/qt-calc'

// LIFF-friendly page — opens inside LINE app
// URL: /portal/liff?token=<public_token>

export default function LiffPage() {
  const [token, setToken] = useState<string | null>(null)
  const [data, setData] = useState<{
    orderNumber?: string
    orderStatus?: string
    totalSatang?: number
    customerName?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    setToken(t)
    if (!t) { setLoading(false); return }

    // Fetch order status via portal API
    fetch(`/api/portal/order-status?token=${t}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="text-gray-700 font-medium">ไม่พบข้อมูล</p>
          <p className="text-gray-500 text-sm mt-1">กรุณาเปิดลิงก์จากข้อความ LINE</p>
        </div>
      </div>
    )
  }

  const ORDER_STATUS_TH: Record<string, string> = {
    new: 'รับ Order แล้ว', credit_hold: 'ตรวจสอบเครดิต',
    awaiting_payment: 'รอชำระเงิน', paid: 'ชำระแล้ว',
    ready: 'เตรียมสินค้า', delivering: 'กำลังจัดส่ง',
    delivered: 'ส่งมอบแล้ว', closed: 'เสร็จสิ้น',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700 flex flex-col">
      <div className="bg-blue-600 px-4 py-6 text-white">
        <p className="text-blue-200 text-xs">WDS — ติดตาม Order</p>
        <h1 className="text-xl font-bold mt-1">{data?.orderNumber ?? 'Order'}</h1>
        {data?.customerName && <p className="text-blue-200 text-sm">{data.customerName}</p>}
      </div>

      <div className="flex-1 bg-gray-50 rounded-t-3xl px-4 py-6 space-y-4">
        {data ? (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">สถานะ</p>
              <p className="text-xl font-bold text-gray-900">
                {ORDER_STATUS_TH[data.orderStatus ?? ''] ?? data.orderStatus}
              </p>
              {data.totalSatang !== undefined && (
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  ฿{satangToBaht(data.totalSatang)}
                </p>
              )}
            </div>

            <a href={`/portal/orders/${token}`}
              className="block w-full py-4 bg-blue-600 text-white font-bold rounded-2xl text-center text-base hover:bg-blue-700">
              ดูรายละเอียดเต็ม →
            </a>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">ไม่พบข้อมูล Order</p>
          </div>
        )}
      </div>
    </div>
  )
}
