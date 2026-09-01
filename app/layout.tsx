import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Optical Manager',
  description: 'إدارة عملاء وفحوصات وفواتير محل البصريات',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="min-h-screen bg-slate-50 md:flex">
          <Sidebar />
          <main className="min-w-0 flex-1 md:mr-64">{children}</main>
        </div>
      </body>
    </html>
  )
}
