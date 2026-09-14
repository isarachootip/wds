'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  X,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  RotateCcw,
  Phone,
  MessageSquare,
  Store,
  Globe,
  Compass,
  HardHat,
} from 'lucide-react'
import {
  KanbanBoard,
  type LeadCard,
  isStale,
  getLeadDealSatang,
  getInterestSnippet,
  STATUS_LABELS,
  STATUS_HEADER_STYLES,
  STATUSES,
} from '../pipeline/KanbanBoard'
import { LeadsTableView, type SortKey, type SortDirection } from './components/LeadsTableView'
import { PillTabs, type PillTabOption } from '@/components/ui/PillTabs'
import { Button } from '@/components/ui/button'
import { satangToBaht } from '@/lib/qt-calc'
import { cn } from '@/lib/utils'

export interface LeadsHubProps {
  initialLeads: LeadCard[]
  initialView?: 'kanban' | 'table'
  initialStatus?: string
  initialSource?: string
  initialSearch?: string
}

export const CHANNEL_FILTER_OPTIONS = [
  { value: 'all', label: 'ทุกช่องทาง (All)', icon: null },
  { value: 'phone', label: 'โทรศัพท์ (Phone)', icon: Phone },
  { value: 'line', label: 'LINE OA', icon: MessageSquare },
  { value: 'store', label: 'หน้าร้าน (Walk-in)', icon: Store },
  { value: 'web', label: 'เว็บไซต์ (Web)', icon: Globe },
  { value: 'architect', label: 'สถาปนิก (Architect)', icon: Compass },
  { value: 'subcontractor', label: 'ผู้รับเหมาช่วง (Subcontractor)', icon: HardHat },
]

function matchesSource(leadSource: string, filter: string): boolean {
  if (filter === 'all') return true
  const norm = (leadSource || '').toLowerCase()
  const target = filter.toLowerCase()
  if (target === 'phone') return norm === 'phone'
  if (target === 'line') return norm === 'line' || norm === 'line_oa'
  if (target === 'store' || target === 'walk_in') return norm === 'store' || norm === 'walk_in'
  if (target === 'web') return norm === 'web' || norm === 'website'
  if (target === 'architect') return norm === 'architect'
  if (target === 'subcontractor') return norm === 'subcontractor'
  return norm === target
}

function matchesStatus(leadStatus: string, filter: string): boolean {
  if (filter === 'all') return true
  if (filter === 'site_visit_requested') {
    return leadStatus === 'site_visit_requested' || leadStatus === 'site_visit'
  }
  return leadStatus === filter
}

