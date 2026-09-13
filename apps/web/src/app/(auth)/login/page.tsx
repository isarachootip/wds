'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

import { loginStandalone } from './actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co')
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!isConfigured) {
      await loginStandalone('admin')
      return
    }

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
        setLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      console.error('[Login] Client error:', err)
      setError(err?.message || 'ไม่สามารถเชื่อมต่อระบบ Authentication ได้')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            WDS เข้าสู่ระบบ
          </h1>
          <p className="text-xs text-slate-500 mt-1">Thai Watsadu Wholesale & Direct Sales</p>
        </div>

        {!isConfigured && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-md">
            ℹ️ โหมด <strong>Standalone (Coolify VPS)</strong>: สามารถกดเข้าสู่ระบบเพื่อใช้งานระบบได้ทันที
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required={isConfigured}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="admin@thaiwatsadu.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required={isConfigured}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {!isConfigured && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2 text-center font-medium">เข้าสู่ระบบด่วนตามบทบาท (Quick Access)</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => loginStandalone('admin')}
                className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => loginStandalone('sales')}
                className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
              >
                💼 Sales
              </button>
              <button
                type="button"
                onClick={() => loginStandalone('technician')}
                className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
              >
                🔧 ช่างหน้างาน
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
