export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-600">WDS Portal</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4">
        {children}
      </main>
    </div>
  )
}
