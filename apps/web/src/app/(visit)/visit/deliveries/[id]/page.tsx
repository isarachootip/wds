import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { DeliveryActions } from './DeliveryActions'

async function fetchDelivery(id: string) {
  try {
    const { getDeliveryById } = await import('@/modules/billing/queries')
    return await getDeliveryById(id)
  } catch { return null }
}

export default async function VisitDeliveryDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params
  const data = await fetchDelivery(id)
  if (!data) notFound()

  const { delivery, order, customer, items } = data

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <p className="text-xs text-gray-500 mb-1">งานจัดส่ง</p>
        <h1 className="text-lg font-bold text-gray-900">{customer?.name ?? 'ลูกค้า'}</h1>
        <p className="text-sm text-gray-500">{order?.number ?? '-'}</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">รายการสินค้า</h3>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-700">{item.description}</span>
                  <span className="text-gray-500">{item.qtyOrdered} ชิ้น</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลการส่ง</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">วันที่นัด</span>
              <span>{delivery.scheduledDate ? new Date(delivery.scheduledDate).toLocaleDateString('th-TH') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">พยายามส่ง</span>
              <span className={delivery.attempt > 0 ? 'text-orange-600 font-medium' : 'text-gray-700'}>
                {delivery.attempt} ครั้ง
              </span>
            </div>
            {delivery.vehicle && (
              <div className="flex justify-between">
                <span className="text-gray-500">ยานพาหนะ</span>
                <span>{delivery.vehicle}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <DeliveryActions
          deliveryId={delivery.id}
          orderId={delivery.orderId}
          currentStatus={delivery.status}
          attempt={delivery.attempt ?? 0}
        />
      </div>
    </div>
  )
}
