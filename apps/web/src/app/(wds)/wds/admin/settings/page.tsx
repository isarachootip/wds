'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
  getLineConfigAction,
  saveLineConfigAction,
  testLineConnectionAction,
  LineConfigView,
} from '@/modules/settings/actions'
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Bot,
  Zap,
  HelpCircle,
  Server,
  Sparkles,
  Layers,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [config, setConfig] = useState<LineConfigView>({
    channelSecret: '',
    channelAccessToken: '',
    liffId: '',
    isConfigured: false,
    source: 'none',
  })

  // Form states
  const [channelSecret, setChannelSecret] = useState('')
  const [channelAccessToken, setChannelAccessToken] = useState('')
  const [liffId, setLiffId] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [showToken, setShowToken] = useState(false)

  // Status & Test states
  const [testResult, setTestResult] = useState<{
    tested: boolean
    success: boolean
    message: string
    bot?: { displayName: string; pictureUrl?: string; basicId: string }
  } | null>(null)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // Derived Webhook URL
  const [webhookUrl, setWebhookUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/line/webhook`)
    }

    startTransition(async () => {
      try {
        const data = await getLineConfigAction()
        setConfig(data)
        setChannelSecret(data.channelSecret || '')
        setChannelAccessToken(data.channelAccessToken || '')
        setLiffId(data.liffId || '')
        if (data.botName) {
          setTestResult({
            tested: true,
            success: true,
            message: 'เชื่อมต่อกับ LINE API สำเร็จ',
            bot: {
              displayName: data.botName,
              pictureUrl: data.botPictureUrl,
              basicId: data.botBasicId || '',
            },
          })
        }
      } catch (err: any) {
        setSaveStatus({
          type: 'error',
          message: 'ไม่สามารถโหลดการตั้งค่าได้: ' + err.message,
        })
      } finally {
        setIsLoading(false)
      }
    })
  }, [])

  const handleCopyWebhook = () => {
    if (!webhookUrl) return
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2500)
  }

  const handleTestConnection = () => {
    if (!channelAccessToken.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: 'กรุณาระบุ Channel Access Token ก่อนทดสอบ',
      })
      return
    }

    setTestResult(null)
    setSaveStatus({ type: null, message: '' })

    startTransition(async () => {
      const res = await testLineConnectionAction(channelAccessToken.trim())
      if (res.success && res.bot) {
        setTestResult({
          tested: true,
          success: true,
          message: `เชื่อมต่อสำเร็จ! บอท: ${res.bot.displayName} (${res.bot.basicId || '@bot'})`,
          bot: res.bot,
        })
      } else {
        setTestResult({
          tested: true,
          success: false,
          message: res.error || 'การทดสอบเชื่อมต่อล้มเหลว ตรวจสอบ Token อีกครั้ง',
        })
      }
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus({ type: null, message: '' })

    startTransition(async () => {
      const res = await saveLineConfigAction({
        channelSecret,
        channelAccessToken,
        liffId,
      })

      if (res.success) {
        setSaveStatus({
          type: 'success',
          message: 'บันทึกการตั้งค่า LINE สำเร็จและมีผลทันที!',
        })
        setConfig((prev) => ({
          ...prev,
          channelSecret,
          channelAccessToken,
          liffId,
          botName: res.bot?.displayName || prev.botName,
          botPictureUrl: res.bot?.pictureUrl || prev.botPictureUrl,
          botBasicId: res.bot?.basicId || prev.botBasicId,
          isConfigured: Boolean(channelSecret && channelAccessToken),
          source: 'database',
          updatedAt: new Date().toISOString(),
        }))
        if (res.bot) {
          setTestResult({
            tested: true,
            success: true,
            message: 'เชื่อมต่อกับ LINE API สำเร็จ',
            bot: res.bot,
          })
        }
      } else {
        setSaveStatus({
          type: 'error',
          message: res.error || 'บันทึกไม่สำเร็จ',
        })
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span>Settings</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400">LINE OA & Integrations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-[#06C755]" />
            ตั้งค่าการเชื่อมต่อ LINE Official Account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            จัดการ Messaging API, Webhook และ LIFF App แบบ Dynamic (ไม่ต้อง Restart Server บน Coolify)
          </p>
        </div>

        {/* Source Badge */}
        <div className="flex items-center gap-2">
          {config.isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              เชื่อมต่อแล้ว ({config.source === 'database' ? 'Database Config' : 'ENV Fallback'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-3.5 h-3.5" />
              ยังไม่ได้ตั้งค่า
            </span>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {saveStatus.type && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 transition-all ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{saveStatus.message}</div>
        </div>
      )}

      {/* Bot Profile Card (If connected) */}
      {testResult?.bot && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-500/15 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {testResult.bot.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={testResult.bot.pictureUrl}
                  alt={testResult.bot.displayName}
                  className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#06C755] flex items-center justify-center text-white shadow-sm">
                  <Bot className="w-7 h-7" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {testResult.bot.displayName}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#06C755] text-white">
                    Official Bot
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  LINE ID: {testResult.bot.basicId || '@not_set'}
                </div>
              </div>
            </div>

            <div className="text-xs text-right text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> LINE Messaging API Active
              </span>
              {config.updatedAt && (
                <div className="mt-0.5">
                  อัปเดตล่าสุด: {new Date(config.updatedAt).toLocaleString('th-TH')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                ข้อมูล Credentials & API Keys
              </h2>
              <span className="text-xs text-slate-400">JoyCafe Config Format</span>
            </div>

            {/* 1. Channel Secret */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. LINE Channel Secret <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={channelSecret}
                  onChange={(e) => setChannelSecret(e.target.value)}
                  placeholder="เช่น 9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ใช้สำหรับตรวจสอบลายเซ็น (HMAC-SHA256) ของ Webhook Request จาก LINE Server
              </p>
            </div>

            {/* 2. Channel Access Token */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. LINE Channel Access Token (Long-lived) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={channelAccessToken}
                  onChange={(e) => setChannelAccessToken(e.target.value)}
                  placeholder="เช่น eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono pr-10 transition-colors"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ใช้สำหรับ Push Notification, ส่ง Flex Message ใบเสนอราคา, นัดหมาย และแจ้งเตือนสถานะคำสั่งซื้อ
              </p>
            </div>

            {/* 3. LIFF ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. LIFF ID (สำหรับ Customer Portal & On-site App)
              </label>
              <input
                type="text"
                value={liffId}
                onChange={(e) => setLiffId(e.target.value)}
                placeholder="เช่น 2006789123-AbCdEfGh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-colors"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Endpoint URL ใน LINE LIFF Console ให้ชี้ไปที่: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono text-[11px]">{webhookUrl ? `${webhookUrl.replace('/api/line/webhook', '')}/portal/liff` : '/portal/liff'}</code>
              </p>
            </div>

            {/* Test result status box */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isPending || !channelAccessToken}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-medium transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin text-blue-500' : 'text-slate-500'}`} />
                ทดสอบการเชื่อมต่อ (Test Connection)
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    บันทึกการตั้งค่า (Save Settings)
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Webhook & Setup Guide */}
        <div className="space-y-6">
          {/* Webhook Endpoint Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" />
                Webhook URL
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                POST Ready
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              นำ URL ด้านล่างนี้ไปวางในหน้า <strong>Messaging API</strong> ใน LINE Developers Console
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all select-all font-semibold">
                {webhookUrl || 'https://your-domain.com/api/line/webhook'}
              </div>
              <button
                type="button"
                onClick={handleCopyWebhook}
                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  copiedWebhook
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {copiedWebhook ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> คัดลอกเรียบร้อยแล้ว!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> คัดลอก Webhook URL
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              ขั้นตอนการติดตั้งใน LINE Console
            </h3>

            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-3 list-decimal list-inside leading-relaxed">
              <li>
                เข้าสู่ <a href="https://developers.line.biz" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-0.5 underline">LINE Developers Console <ExternalLink className="w-3 h-3 inline" /></a>
              </li>
              <li>
                สร้าง Provider และ Channel ประเภท <strong>Messaging API</strong>
              </li>
              <li>
                คัดลอก <strong>Channel Secret</strong> จากแท็บ <em>Basic settings</em>
              </li>
              <li>
                ออก <strong>Channel access token (long-lived)</strong> จากแท็บ <em>Messaging API</em>
              </li>
              <li>
                วาง <strong>Webhook URL</strong> แล้วกดปุ่ม <strong>Verify</strong> และเปิดสวิตช์ <strong>Use webhook</strong>
              </li>
              <li>
                ปิดฟังก์ชัน <strong>Auto-reply messages</strong> ใน LINE Official Account Manager เพื่อให้ระบบ WDS ตอบกลับอัตโนมัติได้อย่างสมบูรณ์
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
