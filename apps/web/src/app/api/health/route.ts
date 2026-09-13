import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  const start = Date.now()
  let dbStatus = 'ok'
  let dbLatencyMs = 0

  try {
    const db = getDb()
    const t0 = Date.now()
    await db.execute(sql`SELECT 1`)
    dbLatencyMs = Date.now() - t0
  } catch (e) {
    dbStatus = 'error'
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded'
  const code = status === 'ok' ? 200 : 503

  return NextResponse.json(
    {
      status,
      ts: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      uptime: Math.round(process.uptime()),
      db: { status: dbStatus, latencyMs: dbLatencyMs },
      env: process.env.NODE_ENV,
    },
    { status: code }
  )
}
