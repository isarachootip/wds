import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Sidebar } from '@/components/layout/Sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/wds/leads',
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock login actions
vi.mock('@/app/(auth)/login/actions', () => ({
  logout: vi.fn(),
}))

describe('Tier 1.2: Collapsible Sidebar State Machine', () => {
  it('T1.2.1: renders desktop sidebar container with w-64 class and Thai Watsadu brand header', () => {
    const html = renderToString(
      React.createElement(Sidebar, {
        mobileOpen: false,
        onCloseMobile: vi.fn(),
      })
    )

    expect(html).toContain('w-64')
    expect(html).toContain('Cusbox')
    expect(html).toContain('CB')
    expect(html).toContain('v1.0')
  })

  it('T1.2.2: mobile off-canvas drawer is hidden (-translate-x-full) when mobileOpen is false', () => {
    const html = renderToString(
      React.createElement(Sidebar, {
        mobileOpen: false,
        onCloseMobile: vi.fn(),
      })
    )

    expect(html).toContain('-translate-x-full')
    expect(html).not.toContain('backdrop-blur-xs')
  })

  it('T1.2.3: mobile off-canvas drawer displays translate-x-0 and backdrop when mobileOpen is true', () => {
    const html = renderToString(
      React.createElement(Sidebar, {
        mobileOpen: true,
        onCloseMobile: vi.fn(),
      })
    )

    expect(html).toContain('translate-x-0')
    expect(html).toContain('bg-black/50')
  })

  it('T1.2.4: active route item (/wds/leads) receives primary highlight styling', () => {
    const html = renderToString(
      React.createElement(Sidebar, {
        mobileOpen: false,
        onCloseMobile: vi.fn(),
      })
    )

    expect(html).toContain('/wds/leads')
    expect(html).toContain('bg-primary/10 text-primary font-semibold')
  })

  it('T1.2.5: renders all required CRM operational navigation groups', () => {
    const html = renderToString(
      React.createElement(Sidebar, {
        mobileOpen: false,
        onCloseMobile: vi.fn(),
      })
    )

    expect(html).toContain('Sales &amp; CRM')
    expect(html).toContain('Commerce &amp; Orders')
    expect(html).toContain('Operations &amp; Field')
    expect(html).toContain('Finance &amp; Analytics')
  })

  it('T1.2.6: sidebar includes logout action affordance', () => {
    const html = renderToString(
      React.createElement(Sidebar, {
        mobileOpen: false,
        onCloseMobile: vi.fn(),
      })
    )

    expect(html).toContain('ออกจากระบบ')
  })
})
