const navItems = [
  { href: '/visit/dashboard', label: 'งานวันนี้', icon: '📋' },
  { href: '/visit/map', label: 'แผนที่', icon: '🗺️' },
  { href: '/visit/checkin', label: 'เช็คอิน', icon: '📍' },
  { href: '/visit/history', label: 'ประวัติ', icon: '📅' },
  { href: '/visit/profile', label: 'โปรไฟล์', icon: '👤' },
]

export default function VisitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex items-center">
        <h1 className="font-bold">Visit App</h1>
      </header>
      {/* Content */}
      <main className="flex-1 pb-20 overflow-auto">
        {children}
      </main>
      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center py-2 min-h-[56px] text-slate-600 hover:text-blue-600 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}
