import React from 'react'

export const metadata = {
  title: 'เข้าสู่ระบบ | Thai Watsadu WDS Platform',
  description: 'เข้าสู่ระบบบริหารจัดการฝ่ายขาย โครงการ และงานสำรวจหน้างาน Thai Watsadu Wholesale & Direct Sales',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Cruip Artifact Subtle Gradient Blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-thaiwatsadu-red/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
