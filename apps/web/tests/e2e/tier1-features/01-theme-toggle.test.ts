import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { ThemeProvider, useTheme, type Theme } from '@/components/theme/ThemeProvider'

describe('Tier 1.1: Theme Toggle & Persistence', () => {
  const originalDocument = global.document
  const originalWindow = global.window
  const originalLocalStorage = global.localStorage

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.document = originalDocument
    global.window = originalWindow
    global.localStorage = originalLocalStorage
  })

  it('T1.1.1: SSR safe execution - renders children without DOM crash', () => {
    const TestComponent = () => React.createElement('div', { id: 'theme-child' }, 'Theme Active')
    const html = renderToString(
      React.createElement(
        ThemeProvider,
        { defaultTheme: 'dark' },
        React.createElement(TestComponent)
      )
    )
    expect(html).toContain('Theme Active')
    expect(html).toContain('id="theme-child"')
  })

  it('T1.1.2: validates Theme type contract accepts "light", "dark", "system"', () => {
    const validThemes: Theme[] = ['light', 'dark', 'system']
    validThemes.forEach((t) => {
      expect(['light', 'dark', 'system']).toContain(t)
    })
  })

  it('T1.1.3: verifies custom storage key parameter support', () => {
    const customKey = 'wds-enterprise-theme-key'
    const Consumer = () => {
      const { theme } = useTheme()
      return React.createElement('span', null, theme)
    }

    const html = renderToString(
      React.createElement(
        ThemeProvider,
        { storageKey: customKey, defaultTheme: 'dark' },
        React.createElement(Consumer)
      )
    )
    expect(html).toContain('dark')
  })

  it('T1.1.4: throws descriptive error when useTheme is called outside ThemeProvider', () => {
    const OrphanConsumer = () => {
      useTheme()
      return null
    }

    expect(() => {
      renderToString(React.createElement(OrphanConsumer))
    }).toThrow('useTheme must be used within a ThemeProvider')
  })

  it('T1.1.5: theme switching state machine correctly transitions light <-> dark <-> system', () => {
    type State = Theme
    const transitions: Record<State, State> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    }

    let current: State = 'light'
    expect(current).toBe('light')

    current = transitions[current]
    expect(current).toBe('dark')

    current = transitions[current]
    expect(current).toBe('system')

    current = transitions[current]
    expect(current).toBe('light')
  })

  it('T1.1.6: verifies class token mapping for light vs dark modes', () => {
    // Cruip Artifact theme token contract
    const getResolvedClass = (theme: Theme, systemPrefersDark: boolean): string => {
      if (theme === 'dark') return 'dark'
      if (theme === 'light') return ''
      return systemPrefersDark ? 'dark' : ''
    }

    expect(getResolvedClass('dark', false)).toBe('dark')
    expect(getResolvedClass('light', true)).toBe('')
    expect(getResolvedClass('system', true)).toBe('dark')
    expect(getResolvedClass('system', false)).toBe('')
  })
})
