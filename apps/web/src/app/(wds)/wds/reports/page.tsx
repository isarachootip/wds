import Link from 'next/link'

const REPORTS = [
  { href: '/wds/reports/funnel', icon: '📊', title: 'Conversion Funnel', desc: 'อัตราแปลง Lead → ชำระเงิน และเวลาเฉลี่ยแต่ละขั้น' },
  { href: '/wds/reports/channels', icon: '📡', title: 'รายงานช่องทาง', desc: 'Lead / Win Rate / มูลค่าเฉลี่ย แยกตาม LINE / โทร / หน้าร้าน' },
  { href: '/wds/reports/technicians', icon: '🔧', title: 'ผลงานช่าง', desc: 'งานต่อวัน, ตรงเวลา %, check-in นอกพื้นที่' },
  { href: '/wds/reports/ar-aging', icon: '💳', title: 'ลูกหนี้คงค้าง', desc: 'แยกอายุหนี้ 0-30 / 31-60 / 61-90 / 90+ วัน + export' },
]

export default function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">รายงาน</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <Link key={r.href} href={r.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
            <div className="flex items-start gap-4">
              <span className="text-3xl">{r.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{r.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
