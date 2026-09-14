'use server'

import { getDb } from '@/lib/db'
import { systemSettings } from '@wds/db'
import { eq } from 'drizzle-orm'
import {
  getEffectiveLineConfig,
  invalidateLineConfigCache,
  testLineBotConnection,
  LineConfig,
} from '@/lib/line'

export interface LineConfigView {
  channelSecret: string
  channelAccessToken: string
  liffId: string
  botName?: string
  botPictureUrl?: string
  botBasicId?: string
  updatedAt?: string
  isConfigured: boolean
  source: 'database' | 'environment' | 'none'
}

export async function getLineConfigAction(): Promise<LineConfigView> {
  const config = await getEffectiveLineConfig()
  
  let source: 'database' | 'environment' | 'none' = 'none'
  try {
    const db = getDb()
    const [row] = await db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, 'line_config'))
      .limit(1)

    if (row?.value && typeof row.value === 'object' && Object.keys(row.value).length > 0) {
      source = 'database'
    } else if (process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_SECRET) {
      source = 'environment'
    }
  } catch {
    if (process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_SECRET) {
      source = 'environment'
    }
  }

  const isConfigured = Boolean(config.channelAccessToken && config.channelSecret)

  return {
    channelSecret: config.channelSecret,
    channelAccessToken: config.channelAccessToken,
    liffId: config.liffId,
    botName: config.botName,
    botPictureUrl: config.botPictureUrl,
    botBasicId: config.botBasicId,
    updatedAt: config.updatedAt,
    isConfigured,
    source,
  }
}

export async function testLineConnectionAction(token: string) {
  return await testLineBotConnection(token)
}

export async function saveLineConfigAction(data: {
  channelSecret: string
  channelAccessToken: string
  liffId: string
}): Promise<{
  success: boolean
  error?: string
  bot?: {
    displayName: string
    pictureUrl?: string
    basicId: string
  }
}> {
  const channelSecret = data.channelSecret?.trim() ?? ''
  const channelAccessToken = data.channelAccessToken?.trim() ?? ''
  const liffId = data.liffId?.trim() ?? ''

  let botInfo: { displayName: string; pictureUrl?: string; basicId: string } | undefined

  // If token is provided, verify against LINE API to pull latest profile
  if (channelAccessToken) {
    const testResult = await testLineBotConnection(channelAccessToken)
    if (testResult.success && testResult.bot) {
      botInfo = {
        displayName: testResult.bot.displayName,
        pictureUrl: testResult.bot.pictureUrl,
        basicId: testResult.bot.basicId,
      }
    } else {
      return {
        success: false,
        error: `ตรวจสอบกับ LINE ไม่ผ่าน: ${testResult.error || 'Token ไม่ถูกต้อง'}`,
      }
    }
  }

  const payload: LineConfig = {
    channelSecret,
    channelAccessToken,
    liffId,
    botName: botInfo?.displayName,
    botPictureUrl: botInfo?.pictureUrl,
    botBasicId: botInfo?.basicId,
    updatedAt: new Date().toISOString(),
  }

  try {
    const db = getDb()
    await db
      .insert(systemSettings)
      .values({
        key: 'line_config',
        value: payload,
        description: 'LINE Official Account and LIFF Settings',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: payload,
          updatedAt: new Date(),
        },
      })

    invalidateLineConfigCache()
    return { success: true, bot: botInfo }
  } catch (err: any) {
    console.error('[Settings] saveLineConfig error:', err)
    return { success: false, error: err.message || 'บันทึกการตั้งค่าไม่สำเร็จ' }
  }
}
