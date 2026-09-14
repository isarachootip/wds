'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeProviderProps {
  children?: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'wds-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Determine system preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  // Apply theme class to document.documentElement
  const applyTheme = useCallback(
    (activeTheme: Theme) => {
      if (typeof document === 'undefined') return
      const root = document.documentElement
      const resolved = activeTheme === 'system' ? getSystemTheme() : activeTheme

      setResolvedTheme(resolved)

      if (resolved === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    },
    [getSystemTheme]
  )

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null
      const initialTheme = stored && ['light', 'dark', 'system'].includes(stored) ? stored : defaultTheme
      setThemeState(initialTheme)
      applyTheme(initialTheme)
    } catch {
      applyTheme(defaultTheme)
    }
  }, [defaultTheme, storageKey, applyTheme])

  // Listen to system media query changes when theme is 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, applyTheme])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme)
      try {
        localStorage.setItem(storageKey, newTheme)
      } catch {
        // localStorage might be unavailable/restricted in some environments
      }
      applyTheme(newTheme)
    },
    [storageKey, applyTheme]
  )

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
    }),
    [theme, setTheme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
