import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-yellow-100 text-yellow-700',
  site_visit_requested: 'bg-purple-100 text-purple-700',
  quoted: 'bg-orange-100 text-orange-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'ใหม่',
  contacted: 'ติดต่อแล้ว',
  qualified: 'คุณสมบัติผ่าน',
  site_visit_requested: 'ขอสำรวจหน้างาน',
  quoted: 'เสนอราคาแล้ว',
  won: 'ปิดการขาย',
  lost: 'สูญเสีย',
}

const SOURCE_LABELS: Record<string, string> = {
  line: 'LINE',
  phone: 'โทรศัพท์',
  store: 'หน้าร้าน',
  other: 'อื่นๆ',
}

type Lead = {
  id: string
  status: string
  source: string
  channelRef: string | null
  customerName: string | null
  customerPhone: string | null
  createdAt: Date
  updatedAt: Date
  score: number | null
}

async function fetchLeads(searchParams: Record<string, string>): Promise<Lead[]> {
  try {
    const { getLeads } = await import('@/modules/crm/queries')
    return await getLeads({
      status: searchParams.status,
      source: searchParams.source,
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      pageSize: 20,
    }) as Lead[]
  } catch {
    return []
  }
}

function isStale(updatedAt: Date): boolean {
  return Date.now() - new Date(updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  noStore()
  const params = await searchParams
  const leads = await fetchLeads(params)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">รายการ Lead</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการและติดตาม Lead ทั้งหมด</p>
        </div>
        <Link
          href="/wds/leads/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + บันทึก Lead ใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        {['all', 'new', 'contacted', 'qualified', 'site_visit_requested', 'quoted', 'won', 'lost'].map(s => (
          <Link
            key={s}
            href={s === 'all' ? '/wds/leads' : `/wds/leads?status=${s}`}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              (params.status === s || (!params.status && s === 'all'))
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {s === 'all' ? 'ทั้งหมด' : STATUS_LABELS[s] ?? s}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ลูกค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ช่องทาง</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">สถานะ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">อัปเดตล่าสุด</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  ไม่มีข้อมูล Lead
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {lead.customerName ?? '(ยังไม่ระบุลูกค้า)'}
                    </div>
                    {lead.customerPhone && (
                      <div className="text-gray-500 text-xs">{lead.customerPhone}</div>
                    )}
                    {lead.channelRef && (
                      <div className="text-gray-400 text-xs">{lead.channelRef}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                      {SOURCE_LABELS[lead.source] ?? lead.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[lead.status] ?? lead.status}
                      </span>
                      {isStale(lead.updatedAt) && lead.status !== 'won' && lead.status !== 'lost' && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">⏰ ค้างนาน</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(lead.updatedAt).toLocaleDateString('th-TH', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/wds/leads/${lead.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      ดูรายละเอียด →
                    </Link>
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
