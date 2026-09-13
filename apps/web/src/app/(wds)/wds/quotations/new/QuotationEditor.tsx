'use client'

import { useState, useTransition } from 'react'
import { calculateQuotation, bahtToSatang, satangToBaht, type VatMode } from '@/lib/qt-calc'
import { useRouter } from 'next/navigation'

type LineItem = {
  id: string
  description: string
  qty: number
  unit: string
  unitPriceSatang: number
  discountSatang: number
  amountSatang: number
  sort: number
}

type Customer = { id: string; name: string; phone?: string | null }

type Props = {
  initialItems: LineItem[]
  customers: Customer[]
  jobId?: string
}

export function QuotationEditor({ initialItems, customers, jobId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState<LineItem[]>(initialItems)
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [billDiscountBaht, setBillDiscountBaht] = useState('0')
  const [vatRate, setVatRate] = useState(7)
  const [vatMode, setVatMode] = useState<VatMode>('exclusive')
  const [terms, setTerms] = useState('ชำระเงินภายใน 30 วัน')
  const [note, setNote] = useState('')
  const [validDays, setValidDays] = useState(30)
  const [error, setError] = useState('')

  const lineInputs = items.map(i => ({
    qty: i.qty,
    unitPriceSatang: i.unitPriceSatang,
    discountSatang: i.discountSatang,
  }))
  const billDiscount = bahtToSatang(billDiscountBaht)
  const calc = calculateQuotation(lineInputs, billDiscount, vatRate, vatMode)

  function updateItem(id: string, field: keyof LineItem, value: any) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      updated.amountSatang = updated.qty * updated.unitPriceSatang - updated.discountSatang
      return updated
    }))
  }

  function addItem() {
    const newItem: LineItem = {
      id: `new-${Date.now()}`,
      description: '',
      qty: 1,
      unit: 'ชิ้น',
      unitPriceSatang: 0,
      discountSatang: 0,
      amountSatang: 0,
      sort: items.length,
    }
    setItems(prev => [...prev, newItem])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/portal/q/${token}`
    navigator.clipboard.writeText(url).catch(() => {})
    alert(`คัดลอกลิงก์แล้ว:\n${url}`)
  }

  async function handleSaveAndSend() {
    setError('')
    if (!customerId) { setError('กรุณาเลือกลูกค้า'); return }
    if (items.length === 0) { setError('กรุณาเพิ่มรายการ'); return }

    startTransition(async () => {
      try {
        const { createQuotationFromJobAction, sendQuotationAction } = await import('@/modules/ordering/actions')

        let result
        if (jobId) {
          result = await createQuotationFromJobAction(jobId, customerId, undefined, 'current-user-id')
        } else {
          // Direct creation (no job) — simplified for now
          result = { success: false, error: 'กรุณาสร้าง QT ผ่านหน้างาน (มี jobId)' }
        }

        if (!result.success || !result.quotationId) {
          setError(result.error ?? 'เกิดข้อผิดพลาด')
          return
        }

        // Send QT
        const sendResult = await sendQuotationAction(result.quotationId, 'current-user-id')
        if (!sendResult.success) {
          setError(sendResult.error ?? 'ไม่สามารถส่งได้')
          return
        }

        if (sendResult.publicToken) copyLink(sendResult.publicToken)
        router.push('/wds/quotations')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Customer selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลลูกค้า</h3>
        <select
          value={customerId}
          onChange={e => setCustomerId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">เลือกลูกค้า...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">รายการสินค้า/บริการ</h3>
          <button onClick={addItem}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100">
            + เพิ่มรายการ
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600 w-8">#</th>
                <th className="text-left p-3 font-medium text-gray-600">รายการ</th>
                <th className="text-right p-3 font-medium text-gray-600 w-16">จำนวน</th>
                <th className="text-center p-3 font-medium text-gray-600 w-16">หน่วย</th>
                <th className="text-right p-3 font-medium text-gray-600 w-28">ราคา/หน่วย</th>
                <th className="text-right p-3 font-medium text-gray-600 w-24">ส่วนลด</th>
                <th className="text-right p-3 font-medium text-gray-600 w-28">จำนวนเงิน</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="p-2 text-gray-400 text-center">{i + 1}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      placeholder="ชื่อสินค้า/บริการ"
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input type="number" min="1" value={item.qty}
                      onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                      className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-right" />
                  </td>
                  <td className="p-2">
                    <input type="text" value={item.unit}
                      onChange={e => updateItem(item.id, 'unit', e.target.value)}
                      className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center" />
                  </td>
                  <td className="p-2">
                    <input type="number" min="0" step="0.01"
                      value={item.unitPriceSatang / 100}
                      onChange={e => updateItem(item.id, 'unitPriceSatang', Math.round(parseFloat(e.target.value || '0') * 100))}
                      className="w-28 border border-gray-200 rounded px-2 py-1 text-sm text-right" />
                  </td>
                  <td className="p-2">
                    <input type="number" min="0" step="0.01"
                      value={item.discountSatang / 100}
                      onChange={e => updateItem(item.id, 'discountSatang', Math.round(parseFloat(e.target.value || '0') * 100))}
                      className="w-24 border border-gray-200 rounded px-2 py-1 text-sm text-right" />
                  </td>
                  <td className="p-2 text-right font-medium">
                    ฿{satangToBaht(item.qty * item.unitPriceSatang - item.discountSatang)}
                  </td>
                  <td className="p-2">
                    <button onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">ยังไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">สรุปยอด</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">ส่วนลดท้ายบิล (บาท)</label>
            <input type="number" min="0" step="0.01" value={billDiscountBaht}
              onChange={e => setBillDiscountBaht(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">VAT</label>
            <div className="flex gap-2">
              <select value={vatRate} onChange={e => setVatRate(parseInt(e.target.value))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value={0}>ไม่มี VAT</option>
                <option value={7}>VAT 7%</option>
              </select>
              <select value={vatMode} onChange={e => setVatMode(e.target.value as VatMode)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="exclusive">แยกนอก</option>
                <option value="inclusive">รวมใน</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calculated totals */}
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ราคารวม</span>
            <span>฿{satangToBaht(calc.subtotalSatang)}</span>
          </div>
          {calc.billDiscountSatang > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>ส่วนลดท้ายบิล</span>
              <span>-฿{satangToBaht(calc.billDiscountSatang)}</span>
            </div>
          )}
          {vatRate > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>VAT {vatRate}% ({vatMode === 'exclusive' ? 'แยกนอก' : 'รวมใน'})</span>
              <span>฿{satangToBaht(calc.vatAmountSatang)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2">
            <span>ยอดรวมสุทธิ</span>
            <span className="text-blue-600">฿{satangToBaht(calc.totalSatang)}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">เงื่อนไขและหมายเหตุ</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">เงื่อนไข</label>
            <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">หมายเหตุ</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">ใช้ได้กี่วัน</label>
            <input type="number" min="1" max="365" value={validDays}
              onChange={e => setValidDays(parseInt(e.target.value) || 30)}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <span className="text-xs text-gray-500 ml-2">วัน</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button onClick={() => window.history.back()}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          ยกเลิก
        </button>
        <button onClick={handleSaveAndSend} disabled={isPending}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isPending ? 'กำลังบันทึก...' : '✉️ บันทึกและส่ง QT'}
        </button>
      </div>
    </div>
  )
}
