import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const start = Date.now()
  let dbStatus = 'ok'
  let dbLatencyMs = 0
  let dbError: string | null = null

  try {
    const db = getDb()
    const t0 = Date.now()
    await db.execute(sql`SELECT 1`)
    dbLatencyMs = Date.now() - t0
  } catch (e: any) {
    dbStatus = 'error'
    dbError = e instanceof Error ? e.message : String(e)
    console.error('[Healthcheck] Database probe failed:', dbError)
  }

  const { searchParams } = new URL(request.url)
  const isStrict = searchParams.get('strict') === 'true'

  const status = dbStatus === 'ok' ? 'ok' : 'degraded'
  // When running inside container orchestration (Docker/Coolify), returning 503 triggers
  // immediate container rollback. We return 200 so the container stays alive and logs the error,
  // unless strict=true is explicitly requested.
  const code = isStrict && status !== 'ok' ? 503 : 200

  return NextResponse.json(
    {
      status,
      ts: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      uptime: Math.round(process.uptime()),
      db: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      env: process.env.NODE_ENV,
    },
    { status: code }
  )
}
