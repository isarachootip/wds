'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Bell, CheckCheck, ExternalLink, Sparkles } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export interface NotificationItem {
  id: string
  title: string
  body: string
  read_at: string | null
  link: string | null
  created_at: string
}

const mockNotifications: NotificationItem[] = [
  {
    id: 'mock-1',
    title: 'ลีดใหม่จาก LINE OA',
    body: 'คุณวิชัย ก่อสร้าง (081-234-5678) สนใจเหล็กเส้น มอก. และปูนซีเมนต์ 200 ถุง',
    read_at: null,
    link: '/wds/leads',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    title: 'นัดหมายสำรวจหน้างานสำเร็จ',
    body: 'ช่างภาคสนามยืนยันวันเข้าตรวจพื้นที่ โครงการบางนาวิลเลจ พิกัดระยะ 4.2 กม.',
    read_at: null,
    link: '/wds/appointments',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    title: 'ใบเสนอราคาผ่านการอนุมัติ',
    body: 'QT-2026-008 ยอด ฿452,000.00 ได้รับการอนุมัติ Credit Dual-Control แล้ว',
    read_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    link: '/wds/quotations',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export interface NotificationBellProps {
  userId?: string
  className?: string
}

export function NotificationBell({ userId = 'system', className = '' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('placeholder.supabase.co')
  )

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // In standalone/preview mode, use realistic demo notifications
      setNotifications(mockNotifications)
      return
    }

    try {
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setNotifications(data)
          } else {
            setNotifications(mockNotifications)
          }
        })

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as NotificationItem, ...prev.slice(0, 19)])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch {
      setNotifications(mockNotifications)
    }
  }, [userId, isSupabaseConfigured])

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const markAllRead = async () => {
    const nowIso = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? nowIso })))

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
        await supabase
          .from('notifications')
          .update({ read_at: nowIso })
          .eq('user_id', userId)
          .is('read_at', null)
      } catch {}
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-xs"
        aria-label="การแจ้งเตือน"
        title="การแจ้งเตือน (Notifications)"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-background tabular-nums animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Artifact Styled Dropdown Card */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-xs">การแจ้งเตือน</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>อ่านทั้งหมด</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                ไม่มีการแจ้งเตือนในขณะนี้
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read_at
                return (
                  <a
                    key={n.id}
                    href={n.link ?? '#'}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 hover:bg-muted/40 transition-colors ${
                      isUnread ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs font-medium leading-snug ${
                          isUnread ? 'text-primary font-semibold' : 'text-foreground'
                        }`}
                      >
                        {n.title}
                      </p>
                      {isUnread && (
                        <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground/70">
                      <span>
                        {new Date(n.created_at).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                      {n.link && <ExternalLink className="w-3 h-3 opacity-60" />}
                    </div>
                  </a>
                )
              })
            )}
          </div>

          {/* Footer status */}
          <div className="px-4 py-2 border-t border-border bg-muted/20 text-center text-[11px] text-muted-foreground">
            Thai Watsadu WDS Real-time Dispatch Center
          </div>
        </div>
      )}
    </div>
  )
}
