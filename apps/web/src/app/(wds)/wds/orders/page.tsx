import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { satangToBaht } from '@/lib/qt-calc'

const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'ใหม่', credit_hold: 'รอเครดิต', awaiting_payment: 'รอชำระ',
  paid: 'ชำระแล้ว', ready: 'คลังเตรียม', delivering: 'จัดส่ง',
  delivered: 'ส่งแล้ว', closed: 'ปิด', cancelled: 'ยกเลิก',
}
const ORDER_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  credit_hold: 'bg-red-100 text-red-700',
  awaiting_payment: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  ready: 'bg-purple-100 text-purple-700',
  delivering: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-teal-100 text-teal-700',
  closed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-400',
}

async function fetchOrders(status?: string) {
  try {
    const { getOrders } = await import('@/modules/billing/queries')
    return await getOrders(status ? { status } : undefined)
  } catch { return [] }
}

export default async function OrdersPage({
  searchParams,
}: { searchParams: Promise<Record<string, string>> }) {
  noStore()
  const params = await searchParams
  const status = params.status
  const orderList = await fetchOrders(status)
  const creditHoldCount = orderList.filter(o => o.status === 'credit_hold').length

  const statuses = ['credit_hold', 'awaiting_payment', 'paid', 'ready', 'delivering', 'delivered', 'closed']

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">คำสั่งซื้อ</h1>
          <p className="text-sm text-gray-500 mt-1">{orderList.length} รายการ</p>
        </div>
      </div>

      {creditHoldCount > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <span>🔴</span>
          <p className="text-sm text-red-700 font-medium">{creditHoldCount} Order ติด Credit Hold</p>
          <Link href="/wds/credit" className="ml-auto text-sm text-red-600 underline font-medium">อนุมัติเครดิต →</Link>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link href="/wds/orders"
          className={`px-3 py-1.5 rounded-lg text-sm border ${!status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
          ทั้งหมด
        </Link>
        {statuses.map(s => (
          <Link key={s} href={`/wds/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm border ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            {ORDER_STATUS_LABELS[s] ?? s}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">เลขที่</th>
              <th className="text-left p-4 font-medium text-gray-600">ลูกค้า</th>
              <th className="text-right p-4 font-medium text-gray-600">มูลค่า</th>
              <th className="text-left p-4 font-medium text-gray-600">เครดิต</th>
              <th className="text-left p-4 font-medium text-gray-600">ชำระ</th>
              <th className="text-left p-4 font-medium text-gray-600">จัดส่ง</th>
              <th className="text-left p-4 font-medium text-gray-600">วันที่</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {orderList.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">ไม่พบ Order</td></tr>
            ) : orderList.map(order => {
              const isPaid = ['paid','ready','delivering','delivered','closed'].includes(order.status)
              const isDelivering = ['delivering','delivered'].includes(order.status)
              const creditBadge = order.status === 'credit_hold'
                ? <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">🔴 Hold</span>
                : <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">✅ ผ่าน</span>
              return (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-mono text-blue-600 text-xs">{order.number ?? '-'}</td>
                  <td className="p-4">{order.customerName ?? '-'}</td>
                  <td className="p-4 text-right font-medium">฿{satangToBaht(order.totalSatang)}</td>
                  <td className="p-4">{creditBadge}</td>
                  <td className="p-4">
                    {isPaid
                      ? <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">✅</span>
                      : <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">⏳</span>
                    }
                  </td>
                  <td className="p-4">
                    {isDelivering
                      ? <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">🚚</span>
                      : order.status === 'delivered'
                      ? <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">✅</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('th-TH')}</td>
                  <td className="p-4">
                    <Link href={`/wds/orders/${order.id}`} className="text-xs text-blue-600 hover:underline">ดู →</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
