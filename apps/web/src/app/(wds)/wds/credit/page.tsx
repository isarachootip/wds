import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { satangToBaht } from '@/lib/qt-calc'
import { CreditApproveButton } from './CreditApproveButton'

async function fetchHoldOrders() {
  try {
    const { getCreditHoldOrders } = await import('@/modules/billing/queries')
    return await getCreditHoldOrders()
  } catch { return [] }
}

export default async function CreditPage() {
  noStore()
  const holdOrders = await fetchHoldOrders()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">อนุมัติเครดิต</h1>
          <p className="text-sm text-gray-500 mt-1">{holdOrders.length} รายการรออนุมัติ</p>
        </div>
      </div>

      {holdOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-green-600 font-medium">✅ ไม่มีรายการรออนุมัติ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {holdOrders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-red-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/wds/orders/${o.id}`}
                      className="font-mono text-blue-600 hover:underline text-sm">{o.number ?? '-'}</Link>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">🔴 Hold</span>
                  </div>
                  <p className="text-sm font-medium">{o.customerName ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(o.createdAt).toLocaleDateString('th-TH')}</p>
                </div>
                <p className="text-xl font-bold text-gray-900">฿{satangToBaht(o.totalSatang)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-red-700 font-medium">เหตุผลที่ hold:</p>
                <p className="text-sm text-red-800 mt-0.5">{o.holdReason}</p>
              </div>
              <CreditApproveButton orderId={o.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
