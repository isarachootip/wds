import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ รอ', scheduled: '📅 นัดหมาย', picking: '📦 เตรียม',
  shipped: '🚚 กำลังส่ง', delivered: '✅ ส่งแล้ว',
  failed: '❌ ไม่สำเร็จ', returned: '↩ คืน'
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  picking: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
}

async function fetchDeliveries() {
  try {
    const { getDeliveries } = await import('@/modules/billing/queries')
    return await getDeliveries()
  } catch { return [] }
}

export default async function DeliveriesPage() {
  noStore()
  const deliveryList = await fetchDeliveries()

  const grouped = deliveryList.reduce<Record<string, typeof deliveryList>>((acc, d) => {
    const key = d.scheduledDate
      ? new Date(d.scheduledDate).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : 'ไม่ระบุวัน'
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ตารางจัดส่ง</h1>
          <p className="text-sm text-gray-500 mt-1">{deliveryList.length} รายการ</p>
        </div>
      </div>

      {deliveryList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-gray-400">ยังไม่มีรายการจัดส่ง</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, items]) => (
            <div key={dateKey}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{dateKey}</h2>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {items.map((d, i) => (
                  <div key={d.id}
                    className={`flex items-center p-4 gap-4 ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{d.customerName ?? '-'}</p>
                      <p className="text-xs text-gray-500">{d.orderNumber ?? '-'}</p>
                    </div>
                    {(d.attempt ?? 0) > 0 && (
                      <span className="text-xs text-orange-600">⚠️ {d.attempt} ครั้ง</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] ?? 'bg-gray-100'}`}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                    <Link href={`/wds/orders/${d.orderId}`}
                      className="text-xs text-blue-600 hover:underline shrink-0">ดู Order →</Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
