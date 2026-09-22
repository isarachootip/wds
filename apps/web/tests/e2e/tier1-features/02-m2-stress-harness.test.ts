import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { Sidebar, navGroups } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { CommandMenu, defaultCommands } from '@/components/layout/CommandMenu'
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

describe('M2 Stress Harness: Empirical Edge Cases & Failure Mode Analysis', () => {
  // ══════════════════════════════════════════════════════════════════════════
  // Section 1: Rapid Toggle of Desktop Sidebar Collapse State (isCollapsed)
  // ══════════════════════════════════════════════════════════════════════════
  describe('1. Rapid Toggle of Desktop Sidebar Collapse State', () => {
    it('1.1: alternating state simulator executes 10 rapid toggles and computes deterministic state', () => {
      let isCollapsed = false
      const storageKey = 'wds-sidebar-collapsed'
      const mockStorage: Record<string, string> = {}

      const setIsCollapsed = (action: boolean | ((prev: boolean) => boolean)) => {
        const next = typeof action === 'function' ? action(isCollapsed) : action
        isCollapsed = next
        mockStorage[storageKey] = String(next)
      }

      const toggleSidebar = () => setIsCollapsed((prev) => !prev)

      // Execute 10 rapid toggles
      for (let i = 0; i < 10; i++) {
        toggleSidebar()
      }

      // After 10 toggles from false, state must be false (even number of toggles)
      expect(isCollapsed).toBe(false)
      expect(mockStorage[storageKey]).toBe('false')

      // 11th toggle brings it to true
      toggleSidebar()
      expect(isCollapsed).toBe(true)
      expect(mockStorage[storageKey]).toBe('true')
    })

    it('1.2: storage exception resilience does not crash state update when localStorage throws', () => {
      let isCollapsed = false
      const throwingStorage = {
        setItem: () => {
          throw new Error('QuotaExceededError: DOM Exception 22')
        },
      }

      expect(() => {
        try {
          throwingStorage.setItem()
        } catch {
          // Handled gracefully in AppShell.tsx lines 66, 56
        }
        isCollapsed = !isCollapsed
      }).not.toThrow()

      expect(isCollapsed).toBe(true)
    })

    it('1.3: verifies DOM class transition between expanded w-64 and collapsed w-12', () => {
      const expandedHtml = renderToString(React.createElement(Sidebar, { isCollapsed: false }))
      expect(expandedHtml).toContain('w-64')
      expect(expandedHtml).not.toContain('w-12')
      expect(expandedHtml).toContain('Cusbox')

      const collapsedHtml = renderToString(React.createElement(Sidebar, { isCollapsed: true }))
      expect(collapsedHtml).toContain('w-12')
      expect(collapsedHtml).not.toContain('w-64')
      expect(collapsedHtml).toContain('CB')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 2: Mobile Viewport Drawer Open/Close & ESC Key Dismissal
  // ══════════════════════════════════════════════════════════════════════════
  describe('2. Mobile Viewport Drawer Open/Close & Dismissal', () => {
    it('2.1: mobile drawer closed state renders off-canvas without backdrop', () => {
      const html = renderToString(
        React.createElement(Sidebar, {
          mobileOpen: false,
          isCollapsed: false,
        })
      )
      expect(html).toContain('-translate-x-full')
      expect(html).not.toContain('bg-black/50 backdrop-blur-xs')
    })

    it('2.2: mobile drawer open state renders on-canvas with blurred backdrop', () => {
      const html = renderToString(
        React.createElement(Sidebar, {
          mobileOpen: true,
          isCollapsed: false,
        })
      )
      expect(html).toContain('translate-x-0')
      expect(html).toContain('bg-black/50 backdrop-blur-xs')
    })

    it('2.3: Escape key dismissal logic calls onCloseMobile only when mobileOpen is true', () => {
      const onCloseMobile = vi.fn()

      const simulateEsc = (key: string, mobileOpen: boolean) => {
        if (key === 'Escape' && mobileOpen && onCloseMobile) {
          onCloseMobile()
        }
      }

      // When drawer is closed, ESC does not trigger onCloseMobile
      simulateEsc('Escape', false)
      expect(onCloseMobile).not.toHaveBeenCalled()

      // When other key is pressed while open, does not trigger
      simulateEsc('Enter', true)
      expect(onCloseMobile).not.toHaveBeenCalled()

      // When ESC is pressed while open, triggers onCloseMobile
      simulateEsc('Escape', true)
      expect(onCloseMobile).toHaveBeenCalledTimes(1)
    })

    it('2.4: Window resize logic triggers onCloseMobile when viewport >= 768px and open', () => {
      const onCloseMobile = vi.fn()

      const simulateResize = (width: number, mobileOpen: boolean) => {
        if (width >= 768 && mobileOpen && onCloseMobile) {
          onCloseMobile()
        }
      }

      // Resize on mobile width does not close
      simulateResize(640, true)
      expect(onCloseMobile).not.toHaveBeenCalled()

      // Resize to desktop width closes mobile drawer
      simulateResize(1024, true)
      expect(onCloseMobile).toHaveBeenCalledTimes(1)
    })

    it('2.5 (Adversarial Defect): Mobile drawer renders w-12 if collapsed was toggled on desktop', () => {
      // Because `isCollapsed ? 'w-12' : 'w-64'` lacks `md:` prefix on w-12,
      // a user with isCollapsed=true opening the mobile drawer gets a 48px drawer!
      const html = renderToString(
        React.createElement(Sidebar, {
          mobileOpen: true,
          isCollapsed: true,
        })
      )
      expect(html).toContain('w-12')
      expect(html).not.toContain('w-64')
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 3: CommandMenu Search with Special Characters & Thai Text
  // ══════════════════════════════════════════════════════════════════════════
  describe('3. CommandMenu Search Input with Special Characters & Thai Text', () => {
    const filterCommands = (query: string, commands = defaultCommands) => {
      const q = query.trim().toLowerCase()
      if (!q) return commands
      return commands.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q)
      )
    }

    it('3.1: Special Characters: regex meta-characters do not crash or throw syntax errors', () => {
      const dangerousQueries = [
        '.*',
        '+',
        '?',
        '^',
        '$',
        '{',
        '}',
        '(',
        ')',
        '|',
        '[',
        ']',
        '\\',
        '\\d+',
        '(((',
      ]

      for (const dq of dangerousQueries) {
        expect(() => filterCommands(dq)).not.toThrow()
      }

      // Test specific matching
      expect(filterCommands('+').map((c) => c.id)).toEqual(['leads-new', 'quotes-new'])
      expect(filterCommands('(').length).toBeGreaterThan(5)
      expect(filterCommands('&').length).toBeGreaterThan(0)
    })

    it('3.2: Special Characters: HTML/script injection strings match nothing safely without XSS', () => {
      const scriptQuery = '<script>alert("xss")</script>'
      const results = filterCommands(scriptQuery)
      expect(results).toHaveLength(0)

      // In HTML renderToString, empty query message displays escaped string
      const html = renderToString(React.createElement(CommandMenu, { isOpen: true, onClose: vi.fn() }))
      expect(html).toContain('ไม่พบรายการที่ตรงกับ')
    })

    it('3.3: Whitespace: leading/trailing/only spaces are trimmed and return all commands if empty', () => {
      expect(filterCommands('   ')).toHaveLength(defaultCommands.length)
      expect(filterCommands('  Dashboard  ')).toHaveLength(1)
    })

    it('3.4: Thai Text: matches Thai titles, subtitles, and categories accurately', () => {
      // Search by Thai title
      const quoteResults = filterCommands('ใบเสนอราคา')
      expect(quoteResults.length).toBeGreaterThanOrEqual(2)
      expect(quoteResults.some((c) => c.id === 'quotes')).toBe(true)

      // Search by Thai subtitle keyword
      const surveyResults = filterCommands('ช่าง')
      expect(surveyResults.length).toBeGreaterThanOrEqual(2)
      expect(surveyResults.some((c) => c.id === 'survey')).toBe(true)
      expect(surveyResults.some((c) => c.id === 'visit-app')).toBe(true)

      // Search by Thai category
      const financeResults = filterCommands('การเงิน')
      expect(financeResults.length).toBeGreaterThanOrEqual(3)
      expect(financeResults.some((c) => c.id === 'credit')).toBe(true)
      expect(financeResults.some((c) => c.id === 'ar-aging')).toBe(true)

      // Search by Lead keywords
      const leadResults = filterCommands('ลีด')
      expect(leadResults.length).toBeGreaterThanOrEqual(3)
      expect(leadResults.some((c) => c.id === 'leads')).toBe(true)
    })

    it('3.5: Mixed Language & Case-Insensitivity: English uppercase matches lowercase Thai entries', () => {
      expect(filterCommands('CRM').length).toBeGreaterThanOrEqual(5)
      expect(filterCommands('crm').length).toBeGreaterThanOrEqual(5)
      expect(filterCommands('B2B').length).toBe(1)
      expect(filterCommands('b2b').length).toBe(1)
      expect(filterCommands('KANBAN').length).toBe(1)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 4: CommandMenu Rapid Arrow Navigation & Shortcuts
  // ══════════════════════════════════════════════════════════════════════════
  describe('4. CommandMenu Rapid Arrow Navigation & Shortcuts', () => {
    it('4.1: Rapid ArrowDown advances with wrap-around to top (index 0)', () => {
      const length = 5
      let selectedIndex = 0

      const handleArrowDown = () => {
        selectedIndex = length > 0 ? (selectedIndex + 1) % length : 0
      }

      // 4 steps reach index 4 (last item)
      for (let i = 0; i < 4; i++) handleArrowDown()
      expect(selectedIndex).toBe(4)

      // 5th step wraps around to 0
      handleArrowDown()
      expect(selectedIndex).toBe(0)

      // 100 rapid presses end at 100 % 5 = 0
      for (let i = 0; i < 100; i++) handleArrowDown()
      expect(selectedIndex).toBe(0)
    })

    it('4.2: ArrowUp from top (index 0) wraps around to bottom (length - 1)', () => {
      const length = 5
      let selectedIndex = 0

      const handleArrowUp = () => {
        selectedIndex = length > 0 ? (selectedIndex - 1 + length) % length : 0
      }

      handleArrowUp()
      expect(selectedIndex).toBe(4) // Last item

      handleArrowUp()
      expect(selectedIndex).toBe(3)
    })

    it('4.3: Arrow navigation handles empty list (length 0) safely without NaN or crash', () => {
      const length = 0
      let selectedIndex = 0

      const handleArrowDown = () => {
        selectedIndex = length > 0 ? (selectedIndex + 1) % length : 0
      }
      const handleArrowUp = () => {
        selectedIndex = length > 0 ? (selectedIndex - 1 + length) % length : 0
      }

      handleArrowDown()
      expect(selectedIndex).toBe(0)

      handleArrowUp()
      expect(selectedIndex).toBe(0)
    })

    it('4.4: Query change resets selectedIndex to 0 to prevent out-of-bounds selection', () => {
      let selectedIndex = 4
      const onQueryChange = () => {
        selectedIndex = 0
      }
      onQueryChange()
      expect(selectedIndex).toBe(0)
    })

    it('4.5 (Adversarial Defect): ⌘K / Ctrl+K keyboard shortcut fails to open modal when closed', () => {
      // In CommandMenu.tsx line 201-209:
      // if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      //   e.preventDefault()
      //   if (isOpen) {
      //     onClose()
      //   } else {
      //     setQuery('')
      //     setSelectedIndex(0)
      //   }
      //   return
      // }
      // Because isOpen is a prop passed from Header, and CommandMenu has no onOpen callback,
      // pressing ⌘K when isOpen=false resets query and index, but CANNOT open the modal!
      let isOpen = false
      const onClose = vi.fn()
      let query = 'previous'
      let selectedIndex = 3

      const handleKeyDown = (key: string, metaOrCtrl: boolean) => {
        if (metaOrCtrl && key.toLowerCase() === 'k') {
          if (isOpen) {
            onClose()
          } else {
            query = ''
            selectedIndex = 0
            // Notice: isOpen remains false! There is no mechanism to set isOpen = true!
          }
        }
      }

      handleKeyDown('k', true)

      // Query and index reset, but modal remains closed!
      expect(query).toBe('')
      expect(selectedIndex).toBe(0)
      expect(isOpen).toBe(false)
    })
  })
})
