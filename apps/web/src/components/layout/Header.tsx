'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  Search,
  Plus,
  Bell,
  ChevronRight,
  FileText,
  Users,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { CommandMenu } from './CommandMenu'
import { NotificationBell } from '@/components/NotificationBell'

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

interface HeaderProps {
  onToggleMobileSidebar: () => void
}

export function Header({ onToggleMobileSidebar }: HeaderProps) {
  const pathname = usePathname()
  const [isCommandOpen, setIsCommandOpen] = useState(false)

  // Generate breadcrumb items from URL
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg, idx) => {
    const path = `/${segments.slice(0, idx + 1).join('/')}`
    const label = pathLabels[seg] || (seg.length > 8 ? `${seg.slice(0, 8)}...` : seg)
    const isLast = idx === segments.length - 1
    return { label, path, isLast }
  })

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-background/80 backdrop-blur-md border-b border-border transition-colors">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              href="/wds/dashboard"
              className="font-medium hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>WDS</span>
            </Link>
            {breadcrumbs.map((bc, i) => (
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

        {/* Right: Search, Quick Action & User Center */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Palette Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/80 text-xs text-muted-foreground hover:text-foreground transition-all shadow-xs"
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

          {/* Real-time Notification Bell */}
          <div className="flex items-center">
            <NotificationBell />
          </div>

          {/* User Status Tag */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              TW
            </div>
          </div>
        </div>
      </header>

      {/* Command Menu Modal */}
      <CommandMenu isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  )
}
