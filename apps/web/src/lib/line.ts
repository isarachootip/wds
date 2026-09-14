import { createHmac } from 'crypto'
import { getDb } from '@/lib/db'
import { systemSettings } from '@wds/db'
import { eq } from 'drizzle-orm'

export interface LineConfig {
  channelSecret: string
  channelAccessToken: string
  liffId: string
  botName?: string
  botPictureUrl?: string
  botBasicId?: string
  updatedAt?: string
}

let cachedLineConfig: LineConfig | null = null
let cacheExpiresAt = 0

/**
 * Fetch effective LINE OA configuration:
 * 1. Checks `system_settings` table where key = 'line_config'
 * 2. Fallbacks to process.env (LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, LIFF_ID)
 */
export async function getEffectiveLineConfig(): Promise<LineConfig> {
  const now = Date.now()
  if (cachedLineConfig && now < cacheExpiresAt) {
    return cachedLineConfig
  }

  let dbConfig: Partial<LineConfig> = {}
  try {
    const db = getDb()
    const [row] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, 'line_config'))
      .limit(1)

    if (row?.value && typeof row.value === 'object') {
      dbConfig = row.value as Partial<LineConfig>
    }
  } catch {
    // If DB is unreachable or table not migrated yet, fallback silently
  }

  const effective: LineConfig = {
    channelSecret: dbConfig.channelSecret || process.env.LINE_CHANNEL_SECRET || '',
    channelAccessToken: dbConfig.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    liffId: dbConfig.liffId || process.env.LIFF_ID || '',
    botName: dbConfig.botName,
    botPictureUrl: dbConfig.botPictureUrl,
    botBasicId: dbConfig.botBasicId,
    updatedAt: dbConfig.updatedAt,
  }

  cachedLineConfig = effective
  cacheExpiresAt = now + 30_000 // Cache for 30s
  return effective
}

export function invalidateLineConfigCache() {
  cachedLineConfig = null
  cacheExpiresAt = 0
}

/**
 * Test connection to LINE Messaging API by fetching Bot Profile
 */
export async function testLineBotConnection(token: string): Promise<{
  success: boolean
  bot?: {
    userId: string
    basicId: string
    displayName: string
    pictureUrl?: string
    chatMode: string
    markAsReadMode: string
  }
  error?: string
}> {
  if (!token?.trim()) {
    return { success: false, error: 'Channel Access Token is required' }
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/info', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      let message = `LINE API Error (${res.status})`
      try {
        const json = JSON.parse(errorText)
        if (json.message) message = json.message
      } catch {}
      return { success: false, error: message }
    }

    const data = await res.json()
    return {
      success: true,
      bot: {
        userId: data.userId,
        basicId: data.basicId,
        displayName: data.displayName,
        pictureUrl: data.pictureUrl,
        chatMode: data.chatMode,
        markAsReadMode: data.markAsReadMode,
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect to LINE API' }
  }
}

// ─── Signature Verification ────────────────────────────────────────────────
/**
 * Verify X-Line-Signature header using HMAC-SHA256
 * @param rawBody  The raw request body string (must NOT be parsed JSON)
 * @param signature  Value of X-Line-Signature header
 * @param channelSecret  LINE channel secret
 */
export function verifyLineSignature(
  rawBody: string,
  signature: string,
  channelSecret: string
): boolean {
  if (!rawBody || !signature || !channelSecret) return false
  const hash = createHmac('sha256', channelSecret)
    .update(rawBody)
    .digest('base64')
  return hash === signature
}

// ─── Send Message ──────────────────────────────────────────────────────────
const LINE_API_BASE = 'https://api.line.me/v2/bot'

export async function sendLineMessage(
  userId: string,
  messages: object[]
): Promise<boolean> {
  const config = await getEffectiveLineConfig()
  const token = config.channelAccessToken
  if (!token) {
    console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN not configured in DB or ENV')
    return false
  }
  try {
    const res = await fetch(`${LINE_API_BASE}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: userId, messages }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[LINE] push message error:', err)
      return false
    }
    return true
  } catch (e) {
    console.error('[LINE] sendLineMessage failed:', e)
    return false
  }
}

// ─── Reply Message ─────────────────────────────────────────────────────────
export async function replyLineMessage(
  replyToken: string,
  messages: object[]
): Promise<boolean> {
  const config = await getEffectiveLineConfig()
  const token = config.channelAccessToken
  if (!token) return false
  try {
    const res = await fetch(`${LINE_API_BASE}/message/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    })
    return res.ok
  } catch { return false }
}


// ─── Flex Message Factories ────────────────────────────────────────────────

