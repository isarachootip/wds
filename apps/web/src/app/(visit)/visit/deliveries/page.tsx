import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  pending: 'รอ', scheduled: 'นัดหมาย', picking: 'กำลังเตรียม',
  shipped: 'กำลังส่ง', delivered: 'ส่งแล้ว', failed: 'ไม่สำเร็จ', returned: 'คืน'
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

async function fetchMyDeliveries() {
  try {
    const { getDeliveries } = await import('@/modules/billing/queries')
    // TODO Phase 5: filter by session driverId. For now return all today's
    const all = await getDeliveries()
    const today = new Date().toDateString()
    return all.filter(d => {
      if (!d.scheduledDate) return true
      return new Date(d.scheduledDate).toDateString() === today
    })
  } catch { return [] }
}

export default async function VisitDeliveriesPage() {
  noStore()
  const deliveries = await fetchMyDeliveries()
  const pending = deliveries.filter(d => !['delivered','returned'].includes(d.status))
  const done = deliveries.filter(d => ['delivered','returned'].includes(d.status))

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">งานส่งวันนี้</p>
            <h1 className="text-lg font-bold text-gray-900">
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h1>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-600">{pending.length}</span>
            <p className="text-xs text-gray-500">คงเหลือ</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {deliveries.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 py-12 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-600 font-medium">ไม่มีงานส่งวันนี้</p>
          </div>
        )}

        {/* Active deliveries */}
        {pending.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">กำลังดำเนินการ</h2>
            <div className="space-y-3">
              {pending.map(d => (
                <Link key={d.id} href={`/visit/deliveries/${d.id}`}
                  className="block bg-white rounded-2xl border border-gray-200 p-4 shadow-sm active:scale-98 transition-transform">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-semibold text-gray-900">{d.customerName ?? 'ไม่ระบุลูกค้า'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{d.orderNumber ?? '-'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[d.status] ?? 'bg-gray-100'}`}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </div>
                  {(d.attempt ?? 0) > 0 && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ พยายามส่งแล้ว {d.attempt} ครั้ง</p>
                  )}
                  <p className="text-xs text-blue-600 mt-2 font-medium">แตะเพื่อดำเนินการ →</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Done deliveries */}
        {done.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">เสร็จแล้ว ({done.length})</h2>
            <div className="space-y-2">
              {done.map(d => (
                <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between opacity-70">
                  <div>
                    <p className="text-sm font-medium">{d.customerName ?? '-'}</p>
                    <p className="text-xs text-gray-400">{d.orderNumber ?? '-'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] ?? 'bg-gray-100'}`}>
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
