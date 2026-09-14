'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PanelLeft,
  Search,
  Plus,
  ChevronRight,
  Building2,
} from 'lucide-react'
import { CommandMenu } from './CommandMenu'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ThemeProvider, useTheme } from '@/components/theme/ThemeProvider'
import { useSidebar } from './AppShell'

const pathLabels: Record<string, string> = {
  wds: 'WDS Platform',
  dashboard: 'แดชบอร์ด',
  leads: 'ลีด',
  new: 'สร้างใหม่',
  customers: 'ลูกค้า',
  quotations: 'ใบเสนอราคา',
  orders: 'คำสั่งซื้อ',
  payments: 'การชำระเงิน',
  appointments: 'นัดหมายสำรวจ',
  deliveries: 'การจัดส่ง',
  pipeline: 'Sales Pipeline',
  followups: 'การติดตามงาน',
  credit: 'Credit Dual-Control',
  reports: 'รายงาน & สถิติ',
  'ar-aging': 'AR Aging',
  channels: 'Channel Analytics',
  funnel: 'Conversion Funnel',
  technicians: 'ผลงานช่าง',
  admin: 'ระบบผู้ดูแล',
  events: 'Event Store',
  visit: 'Field Service',
}

// Resilient wrapper: Provides an internal ThemeProvider if Header is rendered outside one (e.g. isolated test environments)
function SafeThemeToggle() {
  let hasProvider = false
  try {
    useTheme()
    hasProvider = true
  } catch {
    hasProvider = false
  }

  if (!hasProvider) {
    return (
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
  }

  return <ThemeToggle />
}

export interface HeaderProps {
  onToggleMobileSidebar?: () => void
  onToggleDesktopSidebar?: () => void
}

export function Header({ onToggleMobileSidebar, onToggleDesktopSidebar }: HeaderProps) {
  const pathname = usePathname()
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const sidebarContext = useSidebar()

  const handleToggleMobile = onToggleMobileSidebar || sidebarContext.toggleMobileSidebar
  const handleToggleDesktop = onToggleDesktopSidebar || sidebarContext.toggleSidebar
  const isCollapsed = sidebarContext.isCollapsed

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Generate dynamic breadcrumb items from URL pathname
  const segments = pathname ? pathname.split('/').filter(Boolean) : []
  const breadcrumbs = segments.map((seg, idx) => {
    const path = `/${segments.slice(0, idx + 1).join('/')}`
    const label = pathLabels[seg] || (seg.length > 8 ? `${seg.slice(0, 8)}...` : seg)
    const isLast = idx === segments.length - 1
    return { label, path, isLast }
  })

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-background/80 backdrop-blur-md border-b border-border transition-colors">
        {/* Left: Sidebar Collapse/Drawer Toggle & Dynamic Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Drawer Toggle (PanelLeft) */}
          <button
            type="button"
            onClick={handleToggleMobile}
            aria-expanded={Boolean(sidebarContext.isMobileOpen)}
            className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Toggle navigation menu"
            title="เปิดเมนูนำทาง (Navigation)"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Collapse Toggle (PanelLeft) */}
          <button
            type="button"
            onClick={handleToggleDesktop}
            aria-expanded={!isCollapsed}
            className="hidden md:inline-flex p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Toggle desktop sidebar"
            title={isCollapsed ? 'ขยายแถบเมนู (Expand Sidebar)' : 'ย่อแถบเมนู (Collapse Sidebar)'}
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* Dynamic Breadcrumbs with clean Cruip Artifact typography */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link
              href="/wds/dashboard"
              className="font-medium hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>WDS</span>
            </Link>
            {breadcrumbs.map((bc) => (
              <React.Fragment key={bc.path}>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                {bc.isLast ? (
                  <span className="font-semibold text-foreground truncate">{bc.label}</span>
                ) : (
                  <Link
                    href={bc.path}
                    className="hover:text-foreground transition-colors truncate"
                  >
                    {bc.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right: Search, Quick Action, ThemeToggle, NotificationCenter & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Command Palette Trigger Button (⌘K) */}
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 text-xs text-muted-foreground hover:text-foreground transition-all shadow-xs"
            aria-label="ค้นหาด่วน (Command palette)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ค้นหาด่วน...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Quick Action Button */}
          <div className="hidden sm:flex items-center gap-1.5">
            <Link
              href="/wds/quotations/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ใบเสนอราคา</span>
            </Link>
          </div>

          {/* Dark / Light Theme Toggle */}
          <div className="flex items-center">
            <SafeThemeToggle />
          </div>

          {/* Real-time Notification Bell with unread counter */}
          <div className="flex items-center">
            <NotificationBell />
          </div>

          {/* User Profile Badge */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              AE
            </div>
          </div>
        </div>
      </header>

      {/* Command Menu Modal Dialog */}
      <CommandMenu isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  )
}
