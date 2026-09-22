import React, { Suspense } from 'react'
import { Metadata } from 'next'
import { KmHub } from './KmHub'

export const metadata: Metadata = {
  title: 'คลังความรู้ & คู่มือระบบ (KM Hub) | Thai Watsadu WDS',
  description: 'ศูนย์รวมคลังความรู้ คู่มือการใช้งานระบบ WDS และแนวคิดหลักของแพลตฟอร์มการขายและบริการติดตั้ง',
}

export default function KmPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground animate-pulse text-sm">
          กำลังโหลดคลังความรู้ระบบ...
        </div>
      }
    >
      <KmHub />
    </Suspense>
  )
}
