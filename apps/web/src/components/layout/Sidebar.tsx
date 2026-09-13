'use client'

import React, { useState } from 'react'
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
  ChevronRight,
  LogOut,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  badgeVariant?: 'default' | 'alert' | 'warning'
  external?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

const navGroups: NavGroup[] = [
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
    label: 'Governance',
    defaultOpen: false,
    items: [
      {
        title: 'Audit Logs (Event Store)',
        href: '/wds/admin/events',
        icon: <Settings className="w-4 h-4 shrink-0" />,
      },
    ],
  },
]

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    Governance: false,
  })

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
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 flex flex-col h-screen w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="flex items-center gap-3 h-14 px-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white font-black text-sm shadow-xs shrink-0">
            TW
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs text-sidebar-foreground truncate tracking-tight">
              Thai Watsadu WDS
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              Wholesale & Direct Sales
            </span>
          </div>
          <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
            v1.0
          </span>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.label]
            return (
              <div key={group.label} className="space-y-1">
                {/* Group Label / Toggle */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-sidebar-foreground transition-colors group"
                >
                  <span>{group.label}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-sidebar-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-sidebar-foreground" />
                  )}
                </button>

                {/* Sub-items */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isItemActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            if (mobileOpen) onCloseMobile()
                          }}
                          className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                            active
                              ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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

        {/* Sidebar Footer / User Profile */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar-background/50">
          <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/80 shadow-xs mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                AE
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
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
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
