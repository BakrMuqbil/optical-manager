import Link from 'next/link'
import { Users, Eye, Receipt, UserPlus, Plus, ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const customers = (db.prepare('SELECT COUNT(*) count FROM customers').get() as {count:number}).count
  const exams = (db.prepare('SELECT COUNT(*) count FROM exams').get() as {count:number}).count
  const invoices = (db.prepare('SELECT COUNT(*) count FROM invoices WHERE status <> ?').get('CANCELLED') as {count:number}).count
  const sales = (db.prepare('SELECT COALESCE(SUM(total),0) total FROM invoices WHERE status <> ?').get('CANCELLED') as {total:number}).total
  const recentCustomers = db.prepare('SELECT id, customer_number, name, phone, created_at FROM customers ORDER BY created_at DESC LIMIT 5').all() as Array<{id:string;customer_number:string;name:string;phone:string|null;created_at:string}>
  const stats: Array<{label:string;value:string|number;Icon:LucideIcon;href:string}> = [
    {label:'العملاء',value:customers,Icon:Users,href:'/customers'},
    {label:'الفحوصات',value:exams,Icon:Eye,href:'/exams'},
    {label:'الفواتير',value:invoices,Icon:Receipt,href:'/invoices'},
    {label:'إجمالي المبيعات',value:formatCurrency(sales),Icon:Receipt,href:'/invoices'},
  ]
  return <div className="mx-auto w-full max-w-7xl p-4 pt-20 md:p-8">
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-bold text-slate-500">مرحبًا بك</p><h1 className="text-3xl font-black text-slate-900">لوحة التحكم</h1><p className="mt-2 text-sm text-slate-500">كل ما تحتاجه لإدارة عملاء محل البصريات بسرعة.</p></div><div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">● يعمل محليًا</div></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({label,value,Icon,href}) => <Link key={label} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{label}</span><span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Icon size={20}/></span></div><div className="mt-4 text-3xl font-black text-slate-900">{value}</div></Link>)}
    </section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link href="/customers/new" className="flex items-center justify-between rounded-2xl bg-slate-900 p-5 font-bold text-white shadow-sm hover:bg-slate-800"><span className="flex items-center gap-3"><UserPlus size={20}/>إضافة عميل</span><ArrowLeft size={18}/></Link>
      <Link href="/exams/new" className="flex items-center justify-between rounded-2xl bg-indigo-600 p-5 font-bold text-white shadow-sm hover:bg-indigo-700"><span className="flex items-center gap-3"><Eye size={20}/>تسجيل فحص نظر</span><ArrowLeft size={18}/></Link>
      <Link href="/invoices/new" className="flex items-center justify-between rounded-2xl bg-emerald-600 p-5 font-bold text-white shadow-sm hover:bg-emerald-700"><span className="flex items-center gap-3"><Plus size={20}/>إنشاء فاتورة</span><ArrowLeft size={18}/></Link>
    </section>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-black text-slate-900">أحدث العملاء</h2><p className="mt-1 text-xs text-slate-500">آخر العملاء الذين تم تسجيلهم</p></div><Link href="/customers" className="text-sm font-bold text-indigo-600">عرض الكل</Link></div>{recentCustomers.length ? <div className="divide-y divide-slate-100">{recentCustomers.map(c=><Link href={`/customers/${c.id}`} key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50"><div><p className="font-bold text-slate-800">{c.name}</p><p className="mt-1 text-xs text-slate-400">{c.phone || 'بدون هاتف'} • {c.customer_number}</p></div><span className="text-xs text-slate-400">{formatDate(c.created_at)}</span></Link>)}</div> : <div className="p-10 text-center text-sm text-slate-400">لا يوجد عملاء بعد.</div>}</section>
  </div>
}
