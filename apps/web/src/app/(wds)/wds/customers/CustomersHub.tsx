'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Search,
  X,
  PhoneCall,
  CreditCard,
  ChevronRight,
  Filter,
  Users,
  Briefcase,
  Store,
  CheckCircle2,
} from 'lucide-react'
import { AddCustomerModal } from './components/AddCustomerModal'
import { Button } from '@/components/ui/button'
import { satangToBaht } from '@/lib/qt-calc'
import { cn } from '@/lib/utils'

export interface CustomerItem {
  id: string
  code: string
  name: string
  taxId?: string | null
  phone?: string | null
  email?: string | null
  contactPerson?: string | null
  lineId?: string | null
  creditLimitSatang?: number | null
  creditUsedSatang?: number | null
  customerGroup?: string | null
  status?: string | null
  createdAt: string | Date
}

export interface CustomersHubProps {
  initialCustomers: CustomerItem[]
}

export const GROUP_LABELS: Record<string, { label: string; style: string }> = {
  contractor: {
    label: 'ผู้รับเหมา (Contractor)',
    style: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20 font-bold',
  },
  developer: {
    label: 'ผู้พัฒนาอสังหาฯ (Developer)',
    style: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 font-bold',
  },
  wholesaler: {
    label: 'ร้านค้าช่วง (Wholesaler)',
    style: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 border-indigo-500/20 font-bold',
  },
  standard: {
    label: 'ลูกค้าทั่วไป (Standard)',
    style: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 font-bold',
  },
}

