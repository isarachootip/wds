'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldCheck, UserCheck, Wrench, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react'
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
    <div className="w-full max-w-md mx-auto relative z-10">
      {/* Cruip Artifact Style Auth Card */}
      <div className="bg-card border border-border/80 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
        {/* Thai Watsadu Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-600 text-white font-black text-xl shadow-md shadow-red-600/20 mb-1">
            TW
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            เข้าสู่ระบบ WDS Platform
          </h1>
          <p className="text-xs text-muted-foreground">
            Thai Watsadu Wholesale &amp; Direct Sales Enterprise
          </p>
        </div>

        {/* Standalone VPS Notice */}
        {!isConfigured && (
          <div className="p-3.5 bg-primary/5 border border-primary/20 text-foreground text-xs rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-primary">โหมด Standalone VPS:</span>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                เลือกบทบาทด้านล่างเพื่อเข้าสู่ระบบทดสอบได้ทันทีโดยไม่ต้องระบุรหัสผ่าน
              </p>
            </div>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">อีเมลพนักงาน</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={isConfigured}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                placeholder="name@thaiwatsadu.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={isConfigured}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-600 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 shadow-xs transition-all"
          >
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Standalone VPS Role Switcher */}
        {!isConfigured && (
          <div className="pt-5 border-t border-border/60 space-y-2.5">
            <p className="text-xs text-center font-medium text-muted-foreground">
              เข้าสู่ระบบด่วนตามบทบาท (Quick Access)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => loginStandalone('admin')}
                className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border bg-card hover:bg-muted/80 hover:border-border text-foreground transition-all shadow-xs group text-left"
              >
                <ShieldCheck className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold truncate">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => loginStandalone('sales')}
                className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border bg-card hover:bg-muted/80 hover:border-border text-foreground transition-all shadow-xs group text-left"
              >
                <UserCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold truncate">Sales / AE</span>
              </button>
              <button
                type="button"
                onClick={() => loginStandalone('technician')}
                className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border bg-card hover:bg-muted/80 hover:border-border text-foreground transition-all shadow-xs group text-left"
              >
                <Wrench className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold truncate">ช่างหน้างาน</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <p className="text-center text-[11px] text-muted-foreground mt-6">
        © {new Date().getFullYear()} Thai Watsadu Co., Ltd. Central Retail Corporation
      </p>
    </div>
  )
}
