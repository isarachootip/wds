import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WDS - ระบบขายและติดตั้งหน้างาน',
  description: 'WDS Field Sales & Service Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning className="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');localStorage.setItem('wds-theme','light');}catch(e){}`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="light" storageKey="wds-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
