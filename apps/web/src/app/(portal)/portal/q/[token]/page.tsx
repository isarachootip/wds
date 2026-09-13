import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { satangToBaht } from '@/lib/qt-calc'
import { AcceptFlow } from './AcceptFlow'
import { RejectForm } from './RejectForm'

export default async function QuotationPublicPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  noStore()
  const { token } = await params

  // Fetch QT by token
  let data: any = null
  try {
    const { getQuotationByToken } = await import('@/modules/ordering/queries')
    data = await getQuotationByToken(token)
  } catch {}

  // Token not found → 404 (do NOT reveal why — prevents enumeration)
  if (!data) notFound()

  const { quotation: qt, items } = data

  // Track view event (fire-and-forget)
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? 'unknown'
  const ua = headersList.get('user-agent') ?? ''

  if (qt.status === 'sent') {
    try {
      const { openQuotationByTokenAction } = await import('@/modules/ordering/actions')
      await openQuotationByTokenAction(qt.id, ip, ua)
    } catch {}
  }

  const isExpired = qt.status === 'expired' ||
    (qt.validUntil && new Date(qt.validUntil) < new Date())
  const isDecided = qt.status === 'accepted' || qt.status === 'rejected'
  const isActive = !isExpired && !isDecided

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-blue-600 font-bold text-lg">WDS</span>
            <span className="text-gray-400 text-sm ml-2">ใบเสนอราคา</span>
          </div>
          <Link
            href={`/api/quotations/${qt.id}/pdf`}
            target="_blank"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            📥 ดาวน์โหลด PDF
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Status banner */}
        {isExpired && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-orange-700 font-semibold text-lg">⏱️ ใบเสนอราคาหมดอายุแล้ว</p>
            <p className="text-orange-600 text-sm mt-1">กรุณาติดต่อเจ้าหน้าที่เพื่อขอใบใหม่</p>
          </div>
        )}
        {qt.status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-semibold text-lg">✅ ยืนยันการสั่งซื้อแล้ว</p>
            <p className="text-green-600 text-sm mt-1">ขอบคุณที่ไว้วางใจ WDS</p>
          </div>
        )}
        {qt.status === 'rejected' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-gray-600 font-semibold">ปฏิเสธใบเสนอราคาแล้ว</p>
          </div>
        )}

        {/* QT details card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* QT header */}
          <div className="bg-blue-600 text-white px-5 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-xs">ใบเสนอราคา</p>
                <p className="text-xl font-bold mt-0.5">{qt.number ?? 'DRAFT'}</p>
              </div>
              <div className="text-right">
                {qt.validUntil && (
                  <p className="text-blue-200 text-xs">ใช้ได้ถึง</p>
                )}
                {qt.validUntil && (
                  <p className="text-sm mt-0.5">
                    {new Date(qt.validUntil).toLocaleDateString('th-TH', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-500">
              <p className="text-blue-200 text-xs">เรียน</p>
              <p className="font-medium">{qt.customerName ?? 'ลูกค้า'}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="divide-y divide-gray-50">
            {items.map((item: any, i: number) => (
              <div key={item.id} className="px-5 py-3">
                <div className="flex justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-800">{i + 1}. {item.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.qty} {item.unit ?? 'ชิ้น'} × ฿{satangToBaht(item.unitPriceSatang)}
                      {item.discountSatang > 0 && ` - ส่วนลด ฿${satangToBaht(item.discountSatang)}`}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">฿{satangToBaht(item.amountSatang)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>ราคารวม</span>
              <span>฿{satangToBaht(qt.subtotalSatang)}</span>
            </div>
            {qt.billDiscountSatang > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>ส่วนลดท้ายบิล</span>
                <span>-฿{satangToBaht(qt.billDiscountSatang)}</span>
              </div>
            )}
            {qt.vatRate > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT {qt.vatRate}% ({qt.vatMode === 'inclusive' ? 'รวมใน' : 'แยกนอก'})</span>
                <span>฿{satangToBaht(qt.vatAmountSatang)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
              <span>ยอดรวมสุทธิ</span>
              <span className="text-blue-600">฿{satangToBaht(qt.totalSatang)}</span>
            </div>
          </div>

          {/* Terms */}
          {qt.terms && (
            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">เงื่อนไข</p>
              <p className="text-xs text-gray-600">{qt.terms}</p>
            </div>
          )}
        </div>

        {/* Accept / Reject — only when active */}
        {isActive && (
          <div className="space-y-3">
            <AcceptFlow
              quotationId={qt.id}
              customerPhone={qt.customerPhone}
              totalSatang={qt.totalSatang}
            />
            <RejectForm quotationId={qt.id} />
          </div>
        )}
      </div>
    </div>
  )
}
