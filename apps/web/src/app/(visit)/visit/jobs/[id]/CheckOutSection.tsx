'use client'

import { useState, useRef, useTransition } from 'react'

type Photo = { id: string; kind: string }
type ChecklistItem = { id: string; checked: boolean }

type Props = {
  jobId: string
  photos: Photo[]
  checklists: ChecklistItem[]
  onSuccess: () => void
}

export function CheckOutSection({ jobId, photos, checklists, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showCheckout, setShowCheckout] = useState(false)
  const [signed, setSigned] = useState(false)
  const [nextAction, setNextAction] = useState('')
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)

  const afterPhotos = photos.filter(p => p.kind === 'after')
  const uncheckedItems = checklists.filter(c => !c.checked)
  const missingItems: string[] = []
  if (afterPhotos.length === 0) missingItems.push('รูปถ่ายหลังงาน อย่างน้อย 1 รูป')
  if (uncheckedItems.length > 0) missingItems.push(`Checklist อีก ${uncheckedItems.length} รายการ`)
  if (!signed) missingItems.push('ลายเซ็นลูกค้า')

  const canCheckout = missingItems.length === 0

  // Canvas drawing
  function startDraw(e: React.PointerEvent) {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    drawingRef.current = true
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }
  function draw(e: React.PointerEvent) {
    if (!drawingRef.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }
  function endDraw() {
    drawingRef.current = false
    const canvas = canvasRef.current!
    // Check if canvas has content
    const ctx = canvas.getContext('2d')!
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const hasContent = data.data.some((v, i) => i % 4 === 3 && v > 0)
    setSigned(hasContent)
  }
  function clearSignature() {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setSigned(false)
  }

  async function handleCheckout() {
    if (!canCheckout) { setError('กรุณาดำเนินการให้ครบก่อน'); return }
    setError('')

    const canvas = canvasRef.current!
    const signatureDataUrl = canvas.toDataURL('image/png')
    // In production: upload signature to Supabase Storage
    const signaturePath = `signatures/${jobId}/${Date.now()}.png`

    startTransition(async () => {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      ).catch(() => null)

      const { checkoutJobAction } = await import('@/modules/visit/actions')
      const result = await checkoutJobAction(jobId, {
        lat: pos?.coords.latitude ?? 0,
        lng: pos?.coords.longitude ?? 0,
        signaturePath,
        nextAction: nextAction || undefined,
      }, 'current-user-id')

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error ?? 'เกิดข้อผิดพลาด')
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <button
        onClick={() => setShowCheckout(s => !s)}
        className="w-full p-4 flex items-center justify-between"
      >
        <span className="font-semibold text-gray-900">📋 Check-out</span>
        <span className="text-gray-400">{showCheckout ? '▲' : '▼'}</span>
      </button>

      {showCheckout && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {/* Validation checklist */}
          {missingItems.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-700 mb-1">⚠️ ยังขาด:</p>
              <ul className="space-y-0.5">
                {missingItems.map(m => (
                  <li key={m} className="text-sm text-red-600">• {m}</li>
                ))}
              </ul>
            </div>
          )}

          {canCheckout && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700 font-medium">✅ พร้อม Check-out</p>
            </div>
          )}

          {/* Customer signature */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">ลายเซ็นลูกค้า</p>
            <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={340}
                height={150}
                className="w-full touch-none cursor-crosshair"
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">ลายเซ็น</span>
              <button onClick={clearSignature} className="text-xs text-red-500 underline">ล้าง</button>
            </div>
          </div>

          {/* Next action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">การดำเนินการถัดไป (ไม่บังคับ)</label>
            <textarea
              value={nextAction}
              onChange={e => setNextAction(e.target.value)}
              rows={2}
              placeholder="เช่น: ต้องสั่งวัสดุเพิ่ม, นัดติดตั้งครั้งถัดไป..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={!canCheckout || isPending}
            className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl text-base hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isPending ? '🔄 กำลัง Check-out...' : '✅ Check-out — ส่งรายงาน'}
          </button>
        </div>
      )}
    </div>
  )
}
