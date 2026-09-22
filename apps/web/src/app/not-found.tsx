import React from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, LayoutGrid, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-card p-8 rounded-3xl border border-border shadow-lg space-y-5">
        <div className="size-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="size-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-muted text-muted-foreground border border-border">
            404 NOT FOUND
          </span>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            ไม่พบหน้าที่คุณต้องการ
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            รายการหรือหน้าที่คุณกำลังเข้าถึงอาจถูกลบ ย้าย หรือรหัสอ้างอิง (ID) ไม่ถูกต้องในฐานข้อมูล
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto rounded-xl">
            <Link href="/wds/pipeline">
              <LayoutGrid className="size-4 mr-1.5" />
              <span>กระดานการขาย (Pipeline)</span>
            </Link>
          </Button>

          <Button asChild variant="thaiwatsadu" size="sm" className="w-full sm:w-auto rounded-xl font-bold shadow-xs">
            <Link href="/wds/leads">
              <Users className="size-4 mr-1.5" />
              <span>รายชื่อลีดทั้งหมด</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
