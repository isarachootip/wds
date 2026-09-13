import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { satangToBaht } from '@/lib/qt-calc'
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_COLORS } from '@/modules/ordering/types'

async function fetchQuotations(status?: string) {
  try {
    const { getQuotations } = await import('@/modules/ordering/queries')
    return await getQuotations(status ? { status } : undefined)
  } catch {
    return []
  }
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  noStore()
  const params = await searchParams
  const status = params.status

  const quotations = await fetchQuotations(status)
  const expiringCount = quotations.filter(q => q.expiringWarn).length

  const statuses = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ใบเสนอราคา</h1>
          <p className="text-sm text-gray-500 mt-1">{quotations.length} รายการ</p>
        </div>
        <Link
          href="/wds/quotations/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + สร้างใบเสนอราคา
        </Link>
      </div>

      {/* Expiry warning */}
      {expiringCount > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
          <span className="text-orange-600">⚠️</span>
          <p className="text-sm text-orange-700 font-medium">
            มีใบเสนอราคา {expiringCount} ใบ ที่จะหมดอายุภายใน 3 วัน
          </p>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href="/wds/quotations"
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${!status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
        >
          ทั้งหมด
        </Link>
        {statuses.map(s => (
          <Link
            key={s}
            href={`/wds/quotations?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            {QUOTATION_STATUS_LABELS[s as keyof typeof QUOTATION_STATUS_LABELS] ?? s}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">เลขที่</th>
              <th className="text-left p-4 font-medium text-gray-600">ลูกค้า</th>
              <th className="text-right p-4 font-medium text-gray-600">ยอดรวม</th>
              <th className="text-left p-4 font-medium text-gray-600">สถานะ</th>
              <th className="text-left p-4 font-medium text-gray-600">หมดอายุ</th>
              <th className="text-left p-4 font-medium text-gray-600">วันที่สร้าง</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  ไม่พบใบเสนอราคา
                </td>
              </tr>
            ) : (
              quotations.map(qt => (
                <tr key={qt.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-mono text-blue-600">
                    {qt.number ?? <span className="text-gray-400">DRAFT</span>}
                    {qt.version > 1 && <span className="ml-1 text-xs text-gray-400">v{qt.version}</span>}
                  </td>
                  <td className="p-4">{qt.customerName ?? '-'}</td>
                  <td className="p-4 text-right font-medium">
                    ฿{satangToBaht(qt.totalSatang)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${QUOTATION_STATUS_COLORS[qt.status as keyof typeof QUOTATION_STATUS_COLORS] ?? 'bg-gray-100'}`}>
                      {QUOTATION_STATUS_LABELS[qt.status as keyof typeof QUOTATION_STATUS_LABELS] ?? qt.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {qt.validUntil ? (
                      <span className={qt.expiringWarn ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                        {qt.expiringWarn && '⚠️ '}
                        {new Date(qt.validUntil).toLocaleDateString('th-TH')}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(qt.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link href={`/api/quotations/${qt.id}/pdf`} target="_blank"
                        className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded px-2 py-1">
                        PDF
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
