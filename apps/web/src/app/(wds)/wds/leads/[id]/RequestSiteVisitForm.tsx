'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function RequestSiteVisitForm({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition()
  const [purpose, setPurpose] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!purpose.trim()) {
      setError('กรุณาระบุวัตถุประสงค์')
      return
    }
    setError('')
    startTransition(async () => {
      const { requestSiteVisitAction } = await import('@/modules/crm/actions')
      const result = await requestSiteVisitAction({ leadId, purpose }, 'sales-ae')
      if (result.success) setSuccess(true)
      else setError(result.error ?? 'เกิดข้อผิดพลาดในการขอสำรวจ')
    })
  }

  if (success) {
    return (
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        ✅ ส่งคำขอสำรวจหน้างานเรียบร้อยแล้ว
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">วัตถุประสงค์การสำรวจ</label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={2}
          className="w-full border border-input bg-background rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          placeholder="อธิบายวัตถุประสงค์ในการเข้าสำรวจ..."
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={isPending || !purpose.trim()}
        size="sm"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
      >
        {isPending ? 'กำลังส่ง...' : '🏠 ยืนยันขอสำรวจ'}
      </Button>
    </form>
  )
}
