import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { satangToBaht } from '@/lib/qt-calc'
import { OrderActions } from './OrderActions'

// Import remainingBalanceSatang from billing/credit, not qt-calc
// (define a simple local one here to avoid cross-module issues)
function remaining(total: number, confirmed: number): number {
  return Math.max(0, total - confirmed)
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'เงินสด', transfer: 'โอนเงิน', credit: 'เครดิต', card: 'บัตรเครดิต', cod: 'COD'
}
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: '⏳ รอ', verifying: '🔍 ตรวจสอบ', confirmed: '✅ ยืนยัน', rejected: '❌ ปฏิเสธ', refunded: '↩ คืนเงิน'
}
const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: 'รอ', scheduled: '📅 นัดหมาย', picking: '📦 เตรียม', shipped: '🚚 ส่งแล้ว',
  delivered: '✅ ส่งมอบ', failed: '❌ ส่งไม่สำเร็จ', returned: '↩ คืน'
}
const CREDIT_DECISION_LABELS: Record<string, string> = {
  pass: '✅ ผ่าน', hold: '⚠️ Hold', reject: '🔴 Reject'
}

async function fetchOrder(id: string) {
  try {
    const { getOrderById } = await import('@/modules/billing/queries')
    return await getOrderById(id)
  } catch { return null }
}

export default async function OrderDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params
  const data = await fetchOrder(id)
  if (!data) notFound()

  const { order, customer, quotation, payments: orderPayments, deliveries: orderDeliveries, creditChecks: orderCreditChecks, confirmedSatang } = data
  const remainingSatang = remaining(order.totalSatang, confirmedSatang)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/wds/orders" className="text-sm text-gray-500 hover:text-gray-700">← Orders</Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{order.number ?? 'SO-...'}</h1>
          <p className="text-sm text-gray-500 mt-1">{customer?.name ?? 'ไม่ระบุลูกค้า'}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">฿{satangToBaht(order.totalSatang)}</p>
          {confirmedSatang > 0 && remainingSatang > 0 && (
            <p className="text-sm text-orange-600 mt-0.5">ค้างชำระ ฿{satangToBaht(remainingSatang)}</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">

        {/* Step 1: QT */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">1</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">ใบเสนอราคา</p>
              <p className="text-xs text-gray-500">{quotation?.number ?? '-'}</p>
            </div>
            <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('th-TH')}</span>
          </div>
        </div>

        {/* Step 2: Credit Check */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-sm shrink-0">2</div>
            <p className="font-medium text-gray-900">ตรวจสอบเครดิต</p>
          </div>
          {orderCreditChecks.length === 0 ? (
            <p className="text-xs text-gray-400 ml-11">ยังไม่มีการตรวจสอบ</p>
          ) : (
            <div className="ml-11 space-y-2">
              {orderCreditChecks.map(cc => (
                <div key={cc.id} className="flex items-start justify-between text-sm">
                  <div>
                    <span className={`text-xs font-medium ${cc.decision === 'pass' ? 'text-green-700' : cc.decision === 'reject' ? 'text-red-700' : 'text-orange-700'}`}>
                      {CREDIT_DECISION_LABELS[cc.decision] ?? cc.decision}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{cc.reason}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-3">
                    {cc.auto ? '🤖 auto' : '👤 manual'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Payments */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm shrink-0">3</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">การชำระเงิน</p>
              {confirmedSatang > 0 && (
                <p className="text-xs text-green-600">ชำระแล้ว ฿{satangToBaht(confirmedSatang)} / ฿{satangToBaht(order.totalSatang)}</p>
              )}
            </div>
            <Link href="/wds/payments" className="text-xs text-blue-600 hover:underline">จัดการ →</Link>
          </div>
          {orderPayments.length === 0 ? (
            <p className="text-xs text-gray-400 ml-11">ยังไม่มีรายการ</p>
          ) : (
            <div className="ml-11 space-y-2">
              {orderPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{PAYMENT_METHOD_LABELS[p.method ?? ''] ?? p.method}</span>
                    {p.refNo && <span className="text-gray-400 ml-1 text-xs">{p.refNo}</span>}
                    {p.rejectReason && <p className="text-xs text-red-500">{p.rejectReason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">฿{satangToBaht(p.amountSatang)}</span>
                    <span className="text-xs text-gray-500">{PAYMENT_STATUS_LABELS[p.status] ?? p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Delivery */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">4</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">การจัดส่ง</p>
            </div>
            <Link href="/wds/deliveries" className="text-xs text-blue-600 hover:underline">จัดการ →</Link>
          </div>
          {orderDeliveries.length === 0 ? (
            <p className="text-xs text-gray-400 ml-11">ยังไม่มีรายการ</p>
          ) : (
            <div className="ml-11 space-y-2">
              {orderDeliveries.map(d => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span>{d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString('th-TH') : 'ไม่ระบุวัน'}</span>
                    {(d.attempt ?? 0) > 0 && <span className="ml-1 text-xs text-orange-600">พยายาม {d.attempt} ครั้ง</span>}
                  </div>
                  <span className="text-xs text-gray-500">{DELIVERY_STATUS_LABELS[d.status] ?? d.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <OrderActions
          orderId={order.id}
          orderStatus={order.status}
          confirmedSatang={confirmedSatang}
          orderTotalSatang={order.totalSatang}
        />
      </div>
    </div>
  )
}