export function CustomersHub({ initialCustomers }: CustomersHubProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Metrics
  const totalCount = customers.length
  const contractorCount = customers.filter(
    c => c.customerGroup === 'contractor' || c.customerGroup === 'developer'
  ).length
  const wholesalerCount = customers.filter(c => c.customerGroup === 'wholesaler').length
  const totalCreditSatang = customers.reduce(
    (sum, c) => sum + (c.creditLimitSatang || 0),
    0
  )

  // Filtered
  const filteredCustomers = useMemo(() => {
    let result = customers

    if (selectedGroup !== 'all') {
      result = result.filter(c => (c.customerGroup || 'contractor') === selectedGroup)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const rawDigits = q.replace(/\D/g, '')

      result = result.filter(c => {
        const name = (c.name || '').toLowerCase()
        const code = (c.code || '').toLowerCase()
        const taxId = (c.taxId || '').toLowerCase()
        const contact = (c.contactPerson || '').toLowerCase()
        const phone = (c.phone || '').replace(/\D/g, '')

        return (
          name.includes(q) ||
          code.includes(q) ||
          taxId.includes(q) ||
          contact.includes(q) ||
          (rawDigits.length >= 3 && phone.includes(rawDigits))
        )
      })
    }

    return result
  }, [customers, selectedGroup, searchQuery])

  function handleCustomerAdded(newCustomer: CustomerItem) {
    setCustomers(prev => [newCustomer, ...prev])
    setSuccessToast(`บันทึกข้อมูลลูกค้า ${newCustomer.name} เรียบร้อยแล้ว`)
    setTimeout(() => setSuccessToast(null), 5000)
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-xs text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              ลูกค้าองค์กร & คู่ค้า (Customer 360°)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
              {totalCount} บัญชีทั้งหมด
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ฐานข้อมูลลูกค้านิติบุคคล ผู้รับเหมา โครงการก่อสร้าง และการบริหารวงเงินเครดิต B2B
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="thaiwatsadu"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="shadow-xs font-bold"
          >
            <Plus className="size-4 mr-1.5" />
            <span>+ เพิ่มลูกค้าใหม่</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Customers */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs border-t-4 border-t-primary">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-muted-foreground">ลูกค้าทั้งหมด</span>
            <Users className="size-4 text-primary shrink-0" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1 font-mono tabular-nums">
            {totalCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">บัญชีนิติบุคคล & ร้านค้า</p>
        </div>

        {/* Card 2: Contractors / Developers */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-muted-foreground">ผู้รับเหมา & โครงการ</span>
            <Briefcase className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1 font-mono tabular-nums">
            {contractorCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">กลุ่มงานโครงการก่อสร้าง</p>
        </div>

        {/* Card 3: Wholesalers */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs border-t-4 border-t-indigo-500">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-muted-foreground">ร้านค้าช่วง / ขายส่ง</span>
            <Store className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1 font-mono tabular-nums">
            {wholesalerCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">คู่ค้าซื้อส่งต่อเนื่อง</p>
        </div>

        {/* Card 4: Total Credit Limit */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-muted-foreground">วงเงินเครดิตอนุมัติรวม</span>
            <CreditCard className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground mt-1 font-mono tabular-nums tracking-tight">
            ฿{satangToBaht(totalCreditSatang)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">วงเงิน Credit Term ทั้งหมด</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อบริษัท, รหัสลูกค้า, Tax ID, เบอร์โทร..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Group Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedGroup('all')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              selectedGroup === 'all'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setSelectedGroup('contractor')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              selectedGroup === 'contractor'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            ผู้รับเหมา
          </button>
          <button
            type="button"
            onClick={() => setSelectedGroup('developer')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              selectedGroup === 'developer'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            โครงการ
          </button>
          <button
            type="button"
            onClick={() => setSelectedGroup('wholesaler')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              selectedGroup === 'wholesaler'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            ร้านค้าช่วง
          </button>
        </div>
      </div>

      {/* Modern High-Contrast Customer Data Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/70 border-b border-border text-xs font-bold text-foreground select-none">
              <tr>
                <th scope="col" className="text-left px-4 py-3.5 font-bold">
                  รหัสลูกค้า
                </th>
                <th scope="col" className="text-left px-4 py-3.5 font-bold">
                  ชื่อลูกค้านิติบุคคล / ร้านค้า
                </th>
                <th scope="col" className="text-left px-4 py-3.5 font-bold">
                  กลุ่มลูกค้า
                </th>
                <th scope="col" className="text-left px-4 py-3.5 font-bold">
                  เบอร์โทรศัพท์ติดต่อ
                </th>
                <th scope="col" className="text-left px-4 py-3.5 font-bold">
                  ผู้ติดต่อหลัก
                </th>
                <th scope="col" className="text-right px-4 py-3.5 font-bold">
                  วงเงินเครดิต (Credit Limit)
                </th>
                <th scope="col" className="text-center px-4 py-3.5 font-bold">
                  360° Profile
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-muted-foreground text-sm">
                    <Building2 className="size-10 text-muted-foreground/40 mx-auto mb-2.5" />
                    <p className="font-bold text-foreground text-base">ยังไม่มีข้อมูลลูกค้าในระบบ</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      คลิกปุ่มด้านล่างเพื่อเพิ่มลูกค้านิติบุคคลหรือคู่ค้าเข้าระบบได้ทันที
                    </p>
                    <Button
                      type="button"
                      variant="thaiwatsadu"
                      size="sm"
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4 font-bold shadow-xs"
                    >
                      <Plus className="size-4 mr-1.5" />
                      <span>+ เพิ่มลูกค้าใหม่รายแรก</span>
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const groupInfo =
                    GROUP_LABELS[customer.customerGroup || 'contractor'] || GROUP_LABELS.contractor
                  const creditSatang = customer.creditLimitSatang || 0

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Customer Code */}
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-muted-foreground">
                        {customer.code}
                      </td>

                      {/* Customer Name */}
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/wds/customers/${customer.id}`}
                          className="font-bold text-base text-foreground hover:text-primary transition-colors block leading-snug"
                        >
                          {customer.name}
                        </Link>
                        {customer.taxId && (
                          <div className="text-[11px] font-mono font-semibold text-muted-foreground mt-0.5">
                            Tax ID: {customer.taxId}
                          </div>
                        )}
                      </td>

                      {/* Customer Group */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs',
                            groupInfo.style
                          )}
                        >
                          {groupInfo.label}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        {customer.phone ? (
                          <a
                            href={`tel:${customer.phone}`}
                            className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted font-bold text-xs font-mono"
                            title="โทรหาลูกค้า"
                          >
                            <PhoneCall className="size-3.5 text-primary shrink-0" />
                            <span>{customer.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Contact Person */}
                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-bold text-foreground">
                          {customer.contactPerson || '-'}
                        </div>
                        {customer.email && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[150px]">
                            {customer.email}
                          </div>
                        )}
                      </td>

                      {/* Credit Limit */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                          {creditSatang > 0 ? `฿${satangToBaht(creditSatang)}` : '฿0.00'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          href={`/wds/customers/${customer.id}`}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-primary hover:bg-primary/10 transition-colors font-bold text-xs"
                          title="ดูข้อมูล 360°"
                        >
                          <span>ดู 360°</span>
                          <ChevronRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCustomerAdded}
      />
    </div>
  )
}
