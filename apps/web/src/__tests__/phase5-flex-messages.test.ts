import { describe, it, expect } from 'vitest'
import {
  quotationFlex,
  appointmentReminderFlex,
  technicianArrivedFlex,
  jobCompletedFlex,
  paymentConfirmedFlex,
  deliveryDispatchedFlex,
  deliveryCompletedFlex,
} from '@/lib/line'

describe('Phase 5 Acceptance Criteria 3: LINE Flex Message Templates (Thai Language & Mobile Schema)', () => {
  it('1. Generates quotationFlex with valid bubble container and Thai labels', () => {
    const flex = quotationFlex({
      qtNumber: 'QT-202609-0001',
      customerName: 'สมศรี มีสุข',
      totalBaht: '45,200.00',
      validUntil: '15 ตุลาคม 2569',
      publicUrl: 'https://wds.co.th/portal/q/token-123',
    }) as any

    expect(flex.type).toBe('flex')
    expect(flex.altText).toContain('QT-202609-0001')
    expect(flex.contents.type).toBe('bubble')

    // Header Thai text
    expect(flex.contents.header.contents[0].text).toContain('ใบเสนอราคา')

    // Body contains customer, total in baht, and validUntil
    const bodyTexts = flex.contents.body.contents.map((c: any) => c.text)
    expect(bodyTexts.some((t: string) => t.includes('สมศรี มีสุข'))).toBe(true)
    expect(bodyTexts.some((t: string) => t.includes('45,200.00'))).toBe(true)
    expect(bodyTexts.some((t: string) => t.includes('15 ตุลาคม 2569'))).toBe(true)

    // Action button
    expect(flex.contents.footer.contents[0].action.uri).toBe('https://wds.co.th/portal/q/token-123')
  })

  it('2. Generates appointmentReminderFlex with 1-day advance warning format', () => {
    const flex = appointmentReminderFlex({
      customerName: 'กิตติศักดิ์ เจริญพร',
      scheduledDate: '15 ก.ย. 2569 เวลา 09:00 - 12:00 น.',
      address: '99/12 หมู่ 4 ต.บางกร่าง อ.เมือง จ.นนทบุรี',
    }) as any

    expect(flex.type).toBe('flex')
    expect(flex.altText).toContain('แจ้งเตือนนัดหมาย')
    expect(flex.contents.header.contents[0].text).toContain('นัดหมายพรุ่งนี้')

    const bodyTexts = flex.contents.body.contents.map((c: any) => c.text)
    expect(bodyTexts.some((t: string) => t.includes('กิตติศักดิ์'))).toBe(true)
    expect(bodyTexts.some((t: string) => t.includes('นนทบุรี'))).toBe(true)
  })

  it('3. Generates technicianArrivedFlex for technician on-site status', () => {
    const flex = technicianArrivedFlex({
      customerName: 'ประภาส แสนสุข',
      techName: 'ช่างเอกชัย',
      arrivedAt: '10:15 น.',
    }) as any

    expect(flex.altText).toBe('ช่างถึงหน้างานแล้ว')
    expect(flex.contents.header.contents[0].text).toContain('ช่างถึงหน้างานแล้ว')
  })

  it('4. Generates jobCompletedFlex with work summary', () => {
    const flex = jobCompletedFlex({
      customerName: 'อนันต์ ชัยวัฒน์',
      jobSummary: 'ติดตั้งโครงสร้างเหล็กและหลังคาเมทัลชีทเรียบร้อย ลูกค้าตรวจรับงาน',
      completedAt: '16:45 น.',
    }) as any

    expect(flex.altText).toBe('งานเสร็จเรียบร้อย')
    expect(flex.contents.body.contents[1].text).toContain('ติดตั้งโครงสร้างเหล็ก')
  })

  it('5. Generates paymentConfirmedFlex with exact Baht amount', () => {
    const flex = paymentConfirmedFlex({
      customerName: 'พรทิพย์ สดใส',
      amountBaht: '12,500.00',
      orderNumber: 'SO-202609-0012',
    }) as any

    expect(flex.altText).toContain('12,500.00')
    expect(flex.contents.header.contents[0].text).toContain('ยืนยันรับชำระเงิน')
  })

  it('6. Generates deliveryDispatchedFlex with tracking URL and deliveryCompletedFlex with receiver name', () => {
    const dispatched = deliveryDispatchedFlex({
      customerName: 'ธวัชชัย รุ่งเรือง',
      orderNumber: 'SO-202609-0088',
      trackingNo: 'TH12345678',
      estimatedDate: '16 ก.ย. 2569',
      trackingUrl: 'https://wds.co.th/portal/orders/token-xyz',
    }) as any

    expect(dispatched.altText).toBe('สินค้าออกจัดส่งแล้ว')
    expect(dispatched.contents.footer.contents[0].action.uri).toBe('https://wds.co.th/portal/orders/token-xyz')

    const completed = deliveryCompletedFlex({
      customerName: 'ธวัชชัย รุ่งเรือง',
      orderNumber: 'SO-202609-0088',
      receiverName: 'คุณธวัชชัย (รับด้วยตนเอง)',
      deliveredAt: '14:20 น.',
    }) as any

    expect(completed.altText).toBe('ส่งสินค้าสำเร็จ')
    expect(completed.contents.body.contents[2].text).toContain('คุณธวัชชัย')
  })
})
