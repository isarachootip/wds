import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { satangToBaht } from '@/lib/qt-calc'
import { PaymentActions } from './PaymentActions'

async function fetchPendingPayments() {
  try {
    const { getPendingPayments } = await import('@/modules/billing/queries')
    return await getPendingPayments()
  } catch { return [] }
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'เงินสด', transfer: 'โอนเงิน', credit: 'เครดิต', card: 'บัตร', cod: 'COD'
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  verifying: 'bg-yellow-100 text-yellow-700',
}

export default async function PaymentsPage() {
  noStore()
  const pendingList = await fetchPendingPayments()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ยืนยันการชำระเงิน</h1>
          <p className="text-sm text-gray-500 mt-1">{pendingList.length} รายการรอตรวจสอบ</p>
        </div>
      </div>

      {pendingList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-green-600 font-medium">✅ ไม่มีรายการรอยืนยัน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingList.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/wds/orders/${p.orderId}`} className="font-mono text-blue-600 text-sm hover:underline">
                      {p.orderNumber ?? p.orderId.slice(0, 8)}
                    </Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100'}`}>
                      {p.status === 'verifying' ? '🔍 รอตรวจสอบ' : '⏳ รอ'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{p.customerName ?? '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">฿{satangToBaht(p.amountSatang)}</p>
                  <p className="text-xs text-gray-500">{METHOD_LABELS[p.method ?? ''] ?? p.method}</p>
                </div>
              </div>

              {p.slipPath && (
                <div className="mb-3">
                  <a href={p.slipPath} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline">📎 ดูสลิป</a>
                </div>
              )}

              <PaymentActions paymentId={p.id} orderId={p.orderId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
