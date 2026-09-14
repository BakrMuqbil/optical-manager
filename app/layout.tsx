import type { Metadata } from 'next'
import './globals.css'
import { TopNavigation } from '@/components/layout/TopNavigation'

export const metadata: Metadata = {
  title: 'Optical Manager',
  description: 'نظام متكامل لإدارة محلات البصريات والعملاء والفواتير والحسابات والتقارير المالية',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="min-h-screen bg-slate-50">
          <TopNavigation />

          <main className="min-w-0 flex-1 pt-20 print:pt-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}