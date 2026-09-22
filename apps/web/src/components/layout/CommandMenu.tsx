'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  FileText,
  Users,
  ShoppingCart,
  TrendingUp,
  MapPin,
  CreditCard,
  BarChart3,
  Settings,
  X,
  ArrowRight,
  ShieldCheck,
  CornerDownLeft,
  MessageSquare,
  BookOpen,
  Sparkles,
} from 'lucide-react'

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  href: string
  category: string
  icon: React.ReactNode
}

export const defaultCommands: CommandItem[] = [
  {
    id: 'dash',
    title: 'Dashboard',
    subtitle: 'สรุปภาพรวมยอดขายและสถานะงาน',
    href: '/wds/dashboard',
    category: 'ทั่วไป',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: 'pipe',
    title: 'Sales Pipeline (Kanban)',
    subtitle: 'ติดตามสถานะลีดในกระบวนการขาย',
    href: '/wds/pipeline',
    category: 'การขาย & CRM',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: 'leads',
    title: 'รายการลีดทั้งหมด (Leads)',
    subtitle: 'จัดการรายชื่อผู้สนใจและสถานะ',
    href: '/wds/leads',
    category: 'การขาย & CRM',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'leads-new',
    title: '+ เพิ่มลีดใหม่',
    subtitle: 'สร้าง Lead จาก Online / Showroom / Direct Sales',
    href: '/wds/leads/new',
    category: 'การขาย & CRM',
    icon: <Users className="w-4 h-4 text-blue-500" />,
  },
  {
    id: 'cust',
    title: 'ข้อมูลลูกค้า (Customers & B2B)',
    subtitle: 'ฐานข้อมูลลูกค้าและสาขา',
    href: '/wds/customers',
    category: 'การขาย & CRM',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'follow',
    title: 'การติดตามงาน (Follow-ups)',
    subtitle: 'รายการที่ต้องติดต่อและค้างชำระ',
    href: '/wds/followups',
    category: 'การขาย & CRM',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'quotes',
    title: 'ใบเสนอราคา (Quotations)',
    subtitle: 'จัดการและส่งใบเสนอราคาให้ลูกค้า',
    href: '/wds/quotations',
    category: 'เอกสาร & สั่งซื้อ',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'quotes-new',
    title: '+ สร้างใบเสนอราคาใหม่',
    subtitle: 'คำนวณราคาและส่วนลดพิเศษ',
    href: '/wds/quotations/new',
    category: 'เอกสาร & สั่งซื้อ',
    icon: <FileText className="w-4 h-4 text-emerald-500" />,
  },
  {
    id: 'orders',
    title: 'คำสั่งซื้อ (Orders)',
    subtitle: 'ติดตามคำสั่งซื้อและสถานะจัดส่ง',
    href: '/wds/orders',
    category: 'เอกสาร & สั่งซื้อ',
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  {
    id: 'payments',
    title: 'การชำระเงินและสลิป (Payments)',
    subtitle: 'ตรวจสอบหลักฐานการโอนและอนุมัติยอด',
    href: '/wds/payments',
    category: 'เอกสาร & สั่งซื้อ',
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    id: 'survey',
    title: 'นัดหมายสำรวจหน้างาน (Site Visits)',
    subtitle: 'ตารางงานช่างและพิกัดสำรวจ',
    href: '/wds/appointments',
    category: 'งานภาคสนาม & จัดส่ง',
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    id: 'deliveries',
    title: 'รายการจัดส่งสินค้า (Deliveries)',
    subtitle: 'แผนกระจายสินค้าและติดตั้ง',
    href: '/wds/deliveries',
    category: 'งานภาคสนาม & จัดส่ง',
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  {
    id: 'visit-app',
    title: 'Field Service Web App',
    subtitle: 'ระบบสำหรับช่างสำรวจหน้างาน',
    href: '/visit/dashboard',
    category: 'งานภาคสนาม & จัดส่ง',
    icon: <MapPin className="w-4 h-4 text-indigo-500" />,
  },
  {
    id: 'credit',
    title: 'Credit Dual-Control',
    subtitle: 'การอนุมัติวงเงินเครดิตและ Dual-Sign',
    href: '/wds/credit',
    category: 'การเงิน & รายงาน',
    icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'ar-aging',
    title: 'รายงานลูกหนี้ค้างชำระ (AR Aging)',
    subtitle: 'วิเคราะห์อายุหนี้และรอบการชำระ',
    href: '/wds/reports/ar-aging',
    category: 'การเงิน & รายงาน',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: 'rep-chan',
    title: 'Channel Performance Analytics',
    subtitle: 'ยอดขายแยกตามช่องทางและสาขา',
    href: '/wds/reports/channels',
    category: 'การเงิน & รายงาน',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: 'events',
    title: 'ระบบบันทึก Audit Logs (Event Store)',
    subtitle: 'ประวัติการดำเนินการและการเปลี่ยนแปลงข้อมูล',
    href: '/wds/admin/events',
    category: 'ระบบ & ความปลอดภัย',
    icon: <Settings className="w-4 h-4" />,
  },
  {
    id: 'line-settings',
    title: 'ตั้งค่าระบบ & LINE Official Account',
    subtitle: 'กำหนดค่า LINE Messaging API, Webhook และ LIFF App',
    href: '/wds/admin/settings',
    category: 'ระบบ & ความปลอดภัย',
    icon: <MessageSquare className="w-4 h-4 text-[#06C755]" />,
  },
  {
    id: 'km-hub',
    title: 'คลังความรู้และคู่มือระบบ (KM Hub)',
    subtitle: 'ศูนย์รวมคู่มือการทำงาน กฎธุรกิจ และความรู้ระบบ WDS',
    href: '/wds/km',
    category: 'คู่มือ & ความรู้ (KM)',
    icon: <BookOpen className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'km-diff',
    title: 'คู่มือ: ลูกค้า vs ลีด vs Sales Pipeline ต่างกันอย่างไร?',
    subtitle: 'ทำความเข้าใจโครงสร้าง CRM 1 Customer : N Leads และ Pipeline 7 ขั้น',
    href: '/wds/km?article=customer-lead-pipeline',
    category: 'คู่มือ & ความรู้ (KM)',
    icon: <Sparkles className="w-4 h-4 text-amber-500" />,
  },
]

export interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
  commands?: CommandItem[]
}

export function CommandMenu({ isOpen, onClose, commands = defaultCommands }: CommandMenuProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = commands.filter((item) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    )
  })

  const handleSelect = useCallback(
    (href: string) => {
      onClose()
      router.push(href)
    },
    [onClose, router]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette on ⌘K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          setQuery('')
          setSelectedIndex(0)
        }
        return
      }

      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex].href)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, filtered, selectedIndex, handleSelect])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ค้นหาด่วนและเมนูนำทาง"
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center px-4 border-b border-border bg-card">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            placeholder="ค้นหาหน้า, เอกสาร, เมนูการทำงาน (เช่น ใบเสนอราคา, ลีด, รายงาน)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            autoFocus
            className="w-full py-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtered Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
          <span className="sr-only">ไม่พบรายการที่ตรงกับ</span>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              ไม่พบรายการที่ตรงกับ &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item, index) => {
                const isSelected = selectedIndex === index
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-foreground hover:bg-accent/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/70 text-muted-foreground shrink-0">
                        {item.icon}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs sm:text-sm truncate leading-tight">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {item.category}
                      </span>
                      {isSelected ? (
                        <CornerDownLeft className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Shortcut Key Hints */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              ใช้ <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">↓</kbd> นำทาง
            </span>
            <span>
              กด <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Enter</kbd> เพื่อเลือก
            </span>
          </div>
          <span>
            กด <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">ESC</kbd> เพื่อปิด
          </span>
        </div>
      </div>
    </div>
  )
}
