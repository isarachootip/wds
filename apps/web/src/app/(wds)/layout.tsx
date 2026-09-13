import { logout } from '@/app/(auth)/login/actions'

const navItems = [
  { href: '/wds/dashboard', label: 'แดชบอร์ด', icon: '🏠' },
  { href: '/wds/customers', label: 'ลูกค้า', icon: '👥' },
  { href: '/wds/leads', label: 'ลีด', icon: '📋' },
  { href: '/wds/site-visits', label: 'สำรวจหน้างาน', icon: '🗺️' },
  { href: '/wds/payments', label: 'การชำระเงิน', icon: '💳' },
]

export default function WdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">WDS</h1>
          <p className="text-xs text-slate-500">ระบบขายและติดตั้ง</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors text-sm"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="p-4 border-t">
          <form action={logout}>
            <button type="submit" className="w-full text-sm text-slate-500 hover:text-red-500 transition-colors text-left">
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
