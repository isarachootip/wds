'use client'

import { useState, useTransition } from 'react'
import { formatDistance } from '@/lib/geo'
import { enqueue } from '@/lib/offline-queue'

const MAX_DISTANCE_M = 300

type Props = {
  jobId: string
  siteLat?: number
  siteLng?: number
  onSuccess: () => void
}

export function CheckInButton({ jobId, siteLat, siteLng, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<'idle' | 'locating' | 'confirm' | 'reason'>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  async function handleCheckIn() {
    setStep('locating')
    setError('')
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
      )
      const { latitude: lat, longitude: lng } = pos.coords
      setCoords({ lat, lng })

      // Calculate distance if site coords known
      if (siteLat != null && siteLng != null) {
        const { haversineDistance } = await import('@/lib/geo')
        const d = Math.round(haversineDistance(lat, lng, siteLat, siteLng))
        setDistance(d)
        if (d > MAX_DISTANCE_M) {
          setStep('reason')
          return
        }
      }
      setStep('confirm')
    } catch {
      setError('ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึง GPS')
      setStep('idle')
    }
  }

  async function submitCheckIn(r?: string) {
    if (!coords) return
    setError('')

    const action = async () => {
      if (!navigator.onLine) {
        // Queue for later using built-in crypto.randomUUID()
        await enqueue({
          id: crypto.randomUUID(),
          action: 'checkin',
          payload: { jobId, lat: coords.lat, lng: coords.lng, reason: r, siteLat, siteLng },
        })
        onSuccess()
        return
      }

      const { checkInJobAction } = await import('@/modules/visit/actions')
      const result = await checkInJobAction(
        jobId, coords.lat, coords.lng, 'current-user-id', r, siteLat, siteLng
      )
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error ?? 'เกิดข้อผิดพลาด')
        setStep('idle')
      }
    }

    startTransition(action)
  }

  if (step === 'idle') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">📍 เริ่มปฏิบัติงาน</h3>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          onClick={handleCheckIn}
          data-testid="checkin-button"
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-base hover:bg-blue-700 active:scale-95 transition-all"
        >
          🏠 Site On — เริ่มงาน
        </button>
      </div>
    )
  }

  if (step === 'locating') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
        <div className="animate-spin text-3xl mb-2">🌐</div>
        <p className="text-gray-600">กำลังระบุตำแหน่ง GPS...</p>
      </div>
    )
  }

  if (step === 'reason') {
    return (
      <div className="bg-white rounded-2xl border border-orange-200 p-5">
        <div className="p-3 bg-orange-50 rounded-xl mb-4">
          <p className="text-orange-700 font-semibold">⚠️ นอกพื้นที่งาน</p>
          <p className="text-orange-600 text-sm mt-1">
            ระยะห่าง {distance != null ? formatDistance(distance) : '?'} (เกิน {MAX_DISTANCE_M} ม.)
          </p>
        </div>
        <p className="text-sm text-gray-700 mb-2">กรุณาระบุเหตุผล (บังคับ)</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="เช่น: ลูกค้าขอนัดจุดนี้, ที่จอดรถ, ฯลฯ"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-3"
        />
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => setStep('idle')}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
            ยกเลิก
          </button>
          <button
            onClick={() => {
              if (!reason.trim()) { setError('กรุณาระบุเหตุผล'); return }
              submitCheckIn(reason)
            }}
            disabled={isPending}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {isPending ? 'กำลัง Check-in...' : '✅ ยืนยัน Check-in'}
          </button>
        </div>
      </div>
    )
  }

  // confirm step
  return (
    <div className="bg-white rounded-2xl border border-blue-200 p-5">
      <div className="p-3 bg-blue-50 rounded-xl mb-4">
        <p className="text-blue-700 font-semibold">📍 ตำแหน่งของคุณ</p>
        {distance != null && (
          <p className="text-blue-600 text-sm mt-1">ระยะห่างจากหน้างาน: {formatDistance(distance)} ✅</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {coords?.lat.toFixed(5)}, {coords?.lng.toFixed(5)}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setStep('idle')}
          className="flex-1 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
          ยกเลิก
        </button>
        <button
          onClick={() => submitCheckIn()}
          disabled={isPending}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {isPending ? 'กำลัง Check-in...' : '🏠 ยืนยัน Site On'}
        </button>
      </div>
    </div>
  )
}
