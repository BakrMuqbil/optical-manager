import Link from "next/link";
import { ArrowLeft, FileText, Plus, Wallet, CreditCard, AlertCircle } from "lucide-react";
import { db, getSettings } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const settings = getSettings() as { currency?: string } | undefined;
  const currency = settings?.currency || "ر.ي";
  const stats = db.prepare(`SELECT COUNT(*) count, COALESCE(SUM(total),0) total, COALESCE(SUM(paid),0) paid, COALESCE(SUM(remaining),0) remaining FROM invoices WHERE status <> 'CANCELLED'`).get() as {count:number;total:number;paid:number;remaining:number};
  const recent = db.prepare(`SELECT i.id,i.invoice_number,i.invoice_date,i.total,i.paid,i.remaining,i.status,c.name customer_name,c.phone customer_phone FROM invoices i JOIN customers c ON c.id=i.customer_id WHERE i.status<>'CANCELLED' ORDER BY i.invoice_date DESC,i.created_at DESC LIMIT 6`).all() as Array<{id:string;invoice_number:string;invoice_date:string;total:number;paid:number;remaining:number;status:string;customer_name:string;customer_phone:string|null}>;
  return <div className="mx-auto w-full max-w-7xl p-4 pt-20 md:p-8">
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-bold text-slate-500">مرحبًا بك</p><h1 className="text-3xl font-black text-slate-900">لوحة التحكم</h1><p className="mt-2 text-sm text-slate-500">ملخص سريع للفواتير والمبالغ المستحقة والمتبقية.</p></div><div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">● يعمل محليًا</div></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card label="عدد الفواتير" value={String(stats.count)} Icon={FileText}/>
      <Card label="إجمالي المستحق" value={formatCurrency(stats.total, currency)} Icon={Wallet}/>
      <Card label="إجمالي المدفوع" value={formatCurrency(stats.paid, currency)} Icon={CreditCard}/>
      <Card label="إجمالي المتبقي" value={formatCurrency(stats.remaining, currency)} Icon={AlertCircle} danger={stats.remaining>0}/>
    </section>
    <section className="mt-6 grid gap-4 md:grid-cols-2"><Link href="/invoices/new" className="flex items-center justify-between rounded-2xl bg-slate-900 p-5 font-bold text-white shadow-sm hover:bg-slate-800"><span className="flex items-center gap-3"><Plus size={20}/>فاتورة جديدة</span><ArrowLeft size={18}/></Link><Link href="/account-statement" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 font-bold text-slate-800 shadow-sm hover:bg-slate-50"><span className="flex items-center gap-3"><FileText size={20}/>فتح كشف الحساب</span><ArrowLeft size={18}/></Link></section>
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-black text-slate-900">آخر الفواتير</h2><p className="mt-1 text-xs text-slate-500">أحدث العمليات المحفوظة</p></div><Link href="/account-statement" className="text-sm font-bold text-indigo-600">كشف الحساب</Link></div>{recent.length?<div className="divide-y divide-slate-100">{recent.map(i=><Link href={`/invoices/${i.id}`} key={i.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-50"><div><p className="font-bold text-slate-800">{i.customer_name}</p><p className="mt-1 text-xs text-slate-400">{i.invoice_number} • {i.invoice_date} • {i.customer_phone||'بدون جوال'}</p></div><div className="text-left"><p className="font-black">{formatCurrency(i.total, currency)}</p><p className={`mt-1 text-xs font-bold ${i.remaining>0?'text-red-600':'text-emerald-600'}`}>{i.remaining>0?`متبقي ${formatCurrency(i.remaining, currency)}`:'مسددة بالكامل'}</p></div></Link>)}</div>:<div className="p-10 text-center text-sm text-slate-400">لا توجد فواتير بعد.</div>}</section>
  </div>
}
function Card({label,value,Icon,danger=false}:{label:string;value:string;Icon:React.ElementType;danger?:boolean}){return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{label}</span><span className={`rounded-xl p-2.5 ${danger?'bg-red-50 text-red-600':'bg-slate-100 text-slate-700'}`}><Icon size={20}/></span></div><div className={`mt-4 text-2xl font-black ${danger?'text-red-600':'text-slate-900'}`}>{value}</div></div>}