export function quotationFlex(data: {
  qtNumber: string
  customerName: string
  totalBaht: string
  validUntil: string
  publicUrl: string
}): object {
  return {
    type: 'flex',
    altText: `ใบเสนอราคา ${data.qtNumber}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#1E40AF',
        contents: [{ type: 'text', text: '📄 ใบเสนอราคา', color: '#FFFFFF', size: 'sm', weight: 'bold' }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: data.qtNumber, size: 'xl', weight: 'bold', color: '#1E40AF' },
          { type: 'text', text: `ลูกค้า: ${data.customerName}`, size: 'sm', color: '#374151' },
          { type: 'text', text: `มูลค่า: ฿${data.totalBaht}`, size: 'lg', weight: 'bold', color: '#065F46' },
          { type: 'text', text: `ใช้ได้ถึง: ${data.validUntil}`, size: 'xs', color: '#9CA3AF' },
        ]
      },
      footer: {
        type: 'box', layout: 'vertical',
        contents: [{
          type: 'button', style: 'primary', color: '#1E40AF',
          action: { type: 'uri', label: 'ดู/ยืนยัน ใบเสนอราคา', uri: data.publicUrl }
        }]
      }
    }
  }
}

export function appointmentReminderFlex(data: {
  customerName: string
  scheduledDate: string
  address: string
}): object {
  return {
    type: 'flex',
    altText: `แจ้งเตือนนัดหมายพรุ่งนี้`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#7C3AED',
        contents: [{ type: 'text', text: '📅 นัดหมายพรุ่งนี้', color: '#FFFFFF', size: 'sm', weight: 'bold' }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: `คุณ${data.customerName}`, size: 'lg', weight: 'bold' },
          { type: 'text', text: `วันที่: ${data.scheduledDate}`, size: 'sm', color: '#374151' },
          { type: 'text', text: `สถานที่: ${data.address}`, size: 'sm', color: '#374151', wrap: true },
        ]
      }
    }
  }
}

export function technicianArrivedFlex(data: {
  customerName: string
  techName: string
  arrivedAt: string
}): object {
  return {
    type: 'flex',
    altText: 'ช่างถึงหน้างานแล้ว',
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#059669',
        contents: [{ type: 'text', text: '🔧 ช่างถึงหน้างานแล้ว', color: '#FFFFFF', size: 'sm', weight: 'bold' }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: `คุณ${data.customerName}`, size: 'lg', weight: 'bold' },
          { type: 'text', text: `ช่าง: ${data.techName}`, size: 'sm', color: '#374151' },
          { type: 'text', text: `เวลา: ${data.arrivedAt}`, size: 'sm', color: '#374151' },
        ]
      }
    }
  }
}

export function jobCompletedFlex(data: {
  customerName: string
  jobSummary: string
  completedAt: string
}): object {
  return {
    type: 'flex',
    altText: 'งานเสร็จเรียบร้อย',
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#059669',
        contents: [{ type: 'text', text: '✅ งานเสร็จเรียบร้อย', color: '#FFFFFF', size: 'sm', weight: 'bold' }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: `คุณ${data.customerName}`, size: 'lg', weight: 'bold' },
          { type: 'text', text: data.jobSummary, size: 'sm', color: '#374151', wrap: true },
          { type: 'text', text: `เสร็จเมื่อ: ${data.completedAt}`, size: 'xs', color: '#9CA3AF' },
        ]
      }
    }
  }
}

export function paymentConfirmedFlex(data: {
  customerName: string
  amountBaht: string
  orderNumber: string
}): object {
  return {
    type: 'flex',
    altText: `ยืนยันรับชำระเงิน ฿${data.amountBaht}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#065F46',
        contents: [{ type: 'text', text: '💰 ยืนยันรับชำระเงิน', color: '#FFFFFF', size: 'sm', weight: 'bold' }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: `คุณ${data.customerName}`, size: 'lg', weight: 'bold' },
          { type: 'text', text: `Order: ${data.orderNumber}`, size: 'sm', color: '#374151' },
          { type: 'text', text: `ยอด: ฿${data.amountBaht}`, size: 'xl', weight: 'bold', color: '#065F46' },
        ]
      }
    }
  }
}

export function deliveryDispatchedFlex(data: {
  customerName: string
  orderNumber: string
  trackingNo?: string
  estimatedDate: string
  trackingUrl: string
}): object {
  return {
    type: 'flex',
    altText: `สินค้าออกจัดส่งแล้ว`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#4338CA',
        contents: [{ type: 'text', text: '🚚 สินค้าออกจัดส่งแล้ว', color: '#FFFFFF', size: 'sm', weight: 'bold' }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: `คุณ${data.customerName}`, size: 'lg', weight: 'bold' },
          { type: 'text', text: `Order: ${data.orderNumber}`, size: 'sm', color: '#374151' },
          ...(data.trackingNo ? [{ type: 'text', text: `Tracking: ${data.trackingNo}`, size: 'sm', color: '#374151' }] : []) as object[],
          { type: 'text', text: `คาดว่าจะถึง: ${data.estimatedDate}`, size: 'sm', color: '#374151' },
        ]
      },
      footer: {
        type: 'box', layout: 'vertical',
        contents: [{
          type: 'button', style: 'primary', color: '#4338CA',
          action: { type: 'uri', label: 'ติดตามสถานะ', uri: data.trackingUrl }
        }]
      }
    }
  }
}

export function deliveryCompletedFlex(data: {
  customerName: string
  orderNumber: string
  receiverName: string
  deliveredAt: string
}): object {
  return {
    type: 'flex',
    altText: `ส่งสินค้าสำเร็จ`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#065F46',
        contents: [{ type: 'text', text: '✅ ส่งสินค้าสำเร็จ', color: '#FFFFFF', size: 'sm', weight: 'bold' }]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: `คุณ${data.customerName}`, size: 'lg', weight: 'bold' },
          { type: 'text', text: `Order: ${data.orderNumber}`, size: 'sm', color: '#374151' },
          { type: 'text', text: `ผู้รับ: ${data.receiverName}`, size: 'sm', color: '#374151' },
          { type: 'text', text: `เวลา: ${data.deliveredAt}`, size: 'xs', color: '#9CA3AF' },
        ]
      }
    }
  }
}
