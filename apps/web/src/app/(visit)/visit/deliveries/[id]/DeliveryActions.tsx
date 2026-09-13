'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  deliveryId: string
  orderId: string
  currentStatus: string
  attempt: number
}

export function DeliveryActions({ deliveryId, orderId, currentStatus, attempt }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [step, setStep] = useState<'idle' | 'pod' | 'fail'>('idle')
  const [receiverName, setReceiverName] = useState('')
  const [podDataUrl, setPodDataUrl] = useState<string | null>(null)
  const [failReason, setFailReason] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const actorId = 'current-driver-id'
  const actorRole = 'technician'

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPodDataUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleStatusUpdate(newStatus: 'picking' | 'shipped') {
    setError('')
    startTransition(async () => {
      const { updateDeliveryStatusAction } = await import('@/modules/billing/actions')
      const r = await updateDeliveryStatusAction(deliveryId, newStatus, actorId)
      if (!r.success) setError(r.error ?? 'เกิดข้อผิดพลาด')
      else router.refresh()
    })
  }

  async function handleDelivered() {
    if (!podDataUrl) { setError('กรุณาถ่ายรูป POD ก่อน'); return }
    if (!receiverName.trim()) { setError('กรุณากรอกชื่อผู้รับ'); return }
    setError('')
    startTransition(async () => {
      const { markDeliveredAction } = await import('@/modules/billing/actions')
      // In production: upload podDataUrl to Supabase Storage, get path
      // For now, use data URL as placeholder
      const podPath = `deliveries/${deliveryId}/pod_${Date.now()}.jpg`
      const r = await markDeliveredAction({
        deliveryId,
        orderId,
        podPath,
        receiverName,
        actorId,
        actorRole,
      })
      if (!r.success) setError(r.error ?? 'เกิดข้อผิดพลาด')
      else router.push('/visit/deliveries')
    })
  }

  async function handleFail() {
    if (!failReason.trim()) { setError('กรุณาระบุเหตุผล'); return }
    setError('')
    startTransition(async () => {
      const { failDeliveryAction } = await import('@/modules/billing/actions')
      const r = await failDeliveryAction({ deliveryId, orderId, failReason, actorId })
      if (!r.success) setError(r.error ?? 'เกิดข้อผิดพลาด')
      else router.push('/visit/deliveries')
    })
  }

  if (currentStatus === 'delivered') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-green-700 font-bold">ส่งมอบสำเร็จแล้ว</p>
      </div>
    )
  }

  // POD capture step
  if (step === 'pod') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">📸 ถ่ายรูปหลักฐานการส่ง (POD)</h3>

        {/* Photo */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${podDataUrl ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}>
          {podDataUrl ? (
            <img src={podDataUrl} alt="POD" className="max-h-48 mx-auto rounded-lg object-cover" />
          ) : (
            <div>
              <p className="text-4xl mb-2">📷</p>
              <p className="text-sm text-gray-500">แตะเพื่อถ่ายรูปหรือเลือกรูป</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
            onChange={handlePhotoSelect} className="hidden" />
        </div>

        {/* Receiver name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้รับ</label>
          <input type="text" value={receiverName} onChange={e => setReceiverName(e.target.value)}
            placeholder="ชื่อ-นามสกุลผู้รับของ"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button onClick={() => { setStep('idle'); setError('') }}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
            ย้อนกลับ
          </button>
          <button onClick={handleDelivered} disabled={isPending || !podDataUrl || !receiverName}
            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl text-sm disabled:opacity-40 hover:bg-green-700">
            {isPending ? '⏳ กำลังบันทึก...' : '✅ ยืนยันส่งสำเร็จ'}
          </button>
        </div>
      </div>
    )
  }

  // Fail reason step
  if (step === 'fail') {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">❌ ส่งไม่สำเร็จ</h3>
        {attempt >= 2 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-700 font-medium">⚠️ ครั้งที่ {attempt + 1} — หากไม่สำเร็จอีกครั้ง ระบบจะแจ้ง Manager</p>
          </div>
        )}
        <textarea value={failReason} onChange={e => setFailReason(e.target.value)} rows={3}
          placeholder="ระบุเหตุผล เช่น ไม่มีคนรับ, ที่อยู่ผิด..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm" autoFocus />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => { setStep('idle'); setError('') }}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-sm">ยกเลิก</button>
          <button onClick={handleFail} disabled={isPending}
            className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-40">
            {isPending ? '...' : 'บันทึกไม่สำเร็จ'}
          </button>
        </div>
      </div>
    )
  }

  // Main actions
  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

      {currentStatus === 'scheduled' && (
        <button onClick={() => handleStatusUpdate('picking')} disabled={isPending}
          className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl text-base hover:bg-purple-700 disabled:opacity-50 active:scale-98">
          {isPending ? '⏳...' : '📦 เริ่มเตรียมสินค้า'}
        </button>
      )}

      {currentStatus === 'picking' && (
        <button onClick={() => handleStatusUpdate('shipped')} disabled={isPending}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl text-base hover:bg-indigo-700 disabled:opacity-50 active:scale-98">
          {isPending ? '⏳...' : '🚚 ออกเดินทางแล้ว'}
        </button>
      )}

      {currentStatus === 'shipped' && (
        <button onClick={() => setStep('pod')}
          className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl text-base hover:bg-green-700 active:scale-98">
          ✅ ส่งสำเร็จ + ถ่ายรูป POD
        </button>
      )}

      {['scheduled','picking','shipped'].includes(currentStatus) && (
        <button onClick={() => setStep('fail')}
          className="w-full py-3.5 border border-red-200 text-red-600 rounded-2xl text-sm hover:bg-red-50">
          ❌ ส่งไม่สำเร็จ
        </button>
      )}

      {currentStatus === 'failed' && (
        <div className="space-y-3">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
            <p className="text-orange-700 text-sm font-medium">ส่งไม่สำเร็จ ครั้งที่ {attempt}</p>
          </div>
          <button onClick={() => handleStatusUpdate('picking')} disabled={isPending}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl text-base disabled:opacity-50">
            {isPending ? '⏳...' : '🔄 ลองส่งใหม่อีกครั้ง'}
          </button>
        </div>
      )}
    </div>
  )
}
