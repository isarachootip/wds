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

  const {
    customer,
    leads = [],
    siteVisits = [],
    addresses = [],
    orders = [],
    totalPurchasedSatang = 0,
  } = data
  const creditUsedPct = customer.creditLimitSatang
    ? Math.round((customer.creditUsedSatang / customer.creditLimitSatang) * 100)
    : 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
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
          {/* Site Addresses (หน้างาน) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">📍 ที่อยู่หน้างานติดตั้ง ({addresses.length})</h3>
            </div>
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">ยังไม่มีที่อยู่หน้างานที่บันทึกไว้</p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr: any) => (
                  <div key={addr.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{addr.label ?? 'หน้างาน'}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">หลัก</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-xs mt-1">
                        {addr.fullAddress} {addr.subdistrict} {addr.district} {addr.province} {addr.postalCode}
                      </p>
                    </div>
                    {addr.lat && addr.lng ? (
                      <a
                        href={`https://www.google.com/maps?q=${addr.lat},${addr.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline shrink-0 ml-4 flex items-center gap-1 font-medium"
                      >
                        พิกัดแผนที่ ↗
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leads */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">ประวัติ Lead ทั้งหมด ({leads.length})</h3>
              <Link href={`/wds/leads?customerId=${customer.id}`} className="text-xs text-blue-600 font-medium">ดูทั้งหมด →</Link>
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
                      <Link href={`/wds/leads/${l.id}`} className="text-xs text-blue-600 font-medium">ดู →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Site Visits */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ประวัติการสำรวจหน้างาน ({siteVisits.length})</h3>
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

          {/* Orders / Purchase History */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ประวัติการสั่งซื้อและติดตั้ง ({orders.length})</h3>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">ยังไม่มีประวัติการสั่งซื้อ</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((ord: any) => (
                  <div key={ord.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-gray-800">{ord.number ?? ord.id.slice(0, 8)}</span>
                      <span className="text-gray-400 text-xs ml-2">
                        {new Date(ord.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">
                        ฿{((ord.totalSatang || 0) / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Accumulated Purchase Volume */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">ยอดซื้อสะสม (LTV)</h3>
            <p className="text-2xl font-bold text-gray-900">
              ฿{(totalPurchasedSatang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400 mt-1">คำนวณจากยอดคำสั่งซื้อทั้งหมดของลูกค้า</p>
          </div>

          {/* Credit */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">เครดิต</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">วงเงิน</span>
                <span className="font-medium">฿{((customer.creditLimitSatang || 0) / 100).toLocaleString('th-TH')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ใช้ไป</span>
                <span className="font-medium text-orange-600">฿{((customer.creditUsedSatang || 0) / 100).toLocaleString('th-TH')}</span>
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
              <div className="flex justify-between">
                <span className="text-gray-500">ที่อยู่หน้างาน</span>
                <span className="font-medium">{addresses.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
