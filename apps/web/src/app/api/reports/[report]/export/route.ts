import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

type ReportName = 'funnel' | 'channels' | 'technicians' | 'ar-aging'

interface ReportConfig {
  fetchData: () => Promise<Record<string, unknown>[]>
  filename: string
  headers: string[]
  rowMapper: (row: Record<string, unknown>) => (string | number)[]
}

async function getReportConfig(report: string): Promise<ReportConfig | null> {
  const { getFunnelReport, getChannelReport, getTechnicianReport, getArAgingReport } =
    await import('@/modules/reports/queries')

  const satangToBahtNum = (v: unknown) =>
    v !== null && v !== undefined ? Number(v) / 100 : 0

  const configs: Record<string, ReportConfig> = {
    funnel: {
      filename: 'funnel',
      headers: ['ขั้นตอน', 'จำนวน', 'อัตราแปลง (%)', 'เวลาเฉลี่ย (วัน)'],
      fetchData: async () => {
        const data = await getFunnelReport()
        if (!data) return []
        return [
          { step: 'Lead ทั้งหมด', count: data.total_leads, rate: '', avg_days: '' },
          { step: 'Site Visit', count: data.sv_count, rate: data.sv_rate_pct, avg_days: data.sv_avg_days },
          { step: 'Quotation', count: data.qt_count, rate: data.qt_rate_pct, avg_days: data.qt_avg_days },
          { step: 'Order', count: data.order_count, rate: data.order_rate_pct, avg_days: '' },
          { step: 'Paid', count: data.paid_count, rate: data.paid_rate_pct, avg_days: '' },
        ] as Record<string, unknown>[]
      },
      rowMapper: (r) => [String(r.step), Number(r.count), r.rate !== '' ? Number(r.rate) : '', r.avg_days !== '' ? Number(r.avg_days) : ''],
    },
    channels: {
      filename: 'channels',
      headers: ['ช่องทาง', 'Lead', 'ปิดการขาย', 'Win Rate (%)', 'มูลค่าเฉลี่ย (บาท)'],
      fetchData: async () => (await getChannelReport()) as unknown as Record<string, unknown>[],
      rowMapper: (r) => [String(r.source), Number(r.lead_count), Number(r.won_count), Number(r.win_rate_pct), satangToBahtNum(r.avg_order_satang)],
    },
    technicians: {
      filename: 'technicians',
      headers: ['ช่าง', 'งานทั้งหมด', 'เสร็จ', 'ตรงเวลา (%)', 'นอกพื้นที่'],
      fetchData: async () => (await getTechnicianReport()) as unknown as Record<string, unknown>[],
      rowMapper: (r) => [String(r.full_name), Number(r.total_jobs), Number(r.completed_jobs), Number(r.on_time_pct), Number(r.flagged_jobs)],
    },
    'ar-aging': {
      filename: 'ar_aging',
      headers: ['ลูกค้า', '0-30 วัน (บาท)', '31-60 วัน (บาท)', '61-90 วัน (บาท)', '90+ วัน (บาท)', 'รวม (บาท)'],
      fetchData: async () => (await getArAgingReport()) as unknown as Record<string, unknown>[],
      rowMapper: (r) => [
        String(r.customer_name),
        satangToBahtNum(r.bucket_0_30), satangToBahtNum(r.bucket_31_60),
        satangToBahtNum(r.bucket_61_90), satangToBahtNum(r.bucket_90plus),
        satangToBahtNum(r.total_outstanding),
      ],
    },
  }
  return configs[report] ?? null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ report: string }> }
) {
  const { report } = await params
  const format = request.nextUrl.searchParams.get('format') ?? 'csv'

  const config = await getReportConfig(report)
  if (!config) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = await config.fetchData()
  const rows = data.map(config.rowMapper)

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new()
    const wsData = [config.headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${config.filename}_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  }

  // CSV
  const csvRows = [config.headers, ...rows]
    .map(row => row.map(cell => {
      const s = String(cell ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }).join(','))
    .join('\r\n')

  // UTF-8 BOM for Excel Thai display
  const bom = '\uFEFF'
  return new NextResponse(bom + csvRows, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${config.filename}_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
