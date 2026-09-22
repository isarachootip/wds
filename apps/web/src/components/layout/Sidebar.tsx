'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Building2,
  PhoneCall,
  FileText,
  ShoppingCart,
  CreditCard,
  MapPin,
  Truck,
  ShieldCheck,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  ExternalLink,
  Layers,
  MessageSquare,
  BookOpen,
  ClipboardCheck,
} from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { useSidebar } from './AppShell'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'

export interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  badgeVariant?: 'default' | 'alert' | 'warning'
  external?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

export const navGroups: NavGroup[] = [
  {
    label: 'Sales & CRM',
    defaultOpen: true,
    items: [
      {
        title: 'แดชบอร์ด',
        href: '/wds/dashboard',
        icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'Sales Pipeline',
        href: '/wds/pipeline',
        icon: <TrendingUp className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'ลีด (Leads)',
        href: '/wds/leads',
        icon: <Users className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'ลูกค้า (Customers)',
        href: '/wds/customers',
        icon: <Building2 className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'การติดตามงาน (Follow-ups)',
        href: '/wds/followups',
        icon: <PhoneCall className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    label: 'Commerce & Orders',
    defaultOpen: true,
    items: [
      {
        title: 'ใบเสนอราคา',
        href: '/wds/quotations',
        icon: <FileText className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'คำสั่งซื้อ (Orders)',
        href: '/wds/orders',
        icon: <ShoppingCart className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'การชำระเงิน & สลิป',
        href: '/wds/payments',
        icon: <CreditCard className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    label: 'Operations & Field',
    defaultOpen: true,
    items: [
      {
        title: 'นัดหมายสำรวจหน้างาน',
        href: '/wds/appointments',
        icon: <MapPin className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'การจัดส่ง & ติดตั้ง',
        href: '/wds/deliveries',
        icon: <Truck className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'ผลตรวจ QC (PMT Flow)',
        href: '/wds/pmt-qc',
        icon: <ClipboardCheck className="w-4 h-4 shrink-0 text-emerald-500" />,
      },
      {
        title: 'Field Service App',
        href: '/visit/dashboard',
        icon: <ExternalLink className="w-4 h-4 shrink-0 text-blue-500" />,
      },
    ],
  },
  {
    label: 'Finance & Analytics',
    defaultOpen: true,
    items: [
      {
        title: 'Credit Dual-Control',
        href: '/wds/credit',
        icon: <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500" />,
      },
      {
        title: 'AR Aging Report',
        href: '/wds/reports/ar-aging',
        icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'Channel Analytics',
        href: '/wds/reports/channels',
        icon: <Layers className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'รายงานรวม (Reports)',
        href: '/wds/reports',
        icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    label: 'Governance & Settings',
    defaultOpen: false,
    items: [
      {
        title: 'คลังความรู้ & คู่มือ (KM Hub)',
        href: '/wds/km',
        icon: <BookOpen className="w-4 h-4 shrink-0 text-amber-500" />,
      },
      {
        title: 'Audit Logs (Event Store)',
        href: '/wds/admin/events',
        icon: <Settings className="w-4 h-4 shrink-0" />,
      },
      {
        title: 'ตั้งค่าระบบ & LINE OA',
        href: '/wds/admin/settings',
        icon: <MessageSquare className="w-4 h-4 shrink-0 text-[#06C755]" />,
      },
    ],
  },
]

export interface SidebarProps {
  mobileOpen?: boolean
  onCloseMobile?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({
  mobileOpen: propMobileOpen,
  onCloseMobile: propOnCloseMobile,
  isCollapsed: propIsCollapsed,
}: SidebarProps) {
  const pathname = usePathname()
  const sidebarContext = useSidebar()

  // Prioritize explicit props if passed, otherwise fall back to SidebarContext
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : sidebarContext.isCollapsed
  const mobileOpen = propMobileOpen !== undefined ? propMobileOpen : sidebarContext.isMobileOpen
  const onCloseMobile = propOnCloseMobile || (() => sidebarContext.setIsMobileOpen(false))

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    navGroups.forEach((g) => {
      if (g.defaultOpen === false) initial[g.label] = true
    })
    return initial
  })

  // Auto-close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen && onCloseMobile) {
        onCloseMobile()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, onCloseMobile])

  // Auto-close mobile drawer if viewport resizes to desktop width (>= 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileOpen && onCloseMobile) {
        onCloseMobile()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileOpen, onCloseMobile])

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  const isItemActive = (href: string) => {
    if (href === '/wds/dashboard') {
      return pathname === '/wds/dashboard' || pathname === '/wds'
    }
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={100}>
      {/* Mobile Backdrop with blur */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Two-Stage Sidebar Container: w-64 (16rem) expanded vs w-12 (3rem) collapsed */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 flex flex-col h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-linear md:translate-x-0 ${
          isCollapsed ? 'w-12' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Workspace Brand Header */}
        {isCollapsed ? (
          <div className="flex items-center justify-center h-14 border-b border-sidebar-border shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm shadow-xs shrink-0 cursor-default">
                  CB
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p className="font-semibold text-xs">Cusbox</p>
                <p className="text-[10px] text-muted-foreground">v1.0</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-3 h-14 px-4 border-b border-sidebar-border shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm shadow-xs shrink-0">
              CB
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-sidebar-foreground truncate tracking-tight">
                Cusbox
              </span>
            </div>
            <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
              v1.0
            </span>
          </div>
        )}

        {/* Navigation Content */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-1.5 py-3 space-y-4' : 'px-3 py-3 space-y-4'}`}>
          {navGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.label]

            // Collapsed icon-only mode with Radix Tooltips
            if (isCollapsed) {
              return (
                <div key={group.label} className="flex flex-col items-center gap-1">
                  {group.items.map((item) => {
                    const active = isItemActive(item.href)
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            onClick={() => {
                              if (mobileOpen && onCloseMobile) onCloseMobile()
                            }}
                            className={`relative flex items-center justify-center w-8 h-8 rounded-lg text-xs transition-colors ${
                              active
                                ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            }`}
                            aria-label={item.title}
                          >
                            <span className={active ? 'text-primary' : 'text-muted-foreground'}>
                              {item.icon}
                            </span>
                            {item.badge !== undefined && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-sidebar" />
                            )}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          <div className="flex items-center gap-2">
                            <span>{item.title}</span>
                            {item.badge !== undefined && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              )
            }

            // Expanded Mode: Navigation Groups with rotated chevrons & indented track
            return (
              <div key={group.label} className="space-y-1">
                {/* Group Header Button with Rotated Chevron */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={!isGroupCollapsed}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-sidebar-foreground transition-colors group"
                >
                  <span className="truncate">{group.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-sidebar-foreground transition-transform duration-200 ${
                      isGroupCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                  />
                </button>

                {/* Sub-items with indented vertical border track */}
                {!isGroupCollapsed && (
                  <div className="border-l border-sidebar-border ml-4 pl-3 flex flex-col gap-1 mt-1">
                    {group.items.map((item) => {
                      const active = isItemActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            if (mobileOpen && onCloseMobile) onCloseMobile()
                          }}
                          className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                            active
                              ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={active ? 'text-primary' : 'text-muted-foreground'}>
                              {item.icon}
                            </span>
                            <span className="truncate">{item.title}</span>
                          </div>

                          {item.badge !== undefined && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.badgeVariant === 'alert'
                                  ? 'bg-rose-500 text-white'
                                  : item.badgeVariant === 'warning'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Sidebar Footer / User Profile Card */}
        {isCollapsed ? (
          <div className="p-2 border-t border-sidebar-border bg-sidebar-background/50 flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 cursor-default">
                  AE
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <div>
                  <p className="font-semibold text-xs">Account Executive</p>
                  <p className="text-[10px] text-muted-foreground">ทีมขายสาขาบางนา</p>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <form action={logout} className="w-full flex justify-center">
                  <button
                    type="submit"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    aria-label="ออกจากระบบ"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </form>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <span>ออกจากระบบ</span>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="p-3 border-t border-sidebar-border bg-sidebar-background/50">
            <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/80 shadow-xs mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  AE
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate">
                    Account Executive
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    ทีมขายสาขาบางนา
                  </span>
                </div>
              </div>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>ออกจากระบบ</span>
              </button>
            </form>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}
