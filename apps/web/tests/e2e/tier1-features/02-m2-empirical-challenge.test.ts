import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Sidebar, navGroups } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { CommandMenu } from '@/components/layout/CommandMenu'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { AppShell, SidebarProvider, useSidebar } from '@/components/layout/AppShell'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/wds/leads',
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock login actions
vi.mock('@/app/(auth)/login/actions', () => ({
  logout: vi.fn(),
}))

describe('M2 Empirical Challenger: Layout Metrics, DOM Contracts & Accessibility', () => {
  // ══════════════════════════════════════════════════════════════════════════
  // Section 1: DOM Contracts & Two-Stage Width Verification
  // ══════════════════════════════════════════════════════════════════════════
  describe('1. Two-Stage Sidebar Widths (w-64 / 16rem vs w-12 / 3rem)', () => {
    it('1.1: expanded sidebar renders with w-64 class', () => {
      const html = renderToString(
        React.createElement(Sidebar, {
          isCollapsed: false,
          mobileOpen: false,
          onCloseMobile: vi.fn(),
        })
      )
      expect(html).toContain('w-64')
      expect(html).not.toContain('w-12')
      expect(html).toContain('Thai Watsadu WDS')
    })

    it('1.2: collapsed sidebar renders with w-12 class and compact brand icon', () => {
      const html = renderToString(
        React.createElement(Sidebar, {
          isCollapsed: true,
          mobileOpen: false,
          onCloseMobile: vi.fn(),
        })
      )
      expect(html).toContain('w-12')
      expect(html).not.toContain('w-64')
      // Compact brand icon renders
      expect(html).toContain('TW')
    })

    it('1.3: off-canvas drawer is hidden (-translate-x-full) when mobileOpen is false', () => {
      const html = renderToString(
        React.createElement(Sidebar, {
          mobileOpen: false,
          isCollapsed: false,
        })
      )
      expect(html).toContain('-translate-x-full')
      expect(html).not.toContain('backdrop-blur-xs')
    })

    it('1.4: off-canvas drawer shows (translate-x-0) with backdrop blur when mobileOpen is true', () => {
      const html = renderToString(
        React.createElement(Sidebar, {
          mobileOpen: true,
          isCollapsed: false,
        })
      )
      expect(html).toContain('translate-x-0')
      expect(html).toContain('bg-black/50 backdrop-blur-xs')
    })

    it('1.5 (Adversarial Edge Case): verify mobile drawer width when isCollapsed is true', () => {
      // In current implementation, `isCollapsed ? 'w-12' : 'w-64'` has no `md:` prefix on w-12.
      // If a user collapsed on desktop, isCollapsed=true persists into mobile mode.
      const html = renderToString(
        React.createElement(Sidebar, {
          mobileOpen: true,
          isCollapsed: true,
        })
      )
      // Empirically confirms that the drawer renders w-12 on mobile if isCollapsed is true
      expect(html).toContain('w-12')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 2: Indented Sub-item Track & Collapsible Groups
  // ══════════════════════════════════════════════════════════════════════════
  describe('2. Indented Sub-item Track Verification', () => {
    it('2.1: expanded group renders indented track with exact class border-l border-sidebar-border ml-4 pl-3', () => {
      const html = renderToString(
        React.createElement(Sidebar, {
          isCollapsed: false,
          mobileOpen: false,
        })
      )
      expect(html).toContain('border-l border-sidebar-border ml-4 pl-3')
    })

    it('2.2: collapsed mode does not render the indented sub-item track', () => {
      const html = renderToString(
        React.createElement(Sidebar, {
          isCollapsed: true,
          mobileOpen: false,
        })
      )
      expect(html).not.toContain('border-l border-sidebar-border ml-4 pl-3')
    })

    it('2.3 (Adversarial Audit): navGroups configuration contract', () => {
      const govGroup = navGroups.find((g) => g.label === 'Governance')
      expect(govGroup).toBeDefined()
      expect(govGroup?.defaultOpen).toBe(false)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 3: Frosted Glass Header Classes & Controls
  // ══════════════════════════════════════════════════════════════════════════
  describe('3. Frosted Glass Header Styling & Layout', () => {
    it('3.1: header container includes exact frosted glass classes: backdrop-blur-md bg-background/80 border-b border-border', () => {
      const html = renderToString(
        React.createElement(Header, {
          onToggleMobileSidebar: vi.fn(),
          onToggleDesktopSidebar: vi.fn(),
        })
      )
      expect(html).toContain('backdrop-blur-md')
      expect(html).toContain('bg-background/80')
      expect(html).toContain('border-b')
      expect(html).toContain('border-border')
      expect(html).toContain('sticky top-0')
    })

    it('3.2: header renders quick search trigger with ⌘K badge', () => {
      const html = renderToString(React.createElement(Header))
      expect(html).toContain('ค้นหาด่วน...')
      expect(html).toContain('⌘K')
      expect(html).toContain('lucide-search')
    })

    it('3.3: header renders dynamic breadcrumbs with root WDS link', () => {
      const html = renderToString(React.createElement(Header))
      expect(html).toContain('Breadcrumb')
      expect(html).toContain('WDS')
      expect(html).toContain('/wds/dashboard')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 4: Adversarial Accessibility Audit (aria-expanded, aria-label, roles)
  // ══════════════════════════════════════════════════════════════════════════
  describe('4. Accessibility Audit (aria-expanded, aria-label, roles)', () => {
    it('4.1: Header navigation and buttons provide aria-label attributes', () => {
      const html = renderToString(React.createElement(Header))
      expect(html).toContain('aria-label="Toggle navigation menu"')
      expect(html).toContain('aria-label="Toggle desktop sidebar"')
      expect(html).toContain('aria-label="Breadcrumb"')
      expect(html).toContain('aria-label="ค้นหาด่วน (Command palette)"')
    })

    it('4.2: Collapsed Sidebar item buttons provide aria-label attributes for screen readers', () => {
      const html = renderToString(
        React.createElement(Sidebar, {
          isCollapsed: true,
          mobileOpen: false,
        })
      )
      expect(html).toContain('aria-label="แดชบอร์ด"')
      expect(html).toContain('aria-label="Sales Pipeline"')
      expect(html).toContain('aria-label="ลีด (Leads)"')
      expect(html).toContain('aria-label="ออกจากระบบ"')
    })

    it('4.3: NotificationBell button provides aria-label attribute', () => {
      const html = renderToString(React.createElement(NotificationBell))
      expect(html).toContain('aria-label="การแจ้งเตือน"')
    })

    it('4.4: Check aria-expanded on sidebar collapse buttons and accordion headers', () => {
      const headerHtml = renderToString(React.createElement(Header))
      const sidebarHtml = renderToString(React.createElement(Sidebar, { isCollapsed: false }))

      // Audit findings: aria-expanded is wired to toggle buttons
      const hasHeaderDesktopExpanded = headerHtml.includes('aria-expanded')
      const hasSidebarGroupExpanded = sidebarHtml.includes('aria-expanded')

      // Record empirical reality: aria-expanded is present in the DOM
      expect(hasHeaderDesktopExpanded).toBe(true)
      expect(hasSidebarGroupExpanded).toBe(true)
    })

    it('4.5: Check dialog role on CommandMenu modal container', () => {
      const menuHtml = renderToString(React.createElement(CommandMenu, { isOpen: true, onClose: vi.fn() }))

      // Audit findings: role="dialog" and aria-modal="true"
      const hasRoleDialog = menuHtml.includes('role="dialog"')
      const hasAriaModal = menuHtml.includes('aria-modal="true"')

      // Record empirical reality: role="dialog" and aria-modal="true" are present
      expect(hasRoleDialog).toBe(true)
      expect(hasAriaModal).toBe(true)
    })
  })
})
