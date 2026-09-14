'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const SOURCE_TABS = [
  { key: 'line', label: '💬 LINE' },
  { key: 'phone', label: '📞 โทรศัพท์' },
  { key: 'store', label: '🏪 หน้าร้าน' },
  { key: 'other', label: '📋 อื่นๆ' },
] as const

type Source = 'line' | 'phone' | 'store' | 'other'

type DupeWarning = {
  leadId: string
  status: string
  source?: string
  customerName?: string | null
}

type MatchedCustomer = {
  id: string
  name: string
  phone: string | null
  code: string | null
}

export default function NewLeadPage() {
  const router = useRouter()
  const [source, setSource] = useState<Source>('phone')
  const [channelRef, setChannelRef] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [interest, setInterest] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dupeWarnings, setDupeWarnings] = useState<DupeWarning[]>([])
  const [matchedCustomers, setMatchedCustomers] = useState<MatchedCustomer[]>([])

  const channelRefLabel = source === 'line' ? 'LINE User ID' : source === 'phone' ? 'เบอร์โทรศัพท์' : 'รหัสสาขา'

  async function checkDedupe(refVal?: string, phoneVal?: string) {
    const ref = (refVal !== undefined ? refVal : channelRef).trim()
    const ph = (phoneVal !== undefined ? phoneVal : customerPhone).trim()
    if (!ref && !ph) {
      setDupeWarnings([])
      setMatchedCustomers([])
      return
    }
    try {
      const params = new URLSearchParams()
      if (ref) params.set('channelRef', ref)
      if (ph) params.set('phone', ph)
      const res = await fetch(`/api/leads/check-dupe?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDupeWarnings(data.dupes ?? [])
        setMatchedCustomers(data.customers ?? [])
        if (data.customers && data.customers.length > 0 && !customerName) {
          setCustomerName(data.customers[0].name)
          setSelectedCustomerId(data.customers[0].id)
        }
      }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { createLeadAction } = await import('@/modules/crm/actions')
      const result = await createLeadAction({
        customerId: selectedCustomerId || undefined,
        source,
        channelRef: channelRef || undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        budgetRangeMinSatang: budgetMin ? Math.round(parseFloat(budgetMin) * 100) : undefined,
        budgetRangeMaxSatang: budgetMax ? Math.round(parseFloat(budgetMax) * 100) : undefined,
        interest: interest ? { description: interest } : undefined,
        ownerId: 'current-user-id', // TODO: get from session in Phase 2
      })

      if (result.success && result.leadId) {
        router.push(`/wds/leads/${result.leadId}`)
      } else {
        setError(result.error ?? 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">บันทึก Lead ใหม่</h1>
        <p className="text-sm text-muted-foreground mt-1">กรอกข้อมูลลูกค้าที่ติดต่อเข้ามา</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs text-card-foreground">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Channel selector */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">ช่องทางที่ติดต่อ</label>
            <div className="flex gap-2">
              {SOURCE_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSource(tab.key)}
                  className={`flex-1 py-2.5 px-3 text-sm rounded-lg border transition-colors font-medium ${
                    source === tab.key
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel ref */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">{channelRefLabel}</label>
            <input
              type="text"
              value={channelRef}
              onChange={e => setChannelRef(e.target.value)}
              onBlur={e => checkDedupe(e.target.value)}
              placeholder={source === 'phone' ? '0XX-XXX-XXXX' : source === 'line' ? 'U1234...' : ''}
              className="w-full border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            {/* Dedupe warning */}
            {dupeWarnings.length > 0 && (
              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">⚠️ พบ Lead ที่มีข้อมูลนี้อยู่แล้ว</p>
                <ul className="mt-1 space-y-1">
                  {dupeWarnings.map(w => (
                    <li key={w.leadId}>
                      <a href={`/wds/leads/${w.leadId}`} className="text-xs text-primary hover:underline font-medium">
                        ดู Lead เดิม (สถานะ: {w.status}) →
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Customer info */}
          <div className="border border-border bg-muted/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground">ข้อมูลลูกค้า</h3>
              {selectedCustomerId && (
                <span className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
                  ผูกกับลูกค้าเดิมแล้ว
                </span>
              )}
            </div>

            {/* Matched Customer Alert */}
            {matchedCustomers.length > 0 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-1">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                  👤 พบประวัติลูกค้ารายเดิมในระบบ (ผูกข้อมูลอัตโนมัติ):
                </p>
                {matchedCustomers.map(mc => (
                  <div key={mc.id} className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400">
                    <span>
                      <strong className="font-semibold">{mc.name}</strong> ({mc.code ?? 'ลูกค้าทั่วไป'}) · โทร: {mc.phone ?? '-'}
                    </span>
                    <a
                      href={`/wds/customers/${mc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-blue-900 font-medium"
                    >
                      ดู Customer 360 ↗
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">ชื่อลูกค้า / บริษัท</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="ชื่อลูกค้าหรือชื่อบริษัท"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                onBlur={e => checkDedupe(undefined, e.target.value)}
                className="w-full border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="0XX-XXX-XXXX"
              />
            </div>
          </div>

          {/* Interest & Budget */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">ความต้องการ / สินค้าที่สนใจ</label>
            <textarea
              value={interest}
              onChange={e => setInterest(e.target.value)}
              rows={3}
              className="w-full border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="อธิบายสินค้าหรือบริการที่ลูกค้าสนใจ..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">งบประมาณต่ำสุด (บาท)</label>
              <input
                type="number"
                value={budgetMin}
                onChange={e => setBudgetMin(e.target.value)}
                className="w-full border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">งบประมาณสูงสุด (บาท)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={e => setBudgetMax(e.target.value)}
                className="w-full border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 py-2.5 border-border text-foreground hover:bg-muted transition-colors"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="thaiwatsadu"
              disabled={loading}
              className="flex-1 py-2.5 disabled:opacity-50 transition-colors font-medium shadow-xs"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
