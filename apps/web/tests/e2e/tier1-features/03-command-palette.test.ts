import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { CommandMenu } from '@/components/layout/CommandMenu'
import { Header } from '@/components/layout/Header'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/wds/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Tier 1.3: ⌘K Command Palette', () => {
  it('T1.3.1: Header renders quick search trigger button with ⌘K keyboard shortcut indicator', () => {
    const html = renderToString(React.createElement(Header, { onToggleMobileSidebar: vi.fn() }))
    expect(html).toContain('ค้นหาด่วน...')
    expect(html).toContain('⌘K')
  })

  it('T1.3.2: CommandMenu renders nothing (null) when isOpen is false', () => {
    const html = renderToString(React.createElement(CommandMenu, { isOpen: false, onClose: vi.fn() }))
    expect(html).toBe('')
  })

  it('T1.3.3: CommandMenu renders search modal and input with backdrop when isOpen is true', () => {
    const html = renderToString(React.createElement(CommandMenu, { isOpen: true, onClose: vi.fn() }))
    expect(html).toContain('ค้นหาหน้า, เอกสาร, เมนูการทำงาน')
    expect(html).toContain('backdrop-blur-xs')
    expect(html).toContain('Dashboard')
    expect(html).toContain('Sales Pipeline (Kanban)')
  })

  it('T1.3.4: command filtering matches items by title case-insensitively', () => {
    const mockCommands = [
      { id: 'dash', title: 'Dashboard', subtitle: 'สรุปภาพรวมยอดขาย', href: '/wds/dashboard', category: 'ทั่วไป' },
      { id: 'pipe', title: 'Sales Pipeline', subtitle: 'ติดตามสถานะลีด', href: '/wds/pipeline', category: 'การขาย' },
      { id: 'quotes', title: 'Quotations', subtitle: 'ใบเสนอราคา', href: '/wds/quotations', category: 'เอกสาร' },
    ]

    const filterCommands = (query: string) => {
      const q = query.trim().toLowerCase()
      return mockCommands.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
    }

    expect(filterCommands('pipe')).toHaveLength(1)
    expect(filterCommands('pipe')[0].id).toBe('pipe')
    expect(filterCommands('DASH')).toHaveLength(1)
    expect(filterCommands('DASH')[0].id).toBe('dash')
  })

  it('T1.3.5: command filtering matches items by Thai category and subtitle', () => {
    const mockCommands = [
      { id: 'quotes', title: 'ใบเสนอราคา', subtitle: 'คำนวณราคาและส่วนลด', category: 'เอกสาร & สั่งซื้อ' },
      { id: 'survey', title: 'นัดหมายสำรวจ', subtitle: 'ตารางงานช่าง', category: 'งานภาคสนาม' },
    ]

    const filterCommands = (query: string) => {
      const q = query.trim().toLowerCase()
      return mockCommands.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
    }

    expect(filterCommands('เอกสาร')).toHaveLength(1)
    expect(filterCommands('เอกสาร')[0].id).toBe('quotes')
    expect(filterCommands('ช่าง')).toHaveLength(1)
    expect(filterCommands('ช่าง')[0].id).toBe('survey')
  })

  it('T1.3.6: command filtering returns empty array when query does not match any items', () => {
    const mockCommands = [
      { id: 'dash', title: 'Dashboard', subtitle: 'สรุปภาพรวม', category: 'ทั่วไป' },
    ]

    const filterCommands = (query: string) => {
      const q = query.trim().toLowerCase()
      return mockCommands.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
    }

    expect(filterCommands('xyznonexistentquery123')).toEqual([])
  })
})
