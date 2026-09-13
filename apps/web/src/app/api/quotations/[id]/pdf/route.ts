import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { QuotationPdf } from '@/lib/pdf/QuotationPdf'
import { getQuotationById } from '@/modules/ordering/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const data = await getQuotationById(id)
  if (!data) {
    return new Response('ไม่พบใบเสนอราคา', { status: 404 })
  }

  const { quotation, customer, items } = data

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(QuotationPdf, {
      number: quotation.number ?? 'DRAFT',
      customerName: customer?.name,
      createdAt: new Date(quotation.createdAt),
      validUntil: quotation.validUntil ? new Date(quotation.validUntil) : null,
      items: items.map(i => ({
        id: i.id,
        description: i.description,
        qty: i.qty,
        unit: i.unit,
        unitPriceSatang: i.unitPriceSatang,
        discountSatang: i.discountSatang,
        amountSatang: i.amountSatang,
      })),
      subtotalSatang: quotation.subtotalSatang,
      billDiscountSatang: quotation.billDiscountSatang,
      vatRate: quotation.vatRate,
      vatMode: quotation.vatMode as 'exclusive' | 'inclusive',
      vatAmountSatang: quotation.vatAmountSatang,
      totalSatang: quotation.totalSatang,
      terms: quotation.terms,
      note: quotation.note,
    }) as any  // @react-pdf/renderer expects DocumentProps — QuotationPdf wraps Document

    const pdfBuffer = await renderToBuffer(element)

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${quotation.number ?? 'quotation'}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return new Response('ไม่สามารถสร้าง PDF ได้', { status: 500 })
  }
}
