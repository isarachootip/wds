import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { ThemeProvider, useTheme, type Theme } from '@/components/theme/ThemeProvider'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ArtifactKpiCard } from '@/components/ui/ArtifactKpiCard'
import { StatusBadge, CRM_STAGE_LABELS, type CrmStage } from '@/components/ui/StatusBadge'
import { PillTabs, PillSegmentedControl } from '@/components/ui/PillTabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

describe('M1 Empirical Challenger: Stress Tests & Boundary Conditions', () => {
  // ══════════════════════════════════════════════════════════════════════════
  // Section 1: Rapid Theme Switching & Dynamic System Preference Stress
  // ══════════════════════════════════════════════════════════════════════════
  describe('1. Rapid Theme Switching & State Machine Stress', () => {
    let mockStorage: Record<string, string> = {}
    let rootClasses: Set<string> = new Set()
    let systemPrefersDark = false
    let mediaChangeListeners: Array<() => void> = []

    const mockDocument = {
      documentElement: {
        classList: {
          add: (cls: string) => rootClasses.add(cls),
          remove: (cls: string) => rootClasses.delete(cls),
          contains: (cls: string) => rootClasses.has(cls),
          toggle: (cls: string, force?: boolean) => {
            if (force !== undefined) {
              if (force) rootClasses.add(cls)
              else rootClasses.delete(cls)
              return force
            }
            if (rootClasses.has(cls)) {
              rootClasses.delete(cls)
              return false
            } else {
              rootClasses.add(cls)
              return true
            }
          },
        },
      },
    }

    const mockWindow = {
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: systemPrefersDark,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, cb: () => void) => {
          if (event === 'change') mediaChangeListeners.push(cb)
        }),
        removeEventListener: vi.fn((event: string, cb: () => void) => {
          mediaChangeListeners = mediaChangeListeners.filter((l) => l !== cb)
        }),
        dispatchEvent: vi.fn(),
      })),
    }

    const mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = String(val)
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      }),
      clear: vi.fn(() => {
        mockStorage = {}
      }),
    }

    beforeEach(() => {
      mockStorage = {}
      rootClasses = new Set()
      systemPrefersDark = false
      mediaChangeListeners = []
      vi.stubGlobal('document', mockDocument)
      vi.stubGlobal('window', mockWindow)
      vi.stubGlobal('localStorage', mockLocalStorage)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('1.1: Rapid sequential theme switching ("light" -> "dark" -> "system" -> "dark") maintains sync', () => {
      let themeContext: ReturnType<typeof useTheme> | null = null

      const Harness = () => {
        const ctx = useTheme()
        themeContext = ctx
        return React.createElement('div', { 'data-theme': ctx.theme, 'data-resolved': ctx.resolvedTheme })
      }

      renderToString(
        React.createElement(
          ThemeProvider,
          { defaultTheme: 'light', storageKey: 'wds-theme' },
          React.createElement(Harness)
        )
      )

      expect(themeContext).not.toBeNull()

      // Switch 1: Explicit 'light'
      themeContext!.setTheme('light')
      expect(mockStorage['wds-theme']).toBe('light')
      expect(rootClasses.has('dark')).toBe(false)

      // Switch 2: Explicit 'dark'
      themeContext!.setTheme('dark')
      expect(mockStorage['wds-theme']).toBe('dark')
      expect(rootClasses.has('dark')).toBe(true)

      // Switch 3: Switch to 'system' (system is light)
      systemPrefersDark = false
      themeContext!.setTheme('system')
      expect(mockStorage['wds-theme']).toBe('system')
      expect(rootClasses.has('dark')).toBe(false)

      // Switch 4: Back to 'dark'
      themeContext!.setTheme('dark')
      expect(mockStorage['wds-theme']).toBe('dark')
      expect(rootClasses.has('dark')).toBe(true)
    })

    it('1.2: 100 rapid consecutive alternating theme switches remain deterministic with zero class leakage', () => {
      let themeContext: ReturnType<typeof useTheme> | null = null

      const Harness = () => {
        themeContext = useTheme()
        return null
      }

      renderToString(
        React.createElement(
          ThemeProvider,
          { defaultTheme: 'system' },
          React.createElement(Harness)
        )
      )

      const sequence: Theme[] = ['light', 'dark', 'system']
      for (let i = 0; i < 100; i++) {
        const nextTheme = sequence[i % sequence.length]
        themeContext!.setTheme(nextTheme)
      }

      // 100th switch (index 99): 99 % 3 = 0 -> 'light'
      expect(mockStorage['wds-theme']).toBe('light')
      expect(rootClasses.has('dark')).toBe(false)
      expect(rootClasses.size).toBe(0) // No residual classes
    })

    it('1.3: ThemeToggle flips dark <-> light based on current resolvedTheme', () => {
      let themeContext: ReturnType<typeof useTheme> | null = null

      const Harness = () => {
        themeContext = useTheme()
        return React.createElement(ThemeToggle)
      }

      const html = renderToString(
        React.createElement(
          ThemeProvider,
          { defaultTheme: 'dark' },
          React.createElement(Harness)
        )
      )

      expect(html).toContain('aria-label="Toggle theme"')
      expect(html).toContain('lucide-sun')
      expect(html).toContain('lucide-moon')
      themeContext!.setTheme('dark')
      expect(rootClasses.has('dark')).toBe(true)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 2: Storage Corruption & Storage Failure Fallbacks
  // ══════════════════════════════════════════════════════════════════════════
  describe('2. Storage Corruption & Security Error Resilience', () => {
    let rootClasses: Set<string> = new Set()

    const mockDocument = {
      documentElement: {
        classList: {
          add: (cls: string) => rootClasses.add(cls),
          remove: (cls: string) => rootClasses.delete(cls),
          contains: (cls: string) => rootClasses.has(cls),
        },
      },
    }

    const mockWindow = {
      matchMedia: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    }

    beforeEach(() => {
      rootClasses = new Set()
      vi.stubGlobal('document', mockDocument)
      vi.stubGlobal('window', mockWindow)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('2.1: Corrupted storage values fall back safely to defaultTheme without crash', () => {
      const corruptedValues = [
        'invalid-theme-name',
        '',
        'null',
        'undefined',
        '{ theme: "dark" }',
        'DARK',
        'LIGHT',
        'SYSTEM',
        '12345',
        'a'.repeat(1000),
      ]

      corruptedValues.forEach((corrupted) => {
        rootClasses = new Set()
        const mockStorage = {
          getItem: vi.fn().mockReturnValue(corrupted),
          setItem: vi.fn(),
        }
        vi.stubGlobal('localStorage', mockStorage)

        let resolved: string | null = null
        const Harness = () => {
          const { theme } = useTheme()
          resolved = theme
          return null
        }

        expect(() => {
          renderToString(
            React.createElement(
              ThemeProvider,
              { defaultTheme: 'dark' },
              React.createElement(Harness)
            )
          )
        }).not.toThrow()

        // Must fall back to defaultTheme ('dark')
        expect(resolved).toBe('dark')
      })
    })

    it('2.2: Throws SecurityError on localStorage.getItem (sandboxed iframe / private mode) safely falls back', () => {
      const restrictedStorage = {
        getItem: vi.fn().mockImplementation(() => {
          throw new Error('SecurityError: The operation is insecure.')
        }),
        setItem: vi.fn(),
      }
      vi.stubGlobal('localStorage', restrictedStorage)

      let renderedTheme: string | null = null
      const Harness = () => {
        const { theme } = useTheme()
        renderedTheme = theme
        return React.createElement('span', null, theme)
      }

      expect(() => {
        renderToString(
          React.createElement(
            ThemeProvider,
            { defaultTheme: 'light' },
            React.createElement(Harness)
          )
        )
      }).not.toThrow()

      expect(renderedTheme).toBe('light')
    })

    it('2.3: Throws QuotaExceededError on localStorage.setItem still applies class to document element', () => {
      const quotaExceededStorage = {
        getItem: vi.fn().mockReturnValue('light'),
        setItem: vi.fn().mockImplementation(() => {
          const err = new Error('QuotaExceededError: DOM Exception 22')
          err.name = 'QuotaExceededError'
          throw err
        }),
      }
      vi.stubGlobal('localStorage', quotaExceededStorage)

      let themeContext: ReturnType<typeof useTheme> | null = null
      const Harness = () => {
        themeContext = useTheme()
        return null
      }

      renderToString(
        React.createElement(
          ThemeProvider,
          { defaultTheme: 'light' },
          React.createElement(Harness)
        )
      )

      expect(themeContext).not.toBeNull()

      // setTheme to dark must NOT throw even though setItem throws QuotaExceededError
      expect(() => {
        themeContext!.setTheme('dark')
      }).not.toThrow()

      // And DOM mutation MUST still take effect
      expect(rootClasses.has('dark')).toBe(true)
    })

    it('2.4: Missing window.matchMedia behavior stress analysis', () => {
      // If window.matchMedia is undefined in non-standard webviews
      const windowWithoutMatchMedia = {}
      vi.stubGlobal('window', windowWithoutMatchMedia)

      let themeContext: ReturnType<typeof useTheme> | null = null
      const Harness = () => {
        themeContext = useTheme()
        return null
      }

      // Initializing with explicit 'dark' does not invoke matchMedia
      expect(() => {
        renderToString(
          React.createElement(
            ThemeProvider,
            { defaultTheme: 'dark' },
            React.createElement(Harness)
          )
        )
      }).not.toThrow()

      themeContext!.setTheme('dark')
      expect(rootClasses.has('dark')).toBe(true)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section 3: Component Rendering with Missing or Extreme Props
  // ══════════════════════════════════════════════════════════════════════════
  describe('3. Component Rendering with Missing or Extreme Props', () => {
    describe('3.1 ArtifactKpiCard Edge Cases', () => {
      it('renders cleanly without trend and without sub props (minimal card)', () => {
        const html = renderToString(
          React.createElement(ArtifactKpiCard, {
            label: 'Total Revenue',
            value: '฿5,000,000',
          })
        )

        expect(html).toContain('Total Revenue')
        expect(html).toContain('uppercase')
        expect(html).toContain('฿5,000,000')
        expect(html).toContain('rounded-2xl')
        // Must NOT render broken trend elements
        expect(html).not.toContain('ArrowUpRight')
        expect(html).not.toContain('ArrowDownRight')
      })

      it('handles trend without positive flag (defaults safely to negative rose styling)', () => {
        const html = renderToString(
          React.createElement(ArtifactKpiCard, {
            label: 'Neutral Shift',
            value: '100',
            trend: { value: '0.0%' }, // positive is undefined
          })
        )

        expect(html).toContain('0.0%')
        expect(html).toContain('text-rose-700')
        expect(html).toContain('bg-rose-500/10')
      })

      it('renders 0 numeric value accurately without treating it as missing/falsy', () => {
        const html = renderToString(
          React.createElement(ArtifactKpiCard, {
            label: 'Zero Deals',
            value: 0,
          })
        )

        expect(html).toContain('>0<')
      })

      it('renders negative numbers and extreme large values without crashing', () => {
        const htmlNeg = renderToString(
          React.createElement(ArtifactKpiCard, {
            label: 'Negative Variance',
            value: -42,
          })
        )
        expect(htmlNeg).toContain('-42')

        const megaVal = 999_999_999_999
        const htmlHuge = renderToString(
          React.createElement(ArtifactKpiCard, {
            label: 'Mega Sum',
            value: megaVal,
          })
        )
        expect(htmlHuge).toContain('999999999999')
      })

      it('safely handles ultra-long label (1,000+ characters) with truncate class', () => {
        const longLabel = 'VERY_LONG_METRIC_LABEL_'.repeat(50)
        const html = renderToString(
          React.createElement(ArtifactKpiCard, {
            label: longLabel,
            value: '10',
          })
        )

        expect(html).toContain('truncate')
        expect(html).toContain(longLabel)
      })

      it('handles unrecognized variant gracefully without undefined className explosion', () => {
        const html = renderToString(
          React.createElement(ArtifactKpiCard, {
            label: 'Special Status',
            value: '99',
            variant: 'nonexistent_extreme_variant' as any,
          })
        )

        expect(html).toContain('rounded-2xl')
        expect(html).toContain('99')
      })

      it('empty string href="" does NOT render broken Link anchor tag', () => {
        const html = renderToString(
          React.createElement(ArtifactKpiCard, {
            label: 'Unlinked',
            value: '5',
            href: '',
          })
        )

        expect(html).not.toContain('<a')
        expect(html).not.toContain('href=""')
      })
    })

    describe('3.2 StatusBadge Edge Cases', () => {
      it('renders completely empty props ({}) safely with neutral default', () => {
        const html = renderToString(React.createElement(StatusBadge, {}))

        expect(html).toContain('rounded-full')
        expect(html).toContain('bg-slate-500/10')
        expect(html).toContain('neutral')
      })

      it('handles unrecognized status string by falling back to neutral container with raw label', () => {
        const html = renderToString(
          React.createElement(StatusBadge, {
            status: 'UNRECOGNIZED_CRM_STATUS_XYZ' as any,
          })
        )

        expect(html).toContain('UNRECOGNIZED_CRM_STATUS_XYZ')
        expect(html).toContain('bg-slate-500/10')
        expect(html).toContain('w-1.5 h-1.5')
      })

      it('handles unrecognized variant by falling back to neutral styling', () => {
        const html = renderToString(
          React.createElement(StatusBadge, {
            variant: 'alien_variant' as any,
            label: 'Alien',
          })
        )

        expect(html).toContain('Alien')
        expect(html).toContain('bg-slate-500/10')
      })

      it('renders all 7 standard CRM stages with exact Thai localized labels', () => {
        const stages: CrmStage[] = [
          'new',
          'contacted',
          'qualified',
          'site_visit_requested',
          'quoted',
          'won',
          'lost',
        ]

        const expectedThai: Record<CrmStage, string> = {
          new: 'ใหม่',
          contacted: 'ติดต่อแล้ว',
          qualified: 'ผ่านเกณฑ์',
          site_visit_requested: 'นัดสำรวจ',
          quoted: 'เสนอราคา',
          won: 'ปิดการขาย (Won)',
          lost: 'ปิดไม่สำเร็จ (Lost)',
        }

        stages.forEach((stage) => {
          expect(CRM_STAGE_LABELS[stage]).toBe(expectedThai[stage])

          const html = renderToString(React.createElement(StatusBadge, { status: stage }))
          expect(html).toContain(expectedThai[stage])
        })
      })

      it('supports custom label overriding CRM stage default label', () => {
        const html = renderToString(
          React.createElement(StatusBadge, {
            status: 'won',
            label: 'ชนะโครงการใหญ่',
          })
        )

        expect(html).toContain('ชนะโครงการใหญ่')
        expect(html).not.toContain('ปิดการขาย (Won)')
        expect(html).toContain('bg-emerald-500/10') // Still applies won stage colors
      })

      it('omits dot indicator when dot={false}', () => {
        const html = renderToString(
          React.createElement(StatusBadge, {
            status: 'new',
            dot: false,
          })
        )

        expect(html).not.toContain('w-1.5 h-1.5')
        expect(html).toContain('ใหม่')
      })
    })

    describe('3.3 PillTabs & Segmented Controls Edge Cases', () => {
      it('renders empty options array [] without crashing', () => {
        const html = renderToString(
          React.createElement(PillTabs, {
            options: [],
            value: '',
            onChange: () => {},
          })
        )

        expect(html).toContain('role="tablist"')
        expect(html).toContain('bg-muted')
      })

      it('handles active value not present in options array without crashing', () => {
        const html = renderToString(
          React.createElement(PillTabs, {
            options: [
              { value: 'tab1', label: 'Tab 1' },
              { value: 'tab2', label: 'Tab 2' },
            ],
            value: 'nonexistent_tab',
            onChange: () => {},
          })
        )

        expect(html).toContain('Tab 1')
        expect(html).toContain('Tab 2')
        expect(html).not.toContain('aria-selected="true"')
      })

      it('PillSegmentedControl renders disabled options with disabled attribute and opacity class', () => {
        const html = renderToString(
          React.createElement(PillSegmentedControl, {
            options: [
              { value: 'active', label: 'Active Option' },
              { value: 'disabled', label: 'Disabled Option', disabled: true },
            ],
            value: 'active',
            onChange: () => {},
          })
        )

        expect(html).toContain('role="radiogroup"')
        expect(html).toContain('opacity-50 cursor-not-allowed')
      })
    })

    describe('3.4 Brand Variant Tokens & Primitives', () => {
      it('Button supports thaiwatsadu and navy brand variants', () => {
        const htmlBrand = renderToString(
          React.createElement(Button, { variant: 'thaiwatsadu' }, 'บันทึกข้อมูล')
        )
        expect(htmlBrand).toContain('bg-thaiwatsadu-red')
        expect(htmlBrand).toContain('hover:bg-thaiwatsadu-darkRed')

        const htmlNavy = renderToString(
          React.createElement(Button, { variant: 'navy' }, 'ปิดงาน')
        )
        expect(htmlNavy).toContain('bg-thaiwatsadu-dark')
      })

      it('Badge supports thaiwatsadu, navy, and success/warning semantic variants', () => {
        const htmlBrand = renderToString(
          React.createElement(Badge, { variant: 'thaiwatsadu' }, 'ไทวัสดุ')
        )
        expect(htmlBrand).toContain('bg-thaiwatsadu-red')

        const htmlSuccess = renderToString(
          React.createElement(Badge, { variant: 'success' }, 'สำเร็จ')
        )
        expect(htmlSuccess).toContain('bg-emerald-500/10')
        expect(htmlSuccess).toContain('border-emerald-500/20')
      })
    })
  })
})
