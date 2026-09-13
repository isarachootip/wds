'use client'

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  href: string
  category: string
  icon: React.ReactNode
}

const defaultCommands: CommandItem[] = [
  { id: 'dash', title: 'Dashboard', subtitle: 'สรุปภาพรวมยอดขายและสถานะงาน', href: '/wds/dashboard', category: 'ทั่วไป', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'pipe', title: 'Sales Pipeline (Kanban)', subtitle: 'ติดตามสถานะลีดในกระบวนการขาย', href: '/wds/pipeline', category: 'การขาย & CRM', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'leads', title: 'รายการลีดทั้งหมด (Leads)', subtitle: 'จัดการรายชื่อผู้สนใจและสถานะ', href: '/wds/leads', category: 'การขาย & CRM', icon: <Users className="w-4 h-4" /> },
  { id: 'leads-new', title: '+ เพิ่มลีดใหม่', subtitle: 'สร้าง Lead จาก Online / Showroom / Direct Sales', href: '/wds/leads/new', category: 'การขาย & CRM', icon: <Users className="w-4 h-4 text-blue-500" /> },
  { id: 'cust', title: 'ข้อมูลลูกค้า (Customers & B2B)', subtitle: 'ฐานข้อมูลลูกค้าและสาขา', href: '/wds/customers', category: 'การขาย & CRM', icon: <Users className="w-4 h-4" /> },
  { id: 'follow', title: 'การติดตามงาน (Follow-ups)', subtitle: 'รายการที่ต้องติดต่อและค้างชำระ', href: '/wds/followups', category: 'การขาย & CRM', icon: <FileText className="w-4 h-4" /> },
  { id: 'quotes', title: 'ใบเสนอราคา (Quotations)', subtitle: 'จัดการและส่งใบเสนอราคาให้ลูกค้า', href: '/wds/quotations', category: 'เอกสาร & สั่งซื้อ', icon: <FileText className="w-4 h-4" /> },
  { id: 'quotes-new', title: '+ สร้างใบเสนอราคาใหม่', subtitle: 'คำนวณราคาและส่วนลดพิเศษ', href: '/wds/quotations/new', category: 'เอกสาร & สั่งซื้อ', icon: <FileText className="w-4 h-4 text-emerald-500" /> },
  { id: 'orders', title: 'คำสั่งซื้อ (Orders)', subtitle: 'ติดตามคำสั่งซื้อและสถานะจัดส่ง', href: '/wds/orders', category: 'เอกสาร & สั่งซื้อ', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'payments', title: 'การชำระเงินและสลิป (Payments)', subtitle: 'ตรวจสอบหลักฐานการโอนและอนุมัติยอด', href: '/wds/payments', category: 'เอกสาร & สั่งซื้อ', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'survey', title: 'นัดหมายสำรวจหน้างาน (Site Visits)', subtitle: 'ตารางงานช่างและพิกัดสำรวจ', href: '/wds/appointments', category: 'งานภาคสนาม & จัดส่ง', icon: <MapPin className="w-4 h-4" /> },
  { id: 'deliveries', title: 'รายการจัดส่งสินค้า (Deliveries)', subtitle: 'แผนกระจายสินค้าและติดตั้ง', href: '/wds/deliveries', category: 'งานภาคสนาม & จัดส่ง', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'visit-app', title: 'Field Service Web App', subtitle: 'ระบบสำหรับช่างสำรวจหน้างาน', href: '/visit/dashboard', category: 'งานภาคสนาม & จัดส่ง', icon: <MapPin className="w-4 h-4 text-indigo-500" /> },
  { id: 'credit', title: 'Credit Dual-Control', subtitle: 'การอนุมัติวงเงินเครดิตและ Dual-Sign', href: '/wds/credit', category: 'การเงิน & รายงาน', icon: <ShieldCheck className="w-4 h-4 text-amber-500" /> },
  { id: 'ar-aging', title: 'รายงานลูกหนี้ค้างชำระ (AR Aging)', subtitle: 'วิเคราะห์อายุหนี้และรอบการชำระ', href: '/wds/reports/ar-aging', category: 'การเงิน & รายงาน', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'rep-chan', title: 'Channel Performance Analytics', subtitle: 'ยอดขายแยกตามช่องทางและสาขา', href: '/wds/reports/channels', category: 'การเงิน & รายงาน', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'events', title: 'ระบบบันทึก Audit Logs (Event Store)', subtitle: 'ประวัติการดำเนินการและการเปลี่ยนแปลงข้อมูล', href: '/wds/admin/events', category: 'ระบบ & ความปลอดภัย', icon: <Settings className="w-4 h-4" /> },
]

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          setQuery('')
          setSelectedIndex(0)
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filtered = defaultCommands.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (href: string) => {
    onClose()
    router.push(href)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            type="text"
            placeholder="ค้นหาหน้า, เอกสาร, เมนูการทำงาน (เช่น ใบเสนอราคา, ลีด, รายงาน)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            autoFocus
            className="w-full py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              ไม่พบรายการที่ตรงกับ "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    selectedIndex === index
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-accent/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted/60 text-muted-foreground shrink-0">
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-xs sm:text-sm truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted/70 text-muted-foreground">
                      {item.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
          <span>กด <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">ESC</kbd> เพื่อปิด</span>
          <span>ใช้ <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">↓</kbd> เพื่อเลื่อน</span>
        </div>
      </div>
    </div>
  )
}
