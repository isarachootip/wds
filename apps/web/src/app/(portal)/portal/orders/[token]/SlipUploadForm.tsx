'use client'

import { useState, useTransition, useRef } from 'react'
import { satangToBaht } from '@/lib/qt-calc'

type Props = {
  orderId: string
  token: string
  orderTotalSatang: number
}

export function SlipUploadForm({ orderId, token, orderTotalSatang }: Props) {
  const [isPending, startTransition] = useTransition()
  const [slipDataUrl, setSlipDataUrl] = useState<string | null>(null)
  const [amountBaht, setAmountBaht] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-green-700 font-bold">ส่งสลิปแล้ว!</p>
        <p className="text-green-600 text-sm mt-1">ทีมบัญชีจะยืนยันภายใน 1-2 ชั่วโมง</p>
      </div>
    )
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setSlipDataUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!slipDataUrl) { setError('กรุณาแนบสลิป'); return }
    const amountSatang = Math.round(parseFloat(amountBaht || '0') * 100)
    if (amountSatang <= 0) { setError('กรุณากรอกจำนวนเงิน'); return }
    setError('')
    startTransition(async () => {
      const { customerUploadSlipAction } = await import('@/modules/billing/actions')
      // In production: upload to Supabase Storage first
      const slipPath = `portal/${orderId}/slip_${Date.now()}.jpg`
      const r = await customerUploadSlipAction({ orderId, token, slipPath, amountSatang })
      if (!r.success) setError(r.error ?? 'เกิดข้อผิดพลาด')
      else setDone(true)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">📎 แนบสลิปโอนเงิน</h3>
      <p className="text-sm text-gray-500">ยอดรวม: <span className="font-bold text-blue-600">฿{satangToBaht(orderTotalSatang)}</span></p>

      {/* Photo */}
      <div
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          ${slipDataUrl ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}>
        {slipDataUrl ? (
          <img src={slipDataUrl} alt="slip" className="max-h-40 mx-auto rounded-lg object-contain" />
        ) : (
          <div>
            <p className="text-3xl mb-2">📷</p>
            <p className="text-sm text-gray-500">แตะเพื่อถ่ายรูปหรือเลือกสลิป</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          onChange={handleFile} className="hidden" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงินที่โอน (บาท)</label>
        <input type="number" min="0" step="0.01" value={amountBaht}
          onChange={e => setAmountBaht(e.target.value)}
          placeholder="0.00"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-medium" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button onClick={handleSubmit} disabled={isPending || !slipDataUrl}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-base hover:bg-blue-700 disabled:opacity-40">
        {isPending ? '⏳ กำลังส่ง...' : '📤 ส่งสลิปให้ทีมบัญชี'}
      </button>
    </div>
  )
}
