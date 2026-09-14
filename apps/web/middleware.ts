import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Rate Limiting (in-memory sliding window) ────────────────────────────────
// NOTE: Use Upstash Redis for multi-instance production deployments
type RateLimitEntry = { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  '/api/line/': { windowMs: 60_000, max: 100 },
  '/api/portal/': { windowMs: 60_000, max: 20 },
  '/portal/': { windowMs: 60_000, max: 60 },
  '/api/auth/otp': { windowMs: 60_000, max: 5 },
  '/api/otp': { windowMs: 60_000, max: 5 },
}

function getRateLimitKey(ip: string, prefix: string): string {
  return `${prefix}:${ip}`
}

function checkRateLimit(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? '127.0.0.1'
  const now = Date.now()

  for (const [prefix, { windowMs, max }] of Object.entries(RATE_LIMITS)) {
    if (!pathname.startsWith(prefix)) continue

    const key = getRateLimitKey(ip, prefix)
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
      return null // OK
    }

    entry.count++
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      )
    }
    return null // OK
  }
  return null // No limit applies
}

// Cleanup old entries periodically (every 5 minutes)
if (typeof globalThis !== 'undefined') {
  // @ts-ignore
  if (!globalThis.__rl_cleanup) {
    // @ts-ignore
    globalThis.__rl_cleanup = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetAt) rateLimitStore.delete(key)
      }
    }, 5 * 60 * 1000)
  }
}

// ─── Public Routes ────────────────────────────────────────────────────────────
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/portal']

type AppRole = 'admin' | 'sales' | 'sales_manager' | 'coordinator' | 'technician' | 'accounting' | 'warehouse' | 'customer'

function getRedirectPath(roles: AppRole[]): string {
  if (roles.includes('technician')) return '/visit/dashboard'
  if (roles.includes('customer')) return '/portal'
  return '/wds/dashboard'
}

export async function middleware(request: NextRequest) {
  // 1. Rate limiting check first
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const pathname = request.nextUrl.pathname

  // 2. Allow public routes and API routes without auth immediately
  // 3. Standalone / VPS Direct Session Check
  const wdsSession = request.cookies.get('wds_session')?.value
  if (wdsSession) {
    let sessionRole: AppRole = 'admin'
    try {
      const parsed = JSON.parse(wdsSession)
      sessionRole = parsed.role || 'admin'
    } catch {}

    if (pathname === '/' || pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = getRedirectPath([sessionRole])
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/wds') && sessionRole === 'technician') {
      const url = request.nextUrl.clone()
      url.pathname = '/visit/dashboard'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/visit') && sessionRole === 'customer') {
      const url = request.nextUrl.clone()
      url.pathname = '/portal'
      return NextResponse.redirect(url)
    }

    return NextResponse.next({ request })
  }

  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname.startsWith('/api/')) {
    return NextResponse.next({ request })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase credentials are missing, redirect to login with graceful fallback
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder.supabase.co')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Not authenticated → login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: userRolesData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    const roles: AppRole[] = (userRolesData ?? []).flatMap(ur => {
      const rolesField = ur.roles as { name: string } | { name: string }[] | null
      if (!rolesField) return []
      if (Array.isArray(rolesField)) return rolesField.map(r => r.name as AppRole)
      return [rolesField.name as AppRole]
    })

    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = getRedirectPath(roles)
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/wds') && roles.includes('technician') && !roles.includes('admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/visit/dashboard'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/visit') && roles.includes('customer')) {
      const url = request.nextUrl.clone()
      url.pathname = '/portal'
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error('[Middleware] Supabase auth check error:', err)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
