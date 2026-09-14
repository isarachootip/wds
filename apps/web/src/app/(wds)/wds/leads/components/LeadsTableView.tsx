'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PhoneCall,
  ChevronRight,
  Filter,
  RotateCcw,
} from 'lucide-react'
import {
  type LeadCard,
  formatPhone,
  isStale,
  getLeadDealSatang,
  getInterestSnippet,
  getSourceBadge,
} from '../../pipeline/KanbanBoard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { satangToBaht } from '@/lib/qt-calc'
import { cn } from '@/lib/utils'

export type SortKey =
  | 'customerName'
  | 'customerPhone'
  | 'source'
  | 'interest'
  | 'dealValueSatang'
  | 'status'
  | 'updatedAt'

export type SortDirection = 'asc' | 'desc'

export interface LeadsTableViewProps {
  leads: LeadCard[]
  sortKey: SortKey
  sortDirection: SortDirection
  onSort: (key: SortKey) => void
  isFiltered?: boolean
  onResetFilters?: () => void
}

export function LeadsTableView({
  leads,
  sortKey,
  sortDirection,
  onSort,
  isFiltered = false,
  onResetFilters,
}: LeadsTableViewProps) {
  function renderSortIcon(key: SortKey) {
    if (sortKey === key) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="size-3.5 text-primary" />
      ) : (
        <ArrowDown className="size-3.5 text-primary" />
      )
    }
    return <ArrowUpDown className="size-3.5 text-muted-foreground" />
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/60 border-b border-border text-xs text-muted-foreground">
            <tr>
              {/* Customer / Project */}
              <th
                scope="col"
                onClick={() => onSort('customerName')}
                className="text-left px-4 py-3.5 font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>ลูกค้า / โครงการ</span>
                  {renderSortIcon('customerName')}
                </div>
              </th>

              {/* Phone */}
              <th
                scope="col"
                onClick={() => onSort('customerPhone')}
                className="text-left px-4 py-3.5 font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>เบอร์โทรศัพท์</span>
                  {renderSortIcon('customerPhone')}
                </div>
              </th>

              {/* Channel */}
              <th
                scope="col"
                onClick={() => onSort('source')}
                className="text-left px-4 py-3.5 font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>ช่องทาง</span>
                  {renderSortIcon('source')}
                </div>
              </th>

              {/* Branch */}
              <th scope="col" className="text-left px-4 py-3.5 font-semibold text-foreground">
                สาขา
              </th>

              {/* AE Actor */}
              <th scope="col" className="text-left px-4 py-3.5 font-semibold text-foreground">
                AE ผู้ดูแล
              </th>

              {/* Interest */}
              <th
                scope="col"
                onClick={() => onSort('interest')}
                className="text-left px-4 py-3.5 font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>ความต้องการ / สินค้า</span>
                  {renderSortIcon('interest')}
                </div>
              </th>

              {/* Deal Value */}
              <th
                scope="col"
                onClick={() => onSort('dealValueSatang')}
                className="text-right px-4 py-3.5 font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>งบประมาณ / มูลค่า</span>
                  {renderSortIcon('dealValueSatang')}
                </div>
              </th>

              {/* Stage Status */}
              <th
                scope="col"
                onClick={() => onSort('status')}
                className="text-left px-4 py-3.5 font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>สถานะ</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              {/* Last Updated */}
              <th
                scope="col"
                onClick={() => onSort('updatedAt')}
                className="text-left px-4 py-3.5 font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>อัปเดตล่าสุด</span>
                  {renderSortIcon('updatedAt')}
                </div>
              </th>

              {/* Actions */}
              <th
                scope="col"
                className="text-right px-4 py-3.5 font-semibold text-foreground"
              >
                การดำเนินการ
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-1">
                      <Filter className="size-5" />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      ไม่พบข้อมูล Lead ที่ตรงกับเงื่อนไข
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ลองปรับเปลี่ยนคำค้นหา หรือล้างตัวกรองสถานะ/ช่องทาง
                    </p>
                    {isFiltered && onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/15 transition-colors"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>ล้างตัวกรองทั้งหมด</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              leads.map(lead => {
                const sourceInfo = getSourceBadge(lead.source)
                const dealSatang = getLeadDealSatang(lead)
                const stale =
                  isStale(lead.updatedAt) &&
                  lead.status !== 'won' &&
                  lead.status !== 'lost'
                const interestSnippet = getInterestSnippet(lead.interest)

                // Derive Branch display
                const branchDisplay =
                  lead.branch ||
                  (lead.channelRef?.startsWith('BR-')
                    ? lead.channelRef
                    : 'สำนักงานใหญ่')

                // Derive AE Actor display
                const aeName =
                  lead.ownerName ||
                  (lead.ownerId ? `AE-${lead.ownerId.slice(0, 4)}` : 'AE ฝ่ายขาย')
                const aeInitials =
                  aeName
                    .split(' ')
                    .map(p => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'AE'

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    {/* Customer / Project */}
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/wds/leads/${lead.id}`}
                        className="block font-semibold text-foreground group-hover:text-primary transition-colors"
                      >
                        {lead.customerName || '(ยังไม่ระบุชื่อลูกค้า)'}
                      </Link>
                      {lead.company && lead.company !== lead.customerName && (
                        <div className="text-xs text-muted-foreground">
                          {lead.company}
                        </div>
                      )}
                      {lead.channelRef && (
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {lead.channelRef}
                        </div>
                      )}
                    </td>

                    {/* Phone Number with Quick Call Button */}
                    <td className="px-4 py-3.5">
                      {lead.customerPhone ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${lead.customerPhone}`}
                            className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="กดโทรด่วนหาลูกค้า"
                          >
                            <PhoneCall className="size-3.5" />
                          </a>
                          <span className="font-mono text-xs text-foreground">
                            {formatPhone(lead.customerPhone)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Channel */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs',
                          sourceInfo.style
                        )}
                      >
                        {sourceInfo.icon}
                        <span>{sourceInfo.label}</span>
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {branchDisplay}
                      </span>
                    </td>

                    {/* AE Actor */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2" title={`ผู้ดูแล: ${aeName}`}>
                        <div className="size-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {aeInitials}
                        </div>
                        <span className="text-xs text-foreground font-medium truncate max-w-[100px]">
                          {aeName}
                        </span>
                      </div>
                    </td>

                    {/* Interest / Products */}
                    <td className="px-4 py-3.5">
                      {interestSnippet ? (
                        <span
                          className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]"
                          title={interestSnippet}
                        >
                          {interestSnippet}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Budget / Deal Value */}
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs tabular-nums">
                      ฿{satangToBaht(dealSatang)}
                    </td>

                    {/* Status Badge + Stale Pill */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={lead.status as any} />

                        {stale && (
                          <span
                            className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-[11px] font-semibold animate-pulse"
                            title="ค้างนานเกิน 7 วัน"
                          >
                            ⏰ ค้างนาน
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Updated (Formatted in Thai Buddhist Era) */}
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(lead.updatedAt).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.customerPhone && (
                          <a
                            href={`tel:${lead.customerPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium transition-colors"
                            title="โทรหาลูกค้าทันที"
                          >
                            <PhoneCall className="size-3" />
                            <span>โทร</span>
                          </a>
                        )}
                        <Link
                          href={`/wds/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                        >
                          <span>รายละเอียด</span>
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
