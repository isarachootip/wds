import { NextRequest, NextResponse } from 'next/server'
import { verifyLineSignature } from '@/lib/line'
import { getDb } from '@/lib/db'
import { leads, leadActivities, followUps } from '@wds/db'
import { eq, and, isNull } from 'drizzle-orm'
import { emit } from '@/lib/events'
import { domainEvents } from '@wds/db'

export const runtime = 'nodejs'

// Must disable body parsing to get raw body for signature verification
export async function POST(request: NextRequest) {
  // 1. Read raw body — MUST be done before any parsing
  const rawBody = await request.text()
  const signature = request.headers.get('x-line-signature') ?? ''
  const channelSecret = process.env.LINE_CHANNEL_SECRET ?? ''

  // 2. Verify signature — fail fast, no DB access
  if (!verifyLineSignature(rawBody, signature, channelSecret)) {
    console.warn('[LINE Webhook] Invalid signature rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Parse events
  let body: { events?: LineEvent[] }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const events: LineEvent[] = body.events ?? []

  // 4. Process each event (non-blocking — respond 200 fast, process async)
  // Use waitUntil in production; for simplicity, await here
  for (const event of events) {
    await handleLineEvent(event)
  }

  return NextResponse.json({ ok: true })
}

interface LineEvent {
  type: string
  replyToken?: string
  source?: { type: string; userId?: string; groupId?: string }
  message?: { type: string; text?: string }
  timestamp?: number
}

async function handleLineEvent(event: LineEvent) {
  const lineUserId = event.source?.userId
  if (!lineUserId) return

  const db = getDb()

  // Find lead with this line user id
  const [existingLead] = await db
    .select({ id: leads.id, customerId: leads.customerId })
    .from(leads)
    .where(and(eq(leads.channelRef, lineUserId), isNull(leads.deletedAt)))
    .limit(1)

  if (event.type === 'follow') {
    // New follower — if no customer, just log (Lead created only on message)
    return
  }

  if (event.type === 'message' && event.message?.type === 'text') {
    const text = event.message.text ?? ''

    if (existingLead) {
      // Known lead — add activity
      await db.insert(leadActivities).values({
        leadId: existingLead.id,
        type: 'line',
        note: text,
        occurredAt: new Date(),
      })
    } else {
      // Unknown user — create new Lead with source='line'
      const [newLead] = await db.insert(leads).values({
        source: 'line',
        channelRef: lineUserId,
        status: 'new',
        interest: { firstMessage: text.slice(0, 200) },
      }).returning({ id: leads.id })

      // Record first message as activity
      await db.insert(leadActivities).values({
        leadId: newLead.id,
        type: 'line',
        note: `ข้อความแรก: ${text.slice(0, 500)}`,
        occurredAt: new Date(),
      })

      // Auto-create first follow-up within 24h
      await db.insert(followUps).values({
        leadId: newLead.id,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        channel: 'line',
        status: 'open',
        note: 'ติดตาม Lead ใหม่จาก LINE ภายใน 24 ชั่วโมง (สร้างอัตโนมัติ)',
      })

      // Emit event so sales gets notified
      await emit(db as any, domainEvents, 'lead.created_from_line', 'lead', newLead.id, {
        lineUserId,
        firstMessage: text,
        createdAt: new Date().toISOString(),
      })
    }
  }
}
