import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  new: 'ใหม่', contacted: 'ติดต่อแล้ว', qualified: 'ผ่านคุณสมบัติ',
  site_visit_requested: 'ขอสำรวจ', quoted: 'เสนอราคา', won: 'ปิดการขาย', lost: 'สูญเสีย',
}

export default async function Customer360Page({ params }: { params: Promise<{ id: string }> }) {
  noStore()
  const { id } = await params

  let data: any = null
  try {
    const { getCustomer360 } = await import('@/modules/crm/queries')
    data = await getCustomer360(id)
  } catch {}

  if (!data) notFound()

  const { customer, leads, siteVisits } = data
  const creditUsedPct = customer.creditLimitSatang
    ? Math.round((customer.creditUsedSatang / customer.creditLimitSatang) * 100)
    : 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/wds/customers" className="hover:text-blue-600">ลูกค้า</Link>
            <span>/</span>
            <span>{customer.name}</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{customer.name}</h1>
          <p className="text-gray-500 text-sm">{customer.code} · {customer.phone ?? '-'} · {customer.email ?? '-'}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {customer.status === 'active' ? '● ใช้งาน' : '● ปิด'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Leads */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Lead ทั้งหมด</h3>
              <Link href={`/wds/leads?customerId=${customer.id}`} className="text-xs text-blue-600">ดูทั้งหมด →</Link>
            </div>
            {leads.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">ยังไม่มี Lead</p>
            ) : (
              <div className="space-y-2">
                {leads.slice(0, 5).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{l.source}</span>
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">
                        {STATUS_LABELS[l.status] ?? l.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(l.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <Link href={`/wds/leads/${l.id}`} className="text-xs text-blue-600">ดู →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Site Visits */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">การสำรวจหน้างาน</h3>
            {siteVisits.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">ยังไม่มีการสำรวจ</p>
            ) : (
              <div className="space-y-2">
                {siteVisits.slice(0, 5).map((sv: any) => (
                  <div key={sv.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-gray-700">{sv.purpose ?? 'ไม่ระบุ'}</span>
                      <span className="text-gray-400 text-xs ml-2">
                        {new Date(sv.requestedAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      sv.status === 'done' ? 'bg-green-100 text-green-700' :
                      sv.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {sv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Credit */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">เครดิต</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">วงเงิน</span>
                <span className="font-medium">฿{(customer.creditLimitSatang / 100).toLocaleString('th-TH')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ใช้ไป</span>
                <span className="font-medium text-orange-600">฿{(customer.creditUsedSatang / 100).toLocaleString('th-TH')}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${creditUsedPct >= 90 ? 'bg-red-500' : creditUsedPct >= 70 ? 'bg-orange-400' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(creditUsedPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-right">{creditUsedPct}% ใช้แล้ว</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">สถิติ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Lead ทั้งหมด</span>
                <span className="font-medium">{leads.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ปิดการขาย</span>
                <span className="font-medium text-green-600">
                  {leads.filter((l: any) => l.status === 'won').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">สำรวจหน้างาน</span>
                <span className="font-medium">{siteVisits.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
