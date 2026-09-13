import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'

export default async function CustomersPage() {
  noStore()

  let customers: any[] = []
  try {
    const { getDb } = await import('@/lib/db')
    const { customers: customersTable } = await import('@wds/db')
    const { isNull, desc } = await import('drizzle-orm')
    const db = getDb()
    customers = await db.select().from(customersTable)
      .where(isNull(customersTable.deletedAt))
      .orderBy(desc(customersTable.createdAt))
      .limit(50)
  } catch {}

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ลูกค้า</h1>
          <p className="text-sm text-gray-500 mt-1">รายชื่อลูกค้าทั้งหมด</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">โทรศัพท์</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">กลุ่มลูกค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">เครดิต</th>
              <th className="text-right px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">ยังไม่มีข้อมูลลูกค้า</td>
              </tr>
            ) : customers.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{c.code}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{c.customerGroup}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.creditLimitSatang ? `฿${(c.creditLimitSatang / 100).toLocaleString('th-TH')}` : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/wds/customers/${c.id}`} className="text-blue-600 hover:text-blue-800 text-xs">
                    ดู 360° →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
