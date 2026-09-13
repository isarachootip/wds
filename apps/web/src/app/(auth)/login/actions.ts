'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginStandalone(role: string = 'admin') {
  const cookieStore = await cookies()
  cookieStore.set('wds_session', JSON.stringify({ role, user: 'admin@thaiwatsadu.com' }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  redirect('/wds/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('wds_session')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {}
  }
  redirect('/login')
}
