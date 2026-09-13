import { NextRequest, NextResponse } from 'next/server'
import { processPendingEvents } from '@/workers/domain-events'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel: allow up to 60s

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const secret = request.headers.get('x-cron-secret')
    ?? request.nextUrl.searchParams.get('secret')

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const batchSize = Number(request.nextUrl.searchParams.get('batch') ?? '50')
    const result = await processPendingEvents(Math.min(batchSize, 200))

    return NextResponse.json({
      ok: true,
      ts: new Date().toISOString(),
      ...result,
    })
  } catch (e) {
    console.error('[cron/process-events] Error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
