'use client'

import { useState, useTransition } from 'react'
import { satangToBaht } from '@/lib/qt-calc'

type Props = {
  quotationId: string
  customerPhone: string | null
  totalSatang: number
}

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 3) + 'xxx' + phone.slice(-2)
}

export function AcceptFlow({ quotationId, customerPhone, totalSatang }: Props) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<'confirm' | 'otp' | 'done'>('confirm')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [orderInfo, setOrderInfo] = useState<{ orderId: string } | null>(null)

  async function handleRequestOtp() {
    if (!customerPhone) { setError('ไม่พบเบอร์โทรศัพท์ลูกค้า'); return }
    setError('')
    startTransition(async () => {
      const { requestOtpAction } = await import('@/modules/ordering/actions')
      const result = await requestOtpAction(quotationId, customerPhone)
      if (!result.success) { setError(result.error ?? 'เกิดข้อผิดพลาด'); return }
      // Development: show OTP (production: send via SMS)
      if (result.otp) setDevOtp(result.otp)
      setStep('otp')
    })
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) { setError('กรุณากรอก OTP 6 หลัก'); return }
    setError('')
    startTransition(async () => {
      const ip = 'unknown'
      const ua = navigator.userAgent
      const { acceptQuotationAction } = await import('@/modules/ordering/actions')
      const result = await acceptQuotationAction(quotationId, otp, ip, ua)
      if (!result.success) { setError(result.error ?? 'เกิดข้อผิดพลาด'); return }
      setOrderInfo({ orderId: result.orderId ?? '' })
      setStep('done')
    })
  }

  if (step === 'done') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <p className="text-green-700 font-bold text-lg">ยืนยันการสั่งซื้อสำเร็จ!</p>
        <p className="text-green-600 text-sm mt-2">
          ยอดรวม: ฿{satangToBaht(totalSatang)}
        </p>
        <p className="text-gray-500 text-xs mt-3">
          เจ้าหน้าที่จะติดต่อกลับเร็วๆ นี้
        </p>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-2">ยืนยันด้วย OTP</h3>
        <p className="text-sm text-gray-500 mb-4">
          ส่งรหัสไปที่เบอร์ {customerPhone ? maskPhone(customerPhone) : 'ไม่ระบุ'}
        </p>

        {/* Dev mode: show OTP */}
        {devOtp && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700 font-medium">🔧 [DEV MODE] รหัส OTP: <span className="font-bold text-lg">{devOtp}</span></p>
            <p className="text-xs text-yellow-600 mt-0.5">Phase 5: จะส่ง SMS จริง</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">รหัส OTP 6 หลัก</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-xl text-center tracking-widest font-mono"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleVerifyOtp}
            disabled={isPending || otp.length !== 6}
            className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-green-700 transition-colors"
          >
            {isPending ? '⏳ กำลังยืนยัน...' : '✅ ยืนยันยอมรับ'}
          </button>
          <button onClick={() => { setStep('confirm'); setOtp(''); setDevOtp(null) }}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
            ย้อนกลับ
          </button>
        </div>
      </div>
    )
  }

  // step === 'confirm'
  return (
    <div className="bg-white rounded-xl border border-green-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-1">✅ ยอมรับใบเสนอราคา</h3>
      <p className="text-sm text-gray-500 mb-4">
        ยอดรวมสุทธิ: <span className="font-bold text-green-600">฿{satangToBaht(totalSatang)}</span>
      </p>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button
        onClick={handleRequestOtp}
        disabled={isPending}
        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl text-base hover:bg-green-700 disabled:opacity-50 transition-colors active:scale-95"
      >
        {isPending ? '⏳ กำลังส่ง OTP...' : '🔐 ยืนยันด้วย OTP'}
      </button>
    </div>
  )
}
