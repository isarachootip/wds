import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { CustomersHub, type CustomerItem } from './CustomersHub'
import { satangToBaht } from '@/lib/qt-calc'

describe('Customers Master Hub Suite', () => {
  const sampleCustomers: CustomerItem[] = [
    {
      id: 'cus-test-01',
      code: 'CUS-001001',
      name: 'บริษัท พิษณุโลก ดีเวลลอปเมนท์ โฮลดิ้ง จำกัด',
      taxId: '0105558012345',
      phone: '0554567890',
      email: 'purchase@phitsanulok-dev.co.th',
      contactPerson: 'คุณสมชาย ยอดขาย',
      customerGroup: 'developer',
      creditLimitSatang: 50_000_000_00, // 50,000,000 THB
      creditUsedSatang: 12_500_000_00,
      status: 'active',
      createdAt: new Date('2026-09-10T10:00:00Z'),
    },
    {
      id: 'cus-test-02',
      code: 'CUS-001002',
      name: 'ห้างหุ้นส่วนจำกัด เอกชัย วัสดุภัณฑ์และการโยธา',
      taxId: '0103559098765',
      phone: '029123456',
      customerGroup: 'contractor',
      creditLimitSatang: 15_000_000_00, // 15,000,000 THB
      status: 'active',
      createdAt: new Date('2026-09-12T08:00:00Z'),
    },
  ]

  it('renders CustomersHub with header, + เพิ่มลูกค้าใหม่ button, and 4 KPI summary cards', () => {
    const rawHtml = renderToString(<CustomersHub initialCustomers={sampleCustomers} />)
    const html = rawHtml.replace(/<!--.*?-->/g, '')

    // Header & Add Button
    expect(html).toContain('ลูกค้าองค์กร &amp; คู่ค้า (Customer 360°)')
    expect(html).toContain('+ เพิ่มลูกค้าใหม่')
    expect(html).toContain('2 บัญชีทั้งหมด')

    // KPI Cards
    expect(html).toContain('ลูกค้าทั้งหมด')
    expect(html).toContain('ผู้รับเหมา &amp; โครงการ')
    expect(html).toContain('วงเงินเครดิตอนุมัติรวม')

    // Formatted monetary total (65,000,000 THB)
    expect(html).toContain(`฿${satangToBaht(65_000_000_00)}`)
  })

  it('renders customer list table with high contrast company names and tax id badges', () => {
    const rawHtml = renderToString(<CustomersHub initialCustomers={sampleCustomers} />)
    const html = rawHtml.replace(/<!--.*?-->/g, '')

    expect(html).toContain('บริษัท พิษณุโลก ดีเวลลอปเมนท์ โฮลดิ้ง จำกัด')
    expect(html).toContain('Tax ID: 0105558012345')
    expect(html).toContain('CUS-001001')
    expect(html).toContain('ผู้พัฒนาอสังหาฯ (Developer)')
    expect(html).toContain('ห้างหุ้นส่วนจำกัด เอกชัย วัสดุภัณฑ์และการโยธา')
    expect(html).toContain('ผู้รับเหมา (Contractor)')
  })

  it('renders empty state when there are 0 customers', () => {
    const rawHtml = renderToString(<CustomersHub initialCustomers={[]} />)
    const html = rawHtml.replace(/<!--.*?-->/g, '')

    expect(html).toContain('ยังไม่มีข้อมูลลูกค้าในระบบ')
    expect(html).toContain('+ เพิ่มลูกค้าใหม่รายแรก')
  })
})
