'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PhoneCall,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import {
  type LeadCard,
  type Status,
  STATUSES,
  STATUS_LABELS,
  STATUS_HEADER_STYLES,
  formatPhone,
  formatShortDate,
  isStale,
  isOverdue,
  getLeadDealSatang,
  getInterestSnippet,
  getSourceBadge,
} from '../KanbanBoard'
import { satangToBaht } from '@/lib/qt-calc'
import { cn } from '@/lib/utils'

export type SortKey =
  | 'customerName'
  | 'customerPhone'
  | 'source'
  | 'dealValueSatang'
  | 'status'
  | 'updatedAt'
  | 'nextFollowUpDue'

export type SortDirection = 'asc' | 'desc'

export interface PipelineListViewProps {
  leads: LeadCard[]
  stageSums: Record<Status, number>
  byStatus: Record<Status, LeadCard[]>
  onMoveStage: (leadId: string, newStage: Status) => void
}

export function PipelineListView({
  leads,
  stageSums,
  byStatus,
  onMoveStage,
}: PipelineListViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('dealValueSatang')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Filtered leads
  const filteredLeads = useMemo(() => {
    let result = leads

    if (selectedStatus !== 'all') {
      result = result.filter(l => {
        if (selectedStatus === 'site_visit_requested') {
          return l.status === 'site_visit_requested' || l.status === 'site_visit'
        }
        return l.status === selectedStatus
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(l => {
        const name = (l.customerName || '').toLowerCase()
        const phone = (l.customerPhone || '').replace(/\D/g, '')
        const company = (l.company || '').toLowerCase()
        const channelRef = (l.channelRef || '').toLowerCase()
        const interest = getInterestSnippet(l.interest).toLowerCase()
        const rawQueryDigits = q.replace(/\D/g, '')

        return (
          name.includes(q) ||
          company.includes(q) ||
          channelRef.includes(q) ||
          interest.includes(q) ||
          (rawQueryDigits.length >= 3 && phone.includes(rawQueryDigits))
        )
      })
    }

    return result
  }, [leads, selectedStatus, searchQuery])

  // Sorted leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let comparison = 0
      switch (sortKey) {
        case 'customerName':
          comparison = (a.customerName || '').localeCompare(b.customerName || '', 'th')
          break
        case 'customerPhone':
          comparison = (a.customerPhone || '').localeCompare(b.customerPhone || '')
          break
        case 'source':
          comparison = (a.source || '').localeCompare(b.source || '')
          break
        case 'dealValueSatang':
          comparison = getLeadDealSatang(a) - getLeadDealSatang(b)
          break
        case 'status':
          comparison = STATUSES.indexOf(a.status as Status) - STATUSES.indexOf(b.status as Status)
          break
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'nextFollowUpDue':
          const timeA = a.nextFollowUpDue ? new Date(a.nextFollowUpDue).getTime() : 0
          const timeB = b.nextFollowUpDue ? new Date(b.nextFollowUpDue).getTime() : 0
          comparison = timeA - timeB
          break
        default:
          comparison = 0
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredLeads, sortKey, sortDirection])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection(key === 'dealValueSatang' ? 'desc' : 'asc')
    }
  }

  function renderSortIcon(key: SortKey) {
    if (sortKey === key) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="size-3.5 text-primary shrink-0" />
      ) : (
        <ArrowDown className="size-3.5 text-primary shrink-0" />
      )
    }
    return <ArrowUpDown className="size-3.5 text-muted-foreground/60 shrink-0" />
  }

  return (
    <div className="space-y-4">
      {/* 7-Stage KPI Summary Cards (Clickable for quick filtering) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STATUSES.map(status => {
          const count = byStatus[status]?.length || 0
          const sumSatang = stageSums[status] || 0
          const styles = STATUS_HEADER_STYLES[status]
          const isSelected = selectedStatus === status

          return (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(prev => (prev === status ? 'all' : status))}
              className={cn(
                'text-left p-3.5 rounded-2xl border transition-all duration-200 bg-card flex flex-col justify-between shadow-2xs hover:shadow-md cursor-pointer relative overflow-hidden',
                styles.borderTop,
                'border-t-4',
                isSelected
                  ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-sm scale-[1.02]'
                  : 'hover:border-foreground/30'
              )}
            >
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs truncate',
                    styles.pill
                  )}
                >
                  {STATUS_LABELS[status]}
                </span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-bold border tabular-nums shrink-0',
                    styles.badge
                  )}
                >
                  {count} ดีล
                </span>
              </div>

              <div className="mt-1">
                <div className="text-[11px] font-bold text-muted-foreground">
                  มูลค่ารวม:
                </div>
                <div className="text-base sm:text-lg font-black text-foreground font-mono tabular-nums tracking-tight">
                  ฿{satangToBaht(sumSatang)}
                </div>
              </div>
            </button>
          )
        })}
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
            placeholder="ค้นหาชื่อลูกค้า, บริษัท, เบอร์โทร, ความต้องการ..."
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

        {/* Filter status reset or indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedStatus !== 'all' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
              <span>ขั้นตอน: {STATUS_LABELS[selectedStatus as Status]}</span>
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          <div className="text-xs font-bold text-muted-foreground">
            แสดง {sortedLeads.length} จาก {leads.length} รายการ
          </div>
        </div>
      </div>

      {/* Modern High-Contrast Leads Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/70 border-b border-border text-xs font-bold text-foreground select-none">
              <tr>
                {/* Customer / Project */}
                <th
                  scope="col"
                  onClick={() => handleSort('customerName')}
                  className="text-left px-4 py-3.5 font-bold cursor-pointer hover:bg-muted/90 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ลูกค้า / โครงการ</span>
                    {renderSortIcon('customerName')}
                  </div>
                </th>

                {/* Status */}
                <th
                  scope="col"
                  onClick={() => handleSort('status')}
                  className="text-left px-4 py-3.5 font-bold cursor-pointer hover:bg-muted/90 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>สถานะ / ขั้นตอน</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                {/* Deal Value */}
                <th
                  scope="col"
                  onClick={() => handleSort('dealValueSatang')}
                  className="text-right px-4 py-3.5 font-bold cursor-pointer hover:bg-muted/90 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>มูลค่าดีล</span>
                    {renderSortIcon('dealValueSatang')}
                  </div>
                </th>

                {/* Source Channel */}
                <th
                  scope="col"
                  onClick={() => handleSort('source')}
                  className="text-left px-4 py-3.5 font-bold cursor-pointer hover:bg-muted/90 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ช่องทาง</span>
                    {renderSortIcon('source')}
                  </div>
                </th>

                {/* Contact Phone */}
                <th
                  scope="col"
                  onClick={() => handleSort('customerPhone')}
                  className="text-left px-4 py-3.5 font-bold cursor-pointer hover:bg-muted/90 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>เบอร์โทรศัพท์</span>
                    {renderSortIcon('customerPhone')}
                  </div>
                </th>

                {/* AE Owner */}
                <th scope="col" className="text-left px-4 py-3.5 font-bold">
                  ผู้ดูแล (AE)
                </th>

                {/* Follow-up / Date */}
                <th
                  scope="col"
                  onClick={() => handleSort('updatedAt')}
                  className="text-left px-4 py-3.5 font-bold cursor-pointer hover:bg-muted/90 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>กำหนดการ / อัปเดต</span>
                    {renderSortIcon('updatedAt')}
                  </div>
                </th>

                {/* Actions */}
                <th scope="col" className="text-center px-4 py-3.5 font-bold">
                  จัดการ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">
                    <p className="font-semibold text-foreground">ไม่พบรายการดีลตามเงื่อนไขที่เลือก</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองขั้นตอน
                    </p>
                  </td>
                </tr>
              ) : (
                sortedLeads.map(lead => {
                  const dealSatang = getLeadDealSatang(lead)
                  const sourceInfo = getSourceBadge(lead.source)
                  const stale = isStale(lead.updatedAt) && lead.status !== 'won' && lead.status !== 'lost'
                  const interestText = getInterestSnippet(lead.interest)
                  const statusStyle = STATUS_HEADER_STYLES[lead.status as Status] || STATUS_HEADER_STYLES.new
                  const aeName = lead.ownerName || (lead.ownerId ? `AE-${lead.ownerId.slice(0, 4)}` : 'AE ฝ่ายขาย')
                  const aeInitials = aeName
                    .split(' ')
                    .map(p => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'AE'

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Customer / Project */}
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/wds/leads/${lead.id}`}
                          className="font-bold text-foreground hover:text-primary transition-colors text-sm block leading-snug"
                        >
                          {lead.customerName || '(ยังไม่ระบุชื่อลูกค้า)'}
                        </Link>
                        {(lead.company || lead.projectName || lead.channelRef) && (
                          <div className="text-xs font-semibold text-muted-foreground line-clamp-1 mt-0.5">
                            {lead.company || lead.projectName || lead.channelRef}
                          </div>
                        )}
                        {interestText && (
                          <div className="text-[11px] font-medium text-muted-foreground line-clamp-1 mt-1">
                            {interestText}
                          </div>
                        )}
                      </td>

                      {/* Status with Direct Stage Dropdown */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <select
                              aria-label={`เปลี่ยนสถานะของ ${lead.customerName || lead.id}`}
                              value={lead.status}
                              onChange={e => onMoveStage(lead.id, e.target.value as Status)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                            >
                              {STATUSES.map(s => (
                                <option key={s} value={s}>
                                  ย้ายไป: {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                            <div
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs transition-colors cursor-pointer',
                                statusStyle.pill
                              )}
                            >
                              <span>{STATUS_LABELS[lead.status as Status] || lead.status}</span>
                              <ChevronDown className="size-3 shrink-0 opacity-70" />
                            </div>
                          </div>

                          {stale && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                              title="ไม่มีการอัปเดตเกิน 7 วัน"
                            >
                              ค้าง &gt;7 วัน
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Deal Value */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                          ฿{satangToBaht(dealSatang)}
                        </span>
                      </td>

                      {/* Source Channel */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs',
                            sourceInfo.style
                          )}
                        >
                          {sourceInfo.icon}
                          <span>{sourceInfo.label}</span>
                        </span>
                      </td>

                      {/* Contact Phone */}
                      <td className="px-4 py-3.5">
                        {lead.customerPhone ? (
                          <a
                            href={`tel:${lead.customerPhone}`}
                            className="inline-flex items-center gap-1.5 font-bold text-xs font-mono text-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted"
                            title="โทรหาลูกค้า"
                          >
                            <PhoneCall className="size-3.5 text-primary shrink-0" />
                            <span>{formatPhone(lead.customerPhone)}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* AE Owner */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {aeInitials}
                          </div>
                          <span className="text-xs font-bold text-foreground truncate max-w-[100px]">
                            {aeName}
                          </span>
                        </div>
                      </td>

                      {/* Follow-up / Date */}
                      <td className="px-4 py-3.5">
                        {lead.nextFollowUpDue ? (
                          <div
                            className={cn(
                              'inline-flex items-center gap-1 text-xs font-bold',
                              isOverdue(lead.nextFollowUpDue)
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-primary'
                            )}
                          >
                            <Calendar className="size-3.5 shrink-0" />
                            <span>
                              {isOverdue(lead.nextFollowUpDue) ? 'เลยกำหนด ' : 'นัด '}
                              {formatShortDate(lead.nextFollowUpDue)}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <Clock className="size-3.5 shrink-0" />
                            <span>{formatShortDate(lead.updatedAt)}</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          href={`/wds/leads/${lead.id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors font-bold text-xs"
                          title="ดูรายละเอียดลีด"
                        >
                          <span>ดูดีล</span>
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
    </div>
  )
}
