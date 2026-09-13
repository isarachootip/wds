import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { satangToBaht } from '@/lib/qt-calc'
import { SlipUploadForm } from './SlipUploadForm'

const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'รับ Order แล้ว', credit_hold: 'ตรวจสอบเครดิต', awaiting_payment: 'รอชำระเงิน',
  paid: 'ชำระแล้ว', ready: 'เตรียมสินค้า', delivering: 'กำลังจัดส่ง',
  delivered: 'ส่งมอบแล้ว', closed: 'เสร็จสิ้น', cancelled: 'ยกเลิก'
}
const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: 'รอนัดหมาย', scheduled: 'นัดหมายแล้ว', picking: 'กำลังเตรียมของ',
  shipped: 'อยู่ระหว่างจัดส่ง', delivered: 'ส่งมอบแล้ว', failed: 'ส่งไม่สำเร็จ', returned: 'คืนสินค้า'
}
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'รอตรวจสอบ', verifying: 'กำลังตรวจสอบ', confirmed: 'ยืนยันแล้ว',
  rejected: 'ปฏิเสธ', refunded: 'คืนเงิน'
}

async function fetchOrderByToken(token: string) {
  try {
    const { getOrderByPublicToken } = await import('@/modules/billing/queries')
    return await getOrderByPublicToken(token)
  } catch { return null }
}

type TimelineStep = { label: string; done: boolean; active?: boolean; timestamp?: string }

function buildTimeline(orderStatus: string, payments: any[], deliveries: any[]): TimelineStep[] {
  const statuses = ['new','awaiting_payment','paid','ready','delivering','delivered','closed']
  const currentIdx = statuses.indexOf(orderStatus)
  
  return [
    { label: '📋 รับ Order', done: currentIdx >= 0, active: orderStatus === 'new' },
    { label: '💰 ชำระเงิน', done: currentIdx >= statuses.indexOf('paid'), active: orderStatus === 'awaiting_payment' },
    { label: '📦 เตรียมสินค้า', done: currentIdx >= statuses.indexOf('ready'), active: orderStatus === 'paid' },
    { label: '🚚 จัดส่ง', done: currentIdx >= statuses.indexOf('delivered'), active: orderStatus === 'delivering' },
    { label: '✅ ส่งมอบแล้ว', done: currentIdx >= statuses.indexOf('delivered'), active: orderStatus === 'delivered' },
  ]
}

export default async function PortalOrderTrackingPage({
  params,
}: { params: Promise<{ token: string }> }) {
  noStore()
  const { token } = await params

  const data = await fetchOrderByToken(token)
  if (!data) notFound()  // 404 — don't reveal existence

  const { order, customer, payments: orderPayments, deliveries: orderDeliveries } = data
  const timeline = buildTimeline(order.status, orderPayments, orderDeliveries)
  const confirmedSatang = orderPayments
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amountSatang, 0)
  const remainingSatang = Math.max(0, order.totalSatang - confirmedSatang)
  const showSlipUpload = order.status === 'awaiting_payment'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-5">
        <div className="max-w-lg mx-auto">
          <p className="text-blue-200 text-xs">WDS — ติดตามสถานะ Order</p>
          <h1 className="text-xl font-bold mt-1">{order.number ?? 'SO-...'}</h1>
          <p className="text-blue-200 text-sm mt-0.5">{customer?.name ?? 'ลูกค้า'}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">สถานะปัจจุบัน</p>
          <p className="text-lg font-bold text-gray-900">
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </p>
          <div className="mt-4">
            <p className="text-right text-xl font-bold text-blue-600 mb-1">฿{satangToBaht(order.totalSatang)}</p>
            {confirmedSatang > 0 && <p className="text-right text-sm text-green-600">ชำระแล้ว ฿{satangToBaht(confirmedSatang)}</p>}
            {remainingSatang > 0 && <p className="text-right text-sm text-orange-600">ค้างชำระ ฿{satangToBaht(remainingSatang)}</p>}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">ความคืบหน้า</h3>
          <div className="space-y-3">
            {timeline.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0
                  ${step.done ? 'bg-green-600 text-white' : step.active ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-200 text-gray-400'}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <p className={`text-sm ${step.done ? 'text-gray-900 font-medium' : step.active ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        {orderPayments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">ประวัติการชำระเงิน</h3>
            <div className="space-y-2">
              {orderPayments.map(p => (
                <div key={p.id} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <div>
                    <p className="font-medium">฿{satangToBaht(p.amountSatang)}</p>
                    <p className="text-xs text-gray-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('th-TH') : '-'}</p>
                  </div>
                  <span className={`text-xs ${p.status === 'confirmed' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery status */}
        {orderDeliveries.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">การจัดส่ง</h3>
            {orderDeliveries.map(d => (
              <div key={d.id} className="text-sm">
                <div className="flex justify-between">
                  <span>{d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString('th-TH') : 'ไม่ระบุวัน'}</span>
                  <span className="text-gray-600">{DELIVERY_STATUS_LABELS[d.status] ?? d.status}</span>
                </div>
                {d.receiverName && <p className="text-xs text-gray-400 mt-0.5">ผู้รับ: {d.receiverName}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Slip upload */}
        {showSlipUpload && (
          <SlipUploadForm orderId={order.id} token={token} orderTotalSatang={order.totalSatang} />
        )}

        {/* Contact */}
        <div className="text-center pb-4">
          <p className="text-xs text-gray-400">มีข้อสงสัย? โทร 02-xxx-xxxx หรือ LINE: @WDS</p>
        </div>
      </div>
    </div>
  )
}
