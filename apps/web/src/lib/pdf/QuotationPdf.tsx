import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register Sarabun Thai font from Google Fonts CDN
Font.register({
  family: 'Sarabun',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/sarabun/v15/DtVmJx26TKEr37c9YKZ5ikQ.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/sarabun/v15/DtVhJx26TKEr37c9aBBJn1I.ttf',
      fontWeight: 'bold',
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 16,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  companyInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
  },
  qtTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  qtNumber: {
    fontSize: 12,
    color: '#2563eb',
    textAlign: 'right',
    marginTop: 2,
  },
  qtMeta: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 2,
  },
  customerSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  customerLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  colNo: { width: '6%' },
  colDesc: { width: '44%' },
  colQty: { width: '8%', textAlign: 'right' },
  colUnit: { width: '8%', textAlign: 'center' },
  colPrice: { width: '14%', textAlign: 'right' },
  colDiscount: { width: '8%', textAlign: 'right' },
  colAmount: { width: '12%', textAlign: 'right' },
  totalsSection: {
    marginLeft: 'auto',
    width: 220,
    marginBottom: 20,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 9,
  },
  totalsRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  terms: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8fafc',
    fontSize: 8,
    color: '#6b7280',
    borderRadius: 4,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#9ca3af',
    paddingTop: 4,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
  },
})

type QuotationItem = {
  id: string
  description: string
  qty: number
  unit: string | null
  unitPriceSatang: number
  discountSatang: number
  amountSatang: number
}

type QuotationPdfProps = {
  number: string
  customerName?: string | null
  createdAt: Date
  validUntil?: Date | null
  items: QuotationItem[]
  subtotalSatang: number
  billDiscountSatang: number
  vatRate: number
  vatMode: 'exclusive' | 'inclusive'
  vatAmountSatang: number
  totalSatang: number
  terms?: string | null
  note?: string | null
}

function fmt(satang: number): string {
  return (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2 })
}

export function QuotationPdf(props: QuotationPdfProps) {
  const {
    number, customerName, createdAt, validUntil,
    items, subtotalSatang, billDiscountSatang, vatRate, vatMode,
    vatAmountSatang, totalSatang, terms, note,
  } = props

  const createdStr = createdAt.toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok'
  })
  const validStr = validUntil
    ? validUntil.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' })
    : '-'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>WDS บริษัท</Text>
            <Text style={styles.companyInfo}>123 ถนนตัวอย่าง กรุงเทพมหานคร 10110</Text>
            <Text style={styles.companyInfo}>โทร: 02-xxx-xxxx | อีเมล: info@wds.co.th</Text>
            <Text style={styles.companyInfo}>เลขที่ผู้เสียภาษี: 0-0000-00000-00-0</Text>
          </View>
          <View>
            <Text style={styles.qtTitle}>ใบเสนอราคา</Text>
            <Text style={styles.qtNumber}>{number}</Text>
            <Text style={styles.qtMeta}>วันที่: {createdStr}</Text>
            <Text style={styles.qtMeta}>ใช้ได้ถึง: {validStr}</Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.customerSection}>
          <Text style={styles.customerLabel}>ลูกค้า / Customer</Text>
          <Text style={styles.customerName}>{customerName ?? 'ไม่ระบุ'}</Text>
        </View>

        {/* Note */}
        {note && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 9, color: '#374151' }}>{note}</Text>
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>#</Text>
            <Text style={styles.colDesc}>รายการ</Text>
            <Text style={styles.colQty}>จำนวน</Text>
            <Text style={styles.colUnit}>หน่วย</Text>
            <Text style={styles.colPrice}>ราคา/หน่วย</Text>
            <Text style={styles.colDiscount}>ส่วนลด</Text>
            <Text style={styles.colAmount}>จำนวนเงิน</Text>
          </View>

          {/* Data rows */}
          {items.map((item, i) => (
            <View key={item.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.colNo}>{i + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colUnit}>{item.unit ?? 'ชิ้น'}</Text>
              <Text style={styles.colPrice}>{fmt(item.unitPriceSatang)}</Text>
              <Text style={styles.colDiscount}>{item.discountSatang > 0 ? fmt(item.discountSatang) : '-'}</Text>
              <Text style={styles.colAmount}>{fmt(item.amountSatang)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text>ราคารวม</Text>
            <Text>{fmt(subtotalSatang)}</Text>
          </View>
          {billDiscountSatang > 0 && (
            <View style={styles.totalsRow}>
              <Text>ส่วนลดท้ายบิล</Text>
              <Text>({fmt(billDiscountSatang)})</Text>
            </View>
          )}
          {vatRate > 0 && (
            <View style={styles.totalsRow}>
              <Text>ภาษีมูลค่าเพิ่ม {vatRate}% ({vatMode === 'inclusive' ? 'รวมใน' : 'แยกนอก'})</Text>
              <Text>{fmt(vatAmountSatang)}</Text>
            </View>
          )}
          <View style={styles.totalsRowBold}>
            <Text>ยอดรวมสุทธิ (บาท)</Text>
            <Text>{fmt(totalSatang)}</Text>
          </View>
        </View>

        {/* Terms */}
        {terms && (
          <View style={styles.terms}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>เงื่อนไขและข้อกำหนด</Text>
            <Text>{terms}</Text>
          </View>
        )}

        {/* Signature lines */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>ผู้รับใบเสนอราคา</Text>
            <Text style={{ marginTop: 2 }}>วันที่ ......................</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>ผู้มีอำนาจลงนาม</Text>
            <Text style={{ marginTop: 2 }}>WDS บริษัท</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) =>
          `หน้า ${pageNumber} / ${totalPages} — ${number}`
        } fixed />
      </Page>
    </Document>
  )
}
