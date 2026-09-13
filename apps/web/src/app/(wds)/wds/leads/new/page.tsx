'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
}

export default function NewLeadPage() {
  const router = useRouter()
  const [source, setSource] = useState<Source>('phone')
  const [channelRef, setChannelRef] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [interest, setInterest] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dupeWarnings, setDupeWarnings] = useState<DupeWarning[]>([])

  const channelRefLabel = source === 'line' ? 'LINE User ID' : source === 'phone' ? 'เบอร์โทรศัพท์' : 'รหัสสาขา'

  async function checkDedupe(ref: string) {
    if (!ref || ref.length < 5) return
    try {
      const res = await fetch(`/api/leads/check-dupe?channelRef=${encodeURIComponent(ref)}`)
      if (res.ok) {
        const data = await res.json()
        setDupeWarnings(data.dupes ?? [])
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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">บันทึก Lead ใหม่</h1>
        <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลลูกค้าที่ติดต่อเข้ามา</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Channel selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ช่องทางที่ติดต่อ</label>
          <div className="flex gap-2">
            {SOURCE_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSource(tab.key)}
                className={`flex-1 py-2.5 px-3 text-sm rounded-lg border transition-colors ${
                  source === tab.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Channel ref */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{channelRefLabel}</label>
          <input
            type="text"
            value={channelRef}
            onChange={e => setChannelRef(e.target.value)}
            onBlur={e => checkDedupe(e.target.value)}
            placeholder={source === 'phone' ? '0XX-XXX-XXXX' : source === 'line' ? 'U1234...' : ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Dedupe warning */}
          {dupeWarnings.length > 0 && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">⚠️ พบ Lead ที่มีข้อมูลนี้อยู่แล้ว</p>
              <ul className="mt-1 space-y-1">
                {dupeWarnings.map(w => (
                  <li key={w.leadId}>
                    <a href={`/wds/leads/${w.leadId}`} className="text-xs text-blue-600 underline">
                      ดู Lead เดิม (สถานะ: {w.status}) →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Customer info */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">ข้อมูลลูกค้า</h3>
          <div>
            <label className="block text-xs text-gray-600 mb-1">ชื่อลูกค้า / บริษัท</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ชื่อลูกค้าหรือชื่อบริษัท"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0XX-XXX-XXXX"
            />
          </div>
        </div>

        {/* Interest & Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ความต้องการ / สินค้าที่สนใจ</label>
          <textarea
            value={interest}
            onChange={e => setInterest(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="อธิบายสินค้าหรือบริการที่ลูกค้าสนใจ..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">งบประมาณต่ำสุด (บาท)</label>
            <input
              type="number"
              value={budgetMin}
              onChange={e => setBudgetMin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">งบประมาณสูงสุด (บาท)</label>
            <input
              type="number"
              value={budgetMax}
              onChange={e => setBudgetMax(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก Lead'}
          </button>
        </div>
      </form>
    </div>
  )
}
