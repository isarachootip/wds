'use client'

import React, { useState } from 'react'
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SeedButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const router = useRouter()

  async function handleSeed() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setResult({ success: true, message: 'ใส่ข้อมูลตัวอย่างเรียบร้อยแล้ว!' })
        router.refresh()
      } else {
        setResult({ success: false, message: data.error || 'เกิดข้อผิดพลาดในการใส่ข้อมูล' })
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message || 'ไม่สามารถเชื่อมต่อ Server ได้' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-xs font-semibold shadow-xs transition-colors"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Database className="w-3.5 h-3.5" />
        )}
        <span>{loading ? 'กำลังใส่ข้อมูล...' : 'ใส่ข้อมูลตัวอย่าง (Seed Sample Data)'}</span>
      </button>

      {result && (
        <span
          className={`text-xs font-medium flex items-center gap-1.5 ${
            result.success ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          <span>{result.message}</span>
        </span>
      )}
    </div>
  )
}