export function LeadsHub({
  initialLeads = [],
  initialView = 'kanban',
  initialStatus = 'all',
  initialSource = 'all',
  initialSearch = '',
}: LeadsHubProps) {
  const [leads, setLeads] = useState<LeadCard[]>(initialLeads)
  const [view, setView] = useState<'kanban' | 'table'>(initialView)
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [sourceFilter, setSourceFilter] = useState<string>(initialSource)
  const [staleOnly, setStaleOnly] = useState<boolean>(false)
  const [searchInput, setSearchInput] = useState<string>(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch)

  // Sort state for table view
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Sync internal leads if initialLeads changes from server
  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  // Debounce search input (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase())
    }, 200)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Synchronize URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('view', view)
    if (statusFilter !== 'all') {
      url.searchParams.set('status', statusFilter)
    } else {
      url.searchParams.delete('status')
    }
    if (sourceFilter !== 'all') {
      url.searchParams.set('source', sourceFilter)
    } else {
      url.searchParams.delete('source')
    }
    if (debouncedSearch) {
      url.searchParams.set('search', debouncedSearch)
    } else {
      url.searchParams.delete('search')
    }
    window.history.replaceState({}, '', url.toString())
  }, [view, statusFilter, sourceFilter, debouncedSearch])

  // Compute status counts respecting source, search, and stale filters
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    STATUSES.forEach(s => {
      counts[s] = 0
    })

    leads.forEach(lead => {
      // Source filter
      if (!matchesSource(lead.source, sourceFilter)) {
        return
      }
      // Stale filter
      if (staleOnly && (!isStale(lead.updatedAt) || lead.status === 'won' || lead.status === 'lost')) {
        return
      }
      // Search filter
      if (debouncedSearch) {
        const name = (lead.customerName || '').toLowerCase()
        const phone = (lead.customerPhone || '').toLowerCase()
        const ref = (lead.channelRef || '').toLowerCase()
        const interest = getInterestSnippet(lead.interest).toLowerCase()
        const company = (lead.company || '').toLowerCase()
        const matches =
          name.includes(debouncedSearch) ||
          phone.includes(debouncedSearch) ||
          ref.includes(debouncedSearch) ||
          interest.includes(debouncedSearch) ||
          company.includes(debouncedSearch)
        if (!matches) return
      }

      counts.all = (counts.all || 0) + 1
      const normalizedStatus = lead.status === 'site_visit' ? 'site_visit_requested' : lead.status
      if (counts[normalizedStatus] !== undefined) {
        counts[normalizedStatus] += 1
      }
    })

    return counts
  }, [leads, sourceFilter, staleOnly, debouncedSearch])

  // Count active stale leads
  const staleCount = useMemo(() => {
    return leads.filter(
      l => isStale(l.updatedAt) && l.status !== 'won' && l.status !== 'lost'
    ).length
  }, [leads])

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Status filter
      if (!matchesStatus(lead.status, statusFilter)) {
        return false
      }

      // Source channel filter
      if (!matchesSource(lead.source, sourceFilter)) {
        return false
      }

      // Stale filter
      if (staleOnly) {
        if (!isStale(lead.updatedAt) || lead.status === 'won' || lead.status === 'lost') {
          return false
        }
      }

      // Debounced search
      if (debouncedSearch) {
        const name = (lead.customerName || '').toLowerCase()
        const phone = (lead.customerPhone || '').toLowerCase()
        const ref = (lead.channelRef || '').toLowerCase()
        const interest = getInterestSnippet(lead.interest).toLowerCase()
        const company = (lead.company || '').toLowerCase()
        return (
          name.includes(debouncedSearch) ||
          phone.includes(debouncedSearch) ||
          ref.includes(debouncedSearch) ||
          interest.includes(debouncedSearch) ||
          company.includes(debouncedSearch)
        )
      }

      return true
    })
  }, [leads, statusFilter, sourceFilter, staleOnly, debouncedSearch])

  // Total deal value of filtered leads
  const totalFilteredDealSatang = useMemo(() => {
    return filteredLeads.reduce((acc, l) => acc + getLeadDealSatang(l), 0)
  }, [filteredLeads])

  // Sorted Leads for Table View
  const sortedTableLeads = useMemo(() => {
    const list = [...filteredLeads]
    list.sort((a, b) => {
      let valA: any
      let valB: any

      switch (sortKey) {
        case 'customerName':
          valA = a.customerName || ''
          valB = b.customerName || ''
          break
        case 'customerPhone':
          valA = a.customerPhone || ''
          valB = b.customerPhone || ''
          break
        case 'source':
          valA = a.source || ''
          valB = b.source || ''
          break
        case 'interest':
          valA = getInterestSnippet(a.interest)
          valB = getInterestSnippet(b.interest)
          break
        case 'dealValueSatang':
          valA = getLeadDealSatang(a)
          valB = getLeadDealSatang(b)
          break
        case 'status':
          valA = a.status || ''
          valB = b.status || ''
          break
        case 'updatedAt':
        default:
          valA = new Date(a.updatedAt).getTime()
          valB = new Date(b.updatedAt).getTime()
          break
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, 'th')
        return sortDirection === 'asc' ? cmp : -cmp
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [filteredLeads, sortKey, sortDirection])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  function handleStatusChange(leadId: string, newStatus: string, lostReason?: string) {
    setLeads(prev =>
      prev.map(l =>
        l.id === leadId
          ? {
              ...l,
              status: newStatus,
              lostReason: lostReason ?? l.lostReason,
              updatedAt: new Date(),
            }
          : l
      )
    )
  }

  function handleResetFilters() {
    setStatusFilter('all')
    setSourceFilter('all')
    setStaleOnly(false)
    setSearchInput('')
    setDebouncedSearch('')
  }

  const isFiltered =
    statusFilter !== 'all' ||
    sourceFilter !== 'all' ||
    staleOnly ||
    debouncedSearch.length > 0

  const buddhistYear = new Date().getFullYear() + 543

  const viewOptions: PillTabOption<'kanban' | 'table'>[] = [
    {
      value: 'kanban',
      label: 'Pipeline (Kanban)',
      icon: <LayoutGrid className="size-3.5" />,
    },
    {
      value: 'table',
      label: 'Data Table',
      icon: <TableIcon className="size-3.5" />,
    },
  ]

  return (
    <div className="space-y-5">
      {/* ──────────────────────────────────────────────────────────────────────────
          Page Header & Primary Action Bar
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              ศูนย์จัดการลีด (Leads Hub)
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
              พ.ศ. {buddhistYear}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border">
              {leads.length} ลีดทั้งหมด
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            กระบวนการขายแบบ Omnichannel ติดตามลูกค้า สำรวจหน้างาน และออกใบเสนอราคา (พ.ศ. {buddhistYear})
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Pill-Segmented View Switcher */}
          <PillTabs<'kanban' | 'table'>
            options={viewOptions}
            value={view}
            onChange={setView}
            size="sm"
          />

          {/* Quick Create Lead Button */}
          <Button asChild variant="thaiwatsadu" size="sm" className="shadow-xs">
            <Link href="/wds/leads/new">
              <Plus className="size-4" />
              <span>+ เพิ่มลีด</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          Multi-Facet Filtering & Search Bar
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Quick Search Input (debounced) */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              aria-label="ค้นหาลีด"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า, เบอร์โทรศัพท์, ความต้องการสินค้า, หรือ Channel Ref..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-muted/40 border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="ล้างคำค้นหา"
                onClick={() => {
                  setSearchInput('')
                  setDebouncedSearch('')
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title="ล้างคำค้นหา"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Stale Lead Toggle Button */}
          <button
            type="button"
            onClick={() => setStaleOnly(prev => !prev)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all shrink-0',
              staleOnly
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 ring-2 ring-rose-500/20'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
            title="กรองเฉพาะ Lead ที่ไม่มีการอัปเดตเกิน 7 วัน"
          >
            <span>⏰ ค้างนาน (&gt;7 วัน)</span>
            <span
              className={cn(
                'text-[11px] px-1.5 py-0.2 rounded-full font-bold',
                staleOnly
                  ? 'bg-rose-500/25 text-rose-800 dark:text-rose-300'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {staleCount}
            </span>
          </button>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl border border-border transition-colors shrink-0"
            >
              <RotateCcw className="size-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        {/* Channel Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
            <span>ช่องทาง:</span>
          </span>

          {CHANNEL_FILTER_OPTIONS.map(opt => {
            const isActive = sourceFilter === opt.value
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSourceFilter(opt.value)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                )}
              >
                {Icon && <Icon className="size-3 shrink-0" />}
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Status Filter Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
            <Filter className="size-3" />
            <span>สถานะ:</span>
          </span>

          {/* All Pill */}
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all shrink-0',
              statusFilter === 'all'
                ? 'bg-foreground text-background border-foreground shadow-xs font-semibold'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            )}
          >
            <span>ทั้งหมด</span>
            <span
              className={cn(
                'text-[11px] px-1.5 py-0.2 rounded-full font-semibold',
                statusFilter === 'all'
                  ? 'bg-background/20 text-background'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {statusCounts.all}
            </span>
          </button>

          {/* Each Status Pill */}
          {STATUSES.map(s => {
            const label = STATUS_LABELS[s]
            const count = statusCounts[s] || 0
            const isSelected = statusFilter === s
            const styles = STATUS_HEADER_STYLES[s]

            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all shrink-0',
                  isSelected
                    ? 'bg-foreground text-background border-foreground shadow-xs font-semibold'
                    : cn(styles.pill, 'hover:shadow-xs')
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    'text-[11px] px-1.5 py-0.2 rounded-full font-bold',
                    isSelected
                      ? 'bg-background/20 text-background'
                      : styles.badge
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          Filter Result Summary Indicator
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div>
          <span>แสดง </span>
          <strong className="text-foreground font-semibold">
            {filteredLeads.length}
          </strong>
          <span> รายการ (จากทั้งหมด {leads.length} ลีด)</span>
          {isFiltered && (
            <span className="text-primary font-medium ml-1.5">
              (มีการกรองข้อมูล)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span>รวมมูลค่าดีล:</span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm font-mono tabular-nums">
            ฿{satangToBaht(totalFilteredDealSatang)}
          </strong>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          Active View: Pipeline (Kanban) or Data Table
      ────────────────────────────────────────────────────────────────────────── */}
      {view === 'kanban' ? (
        <KanbanBoard leads={filteredLeads} onStatusChange={handleStatusChange} />
      ) : (
        <LeadsTableView
          leads={sortedTableLeads}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          isFiltered={isFiltered}
          onResetFilters={handleResetFilters}
        />
      )}
    </div>
  )
}
