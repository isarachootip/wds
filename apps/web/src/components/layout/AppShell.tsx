'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export interface SidebarContextValue {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  isMobileOpen: boolean
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
}

export const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (!context) {
    // Safe fallback if consumed outside SidebarProvider
    return {
      isCollapsed: false,
      setIsCollapsed: () => {},
      isMobileOpen: false,
      setIsMobileOpen: () => {},
      toggleSidebar: () => {},
      toggleMobileSidebar: () => {},
    }
  }
  return context
}

export interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
  storageKey?: string
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  storageKey = 'wds-sidebar-collapsed',
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(defaultCollapsed)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)

  // Read persisted desktop collapsed state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        setIsCollapsedState(stored === 'true')
      }
    } catch {
      // localStorage may fail in restricted/private modes
    }
  }, [storageKey])

  const setIsCollapsed = useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (action) => {
      setIsCollapsedState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action
        try {
          localStorage.setItem(storageKey, String(next))
        } catch {}
        return next
      })
    },
    [storageKey]
  )

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [setIsCollapsed])

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev)
  }, [])

  const value = useMemo<SidebarContextValue>(
    () => ({
      isCollapsed,
      setIsCollapsed,
      isMobileOpen,
      setIsMobileOpen,
      toggleSidebar,
      toggleMobileSidebar,
    }),
    [isCollapsed, setIsCollapsed, isMobileOpen, toggleSidebar, toggleMobileSidebar]
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileOpen, setIsMobileOpen, toggleSidebar, toggleMobileSidebar } =
    useSidebar()

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Sidebar with dual-stage width and mobile drawer */}
      <Sidebar
        mobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area smoothly adjusting based on sidebar width */}
      <div className="flex flex-col flex-1 min-w-0 transition-[margin,width] duration-200 ease-linear">
        <Header
          onToggleMobileSidebar={toggleMobileSidebar}
          onToggleDesktopSidebar={toggleSidebar}
        />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  )
}
