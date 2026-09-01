"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Receipt } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { Invoice } from "@/types/app";
export default function Page() {
  const [q, setQ] = useState(""),
    [rows, setRows] = useState<Invoice[]>([]),
    [currency, setCurrency] = useState("ر.ي");
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => j.data?.currency && setCurrency(j.data.currency));
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/invoices?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j) => setRows(j.data || []));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <PageContainer
      title="الفواتير"
      description="البحث في جميع الفواتير وإعادة طباعتها"
      actions={
        <Link href="/invoices/new" className="btn-primary">
          <Plus size={18} />
          فاتورة جديدة
        </Link>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <Search size={20} className="text-slate-400" />
        <input
          className="w-full bg-transparent py-2 text-sm outline-none"
          placeholder="رقم الفاتورة أو اسم العميل أو الهاتف أو رقم الفحص..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {rows.length ? (
          rows.map((i) => (
            <Link
              href={`/invoices/${i.id}`}
              key={i.id}
              className="flex items-center justify-between border-b border-slate-100 p-5 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <Receipt size={20} />
                </span>
                <div>
                  <p className="font-black">{i.invoice_number}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {i.customer_name} • {formatDate(i.invoice_date)}
                    {i.exam_number ? " • " + i.exam_number : ""}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="font-black">
                  {formatCurrency(i.total, currency)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {i.status === "PAID"
                    ? "مدفوعة"
                    : i.status === "PARTIALLY_PAID"
                      ? "مدفوعة جزئيًا"
                      : i.status === "CANCELLED"
                        ? "ملغاة"
                        : `متبقي ${formatCurrency(i.remaining, currency)}`}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-12 text-center text-sm text-slate-400">
            لا توجد فواتير.
          </div>
        )}
      </div>
    </PageContainer>
  );
}
